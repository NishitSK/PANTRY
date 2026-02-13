import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import connectDB from '@/lib/mongodb'
import { Product } from '@/models'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Initialize Gemini AI (Optional)
const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data with the image
    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null
    const extractedText = formData.get('extractedText') as string | null

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image under 5MB.' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get existing products from database to help with matching
    const products = await Product.find().select('_id name category baseShelfLifeDays').lean()
    const productList = products.map(p => `${p.name} (${p.category})`).join(', ')

    // ---------------------------------------------------------
    // HYBRID LOGIC: Try AI First, Fallback to Local
    // ---------------------------------------------------------

    let itemsInfo: any[] = []
    let summaryInfo = ""
    let aiSuccess = false

    // 1. Try Gemini if available
    if (genAI && apiKey) {
      try {
        console.log("Attempting Gemini analysis...")

        // Convert file to base64
        const bytes = await imageFile.arrayBuffer()
        const base64Image = Buffer.from(bytes).toString('base64')

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: imageFile.type
          }
        }

        let prompt = `You are a food identification expert. Analyze this image and identify all food items.
        Respond ONLY with a valid JSON object: { "items": [{ "name": "string", "category": "string", "quantity": number, "unit": "string", "suggestedStorage": "string" }], "summary": "string" }`

        if (extractedText && extractedText.length > 5) {
          prompt = `Analyze this receipt/list image. I have extracted this text: """${extractedText}""". Use it to identify items. Respond with JSON.`
        }

        const result = await model.generateContent([prompt, imagePart])
        const response = await result.response
        const text = response.text()

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysisResult = JSON.parse(jsonMatch[0])
          itemsInfo = analysisResult.items || []
          summaryInfo = analysisResult.summary || "AI Analysis Complete"
          aiSuccess = true
        }
      } catch (aiError) {
        console.warn("Gemini Analysis Failed (Falling back to local):", aiError)
        // Fallthrough to local parsing
      }
    }

    // 2. If AI failed or key missing, use Local Parsing
    if (!aiSuccess) {
      console.log('Using local text parsing fallback.')

      if (!extractedText || extractedText.trim().length < 3) {
        // If we also don't have text, then we really failed
        if (!aiSuccess && (!extractedText || extractedText.length < 3)) {
          return NextResponse.json({
            success: false,
            items: [],
            summary: "Could not identify items. Please try a clearer photo or manually add items.",
            totalItemsDetected: 0
          })
        }
      } else {
        // Local Parsing Logic (Regex/Heuristic)
        const lines = extractedText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 2);

        for (const line of lines) {
          // Skip common receipt junk
          if (line.match(/total|subtotal|tax|change|cash|card|date|time|tel|fax|receipt/i)) continue;
          if (line.match(/^\d+$/)) continue;

          // Try to match against database
          let bestMatch: any = null;
          let highestScore = 0;

          for (const p of products) {
            const pName = p.name.toLowerCase();
            const lName = line.toLowerCase();

            // Strategy 1: Exact substring match (Original)
            if (lName.includes(pName)) {
              const score = pName.length / lName.length;
              if (score > highestScore) {
                highestScore = score;
                bestMatch = p;
              }
            }

            // Strategy 2: Token-based overlap (Smart Matching)
            // Useful for: "Amul Gold Milk" -> "Milk"
            const pTokens = pName.split(/\s+/).filter(t => t.length > 2);
            // const lTokens = lName.split(/\s+/).filter(t => t.length > 2); // Not strictly needed if checking includes

            if (pTokens.length > 0) {
              let matchedTokens = 0;
              for (const token of pTokens) {
                if (lName.includes(token)) {
                  matchedTokens++;
                }
              }

              // Calculate score: What % of the PRODUCT words are in the RECEIPT line?
              const tokenScore = matchedTokens / pTokens.length;

              // We require a high overlap (e.g., most of the product words must be there)
              if (tokenScore >= 0.8) {
                // Check length ratio to filter out very long lines matching short words (e.g. "coconut oil" matching "oil")
                // unless the token match is perfect.
                const lengthRatio = pName.length / lName.length;

                // Weighted score: 80% based on tokens, 20% based on length similarity
                const weightedScore = (tokenScore * 0.8) + (lengthRatio * 0.2);

                if (weightedScore > highestScore) {
                  highestScore = weightedScore;
                  bestMatch = p;
                }
              }
            }
          }

          if (bestMatch && highestScore > 0.4) {
            itemsInfo.push({
              name: bestMatch.name,
              category: bestMatch.category,
              quantity: 1,
              unit: 'pieces',
              suggestedStorage: 'room_temp',
              matchedProductId: bestMatch._id.toString(),
              matchedProductName: bestMatch.name
            });
          } else {
            const cleanName = line.replace(/\d+(\.\d{2})?/g, '').trim();
            if (cleanName.length > 3) {
              itemsInfo.push({
                name: cleanName,
                category: 'Uncategorized',
                quantity: 1,
                unit: 'pieces',
                suggestedStorage: 'room_temp',
                matchedProductId: null
              });
            }
          }
        }
        summaryInfo = "Processed using offline text recognition."
      }
    }

    // Final response assembly
    return NextResponse.json({
      success: true,
      items: itemsInfo,
      summary: summaryInfo,
      totalItemsDetected: itemsInfo.length
    })

  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to process image.' },
      { status: 500 }
    )
  }
}
