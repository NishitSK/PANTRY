import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { Product, User } from '@/models'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getOrCreateDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!email) return null

  let user = await User.findOne({ email })
  if (!user) {
    user = await User.create({
      email,
      name: clerkUser?.fullName || clerkUser?.firstName || undefined,
      image: clerkUser?.imageUrl,
    })
  }

  return user
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const user = await getOrCreateDbUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = await getOrCreateDbUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    const category = String(body?.category || 'Pantry Staples').trim() || 'Pantry Staples'
    const defaultStorageMethodId = String(body?.defaultStorageMethodId || 'room').trim() || 'room'

    const baseShelfLifeDays = Number(body?.baseShelfLifeDays)
    const roomTempShelfLifeDays = Number(body?.roomTempShelfLifeDays)
    const fridgeShelfLifeDays = Number(body?.fridgeShelfLifeDays)
    const freezerShelfLifeDays = Number(body?.freezerShelfLifeDays)

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    const existing = await Product.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean()
    if (existing) {
      return NextResponse.json(
        {
          ...existing,
          id: existing._id.toString(),
          _id: existing._id.toString(),
          defaultStorageMethodId: existing.defaultStorageMethodId.toString(),
        },
        { status: 200 }
      )
    }

    const created = await Product.create({
      name,
      category,
      baseShelfLifeDays: Number.isFinite(baseShelfLifeDays) && baseShelfLifeDays > 0 ? baseShelfLifeDays : 14,
      roomTempShelfLifeDays: Number.isFinite(roomTempShelfLifeDays) && roomTempShelfLifeDays >= 0 ? roomTempShelfLifeDays : 7,
      fridgeShelfLifeDays: Number.isFinite(fridgeShelfLifeDays) && fridgeShelfLifeDays >= 0 ? fridgeShelfLifeDays : 14,
      freezerShelfLifeDays: Number.isFinite(freezerShelfLifeDays) && freezerShelfLifeDays >= 0 ? freezerShelfLifeDays : 90,
      storageNotes: String(body?.storageNotes || '').trim() || undefined,
      defaultStorageMethodId,
    })

    return NextResponse.json(
      {
        ...created.toObject(),
        id: created._id.toString(),
        _id: created._id.toString(),
        defaultStorageMethodId: created.defaultStorageMethodId.toString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
