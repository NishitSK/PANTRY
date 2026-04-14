'use client'
import React, { useEffect, useState } from 'react'
import { getApiBaseUrl } from '@/lib/api'

import { Thermometer, Droplets, RotateCcw } from 'lucide-react'

export default function WeatherChip() {
  const [weather, setWeather] = useState<{ tempC: number; humidity: number; locationName?: string; feelsLikeC?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string>('')
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    fetchUserCity()
  }, [])

  useEffect(() => {
    if (coords) {
      fetchWeather()
      const interval = setInterval(fetchWeather, 10 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [coords])

  useEffect(() => {
    if (!coords && userCity) {
      fetchWeather()
      const interval = setInterval(fetchWeather, 10 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [userCity, coords])

  // Attempt geolocation for higher accuracy once
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        },
        () => {
          // ignore errors, fall back to city
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  const fetchUserCity = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/user/profile`)
      if (response.ok) {
        const data = await response.json()
        setUserCity(data.city || '')
      } else {
        setUserCity('')
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch user city:', error)
      setUserCity('')
      setLoading(false)
    }
  }

  const fetchWeather = async () => {
    try {
      // Sanitize city name to avoid 404s
      const cleanCity = userCity.replace(/\b(taluk|district)\b/gi, '').trim()

      if (!coords && !cleanCity) {
        setWeather(null)
        setLoading(false)
        return
      }
      
      const baseUrl = getApiBaseUrl()
      const query = coords ? `lat=${coords.lat}&lon=${coords.lon}` : `city=${encodeURIComponent(cleanCity)}`
      const response = await fetch(`${baseUrl}/api/weather/current?${query}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Weather fetched:', data)
        setWeather({ 
          tempC: data.tempC, 
          humidity: data.humidity,
          locationName: data.locationName,
          feelsLikeC: typeof data.feelsLikeC === 'number' ? data.feelsLikeC : undefined
        })
        setLastUpdated(Date.now())
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black shadow-[3px_3px_0_#000]">
        <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
        <span className="text-[10px] text-black font-black uppercase tracking-[0.14em]">Loading</span>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-white border-2 border-black border-dashed">
        <div className="p-1.5 bg-[#FFE66D] border border-black text-black">
          <Thermometer className="w-4 h-4" />
        </div>
        <span className="text-[10px] text-black font-black uppercase tracking-[0.14em]">Set Location</span>
      </div>
    )
  }
// ... existing code ...
  const tooltip = weather?.locationName ? `${weather.locationName} • Updated ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : ''}` : userCity
  const isStale = lastUpdated ? (Date.now() - lastUpdated) > 15 * 60 * 1000 : false
  
  // Helper to clean city name for display
  const getDisplayLocation = () => {
    const name = weather?.locationName?.split(',')[0] || userCity
    return name.replace(/\b(taluk|district)\b/gi, '').trim()
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-white border-2 border-black shadow-[4px_4px_0_#000] group" title={tooltip}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#93E1A8] border border-black text-black">
             <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xl font-black text-black leading-none">{weather.tempC.toFixed(0)}°</p>
            <p className="text-[10px] font-black text-black/70 mt-0.5 max-w-[90px] truncate uppercase tracking-[0.08em]">
              {getDisplayLocation()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 text-[10px] font-black text-black bg-[#FFE66D] px-1.5 py-0.5 border border-black uppercase tracking-[0.08em]">
            <Droplets className="w-3 h-3" />
            <span>{Math.round(weather.humidity)}%</span>
          </div>
          <button
            onClick={fetchWeather}
            className={`text-xs p-1 border border-black transition-colors ${
              isStale ? 'bg-[#FFE66D] text-black' : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
            title="Refresh"
          >
            <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
