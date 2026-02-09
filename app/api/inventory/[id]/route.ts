import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { User, InventoryItem, Prediction, WeatherSnapshot, Feedback } from '@/models'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = params
    const { quantity, notes } = await req.json()

    // Verify the item belongs to the user
    const existingItem = await InventoryItem.findById(id)

    if (!existingItem || existingItem.userId !== user._id.toString()) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Update the item
    const updateData: any = {}
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity)
    if (notes !== undefined) updateData.notes = notes || null

    const updatedItem = await InventoryItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('product')
      .populate('storageMethod')
      .lean()

    // Get latest prediction
    const predictions = await Prediction.find({ inventoryItemId: id })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean()

    return NextResponse.json({
      ...updatedItem,
      _id: updatedItem!._id.toString(),
      userId: updatedItem!.userId.toString(),
      productId: updatedItem!.productId.toString(),
      storageMethodId: updatedItem!.storageMethodId.toString(),
      predictions: predictions.map(p => ({
        ...p,
        _id: p._id.toString(),
        inventoryItemId: p.inventoryItemId.toString()
      }))
    })
  } catch (error) {
    console.error('Update inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = params

    // Verify the item belongs to the user
    const existingItem = await InventoryItem.findById(id)

    if (!existingItem || existingItem.userId !== user._id.toString()) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Delete related records first
    await WeatherSnapshot.deleteMany({ inventoryItemId: id })
    await Prediction.deleteMany({ inventoryItemId: id })
    await Feedback.deleteMany({ inventoryItemId: id })

    // Delete the inventory item
    await InventoryItem.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Delete inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
