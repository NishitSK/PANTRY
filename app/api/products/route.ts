import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Product } from '@/models'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const filter = category ? { category } : {}
    const products = await Product.find(filter).sort({ name: 1 }).lean()

    // Convert _id to string and map to id field for frontend
    const productsWithIds = products.map(p => ({
      ...p,
      id: p._id.toString(),
      _id: p._id.toString(),
      defaultStorageMethodId: p.defaultStorageMethodId.toString()
    }))

    return NextResponse.json(productsWithIds)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
