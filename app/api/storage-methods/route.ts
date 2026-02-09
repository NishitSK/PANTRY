import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { StorageMethod } from '@/models'

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

    const storageMethods = await StorageMethod.find().sort({ name: 1 }).lean()

    // Convert _id to string and map to id field for frontend
    const methodsWithIds = storageMethods.map(m => ({
      ...m,
      id: m._id.toString(),
      _id: m._id.toString()
    }))

    return NextResponse.json(methodsWithIds)
  } catch (error) {
    console.error('Get storage methods error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
