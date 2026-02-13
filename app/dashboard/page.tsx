import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import { InventoryItem, Product, StorageMethod } from '@/models'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
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
      <div className="flex flex-col min-h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] gap-4 overflow-y-auto md:overflow-hidden">
        {/* Header - Compact */}
        <div className="flex items-center justify-between pb-6 pt-2 shrink-0">
          <div>
            <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, <span className="text-primary">{session.user.name?.split(' ')[0] || 'User'}</span>.
            </h1>
            <p className="text-lg text-muted-foreground font-light mt-1">Here&apos;s what&apos;s happening in your pantry today.</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-white shadow-sm border border-border/50 flex items-center justify-center text-primary font-bold text-lg">
            {session.user.name?.charAt(0) || 'U'}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 mb-8">
          <Card className="flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Package className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/5 rounded-full">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Items</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <div className="text-5xl font-serif text-foreground">{totalItems}</div>
              <div className="text-sm text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                Active
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-center relative overflow-hidden group border-orange-100/50 dark:border-orange-900/20 bg-orange-50/30 dark:bg-orange-900/5">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-orange-500">
               <AlertTriangle className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-orange-700/70 dark:text-orange-300/70 uppercase tracking-wider">Expiring Soon</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <div className="text-5xl font-serif text-orange-700 dark:text-orange-400">{expiringSoonCount}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Within 3 days
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-blue-500">
               <Banknote className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
               <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Est. Value</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <div className="text-5xl font-serif text-foreground">
                <span className="text-2xl align-top opacity-50 mr-1">₹</span>{totalValue.toLocaleString('en-IN')}
              </div>
            </div>
          </Card>
        </div>

        {/* Main Section - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Left Column: Expiring Soon */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-lg font-serif font-medium text-foreground">Expiring Soon</h2>
               <Link href="/inventory" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            
            <div className="flex-1 space-y-3 min-h-0">
              {expiringItems.length > 0 ? (
                expiringItems.map((item: any) => (
                  <Card key={item._id} className="p-4 flex items-center justify-between hover:border-primary/30 cursor-pointer group !rounded-3xl !py-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                        item.daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">{item.productName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.storageName} • <span className={item.openedAt ? "text-orange-500" : "text-emerald-500"}>{item.openedAt ? 'Opened' : 'Sealed'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white border border-border/50 text-foreground shadow-sm">
                        {item.daysLeft === 0 ? 'Today' : `${item.daysLeft} days`}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="bg-white/50 border border-dashed border-border/50 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center gap-4 h-64">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                    <PartyPopper className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-serif text-xl text-foreground">No items expiring soon</p>
                    <p className="text-muted-foreground">Your pantry is fresh and healthy.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Actions */}
          <div className="flex flex-col gap-4 shrink-0">
            <h2 className="text-lg font-serif font-medium text-foreground px-1">Quick Actions</h2>
            
            <Card className="p-6 flex flex-col gap-4 !rounded-[2rem] bg-white border-none shadow-xl shadow-indigo-100/50 dark:shadow-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                    <Camera className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-base text-foreground">Scan Receipt</h3>
                    <p className="text-xs text-muted-foreground">AI Auto-Import</p>
                </div>
              </div>
              
              <Link href="/add" className="w-full">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm">
                  <Camera className="h-4 w-4" />
                  Scan Now
                </button>
              </Link>
            </Card>

            <Card className="p-6 flex flex-col gap-4 !rounded-[2rem] bg-white border-none shadow-xl shadow-emerald-100/50 dark:shadow-none">
               <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl">
                    <PlusCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className="font-bold text-base text-foreground">Manual Add</h3>
                    <p className="text-xs text-muted-foreground">Single Item Entry</p>
                </div>
              </div>
              <Link href="/add" className="w-full">
                <button className="w-full bg-white border-2 border-emerald-100 hover:border-emerald-200 text-emerald-700 font-medium py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm">
                  <PlusCircle className="h-4 w-4" />
                  Add Manually
                </button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}