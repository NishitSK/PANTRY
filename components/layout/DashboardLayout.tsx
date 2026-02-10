'use client'

import Sidebar from './Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <div className="md:hidden">
        <Header />
      </div>
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
