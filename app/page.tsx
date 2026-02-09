import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import { InventoryItem, Product, StorageMethod } from '@/models'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'
import { PlusCircle, Camera, ArrowRight, TrendingUp, AlertTriangle, Package, Hand, PartyPopper, Banknote } from 'lucide-react'

// Helper to calculate days between dates
const getDaysDiff = (date1: Date, date2: Date) => {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round((date1.getTime() - date2.getTime()) / oneDay)
}

async function getDashboardStats(userId: string) {
  await connectDB()

  // Fetch all inventory items for the user
  const items = await InventoryItem.find({ userId })
    .populate('productId')
    .populate('storageMethodId')
    .sort({ purchasedAt: -1 })
    .lean()

  const totalItems = items.length
  
  // Calculate expiry status for each item
  const today = new Date()
  let expiringSoonCount = 0
  let expiringItems = []

  // Calculate estimated value
  const CATEGORY_PRICES: Record<string, number> = {
    'Meat & Poultry': 550,
    'Seafood': 600,
    'Dairy': 150,
    'Cheese': 300,
    'Bakery': 80,
    'Beverages': 120,
    'Fresh Fruits': 100,
    'Fresh Vegetables': 60,
    'Snacks': 50,
    'Frozen Foods': 250,
    'Pantry Staples': 100,
    'Grains & Pasta': 90,
    'Condiments & Sauces': 180,
    'Canned Goods': 120,
    'Breakfast': 200,
    'Herbs & Spices': 200,
    'Eggs & Tofu': 100
  }
  
  let totalValue = 0

  for (const item of items) {
    const product = item.productId as any
    const storage = item.storageMethodId as any
    
    if (!product || !storage) continue

    // Calculate Value
    let price = CATEGORY_PRICES[product.category] || 150 // Default 150
    // Adjust for quantity if unit is typical (simple heuristic)
    // Assuming quantity 1 means "one pack" or "1 kg" roughly evaluating to the category price.
    // For now, strict category average is better than random multiplier.
    totalValue += price * (item.quantity || 1)

    // Determine shelf life
    let shelfLife = product.baseShelfLifeDays
    const storageName = storage.name.toLowerCase()
    
    if (storageName.includes('freezer') && product.freezerShelfLifeDays) {
      shelfLife = product.freezerShelfLifeDays
    } else if ((storageName.includes('fridge') || storageName.includes('refrig')) && product.fridgeShelfLifeDays) {
      shelfLife = product.fridgeShelfLifeDays
    } else if (storageName.includes('room') && product.roomTempShelfLifeDays) {
      shelfLife = product.roomTempShelfLifeDays
    }

    // Adjust for opened items
    if (item.openedAt) {
      shelfLife = Math.floor(shelfLife * 0.75)
    }

    const purchaseDate = new Date(item.purchasedAt)
    const expiryDate = new Date(purchaseDate)
    expiryDate.setDate(expiryDate.getDate() + shelfLife)
    
    const daysLeft = getDaysDiff(expiryDate, today)
    
    // Add calculated fields to item
    const enhancedItem = {
      ...item,
      productName: product.name,
      category: product.category,
      storageName: storage.name,
      daysLeft,
      expiryDate
    }

    if (daysLeft <= 3 && daysLeft >= 0) {
      expiringSoonCount++
      expiringItems.push(enhancedItem)
    } else if (daysLeft < 0) {
      // Expired items - could track separately if needed
    }
  }

  // Sort expiring items by days left (ascending)
  expiringItems.sort((a, b) => a.daysLeft - b.daysLeft)

  return {
    totalItems,
    expiringSoonCount,
    expiringItems: expiringItems.slice(0, 3), // Top 3 expiring soon
    totalValue
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const { totalItems, expiringSoonCount, expiringItems, totalValue } = await getDashboardStats((session.user as any).id)

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 overflow-hidden">
        {/* Header - Compact */}
        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/10 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground">Welcome back, {session.user.name?.split(' ')[0] || 'User'}!</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your pantry is looking fresh today.</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base border border-primary/20">
            {session.user.name?.charAt(0) || 'U'}
          </div>
        </div>

        {/* Stats Row - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Items</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-foreground">{totalItems}</div>
              <div className="text-xs text-primary font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Active
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiring Soon</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-destructive">{expiringSoonCount}</div>
              <div className="text-xs text-destructive font-medium">
                Within 3 days
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
               <Banknote className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Est. Value</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-foreground">
                ₹{totalValue.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-primary/80 font-medium">
                ~ Category Est.
              </div>
            </div>
          </div>
        </div>

        {/* Main Section - Flex to fill remaining height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Left Column: Expiring Soon - Scrollable if needed */}
          <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
            <h2 className="text-sm font-bold text-foreground shrink-0 uppercase tracking-wider text-muted-foreground">Expiring Soon</h2>
            
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-2">
              {expiringItems.length > 0 ? (
                expiringItems.map((item: any) => (
                  <div key={item._id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between shadow-sm hover:border-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center text-lg">
                        <Package className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-foreground">{item.productName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {item.storageName} • {item.openedAt ? 'Opened' : 'Sealed'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive uppercase tracking-wide">
                        {item.daysLeft} days left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-muted/30 rounded-xl p-8 border border-dashed border-border text-center flex flex-col items-center justify-center h-full gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                    <PartyPopper className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground">No items expiring soon!</p>
                  <p className="text-sm text-muted-foreground">Your pantry is fresh and healthy.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Actions - Compact */}
          <div className="flex flex-col gap-3 shrink-0">
            <h2 className="text-sm font-bold text-foreground shrink-0 uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
            
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-foreground" />
                <h3 className="font-bold text-sm text-foreground">Scan Receipt</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a photo to automatically add items using AI.
              </p>
              <Link href="/add" className="w-full">
                <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm">
                  <Camera className="h-3 w-3" />
                  Scan Now
                </button>
              </Link>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col gap-3">
               <div className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-foreground" />
                <h3 className="font-bold text-sm text-foreground">Manual Add</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Quickly add a single item to your inventory.
              </p>
              <Link href="/add" className="w-full">
                <button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium py-2 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm">
                  <PlusCircle className="h-3 w-3" />
                  Add Item
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}