import './globals.css'
import { ReactNode } from 'react'
import Header from '@/components/Header'
import Providers from '@/components/Providers'
import type { Viewport } from 'next'
import { Outfit, Fraunces } from 'next/font/google'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const fraunces = Fraunces({ 
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata = {
  title: 'Pantry Guardian',
  description: 'Intelligent Grocery Shelf-Life & Pantry Manager',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  }
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
      <body className={`${outfit.variable} ${fraunces.variable} font-sans min-h-screen bg-background text-foreground antialiased transition-colors duration-300`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}