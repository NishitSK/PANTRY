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
const InsightsCharts = dynamic(() => import('@/components/insights/InsightsCharts'), { ssr: false })

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

  const sortedCategories = (Object.entries(categoryCount) as [string, number][])
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
      <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 overflow-hidden p-1">
        {/* Header & Weather Compact Row */}
        <div className="grid md:grid-cols-2 gap-4 shrink-0 max-h-[50vh]">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground tracking-tight">Insights</h1>
              <p className="text-muted-foreground mt-0.5 text-sm font-light">Pantry statistics & trends.</p>
            </div>

            {/* Stats Grid - Balanced */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/50 shadow-sm bg-card p-4 flex flex-col justify-between gap-1 !rounded-[2rem] hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-primary/10 rounded-2xl shrink-0">
                        <Package className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-serif text-foreground">{totalItems}</p>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Items</p>
              </Card>

              <Card className="border-border/50 shadow-sm bg-card p-4 flex flex-col justify-between gap-1 !rounded-[2rem] hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-2xl shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-2xl font-serif text-red-600 dark:text-red-400">{expiredCount}</p>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Expired</p>
              </Card>

              <Card className="border-border/50 shadow-sm bg-card p-4 flex flex-col justify-between gap-1 !rounded-[2rem] hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-2xl shrink-0">
                        <Timer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-2xl font-serif text-orange-600 dark:text-orange-400">{expiringCount}</p>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Expiring Soon</p>
              </Card>

              <Card className="border-border/50 shadow-sm bg-card p-4 flex flex-col justify-between gap-1 !rounded-[2rem] hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl shrink-0">
                        <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-serif text-emerald-600 dark:text-emerald-400">{freshCount}</p>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Fresh Items</p>
              </Card>
            </div>
          </div>

          <div className="h-full min-h-0 flex flex-col justify-end">
             {/* Compact Weather Placeholder - reducing height here as possible */}
            <InsightsLocationWeather />
          </div>
        </div>

        {/* Charts Grid - 2 Column Layout - Client Side Charts */}
        <div className="flex-1 min-h-0">
        <InsightsCharts 
          categoryData={sortedCategories}
          storageData={{
            pantry: itemsWithPredictions.filter((i: any) => i.storageMethodId?.name?.toLowerCase().includes('room')).length,
            fridge: itemsWithPredictions.filter((i: any) => {
              const name = i.storageMethodId?.name?.toLowerCase() || ''
              return name.includes('fridge') || name.includes('refrig')
            }).length,
            freezer: itemsWithPredictions.filter((i: any) => i.storageMethodId?.name?.toLowerCase().includes('freezer')).length
          }}
          totalItems={totalItems}
        />
      </div>
     </div>
    </DashboardLayout>
  )
}
