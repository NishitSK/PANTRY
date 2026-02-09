'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-4">
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

        const urgencyColor = 
          daysUntilExpiry === null ? 'bg-green-500' :
          daysUntilExpiry < 0 ? 'bg-red-500' :
          daysUntilExpiry <= 2 ? 'bg-orange-500' :
          'bg-green-500'

        return (
          <div 
            key={item.id} 
            className={`group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200 overflow-hidden`}
          >
            {/* Colored Status Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${urgencyColor}`} />

            <div className="p-5 pl-7">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.product.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 mt-1">
                    {item.product.category}
                  </span>
                </div>
                {latestPrediction && <UrgencyBadge level={urgencyLevel} />}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Quantity */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-blue-600 dark:text-blue-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Quantity</p>
                    {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                            <input 
                                type="number" 
                                value={editForm.quantity}
                                onChange={e => setEditForm({...editForm, quantity: e.target.value})}
                                className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-brand-500 outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                step="0.1"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.unit}</span>
                        </div>
                    ) : (
                        <p className="font-bold text-gray-900 dark:text-gray-100">{item.quantity} {item.unit}</p>
                    )}
                  </div>
                </div>

                {/* Storage */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-purple-600 dark:text-purple-400">
                    {item.storageMethod.name.toLowerCase().includes('freez') ? <Snowflake className="w-4 h-4" /> : 
                     item.storageMethod.name.toLowerCase().includes('frig') ? <Thermometer className="w-4 h-4" /> : 
                     <Archive className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Storage</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{item.storageMethod.name}</p>
                  </div>
                </div>

                {/* Expiry */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50">
                  <div className={`p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm ${
                      daysUntilExpiry! < 0 ? 'text-red-600 dark:text-red-400' : 
                      daysUntilExpiry === 0 ? 'text-orange-600 dark:text-orange-400' : 
                      'text-green-600 dark:text-green-400'
                  }`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Expires</p>
                    {latestPrediction ? (
                      <>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {formatIndianDate(new Date(latestPrediction.predictedExpiry))}
                        </p>
                        <p className={`text-xs font-bold ${
                          daysUntilExpiry! < 0 ? 'text-red-600 dark:text-red-400' : 
                          daysUntilExpiry === 0 ? 'text-orange-600 dark:text-orange-400' : 
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {daysUntilExpiry! < 0 ? 'Expired' : 
                           daysUntilExpiry === 0 ? 'Expires Today (2-4h left)' : 
                           `${daysUntilExpiry} days left`}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes & Actions */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between pt-2">
                <div className="w-full sm:w-auto flex-1">
                    {(item.notes || isEditing) && (
                    <div className="bg-yellow-50/50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                        <p className="text-xs text-yellow-700 dark:text-yellow-500 font-bold mb-1 flex items-center gap-1">
                            <Edit2 className="w-3 h-3" /> Notes
                        </p>
                        {isEditing ? (
                            <textarea
                                value={editForm.notes}
                                onChange={e => setEditForm({...editForm, notes: e.target.value})}
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                rows={2}
                                placeholder="Add notes..."
                            />
                        ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">{item.notes}</p>
                        )}
                    </div>
                    )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
                    {isEditing ? (
                        <>
                            <Button onClick={() => saveEdit(item.id)} size="sm" className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white gap-2">
                                <Save className="w-4 h-4" /> Save
                            </Button>
                            <Button onClick={cancelEdit} size="sm" variant="ghost" className="flex-1 sm:flex-none gap-2">
                                <X className="w-4 h-4" /> Cancel
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={() => startEdit(item)} size="sm" variant="outline" className="flex-1 sm:flex-none gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                                <Edit2 className="w-4 h-4" /> Edit
                            </Button>
                            <Button onClick={() => handleDelete(item.id)} size="sm" variant="destructive" className="flex-1 sm:flex-none gap-2">
                                <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                        </>
                    )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
