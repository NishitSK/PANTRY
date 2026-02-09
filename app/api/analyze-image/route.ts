import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import connectDB from '@/lib/mongodb'
import { Product } from '@/models'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

    // Convert file to base64 for Gemini
    const bytes = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString('base64')

    await connectDB()

    // Get existing products from database to help with matching
    const products = await Product.find().select('_id name category').lean()

    const productList = products.map(p => `${p.name} (${p.category})`).join(', ')

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Prepare the image for Gemini
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: imageFile.type
      }
    }

    // Create the prompt for food identification
    const prompt = `You are a food identification expert for a pantry management app. Analyze this image and identify all food items visible.

For each food item you identify, provide:
1. name: The specific name of the food item (e.g., "Apple", "Milk", "Bread")
2. category: One of these categories: Bakery, Beverages, Condiments & Sauces, Dairy, Eggs & Tofu, Fresh Fruits, Fresh Vegetables, Frozen Foods, Meat & Poultry, Pantry Staples, Seafood, Snacks, Grains & Pasta, Canned Goods, Breakfast, Herbs & Spices
3. quantity: Estimated quantity visible
4. unit: Appropriate unit (pieces, kg, liters, grams, etc.)
5. suggestedStorage: One of: "room_temp", "refrigerator", "freezer"
6. confidence: Your confidence level (high, medium, low)

Here are some products already in the database for reference (try to match these names if applicable):
${productList}

Respond ONLY with a valid JSON object in this exact format:
{
  "items": [
    {
      "name": "string",
      "category": "string",
      "quantity": number,
      "unit": "string",
      "suggestedStorage": "string",
      "confidence": "string",
      "matchedProductId": "string or null"
    }
  ],
  "summary": "Brief description of what you see in the image"
}

If no food items are detected, return:
{
  "items": [],
  "summary": "No food items detected in this image"
}`

    // Generate content with the image
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let analysisResult
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }
      analysisResult = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Try to match identified items with products in database
    const itemsWithMatches = await Promise.all(
      analysisResult.items.map(async (item: any) => {
        // Try to find a matching product by name (case-insensitive)
        const matchedProduct = products.find(p =>
          p.name.toLowerCase() === item.name.toLowerCase() ||
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(p.name.toLowerCase())
        )

        return {
          ...item,
          matchedProductId: matchedProduct?._id.toString() || null,
          matchedProductName: matchedProduct?.name || null
        }
      })
    )

    return NextResponse.json({
      success: true,
      items: itemsWithMatches,
      summary: analysisResult.summary,
      totalItemsDetected: itemsWithMatches.length
    })

  } catch (error: any) {
    console.error('Image analysis error:', error)

    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    )
  }
}
