'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Plus, Filter, Loader2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

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
      <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage your pantry items.</p>
          </div>
          <Link href="/add">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Item
            </button>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[150px]"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm text-left relative">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Storage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Expiry</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {item.productId?.name || 'Unknown Item'}
                        {item.openedAt && <span className="ml-2 text-xs text-muted-foreground">(Opened)</span>}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.productId?.category || '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.storageMethodId?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'expired' ? 'bg-destructive/10 text-destructive' :
                          item.status === 'expiring' ? 'bg-secondary/10 text-secondary' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {item.status === 'expired' ? 'Expired' :
                           item.status === 'expiring' ? 'Expiring Soon' :
                           'Good'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.daysLeft !== undefined ? (
                          <span>
                            {item.daysLeft < 0 
                              ? `${Math.abs(item.daysLeft)} days ago` 
                              : item.daysLeft === 0 
                                ? 'Today' 
                                : `${item.daysLeft} days left`
                            }
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                          title="Delete Item"
                        >
                          {deletingId === item._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No items found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
