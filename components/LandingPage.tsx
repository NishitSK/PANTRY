"use client"

import Link from "next/link"
import { Button } from "@/components/ui/shadcn-button"
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero"
import { Particles } from "@/components/ui/particles"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const { theme } = useTheme()
  const [color, setColor] = useState("#ffffff")

  useEffect(() => {
    setColor(theme === "dark" ? "#ffffff" : "#000000")
  }, [theme])

  return (
    <div className="min-h-screen bg-background">
       {/* Hero Section */}
       <ScrollExpandMedia
        mediaType="image"
        mediaSrc="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1920&auto=format&fit=crop"
        bgImageSrc="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1920&auto=format&fit=crop"
        title="Pantry Guardian Smart Inventory"
        date="EST. 2025"
        scrollToExpand="Scroll to Discover"
       >
         <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black dark:text-white">
              Stop Wasting Food
            </h2>
            <p className="text-lg md:text-xl mb-8 text-black dark:text-white opacity-90">
              Track your inventory, get expiry alerts, and save money with Pantry Guardian.
              Our intelligent system helps you manage your kitchen efficiently.
            </p>
         </div>
       </ScrollExpandMedia>

       {/* Features / CTA Section with Particles */}
       <div className="relative min-h-[600px] w-full flex flex-col items-center justify-center overflow-hidden border-t bg-background">
          <Particles
            className="absolute inset-0"
            quantity={100}
            ease={80}
            color={color}
            refresh
          />
          <div className="z-10 text-center space-y-8 p-4 max-w-2xl mx-auto">
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to organize your kitchen?</h2>
             <p className="text-xl text-muted-foreground">
               Join thousands of users who are reducing food waste and saving money every day.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/auth/login">
                  <Button size="lg" className="text-lg px-8 py-6">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">Get Started</Button>
                </Link>
             </div>
          </div>
       </div>
    </div>
  )
}
