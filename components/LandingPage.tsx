"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/shadcn-button"
import { motion, useScroll, useTransform } from "framer-motion"
import ScrollImageSequence from "@/components/ScrollImageSequence"
import { useRef } from "react"
import { ArrowRight, Leaf, Sparkles } from "lucide-react"

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Rotate the banana based on scroll
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360])
  const y = useTransform(scrollYProgress, [0, 1], [0, 100])

  return (
    <div ref={containerRef} className="min-h-[200vh] bg-background font-sans selection:bg-primary/20">
      
      {/* Navigation / Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
             <Leaf size={16} />
           </div>
           <span className="font-serif text-xl font-bold tracking-tight text-foreground">Pantry Guardian</span>
        </div>
        <div className="flex gap-4">
            <Link href="/auth/login" className="hidden sm:block">
                <Button variant="ghost" className="font-medium hover:bg-primary/10 hover:text-primary">Log in</Button>
            </Link>
            <Link href="/auth/register" className="hidden sm:block">
                <Button className="rounded-full px-6 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                    Get Started
                </Button>
            </Link>
        </div>
      </nav>

      {/* Hero Section with Sticky Scroll */}
      <section ref={containerRef} className="relative h-[180vh] lg:h-[150vh]">
        <div className="sticky top-0 h-screen flex flex-col lg:flex-row items-center lg:items-start justify-start lg:justify-center px-6 pt-32 lg:pt-20 pb-40 max-w-7xl mx-auto overflow-hidden">
        
        {/* Text Content */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 z-10 text-center lg:text-left space-y-8"
        >
            <h1 className="font-serif text-5xl md:text-8xl font-medium tracking-tight leading-[0.95] text-foreground">
                Reduce Waste. <br/>
                Save Money. <br/>
                <span className="text-accent italic">Eat Fresh.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                The smart kitchen assistant that helps track expiration dates, suggests recipes, and manages your pantry effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                 <Link href="/auth/register">
                    <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-all hover:scale-105 active:scale-95">
                        Start for Free
                    </Button>
                 </Link>
                 <Link href="/about">
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-medium border-2 hover:bg-secondary/50 transition-all">
                        Learn More
                    </Button>
                 </Link>
            </div>
        </motion.div>

        {/* 3D Banana Animation */}
        <div className="flex-1 relative w-full h-[40vh] lg:h-auto flex items-center justify-center">
             {/* Video Container */}
             <div className="relative w-[300px] h-[300px] md:w-[600px] md:h-[600px] z-20 flex items-center justify-center">
                <ScrollImageSequence 
                    folderPath="/frames"
                    filePrefix="ezgif-frame-"
                    fileSuffix=".jpg"
                    frameCount={80} 
                    className="w-full h-full drop-shadow-2xl" 
                    scale={1.5}
                    objectFit="cover"
                    scrollProgress={scrollYProgress}
                />
             </div>
        </div>
        </div>

      </section>

       {/* Features Preview */}
       <section className="min-h-screen bg-secondary/30 py-32 px-6 rounded-t-[3rem] mt-48 lg:mt-20 relative z-30 border-t border-border/50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20 space-y-4">
                    <h2 className="font-serif text-4xl md:text-5xl text-foreground">manage your kitchen <br/> like a pro</h2>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Everything you need to keep your pantry organized and your food fresh.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { 
                            title: "Easy Tracking", 
                            desc: "Log items instantly.", 
                            icon: <Leaf size={28} />
                        },
                        { 
                            title: "Smart Planning", 
                            desc: "Get recipe suggestions.", 
                            icon: <Sparkles size={28} />
                        },
                        { 
                            title: "Save Money", 
                            desc: "Reduce food waste.", 
                            icon: <ArrowRight size={28} className="-rotate-45" />
                        }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-[2rem] bg-background border border-border/50 hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 group text-center">
                            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 mx-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="font-serif text-2xl mb-3 font-bold text-foreground">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed text-lg">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
       </section>

       {/* Call to Action */}
       <section className="py-20 px-6 bg-primary text-primary-foreground relative z-30">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <h2 className="font-serif text-4xl md:text-5xl font-medium">
                    Ready to organize your pantry?
                </h2>
                <p className="text-primary-foreground/80 text-xl max-w-2xl mx-auto">
                    Join thousands of users who are saving money and reducing food waste today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link href="/auth/register">
                        <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold bg-background text-foreground hover:bg-background/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                            Get Started Now
                        </Button>
                    </Link>
                </div>
            </div>
       </section>

       {/* Footer */}
       <footer className="bg-primary-foreground py-12 px-6 border-t border-border/10 relative z-30">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Leaf size={16} />
                    </div>
                    <span className="font-serif text-xl font-bold tracking-tight text-foreground">Pantry Guardian</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Pantry Guardian. All rights reserved.
                </div>

                <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
                </div>
            </div>
       </footer>

    </div>
  )
}
