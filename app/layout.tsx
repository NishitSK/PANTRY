import './globals.css'
import { ReactNode } from 'react'
import Header from '@/components/Header'
import Providers from '@/components/Providers'
import type { Viewport } from 'next'

export const metadata = {
  title: 'Pantry Guardian',
  description: 'Intelligent Grocery Shelf-Life & Pantry Manager'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 antialiased transition-colors duration-300">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}