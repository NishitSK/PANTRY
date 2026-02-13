'use client'

import Sidebar from './Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen flex-col md:flex-row bg-muted/10 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden">
        <Header />
      </div>
      
      {/* Desktop Sidebar - Wrapped to check layout */}
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300">
        <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
          {children}
        </div>
      </main>
    </div>
  )
}
