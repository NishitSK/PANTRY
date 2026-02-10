'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, PlusCircle, BarChart3, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import WeatherChip from '@/components/ui/WeatherChip'
import { ThemeToggle } from '@/components/ThemeToggle'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Add Item', href: '/add', icon: PlusCircle },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex h-screen w-72 flex-col bg-card border-r border-border">
      <div className="flex h-20 items-center gap-3 px-6 border-b border-border/50">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Package className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">Pantry Guardian</span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/50 p-4 space-y-4">
        <div className="px-2">
          <WeatherChip />
        </div>
        
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
          <div className="h-9 w-9 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
            U
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">User Profile</span>
            <span className="text-xs text-muted-foreground mr-1">Manage Account</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
