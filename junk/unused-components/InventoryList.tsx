'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/shadcn-button'
import UrgencyBadge from '@/components/UrgencyBadge'
import { formatIndianDate } from '@/lib/dateUtils'
import { getApiBaseUrl } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  Thermometer, 
  Calendar, 
  Scale, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Snowflake,
  Archive
} from 'lucide-react'

// Define types based on what's passed from the server
type InventoryItem = {
  id: string
  quantity: number
  unit: string
  notes: string | null
  product: {
    name: string
    category: string
  }
  storageMethod: {
    name: string
  }
  predictions: {
    predictedExpiry: Date | string
  }[]
}

export default function InventoryList({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ quantity: '', notes: '' })
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/inventory/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setItems(items.filter(item => item.id !== id))
        router.refresh()
      } else {
        alert('Failed to delete item')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('An error occurred')
    }
  }

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setEditForm({
      quantity: item.quantity.toString(),
      notes: item.notes || ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ quantity: '', notes: '' })
  }

  const saveEdit = async (id: string) => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseFloat(editForm.quantity),
          notes: editForm.notes
        })
      })

      if (res.ok) {
        const updatedItem = await res.json()
        setItems(items.map(item => item.id === id ? {
            ...item,
            quantity: updatedItem.quantity,
            notes: updatedItem.notes
        } : item))
        setEditingId(null)
        router.refresh()
      } else {
        alert('Failed to update item')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('An error occurred')
    }
  }

  if (items.length === 0) {
    return (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-700 font-medium mb-4">Your inventory is empty</p>
            <a href="/add" className="text-green-700 hover:text-green-800 font-bold">
              Add your first item →
            </a>
          </div>
        </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const latestPrediction = item.predictions[0]
        const daysUntilExpiry = latestPrediction
          ? Math.ceil(
              (new Date(latestPrediction.predictedExpiry).getTime() - new Date().getTime()) / 
              (1000 * 60 * 60 * 24)
            )
          : null

        const urgencyLevel = 
          daysUntilExpiry === null ? 'green' :
          daysUntilExpiry < 0 || daysUntilExpiry === 0 ? 'red' :
          daysUntilExpiry <= 2 ? 'orange' :
          'green'

        const isEditing = editingId === item.id

        return (
          <div 
            key={item.id} 
            className="group relative bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col overflow-hidden"
          >
            {/* Context Header */}
            <div className="p-4 flex items-start justify-between border-b border-border/50 bg-muted/20">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{item.product.category}</span>
                <h3 className="font-bold text-lg text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1" title={item.product.name}>
                  {item.product.name}
                </h3>
              </div>
              {latestPrediction && <UrgencyBadge level={urgencyLevel} />}
            </div>

            {/* Main Content */}
            <div className="p-4 flex-1 space-y-4">
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-2.5 rounded-lg bg-secondary/30 flex items-center gap-2.5">
                    <Scale className="w-4 h-4 text-secondary-foreground/70" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Qty</span>
                        {isEditing ? (
                             <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    value={editForm.quantity}
                                    onChange={e => setEditForm({...editForm, quantity: e.target.value})}
                                    className="w-14 px-1 py-0.5 text-xs border rounded bg-background"
                                />
                                <span className="text-xs font-medium">{item.unit}</span>
                             </div>
                        ) : (
                            <span className="text-sm font-bold">{item.quantity} {item.unit}</span>
                        )}
                    </div>
                 </div>

                 <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 flex items-center gap-2.5">
                    <div className="text-blue-500">
                        {item.storageMethod.name.toLowerCase().includes('freez') ? <Snowflake className="w-4 h-4" /> : 
                         item.storageMethod.name.toLowerCase().includes('frig') ? <Thermometer className="w-4 h-4" /> : 
                         <Archive className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Storage</span>
                        <span className="text-sm font-bold truncate max-w-[8ch]">{item.storageMethod.name}</span>
                    </div>
                 </div>
              </div>

              {/* Expiry Date Big Display */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                  daysUntilExpiry! < 0 ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' :
                  daysUntilExpiry === 0 ? 'bg-orange-50/50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30' :
                  'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30'
              }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${
                         daysUntilExpiry! < 0 ? 'text-red-500' :
                         daysUntilExpiry === 0 ? 'text-orange-500' :
                         'text-green-500'
                    }`} />
                    <span className="text-xs font-semibold text-muted-foreground">Expires</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${
                       daysUntilExpiry! < 0 ? 'text-red-600' :
                       daysUntilExpiry === 0 ? 'text-orange-600' :
                       'text-green-600'
                  }`}>
                    {latestPrediction ? formatIndianDate(new Date(latestPrediction.predictedExpiry)) : 'N/A'}
                  </span>
              </div>

              {/* Notes Area */}
               {(item.notes || isEditing) && (
                <div className="pt-2 border-t border-border/50">
                     {isEditing ? (
                        <textarea
                            value={editForm.notes}
                            onChange={e => setEditForm({...editForm, notes: e.target.value})}
                            className="w-full px-2 py-1 text-xs border rounded bg-background transition-colors focus:ring-1 focus:ring-primary outline-none"
                            rows={2}
                            placeholder="Add notes..."
                        />
                    ) : (
                        item.notes && (
                            <div className="flex gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                                <Edit2 className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                                <span className="italic line-clamp-2">{item.notes}</span>
                            </div>
                        )
                    )}
                </div>
               )}
            </div>

            {/* Actions Footer - Only visible on hover or edit */}
            <div className={`p-3 bg-muted/20 border-t border-border/50 flex gap-2 transition-opacity duration-200 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isEditing ? (
                    <>
                        <Button onClick={() => saveEdit(item.id)} size="sm" className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                            Save
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="ghost" className="flex-1 h-8 text-xs">
                            Cancel
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={() => startEdit(item)} size="sm" variant="outline" className="flex-1 h-8 text-xs border-dashed hover:border-solid hover:bg-secondary">
                            Edit
                        </Button>
                        <Button onClick={() => handleDelete(item.id)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </>
                )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
