import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { User, InventoryItem, Prediction } from '@/models'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import dynamic from 'next/dynamic'
import { 
  Package, AlertTriangle, Timer, Leaf, 
  Archive, Snowflake, Zap, TrendingUp,
  Activity, Calendar
} from 'lucide-react'

const InsightsLocationWeather = dynamic(() => import('@/components/InsightsLocationWeather'), { ssr: false })

export default async function InsightsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/login')
  }

  await connectDB()

  const user = await User.findOne({ email: session.user.email }).lean()

  if (!user) {
    redirect('/auth/login')
  }

  const items = await InventoryItem.find({ userId: user._id.toString() })
    .populate('productId')
    .populate('storageMethodId')
    .lean()

  const itemsWithPredictions = await Promise.all(
    items.map(async (item: any) => {
      const predictions = await Prediction.find({ inventoryItemId: item._id.toString() })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean()
      
      return {
        ...item,
        predictions: predictions
      }
    })
  )

  // Count by category
  const categoryCount = itemsWithPredictions.reduce((acc, item: any) => {
    const cat = item.productId?.category || 'Unknown'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedCategories = Object.entries(categoryCount)
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 5)

  // Calculate dashboard stats (replacing the stored procedure)
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  
  let expiredCount = 0
  let expiringCount = 0
  let freshCount = 0

  itemsWithPredictions.forEach((item: any) => {
    const product = item.productId
    const storage = item.storageMethodId
    
    if (!product || !storage) return

    // Determine shelf life based on storage method
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

    if (expiryDate < now) {
      expiredCount++
    } else if (expiryDate <= threeDaysFromNow) {
      expiringCount++
    } else {
      freshCount++
    }
  })

  const totalItems = itemsWithPredictions.length

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-3rem)] gap-4 overflow-hidden">
        {/* Header & Weather Compact Row */}
        <div className="grid md:grid-cols-2 gap-4 shrink-0">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Insights</h1>
              <p className="text-sm text-muted-foreground">Pantry statistics & trends.</p>
            </div>

            {/* Stats Grid - Moved here */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border shadow-sm bg-card p-3 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-xl font-black text-foreground leading-none">{totalItems}</p>
                </div>
              </Card>

              <Card className="border-border shadow-sm bg-card p-3 flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expired</p>
                  <p className="text-xl font-black text-red-600 dark:text-red-400 leading-none">{expiredCount}</p>
                </div>
              </Card>

              <Card className="border-border shadow-sm bg-card p-3 flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg shrink-0">
                  <Timer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expiring</p>
                  <p className="text-xl font-black text-orange-600 dark:text-orange-400 leading-none">{expiringCount}</p>
                </div>
              </Card>

              <Card className="border-border shadow-sm bg-card p-3 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Leaf className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fresh</p>
                  <p className="text-xl font-black text-primary leading-none">{freshCount}</p>
                </div>
              </Card>
            </div>
          </div>

          <div className="h-full">
            <InsightsLocationWeather />
          </div>
        </div>

        {/* Charts Grid - 2 Column Layout */}
        <div className="grid gap-4 md:grid-cols-2 flex-1 min-h-0">
          {/* Top Categories */}
          <Card className="overflow-hidden shadow-sm border border-border flex flex-col">
            <div className="p-4 border-b border-border shrink-0">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Top Categories
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {sortedCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p className="text-xs">No data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCategories.map(([category, count]: [string, number]) => {
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground">{category}</span>
                          <span className="text-muted-foreground">{count} ({Math.round(count / totalItems * 100)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${count / totalItems * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Storage Distribution */}
          <Card className="overflow-hidden shadow-sm border border-border flex flex-col">
            <div className="p-4 border-b border-border shrink-0">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Storage
              </h3>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/10">
                <div className="p-2 bg-secondary/20 rounded-md">
                  <Archive className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Pantry</p>
                  <p className="text-lg font-bold text-foreground">
                    {itemsWithPredictions.filter((i: any) => i.storageMethodId?.name?.toLowerCase().includes('room')).length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-blue-500/10">
                <div className="p-2 bg-blue-500/20 rounded-md">
                  <Snowflake className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Fridge</p>
                  <p className="text-lg font-bold text-foreground">
                    {itemsWithPredictions.filter((i: any) => {
                      const name = i.storageMethodId?.name?.toLowerCase() || ''
                      return name.includes('fridge') || name.includes('refrig')
                    }).length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-indigo-500/10">
                <div className="p-2 bg-indigo-500/20 rounded-md">
                  <Snowflake className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Freezer</p>
                  <p className="text-lg font-bold text-foreground">
                    {itemsWithPredictions.filter((i: any) => i.storageMethodId?.name?.toLowerCase().includes('freezer')).length}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
