'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Plus, Filter, Loader2, Trash2, Package, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

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
  expiryDate?: string // Calculated on client for sorting/display
  status?: 'good' | 'expiring' | 'expired'
  daysLeft?: number
}

export default function InventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // CATEGORIES - Could be fetched from DB or kept static
  const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Dairy', 'Meat', 'Grains', 'Pantry', 'Frozen', 'Beverages', 'Other']

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchInventory = async () => {
      if (!session?.user) return

      try {
        const res = await fetch('/api/inventory')
        if (!res.ok) throw new Error('Failed to fetch inventory')
        
        const data = await res.json()
        
        // Enhance data with calculated expiry
        const enhancedData = data.map((item: any) => {
          const product = item.productId
          const storage = item.storageMethodId
          const purchasedAt = new Date(item.purchasedAt)
          
          let shelfLife = product.baseShelfLifeDays
          const storageName = storage?.name?.toLowerCase() || ''

          if (storageName.includes('freezer') && product.freezerShelfLifeDays) {
            shelfLife = product.freezerShelfLifeDays
          } else if ((storageName.includes('fridge') || storageName.includes('refrig')) && product.fridgeShelfLifeDays) {
            shelfLife = product.fridgeShelfLifeDays
          } else if (storageName.includes('room') && product.roomTempShelfLifeDays) {
            shelfLife = product.roomTempShelfLifeDays
          }

          if (item.openedAt) {
            shelfLife = Math.floor(shelfLife * 0.75)
          }

          const expiryDate = new Date(purchasedAt)
          expiryDate.setDate(expiryDate.getDate() + shelfLife)
          
          const today = new Date()
          const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          let status: 'good' | 'expiring' | 'expired' = 'good'
          if (daysLeft < 0) status = 'expired'
          else if (daysLeft <= 3) status = 'expiring'

          return {
            ...item,
            expiryDate: expiryDate.toISOString(),
            daysLeft,
            status
          }
        })

        setItems(enhancedData)
      } catch (error) {
        console.error('Error loading inventory:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchInventory()
    }
  }, [session])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete item')

      setItems(items.filter(item => item._id !== id))
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.productId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || item.productId?.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Sort by status urgency then days left
  filteredItems.sort((a, b) => {
    if (a.daysLeft === undefined || b.daysLeft === undefined) return 0
    return a.daysLeft - b.daysLeft
  })

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-1 text-lg font-light">Manage your pantry items.</p>
          </div>
          <Link href="/add">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Item
            </button>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center shrink-0">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl border-2 border-transparent bg-white dark:bg-card hover:bg-white/80 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm text-base"
            />
          </div>
          
          <div className="relative w-full md:w-auto min-w-[200px] group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-3.5 rounded-2xl border-2 border-transparent bg-white dark:bg-card hover:bg-white/80 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm appearance-none cursor-pointer text-base"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="m6 9 6 6 6-6"/></svg>
             </div>
          </div>
        </div>

        {/* Inventory List (Cards) */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
              {filteredItems.map((item) => (
                <Card 
                    key={item._id} 
                    className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 !rounded-[2rem] overflow-visible"
                >
                  <div className="p-5 flex flex-col h-full gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3 items-center">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                item.productId?.category === 'Vegetables' ? "bg-green-100 text-green-600 border-green-200" :
                                item.productId?.category === 'Fruits' ? "bg-orange-100 text-orange-600 border-orange-200" :
                                item.productId?.category === 'Dairy' ? "bg-blue-100 text-blue-600 border-blue-200" :
                                item.productId?.category === 'Meat' ? "bg-red-100 text-red-600 border-red-200" :
                                "bg-muted text-muted-foreground border-border"
                            )}>
                                <Package className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
                                    {item.productId?.name || 'Unknown Item'}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    {item.productId?.category || 'Uncategorized'} 
                                    {item.openedAt && <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">Opened</span>}
                                </p>
                            </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                              e.preventDefault();
                              handleDelete(item._id);
                          }}
                          disabled={deletingId === item._id}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                          title="Delete Item"
                        >
                          {deletingId === item._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                    </div>

                    <div className="mt-auto space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-xl">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="truncate">Stored in: <span className="font-medium text-foreground">{item.storageMethodId?.name || 'Unknown'}</span></span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                             <div className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                item.status === 'expired' ? 'bg-destructive/10 text-destructive' :
                                item.status === 'expiring' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            )}>
                                <span className={cn("h-1.5 w-1.5 rounded-full", 
                                     item.status === 'expired' ? 'bg-destructive' :
                                     item.status === 'expiring' ? 'bg-orange-500' :
                                     'bg-emerald-500'
                                )}/>
                                {item.status === 'expired' ? 'Expired' :
                                 item.status === 'expiring' ? 'Expiring Soon' :
                                 'Fresh'}
                            </div>
                            
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Expiry</p>
                                <p className={cn(
                                    "font-serif text-lg font-medium leading-none",
                                    item.daysLeft !== undefined && item.daysLeft < 3 ? "text-destructive" : "text-foreground"
                                )}>
                                    {item.daysLeft !== undefined ? (
                                        item.daysLeft < 0 ? `${Math.abs(item.daysLeft)} days ago` :
                                        item.daysLeft === 0 ? 'Today' :
                                        `${item.daysLeft} days`
                                    ) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 border-2 border-dashed border-border/60 rounded-[3rem] bg-muted/5">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-foreground mb-2">No items found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                Your search didn&apos;t match any items in your pantry. Try adjusting your filters or add a new item.
              </p>
              <Link href="/add">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-6 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
