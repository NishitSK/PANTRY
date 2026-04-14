import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import { InventoryItem, User } from '@/models'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OverviewHero from '@/components/dashboard/OverviewHero'
import ExpiringSoonCarousel from '@/components/dashboard/ExpiringSoonCarousel'
import Link from 'next/link'
import { Plus, Camera, ArrowRight, Zap, Target, Gauge } from 'lucide-react'

async function getDashboardStats(userId: string) {
    // Gracefully degrade in dev if MongoDB is not configured yet.
    if (!process.env.MONGODB_URI) {
        return {
            totalItems: 0,
            expiringSoonCount: 0,
            expiringItems: [],
            purity: 100,
        }
    }

    try {
        await connectDB()
    } catch (error) {
        console.warn('Dashboard DB connection skipped:', error)
        return {
            totalItems: 0,
            expiringSoonCount: 0,
            expiringItems: [],
            purity: 100,
        }
    }

    const items = await InventoryItem.find({ userId }).populate('productId').populate('storageMethodId').lean()
  
  const today = new Date()
  let expiringSoonCount = 0
  let expiringItems = []
  
  for (const item of items) {
    const product = item.productId as any
    const storage = item.storageMethodId as any
    if (!product || !storage) continue

    let shelfLife = product.baseShelfLifeDays
    const storageName = storage.name.toLowerCase()
    if (storageName.includes('freezer')) shelfLife = product.freezerShelfLifeDays || shelfLife
    else if (storageName.includes('fridge')) shelfLife = product.fridgeShelfLifeDays || shelfLife

    const expiryDate = new Date(item.purchasedAt)
    expiryDate.setDate(expiryDate.getDate() + shelfLife)
    const daysLeft = Math.round((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

    if (daysLeft <= 3) {
      expiringSoonCount++
      expiringItems.push({
        _id: item._id.toString(),
        name: product.name,
        category: product.category,
        daysLeft
      })
    }
  }

  return {
    totalItems: items.length,
    expiringSoonCount,
    expiringItems: expiringItems.sort((a,b) => a.daysLeft - b.daysLeft).slice(0, 4),
    purity: items.length > 0 ? Math.round(((items.length - expiringSoonCount) / items.length) * 100) : 100
  }
}

export default async function DashboardPage() {
    const { userId } = await auth()
    if (!userId) redirect('/auth/login')

    const user = await currentUser()

        const email = user?.emailAddresses?.[0]?.emailAddress
        if (!email) redirect('/auth/login')

        await connectDB()

        let dbUser = await User.findOne({ email }).lean()
        if (!dbUser) {
            await User.create({
                email,
                name: user?.fullName || user?.firstName || undefined,
                image: user?.imageUrl,
            })
            dbUser = await User.findOne({ email }).lean()
        }

        if (!dbUser) redirect('/auth/login')

        const stats = await getDashboardStats(dbUser._id.toString())

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto py-6 md:py-10 px-2 sm:px-4">
        {/* Brutalist Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8 md:mb-12 border-4 border-black bg-[#F6F1E7] px-4 sm:px-6 py-4 sm:py-5 shadow-[8px_8px_0_#000]">
            <div>
                <h1 className="text-xs font-manrope font-black uppercase tracking-[0.35em] text-black mb-2">Morning Summary</h1>
                <p className="text-2xl sm:text-3xl font-noto-serif font-bold text-black">Your kitchen is breathing.</p>
            </div>
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                <Link href="/">
                                    <button className="border-2 border-black bg-white px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-black hover:text-white">
                                        Landing Page
                                    </button>
                                </Link>
                <div className="h-12 w-12 border-2 border-black flex items-center justify-center bg-[#FFE66D]">
                    <div className="h-full w-full flex items-center justify-center text-black font-black">
                        {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </div>

        {/* Hero */}
        <OverviewHero 
            userName={user?.firstName || user?.fullName || 'Chef'} 
            purity={stats.purity}
            itemsTracked={stats.totalItems}
            toRestock={stats.expiringSoonCount}
        />

        <div className="grid grid-cols-12 gap-8 mt-16">
            {/* Main Section */}
            <div className="col-span-12 lg:col-span-8">
                <ExpiringSoonCarousel items={stats.expiringItems} />
                
                {/* Secondary Editorial Section */}
                <div className="bg-[#FFFDF7] p-10 border-4 border-black shadow-[10px_10px_0_#000] relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-noto-serif font-bold text-black mb-4">Your Freshness Plan</h2>
                        <p className="text-black/80 font-manrope text-lg leading-relaxed max-w-xl mb-8">
                            Based on your current stock, you have enough ingredients for 12 potential recipes. 
                            We recommend a <span className="text-black bg-[#93E1A8] px-1 font-black">Mediterranean Salad</span> tonight to utilize your ripening tomatoes.
                        </p>
                        <Link href="/inventory">
                            <button className="flex items-center gap-3 text-black font-black uppercase tracking-[0.12em] hover:gap-5 transition-all group border-2 border-black px-4 py-2 bg-white hover:bg-[#FFE66D]">
                                Explore full inventory
                                <ArrowRight className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </Link>
                    </div>
                    <div className="absolute right-[-5%] bottom-[-5%] w-48 h-48 bg-[#FFE66D] border-4 border-black rotate-12 opacity-20" />
                </div>
            </div>

            {/* Sidebar Actions */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-black text-white p-8 border-4 border-black shadow-[10px_10px_0_#93E1A8]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-white text-black border-2 border-black">
                            <Zap className="h-6 w-6 text-black" />
                        </div>
                        <h3 className="text-xl font-noto-serif font-bold">Quick Actions</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <Link href="/add">
                            <button className="w-full bg-[#FFE66D] text-black font-black py-4 border-2 border-black hover:translate-x-1 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                                <Plus className="h-5 w-5" />
                                Add Single Item
                            </button>
                        </Link>
                        <button className="w-full bg-[#93E1A8] border-2 border-black text-black font-black py-4 hover:translate-x-1 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                            <Camera className="h-5 w-5" />
                            Scan Grocery Receipt
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_#000]">
                    <h3 className="text-xl font-noto-serif font-bold text-black mb-6">Pantry Health</h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black">
                                <span>Utilization</span>
                                <span className="text-black">92%</span>
                            </div>
                            <div className="h-2 bg-black/10 overflow-hidden border border-black">
                                <div className="h-full bg-black w-[92%] transition-all duration-1000" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black">
                                <span>Accuracy</span>
                                <span className="text-black">88%</span>
                            </div>
                            <div className="h-2 bg-black/10 overflow-hidden border border-black">
                                <div className="h-full bg-black w-[88%] transition-all duration-1000" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  )
}