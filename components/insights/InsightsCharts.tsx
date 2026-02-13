'use client'

import { useMemo, useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector
} from 'recharts'
import Card from '@/components/ui/Card'
import { TrendingUp, Package, Archive, Snowflake } from 'lucide-react'

interface InsightsChartsProps {
  categoryData: [string, number][]
  storageData: {
    pantry: number
    fridge: number
    freezer: number
  }
  totalItems: number
}

const COLORS = ['#1a2e1f', '#2f4b32', '#4a6b50', '#6b8f72', '#8fb396']
const STORAGE_COLORS = {
  pantry: '#4f46e5', // Indigo
  fridge: '#2563eb', // Blue
  freezer: '#0ea5e9' // Sky
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl">
        <p className="font-serif font-medium text-lg mb-1">{label}</p>
        <p className="text-sm font-medium text-primary">
          {payload[0].value} items
        </p>
      </div>
    )
  }
  return null
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-2xl font-serif font-bold">
        {value}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#9ca3af" className="text-xs font-medium uppercase tracking-wider">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={6}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 6}
        outerRadius={innerRadius - 2}
        fill={fill}
        fillOpacity={0.2}
        cornerRadius={4}
      />
    </g>
  )
}

export default function InsightsCharts({ categoryData, storageData, totalItems }: InsightsChartsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const barData = useMemo(() => {
    return categoryData.map(([name, value]) => ({ name, value }))
  }, [categoryData])

  const pieData = useMemo(() => {
    return [
      { name: 'Pantry', value: storageData.pantry, color: STORAGE_COLORS.pantry },
      { name: 'Fridge', value: storageData.fridge, color: STORAGE_COLORS.fridge },
      { name: 'Freezer', value: storageData.freezer, color: STORAGE_COLORS.freezer },
    ].filter(d => d.value > 0)
  }, [storageData])

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-0 pb-6">
      {/* Top Categories Bar Chart */}
      <Card className="overflow-hidden shadow-sm border border-border/50 flex flex-col !rounded-[2.5rem] h-full">
        <div className="p-4 border-b border-border/40 shrink-0 bg-muted/5">
          <h3 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Top Categories
          </h3>
        </div>
        <div className="p-4 flex-1 min-h-0">
          {barData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Storage Distribution Pie Chart */}
      <Card className="overflow-hidden shadow-sm border border-border/50 flex flex-col !rounded-[2.5rem] h-full">
        <div className="p-4 border-b border-border/40 shrink-0 bg-muted/5">
          <h3 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Storage Distribution
          </h3>
        </div>
        <div className="p-4 flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="h-full min-h-[250px] max-h-[250px] aspect-square relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend / Key */}
            <div className="flex flex-col gap-4 min-w-[140px]">
               <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 transition-colors">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                    <Archive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pantry</p>
                    <p className="text-lg font-serif font-medium text-foreground">{storageData.pantry}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 transition-colors">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Snowflake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fridge</p>
                    <p className="text-lg font-serif font-medium text-foreground">{storageData.fridge}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50/50 dark:bg-sky-900/10 hover:bg-sky-50 transition-colors">
                  <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                    <Snowflake className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Freezer</p>
                    <p className="text-lg font-serif font-medium text-foreground">{storageData.freezer}</p>
                  </div>
               </div>
            </div>
        </div>
      </Card>
    </div>
  )
}
