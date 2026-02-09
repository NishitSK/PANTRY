'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts'
import { 
  Sparkles, Snowflake, Archive, Calendar as CalendarIcon, 
  Thermometer, Droplets, Milk, Wheat, Carrot, Apple, 
  Beef, Fish, Cookie, Utensils, Bean, IceCream, 
  Sandwich, Coffee, Egg, Scale, FileText, Package
} from 'lucide-react'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/ui/SectionHeading'
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect'

import ImageCapture from '@/components/ImageCapture'
import { formatIndianDate } from '@/lib/dateUtils'
import { getApiBaseUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'

type Product = {
  id: string
  name: string
  category: string
  baseShelfLifeDays: number
  roomTempShelfLifeDays: number | null
  fridgeShelfLifeDays: number | null
  freezerShelfLifeDays: number | null
  storageNotes: string | null
  defaultStorageMethodId: string
}

type StorageMethod = {
  id: string
  name: string
  tempRangeMinC: number
  tempRangeMaxC: number
  humidityPreferred: number
}

const getCategoryIcon = (category: string) => {
  const props = { className: "w-4 h-4" }
  const map: Record<string, React.ReactNode> = {
    'Bakery': <Wheat {...props} />,
    'Beverages': <Coffee {...props} />,
    'Condiments & Sauces': <Utensils {...props} />,
    'Dairy': <Milk {...props} />,
    'Eggs & Tofu': <Egg {...props} />,
    'Fresh Fruits': <Apple {...props} />,
    'Fresh Vegetables': <Carrot {...props} />,
    'Frozen Foods': <IceCream {...props} />,
    'Meat & Poultry': <Beef {...props} />,
    'Pantry Staples': <Archive {...props} />,
    'Seafood': <Fish {...props} />,
    'Snacks': <Cookie {...props} />,
    'Grains & Pasta': <Wheat {...props} />,
    'Canned Goods': <Archive {...props} />,
    'Breakfast': <Coffee {...props} />,
    'Herbs & Spices': <Bean {...props} />
  }
  return map[category] || <Archive {...props} />
}

export default function AddItemPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [storageMethods, setStorageMethods] = useState<StorageMethod[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedStorageId, setSelectedStorageId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('pieces')
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().split('T')[0])
  const [openedAt, setOpenedAt] = useState('')
  const [notes, setNotes] = useState('')

  // Prediction preview state
  const [predictedExpiry, setPredictedExpiry] = useState<Date | null>(null)

  // AI detection state
  const [detectedItems, setDetectedItems] = useState<any[]>([])
  const [showDetectedItems, setShowDetectedItems] = useState(false)

  // Handle AI analysis results
  const handleAnalysisComplete = (data: any) => {
    if (data.items && data.items.length > 0) {
      setDetectedItems(data.items)
      setShowDetectedItems(true)
    }
  }

  // Apply detected item to form
  const applyDetectedItem = (item: any) => {
    if (item.matchedProductId) {
      // Find the product and set category + product
      const matchedProduct = products.find(p => p.id === item.matchedProductId)
      if (matchedProduct) {
        setSelectedCategory(matchedProduct.category)
        setSelectedProductId(matchedProduct.id)
        
        // Find storage method by matching AI suggestion with storage method names
        if (item.suggestedStorage) {
          const suggestedStorageLower = item.suggestedStorage.toLowerCase()
          const matchingStorage = storageMethods.find(sm => 
            sm.name.toLowerCase().includes(suggestedStorageLower.replace('_', ' '))
          )
          if (matchingStorage) {
            setSelectedStorageId(matchingStorage.id)
          } else {
            setSelectedStorageId(matchedProduct.defaultStorageMethodId)
          }
        } else {
          setSelectedStorageId(matchedProduct.defaultStorageMethodId)
        }
      }
    }
    // Set quantity and unit from AI detection
    if (item.quantity) setQuantity(String(item.quantity))
    if (item.unit) setUnit(item.unit)
    setShowDetectedItems(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-select default storage method when product is selected
  useEffect(() => {
    if (selectedProductId && !selectedStorageId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId)
      if (product?.defaultStorageMethodId) {
        setSelectedStorageId(product.defaultStorageMethodId)
      }
    }
  }, [selectedProductId, products, selectedStorageId])

  useEffect(() => {
    if (selectedProductId && selectedStorageId && purchasedAt) {
      calculatePrediction()
    }
  }, [selectedProductId, selectedStorageId, purchasedAt, openedAt])

  const fetchData = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const [productsRes, storageRes] = await Promise.all([
        fetch(`${baseUrl}/api/products`),
        fetch(`${baseUrl}/api/storage-methods`)
      ])

      if (!productsRes.ok || !storageRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const productsData = await productsRes.json()
      const storageData = await storageRes.json()



      // Client-side fallback: Ensure id exists
      const processedProducts = productsData.map((p: any) => ({
        ...p,
        id: p.id || p._id || '', // Fallback to _id if id is missing
      }))
      
      const processedStorage = storageData.map((s: any) => ({
        ...s,
        id: s.id || s._id || '',
      }))



      setProducts(processedProducts)
      setStorageMethods(processedStorage)

      // Extract unique categories
      const categorySet = new Set<string>(processedProducts.map((p: Product) => p.category))
      const uniqueCategories = Array.from(categorySet).sort()
      setCategories(uniqueCategories)


    } catch (err) {
      setError('Failed to load data')

    }
  }

  const calculatePrediction = () => {
    const product = products.find(p => p.id === selectedProductId)
    const storage = storageMethods.find(s => s.id === selectedStorageId)

    if (!product || !storage) return

    // Determine shelf life based on storage method
    let shelfLifeDays = product.baseShelfLifeDays
    const methodLower = storage.name.toLowerCase()

    if (methodLower.includes('room') && product.roomTempShelfLifeDays !== null) {
      shelfLifeDays = product.roomTempShelfLifeDays
    } else if ((methodLower.includes('fridge') || methodLower.includes('refrig')) && product.fridgeShelfLifeDays !== null) {
      shelfLifeDays = product.fridgeShelfLifeDays
    } else if (methodLower.includes('freezer') && product.freezerShelfLifeDays !== null) {
      shelfLifeDays = product.freezerShelfLifeDays
    }

    // Apply penalty if opened
    let effectiveDays = shelfLifeDays
    if (openedAt) {
      effectiveDays = Math.round(shelfLifeDays * 0.75) // 25% reduction if opened
    }

    const purchased = new Date(purchasedAt)
    const expiry = new Date(purchased)
    expiry.setDate(expiry.getDate() + effectiveDays)
    setPredictedExpiry(expiry)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')



    if (!selectedProductId) {
      setError('Please select a product')
      return
    }
    if (!selectedStorageId) {
      setError('Please select a storage method')
      return
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }
    if (!purchasedAt) {
      setError('Please select a purchase date')
      return
    }

    setSubmitting(true)

    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          storageMethodId: selectedStorageId,
          quantity: parseFloat(quantity),
          unit,
          purchasedAt,
          openedAt: openedAt || null,
          notes: notes || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add item')
      }

      router.push('/inventory')
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products



  const selectedProduct = products.find(p => p.id === selectedProductId)



  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-12">
        <div className="mb-8">
          <SectionHeading>Add New Item</SectionHeading>
          <p className="text-muted-foreground mt-2">Add groceries to your inventory with smart expiry predictions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}


        <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start h-full">
          {/* Left Column: Input Form */}
          <div>
            <Card className="h-full">
              <form id="add-item-form" onSubmit={handleSubmit} className="space-y-5">
                {/* AI Scanner Section (Always Visible) */}
                <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                  <div className="animate-in slide-in-from-top-2 duration-200 fade-in">
                    <ImageCapture onAnalysisComplete={handleAnalysisComplete} />
                    
                    {/* Detected Items Inline */}
                    {showDetectedItems && detectedItems.length > 0 && (
                      <div className="mt-3 p-3 bg-background border border-border rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-primary text-xs flex items-center gap-2">
                            <span>✨</span> Detected Items
                          </h3>
                          <button 
                            type="button"
                            onClick={() => setShowDetectedItems(false)}
                            className="text-muted-foreground hover:text-foreground text-[10px]"
                          >
                            Dismiss
                          </button>
                        </div>
                        <div className="grid gap-2 grid-cols-1">
                          {detectedItems.map((item, index) => (
                            <div 
                              key={index}
                              className="p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer group"
                              onClick={() => applyDetectedItem(item)}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{item.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.quantity} {item.unit} • {item.category}
                                  </p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                  item.matchedProductId 
                                    ? 'bg-primary/5 text-primary border-primary/20' 
                                    : 'bg-secondary/5 text-secondary border-secondary/20'
                                }`}>
                                  {item.matchedProductId ? 'Match' : 'New'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Category
                    </label>
                    <div className="h-10">
                      <CustomSelect
                        value={selectedCategory}
                        onChange={(val) => {
                          setSelectedCategory(val)
                          setSelectedProductId('')
                        }}
                        options={categories.map(cat => ({
                          label: cat,
                          value: cat,
                          icon: getCategoryIcon(cat)
                        }))}
                        placeholder="Select category"
                        className="py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Product
                    </label>

                    <div className="h-10">
                      <CustomSelect
                        value={selectedProductId}
                        onChange={(val) => {
                          setSelectedProductId(val)
                          // Reset storage method to trigger auto-selection
                          setSelectedStorageId('')
                        }}
                        disabled={!selectedCategory}
                        options={filteredProducts.map(product => ({
                            label: product.name,
                            value: product.id
                          }))}
                        placeholder="Select product"
                        className="py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {selectedProduct?.storageNotes && (
                  <div className="px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-lg">
                    <p className="text-xs text-secondary">
                      💡 <span className="font-medium">Storage Tip:</span> {selectedProduct.storageNotes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Storage Method
                    </label>
                    <div className="relative h-10">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
                        <Package className="w-4 h-4" />
                      </div>
                      <CustomSelect
                        value={selectedStorageId}
                        onChange={(val) => setSelectedStorageId(val)}
                        options={storageMethods.map(method => ({
                          label: method.name,
                          value: method.id,
                          icon: method.name.toLowerCase().includes('fridge') ? '❄️' : 
                                method.name.toLowerCase().includes('freezer') ? '🧊' : '🏠'
                        }))}
                        placeholder="Storage"
                        className="pl-10 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Quantity
                      </label>
                      <div className="relative h-10">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          <Scale className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          required
                          className="w-full h-full pl-10 pr-3 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/30 hover:bg-muted/50 transition-colors text-foreground placeholder:text-muted-foreground text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Unit
                      </label>
                      <div className="h-10">
                        <CustomSelect
                          value={unit}
                          onChange={(val) => setUnit(val)}
                          options={[
                            { label: 'Pieces', value: 'pieces' },
                            { label: 'Kg', value: 'kg' },
                            { label: 'Grams', value: 'g' },
                            { label: 'Liters', value: 'L' },
                            { label: 'mL', value: 'mL' },
                            { label: 'Lbs', value: 'lbs' },
                            { label: 'Oz', value: 'oz' },
                            { label: 'Packs', value: 'packages' }
                          ]}
                          className="py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Purchase Date
                    </label>
                    <div className="relative h-10">
                       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="date"
                        value={purchasedAt}
                        onChange={(e) => setPurchasedAt(e.target.value)}
                        required
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full h-full pl-10 pr-3 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/30 hover:bg-muted/50 transition-colors text-foreground placeholder:text-muted-foreground text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Opened Date <span className="text-muted-foreground/60">(Opt)</span>
                    </label>
                    <div className="relative h-10">
                       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="date"
                        value={openedAt}
                        onChange={(e) => setOpenedAt(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full h-full pl-10 pr-3 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/30 hover:bg-muted/50 transition-colors text-foreground placeholder:text-muted-foreground text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Notes <span className="text-muted-foreground/60">(Opt)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-muted-foreground pointer-events-none">
                      <FileText className="w-4 h-4" />
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Add notes..."
                      className="w-full pl-10 pr-4 py-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/30 hover:bg-muted/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none text-sm"
                    />
                  </div>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column: Preview & Actions */}
          <div className="space-y-6">
            {/* AI Smart Scan Section Removed - Moved to Product Input */}




            <Card className="shadow-sm border border-border">
              <h3 className="font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Prediction Preview
              </h3>
              
              {predictedExpiry ? (
                <div className="space-y-6">
                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <p className="text-sm text-primary/80 mb-1 font-medium uppercase tracking-wider">Predicted Expiry</p>
                    <p className="text-4xl font-bold text-primary my-2">
                      {formatIndianDate(predictedExpiry)}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mt-1">
                      {(() => {
                        const diffTime = predictedExpiry.getTime() - new Date().getTime();
                        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (daysLeft <= 0) {
                           return "Expires Today";
                        }
                        return `${daysLeft} days left`;
                      })()}
                    </div>
                  </div>

                  {/* Storage Comparison Chart */}
                  {selectedProduct && (
                    <div className="h-32 w-full p-3 bg-muted/30 rounded-xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Pantry', days: selectedProduct.roomTempShelfLifeDays || 0, color: '#f97316' },
                            { name: 'Fridge', days: selectedProduct.fridgeShelfLifeDays || 0, color: '#3b82f6' },
                            { name: 'Freezer', days: selectedProduct.freezerShelfLifeDays || 0, color: '#6366f1' },
                          ].filter(d => d.days > 0)}
                          layout="vertical"
                          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                          barSize={16}
                        >
                          <XAxis type="number" hide />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: 'currentColor' }} 
                            width={45}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              borderRadius: '8px', 
                              border: '1px solid hsl(var(--border))', 
                              fontSize: '12px',
                              padding: '8px'
                            }}
                          />
                          <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                            {
                              [
                                { name: 'Pantry', days: selectedProduct.roomTempShelfLifeDays || 0, color: '#f97316' },
                                { name: 'Fridge', days: selectedProduct.fridgeShelfLifeDays || 0, color: '#3b82f6' },
                                { name: 'Freezer', days: selectedProduct.freezerShelfLifeDays || 0, color: '#6366f1' },
                              ].filter(d => d.days > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-[10px] text-primary/70 mb-0.5">Confidence</p>
                      <p className="text-base font-bold text-primary">High</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/5 border border-secondary/10">
                      <p className="text-[10px] text-secondary mb-0.5">Source</p>
                      <p className="text-base font-bold text-secondary">AI Model</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center p-6 border-2 border-dashed border-muted rounded-2xl bg-muted/10">
                  <div className="p-3 bg-muted/30 rounded-full mb-3">
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-0.5 text-sm">No Prediction Yet</h4>
                  <p className="text-muted-foreground text-[10px] max-w-[180px]">
                    Fill details to predict.
                  </p>
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
               <Button 
                type="submit" 
                form="add-item-form"
                disabled={submitting} 
                className="w-full h-10 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-300 rounded-xl"
              >
                {submitting ? 'Adding Item...' : 'Add to Pantry'}
              </Button>
              <Button
                type="button"
                onClick={() => router.push('/inventory')}
                className="w-full h-10 bg-muted hover:bg-muted/80 text-foreground rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
