'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/shadcn-button'
import { getApiBaseUrl } from '@/lib/api'
import { MapPin, Thermometer, Droplets, Clock } from 'lucide-react'

export default function InsightsLocationWeather() {
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [weather, setWeather] = useState<{ tempC: number; humidity: number; locationName?: string } | null>(null)
  const [fetchingWeather, setFetchingWeather] = useState(false)

  useEffect(() => {
    // Load user city
    ;(async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const r = await fetch(`${baseUrl}/api/user/profile`, { cache: 'no-store' })
        if (r.ok) {
          const data = await r.json()
          const rawCity = data.city || ''
          // Sanitize immediately on load
          const cleanCity = rawCity.replace(/\b(taluk|district)\b/gi, '').trim()
          
          setCity(cleanCity)
          if (cleanCity) {
            await fetchWeather(cleanCity)
          }
        }
      } catch (e) {
        console.error('Failed to load profile', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const fetchWeather = async (targetCity: string) => {
    setFetchingWeather(true)
    try {
      const cleanCity = targetCity.replace(/\b(taluk|district)\b/gi, '').trim()
      console.log('Fetching weather for:', cleanCity)
      
      const baseUrl = getApiBaseUrl()
      const r = await fetch(`${baseUrl}/api/weather/current?city=${encodeURIComponent(cleanCity)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (r.ok) {
        const data = await r.json()
        setWeather({ tempC: data.tempC, humidity: data.humidity, locationName: data.locationName || cleanCity })
      } else {
        setMsg('Weather service unavailable')
      }
    } catch (e) {
      console.error('Weather fetch failed', e)
      setMsg('Failed to fetch weather data')
    } finally {
      setFetchingWeather(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      // sanitize city name: remove 'taluk', 'district', and extra spaces
      const cleanCity = city.replace(/\b(taluk|district)\b/gi, '').trim()
      
      const baseUrl = getApiBaseUrl()
      const r = await fetch(`${baseUrl}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: cleanCity })
      })
      if (r.ok) {
        setCity(cleanCity) // Update input to show cleaned name
        setMsg('Location saved. Weather updated.')
        await fetchWeather(cleanCity)
        setTimeout(() => setMsg(''), 2500)
      } else {
        setMsg('Failed to save location')
      }
    } catch {
      setMsg('Error saving location')
    } finally {
      setSaving(false)
    }
  }

  const handleDetect = async () => {
    setMsg('Detecting your location via GPS...')
    if (!navigator.geolocation) {
      setMsg('Geolocation not supported. Enter city manually.')
      return
    }
    
    try {
      // Use high accuracy GPS with longer timeout
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // If high accuracy times out, try with lower accuracy
            if (error.code === error.TIMEOUT) {
              setMsg('GPS taking longer, trying network location...')
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
              )
            } else {
              reject(error)
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
      })

      const { latitude, longitude, accuracy } = position.coords
      const locationSource = accuracy < 100 ? 'GPS' : 'Network'
      console.log(`Location detected via ${locationSource} (accuracy: ${Math.round(accuracy)}m)`)
      setMsg(`Location detected via ${locationSource} (±${Math.round(accuracy)}m). Fetching city name...`)

      const baseUrl = getApiBaseUrl()
      const r = await fetch(`${baseUrl}/api/weather/current?lat=${latitude}&lon=${longitude}&t=${Date.now()}`, { cache: 'no-store' })
      
      if (r.ok) {
        const data = await r.json()
        const detected = data?.locationName
        if (detected) {
          setCity(detected)
          setMsg(`Detected: ${detected} (via ${locationSource}, ±${Math.round(accuracy)}m). Click Save to use it.`)
        } else {
          setMsg('Got coordinates but could not determine city. Enter manually.')
        }
        setWeather({ tempC: data.tempC, humidity: data.humidity, locationName: data.locationName })
      } else {
        setMsg('Could not fetch location data. Enter city manually.')
      }
    } catch (err: any) {
      console.warn('Geolocation error', err)
      if (err.code === 1) {
        setMsg('Location permission denied. Please enable location access or enter city manually.')
      } else if (err.code === 2) {
        setMsg('Location unavailable. Please check GPS/location settings or enter city manually.')
      } else if (err.code === 3) {
        setMsg('Location request timed out. Try again or enter city manually.')
      } else {
        setMsg('Failed to detect location. Enter city manually.')
      }
    }
  }

  return (
    <Card className="!rounded-[2rem] border-border/50 shadow-sm h-full flex flex-col justify-center p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative group flex-1">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Location..."
              className="w-full pl-3 pr-8 py-2 text-sm border border-border/50 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-muted/30 text-foreground"
            />
            <button
              onClick={handleDetect}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              title="Detect"
            >
              <MapPin className="w-3 h-3" />
            </button>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm">
            {saving ? '...' : 'Save'}
        </Button>
      </div>

      {msg && (
        <div className="mb-2 text-[10px] text-blue-600 dark:text-blue-400 truncate px-1">
          {msg}
        </div>
      )}

      {weather ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all group">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full group-hover:scale-110 transition-transform">
              <Thermometer className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">Temp</div>
              <div className="text-lg font-serif font-medium text-foreground">
                {fetchingWeather ? '..' : `${Math.round(weather.tempC)}°`}
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all group">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:scale-110 transition-transform">
              <Droplets className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">Humidity</div>
              <div className="text-lg font-serif font-medium text-foreground">
                {fetchingWeather ? '..' : `${Math.round(weather.humidity)}%`}
              </div>
            </div>
          </div>
          
          <div className="p-2 bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center gap-1 group">
             <div className="flex items-center gap-1 mb-0.5">
                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Loc</span>
            </div>
            <div className="text-xs font-bold text-foreground truncate w-full text-center px-1" title={weather?.locationName || city || '-'}>
                {weather?.locationName || city || '-'}
            </div>
          </div>

          <div className="p-2 bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center gap-1 group">
             <div className="flex items-center gap-1 mb-0.5">
                <Clock className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Time</span>
            </div>
             <div className="text-xs font-bold text-foreground">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/50 p-2">
          <p className="text-xs">Set location</p>
        </div>
      )}
    </Card>
  )
}
