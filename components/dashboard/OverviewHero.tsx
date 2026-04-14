"use client"

import { motion } from "framer-motion"

interface OverviewHeroProps {
  userName?: string
  purity?: number
  itemsTracked?: number
  toRestock?: number
}

export default function OverviewHero({ 
  userName = "Chef", 
  purity = 85, 
  itemsTracked = 124, 
  toRestock = 8 
}: OverviewHeroProps) {
  
  // Progress ring math
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (purity / 100) * circumference

  return (
    <div className="relative overflow-hidden bg-[#F6F1E7] min-h-[500px] mt-8 mb-12 p-6 font-sans border-4 border-black shadow-[10px_10px_0_#000]">
      
      {/* Brutalist Background Blocks */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -left-10 -top-10 h-40 w-40 bg-[#FFE66D] border-4 border-black rotate-12" />
        <div className="absolute right-8 top-8 h-16 w-16 bg-[#93E1A8] border-2 border-black" />
      </div>

      {/* Main Panel */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between gap-12
                      bg-white border-4 border-black 
                      shadow-[8px_8px_0_#000] p-10 transition-all duration-300">
                      
        <div className="relative z-10 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-black text-black leading-tight mb-4 tracking-tight"
          >
            Good Morning, <span className="bg-[#FFE66D] px-2">{userName}</span>.<br/>
            Your kitchen is <span className="bg-[#93E1A8] px-2">{purity}%</span> fresh.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-black/80 font-medium max-w-md leading-relaxed"
          >
            The curator suggests using your Organic Bananas today. They&apos;re reaching their peak sweetness.
          </motion.p>
          
          <div className="mt-10 flex gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-[#FFE66D] px-8 py-5 border-2 border-black"
            >
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-black mb-2">Items Tracked</p>
              <p className="text-4xl font-noto-serif font-bold text-black">{itemsTracked}</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-[#93E1A8] px-8 py-5 border-2 border-black"
            >
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-black mb-2">To Restock</p>
              <p className="text-4xl font-noto-serif font-bold text-black">{toRestock}</p>
            </motion.div>
          </div>
        </div>

        {/* Freshness Progress Ring */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle 
              className="text-black/10" 
              cx="112" cy="112" fill="transparent" r={radius} 
              stroke="currentColor" strokeWidth="8" 
            />
            <motion.circle 
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-black" 
              cx="112" cy="112" fill="transparent" r={radius} 
              stroke="currentColor" strokeDasharray={circumference} 
              strokeWidth="12" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0px 0px 0px rgba(0, 0, 0, 0))' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center bg-white border-2 border-black px-4 py-3">
            <span className="text-5xl font-noto-serif font-bold text-black">{purity}%</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black mt-1">Purity</span>
          </div>
        </div>
      </div>
    </div>
  )
}
