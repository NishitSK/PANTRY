"use client"
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import WeatherChip from '@/components/ui/WeatherChip'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/add', label: 'Add Item' },
  { href: '/insights', label: 'Insights' },
  { href: '/settings', label: 'Settings' },
]

export default function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-2">
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-600"/>
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                <span className="text-brand-700 dark:text-brand-300">Pantry</span> Guardian
              </span>
            </Link>
          </div>

          {/* Center: Nav (Desktop) */}
          {session && (
            <nav className="hidden md:flex items-center gap-1">
              {links.map(l => {
                const active = pathname === l.href
                const base = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors'
                const cls = active
                  ? `${base} bg-brand-600 text-white shadow-sm`
                  : `${base} text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10`
                return (
                  <Link key={l.href} href={l.href} className={cls}>{l.label}</Link>
                )
              })}
            </nav>
          )}

          {/* Right: Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <WeatherChip />
            </div>
            <ThemeToggle />
            
            {/* Mobile Menu Toggle */}
            {session && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            {session ? (
              <Button variant="ghost" className="hidden md:inline-flex px-3 py-2" onClick={()=>signOut({ callbackUrl: '/auth/login' })}>Sign out</Button>
            ) : (
              <div className="flex gap-2">
                 <Link href="/auth/login"><Button variant="ghost" size="sm">Login</Button></Link>
                 <Link href="/auth/register"><Button size="sm">Get Started</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && session && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                 <WeatherChip />
              </div>
              <nav className="flex flex-col gap-2">
                {links.map(l => {
                  const active = pathname === l.href
                  return (
                    <Link 
                      key={l.href} 
                      href={l.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        active 
                          ? 'bg-brand-600 text-white' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {l.label}
                    </Link>
                  )
                })}
                <button 
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="px-4 py-3 rounded-lg text-base font-medium text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Sign out
                </button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
