'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, PlusCircle, BarChart3, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import WeatherChip from '@/components/ui/WeatherChip'
import { useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ThemeToggle'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Add Item', href: '/add', icon: PlusCircle },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="hidden md:flex h-[calc(100vh-2rem)] my-4 ml-4 w-72 flex-col bg-card border border-border/50 shadow-xl shadow-black/5 rounded-[2rem] z-50 overflow-hidden transition-all duration-300">
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
            <span className="text-2xl font-serif font-bold text-foreground tracking-tight leading-none">Pantry</span>
            <span className="text-sm font-medium text-primary tracking-widest uppercase opacity-80 leading-none">Guardian</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-4 py-8">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3.5 rounded-2xl px-5 py-3.5 text-sm font-medium transition-all duration-200 ease-in-out",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 space-y-4 mb-4">
        <div className="px-2">
          <WeatherChip />
        </div>
        
        <div className="flex items-center justify-between px-2 py-2 rounded-2xl bg-muted/30 border border-border/50 mb-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-3">Theme</span>
          <ThemeToggle />
        </div>

        <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 group">
          {session?.user?.image ? (
             <img src={session.user.image} alt="Profile" className="h-10 w-10 rounded-full border-2 border-background shadow-sm" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{session?.user?.name || 'User Profile'}</span>
            <span className="text-xs text-muted-foreground truncate">{session?.user?.email || 'Manage Account'}</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
