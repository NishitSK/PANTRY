'use client'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/api'

import { Thermometer, Droplets, RotateCcw } from 'lucide-react'

export default function WeatherChip() {
  const { data: session } = useSession()
  const [weather, setWeather] = useState<{ tempC: number; humidity: number; locationName?: string; feelsLikeC?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string>('')
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    fetchUserCity()
  }, [session])

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
    if (!session?.user?.email) return
    
    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/user/profile`)
      if (response.ok) {
        const data = await response.json()
        setUserCity(data.city || '')
      }
    } catch (error) {
      console.error('Failed to fetch user city:', error)
      setUserCity('')
    }
  }

  const fetchWeather = async () => {
    try {
      // Sanitize city name to avoid 404s
      const cleanCity = userCity.replace(/\b(taluk|district)\b/gi, '').trim()
      
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
      <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl border border-border">
        <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">Loading...</span>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border border-dashed">
        <div className="p-1.5 bg-muted rounded-full text-muted-foreground">
          <Thermometer className="w-4 h-4" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">Set Location</span>
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
    <div className="flex flex-col gap-2 p-3 bg-card hover:bg-muted/50 transition-colors rounded-xl border border-border shadow-sm group" title={tooltip}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:bg-primary/20 transition-colors">
             <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground leading-none">{weather.tempC.toFixed(0)}°</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 max-w-[90px] truncate">
              {getDisplayLocation()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary/10 px-1.5 py-0.5 rounded-md text-secondary">
            <Droplets className="w-3 h-3" />
            <span>{Math.round(weather.humidity)}%</span>
          </div>
          <button
            onClick={fetchWeather}
            className={`text-xs p-1 rounded-md hover:bg-muted transition-colors ${
              isStale ? 'text-amber-500' : 'text-muted-foreground/50 hover:text-foreground'
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
