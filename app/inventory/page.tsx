'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Loader2, Plus, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import ExpiringSoonCarousel from '@/components/dashboard/ExpiringSoonCarousel'
import { motion, AnimatePresence } from 'framer-motion'

interface InventoryItem {
  _id: string
  productId: {
    _id: string
    name: string
    category: string
    baseShelfLifeDays: number
    fridgeShelfLifeDays?: number
    freezerShelfLifeDays?: number
    roomTempShelfLifeDays?: number
  }
  storageMethodId: {
    _id: string
    name: string
  }
  quantity: number
  unit: string
  purchasedAt: string
  openedAt?: string
  expiryDate?: string
  status?: 'good' | 'expiring' | 'expired'
  daysLeft?: number
  storageSuggestion?: string
}

export default function InventoryPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Dairy', 'Meat', 'Grains', 'Pantry', 'Frozen', 'Beverages', 'Other']

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/login')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    const fetchInventory = async () => {
      if (!isLoaded || !isSignedIn) return
      try {
        const res = await fetch('/api/inventory')
        if (!res.ok) throw new Error('Failed to fetch inventory')
        const data = await res.json()
        
        const enhancedData = data.map((item: any) => {
          const product = item.productId
          const storage = item.storageMethodId
          const purchasedAt = new Date(item.purchasedAt)
          let shelfLife = product.baseShelfLifeDays
          const storageName = storage?.name?.toLowerCase() || ''

          if (storageName.includes('freezer')) shelfLife = product.freezerShelfLifeDays ?? shelfLife
          else if (storageName.includes('fridge') || storageName.includes('refrig')) shelfLife = product.fridgeShelfLifeDays ?? shelfLife
          else if (storageName.includes('room')) shelfLife = product.roomTempShelfLifeDays ?? shelfLife

          if (item.openedAt) shelfLife = Math.floor(shelfLife * 0.75)
          const expiryDate = new Date(purchasedAt)
          expiryDate.setDate(expiryDate.getDate() + shelfLife)
          const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

          const methods = [
            { key: 'room', label: 'Room Temperature', days: product.roomTempShelfLifeDays ?? product.baseShelfLifeDays },
            { key: 'fridge', label: 'Refrigerator', days: product.fridgeShelfLifeDays ?? product.baseShelfLifeDays },
            { key: 'freezer', label: 'Freezer', days: product.freezerShelfLifeDays ?? product.baseShelfLifeDays },
          ]

          const currentMethodKey = storageName.includes('freezer')
            ? 'freezer'
            : storageName.includes('fridge') || storageName.includes('refrig')
              ? 'fridge'
              : 'room'

          const currentMethod = methods.find((m) => m.key === currentMethodKey)
          const bestMethod = methods.reduce((best, next) => (next.days > best.days ? next : best), methods[0])

          let storageSuggestion: string | undefined
          if (currentMethod && bestMethod.days > currentMethod.days) {
            const extraDays = bestMethod.days - currentMethod.days
            if (daysLeft <= 3 || item.status === 'expired') {
              storageSuggestion = `Try storing in ${bestMethod.label}. This can extend freshness by about ${extraDays} day(s).`
            }
          }
          
          let status: 'good' | 'expiring' | 'expired' = 'good'
          if (daysLeft < 0) status = 'expired'
          else if (daysLeft <= 3) status = 'expiring'

          return { ...item, expiryDate: expiryDate.toISOString(), daysLeft, status, storageSuggestion }
        })
        setItems(enhancedData)
      } catch (error) {
        console.error('Error loading inventory:', error)
      } finally {
        setLoading(false)
      }
    }
    if (isLoaded && isSignedIn) fetchInventory()
  }, [isLoaded, isSignedIn])

  const filteredItems = items.filter(item => {
    const matchesSearch = item.productId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || item.productId?.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const expiringSoonItems = items.filter(item => item.status === 'expiring' || item.status === 'expired')
    .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0))
    .slice(0, 5)

  const getStorageBadgeClass = (storageName?: string) => {
    const name = (storageName || '').toLowerCase()
    if (name.includes('freezer')) return 'bg-[#1E3A8A] text-white'
    if (name.includes('fridge') || name.includes('refrig')) return 'bg-[#BFE7FF] text-black'
    return 'bg-[#FFE66D] text-black'
  }

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#0D631B]" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto py-6 md:py-10 px-2 sm:px-4">
        {/* Top Navigation / Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-4 md:gap-8 sticky top-0 bg-[#F6F1E7] z-30 py-3 md:py-4 px-3 md:px-6 border-4 border-black shadow-[8px_8px_0_#000]">
            <div className="relative flex-1 w-full max-w-xl group">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#0D631B] transition-colors" data-icon="search">search</span>
                <input 
                    type="text" 
                    placeholder="Search your pantry..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-black py-4 pl-14 pr-6 focus:outline-none transition-all placeholder:text-stone-500 font-manrope font-semibold text-black"
                />
            </div>
            <div className="flex w-full md:w-auto items-center justify-end gap-3 md:gap-6">
                <Link href="/add">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
              className="bg-[#FFE66D] text-black px-4 sm:px-6 md:px-10 py-3 md:py-4 border-2 border-black font-manrope font-black text-sm md:text-base shadow-[4px_4px_0_#000] flex items-center gap-2 hover:bg-black hover:text-white"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Item
                    </motion.button>
                </Link>
            </div>
        </div>

        {/* Expiring Soon Section */}
        <ExpiringSoonCarousel items={expiringSoonItems.map(item => ({
            _id: item._id,
            name: item.productId?.name,
            category: item.productId?.category,
            daysLeft: item.daysLeft || 0,
            image: undefined // Could map real images if available
        }))} />

        {/* Main Inventory Title & Categories */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-6">
            <div>
          <h2 className="text-3xl sm:text-4xl font-noto-serif font-bold text-black mb-2">Inventory</h2>
          <p className="text-black/70 font-manrope text-base sm:text-lg">Every ingredient in a brutalist grid.</p>
            </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 w-full md:w-auto">
            {CATEGORIES.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                  "px-6 py-2.5 font-manrope font-black text-sm uppercase tracking-[0.1em] transition-all whitespace-nowrap border-2 border-black",
                            categoryFilter === cat 
                    ? "bg-[#93E1A8] text-black shadow-[4px_4px_0_#000]" 
                    : "bg-white text-black hover:bg-black hover:text-white"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Mobile Inventory Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden mb-10">
          {filteredItems.map((item) => (
            <div key={item._id} className="border-4 border-black bg-[#F4F4EF] p-4 shadow-[6px_6px_0_#000]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">{item.productId?.category}</p>
                  <h3 className="mt-1 text-2xl font-noto-serif font-bold text-black leading-tight">{item.productId?.name}</h3>
                </div>
                <div className={cn(
                  "px-3 py-1 border-2 border-black text-[10px] font-black uppercase tracking-[0.18em]",
                  item.status === 'expired' ? 'bg-[#FFD2CC]' : item.status === 'expiring' ? 'bg-[#FFE66D]' : 'bg-[#93E1A8]'
                )}>
                  {item.status === 'expired' ? 'Expired' : item.status === 'expiring' ? 'Expiring' : 'Fresh'}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-manrope">
                <div className="border-2 border-black bg-white p-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/60">Storage</p>
                  <span className={cn(
                    'mt-1 inline-flex border-2 border-black px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]',
                    getStorageBadgeClass(item.storageMethodId?.name)
                  )}>
                    {item.storageMethodId?.name || 'Room Temperature'}
                  </span>
                </div>
                <div className="border-2 border-black bg-white p-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/60">Quantity</p>
                  <p className="mt-1 font-bold text-black">{item.quantity} {item.unit}</p>
                </div>
                <div className="col-span-2 border-2 border-black bg-white p-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/60">Freshness</p>
                  <p className="mt-1 font-bold text-black">
                    {item.status === 'expired'
                      ? `Expired ${Math.abs(item.daysLeft || 0)} day(s) ago`
                      : item.status === 'expiring'
                        ? `Expires in ${item.daysLeft || 0} day(s)`
                        : 'Optimal Freshness'}
                  </p>
                  {item.storageSuggestion ? (
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#93000A]">
                      {item.storageSuggestion}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="border-4 border-black bg-white p-6 text-center shadow-[6px_6px_0_#000]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/60">No matching items</p>
              <h3 className="mt-2 font-noto-serif text-3xl text-black">Nothing fits this filter.</h3>
              <p className="mt-2 font-manrope text-sm text-black/75">
                Try a different search term or category, or add a new item to the pantry.
              </p>
              <Link href="/add" className="mt-4 inline-flex min-h-11 items-center border-2 border-black bg-[#FFE66D] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white">
                Add item
              </Link>
            </div>
          )}
        </div>

        {/* Inventory List (Editorial Table) */}
        <div className="hidden md:block bg-[#F4F4EF] overflow-hidden border-4 border-black mb-20 shadow-[8px_8px_0_#000]">
          <div className="grid grid-cols-12 px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-black border-b-2 border-black">
                <div className="col-span-5">Item Details</div>
                <div className="col-span-3 text-center">Expiry Status</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Freshness</div>
            </div>
            
            <AnimatePresence>
                <div className="divide-y-2 divide-black/10">
                    {filteredItems.map((item, idx) => (
                        <motion.div 
                            key={item._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                      className="group grid grid-cols-12 px-10 py-8 items-center hover:bg-white transition-all cursor-pointer"
                        >
                            <div className="col-span-5 flex items-center gap-6">
                                <div className={cn(
                          "w-14 h-14 flex items-center justify-center border-2 border-black transition-all shadow-[3px_3px_0_#000] group-hover:scale-105",
                                    item.productId?.category === 'Vegetables' ? "bg-green-100 text-green-700" :
                                    item.productId?.category === 'Fruits' ? "bg-orange-100 text-orange-700" :
                                    item.productId?.category === 'Dairy' ? "bg-blue-100 text-blue-700" :
                                    "bg-stone-100 text-stone-700"
                                )}>
                                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 300" }}>package_2</span>
                                </div>
                                <div className="space-y-1">
                          <p className="text-xl font-noto-serif font-bold text-black group-hover:text-black transition-colors">{item.productId?.name}</p>
                                    <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/70">{item.productId?.category}</span>
                            {item.openedAt && <span className="text-[8px] font-black uppercase py-0.5 px-2 border border-black bg-[#FFE66D] text-black">Opened</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-3">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                            "px-4 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                            item.status === 'expired' ? "bg-[#FFD2CC] text-black" :
                            item.status === 'expiring' ? "bg-[#FFE66D] text-black" :
                            "bg-[#93E1A8] text-black"
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full",
                              item.status === 'expired' ? "bg-black" :
                              item.status === 'expiring' ? "bg-black" :
                              "bg-black"
                                        )} />
                                        {item.status === 'expired' ? `Expired ${Math.abs(item.daysLeft || 0)}d ago` :
                                         item.status === 'expiring' ? `Expires in ${item.daysLeft}d` :
                                         'Optimal Freshness'}
                                    </div>
                          <span className={cn(
                            'mt-2 inline-flex border-2 border-black px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]',
                            getStorageBadgeClass(item.storageMethodId?.name)
                          )}>
                            {item.storageMethodId?.name || 'Room Temperature'}
                          </span>
                          {item.storageSuggestion ? (
                            <span className="text-[10px] text-[#93000A] font-ibm-mono uppercase tracking-[0.12em] mt-2 text-center">
                              {item.storageSuggestion}
                            </span>
                          ) : null}
                                </div>
                            </div>

                            <div className="col-span-2 text-center">
                                <p className="text-lg font-manrope font-bold text-stone-600">{item.quantity} <span className="text-xs font-normal opacity-60 uppercase">{item.unit}</span></p>
                            </div>

                            <div className="col-span-2 flex justify-end">
                                <div className="w-32 space-y-2">
                                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter text-stone-400">
                                        <span>Curated Purity</span>
                                        <span className={cn(
                                        (item.daysLeft || 0) < 3 ? "text-black" : "text-black"
                                        )}>{Math.max(0, Math.min(100, Math.round(((item.daysLeft || 0) / 14) * 100)))}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white border border-black overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(0, Math.min(100, Math.round(((item.daysLeft || 0) / 14) * 100)))}%` }}
                                            transition={{ duration: 1 }}
                                            className={cn(
                                          "h-full",
                                          (item.daysLeft || 0) < 3 ? "bg-[#FFE66D]" : "bg-[#93E1A8]"
                                            )} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <div className="px-10 py-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/60">No matching items</p>
                <h3 className="mt-2 font-noto-serif text-4xl text-black">Nothing fits this filter.</h3>
                <p className="mt-2 font-manrope text-sm text-black/75">
                  Change the search/category filters or add a new pantry item.
                </p>
              </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  )
}
