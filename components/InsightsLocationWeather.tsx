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
    <Card>
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insights Location</label>
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Mumbai, Delhi"
              className="w-full pl-3 pr-10 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
            />
            <button
              onClick={handleDetect}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
              title="Detect Location"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for weather-based analytics and shown in the navbar.</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="bg-green-700 hover:bg-green-800 text-white">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {msg && (
        <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm">{msg}</div>
      )}

      {weather ? (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-xl border border-border flex flex-col items-center justify-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <Thermometer className="w-3 h-3" /> Temperature
            </div>
            <div className="text-2xl font-bold text-foreground">
              {fetchingWeather ? '...' : `${Math.round(weather.tempC)}°C`}
            </div>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-xl border border-border flex flex-col items-center justify-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> Humidity
            </div>
            <div className="text-2xl font-bold text-foreground">
              {fetchingWeather ? '...' : `${Math.round(weather.humidity)}%`}
            </div>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-xl border border-border flex flex-col items-center justify-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location
            </div>
            <div className="text-sm font-bold text-foreground truncate w-full text-center" title={weather?.locationName || city || '-'}>
              {weather?.locationName || city || '-'}
            </div>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-xl border border-border flex flex-col items-center justify-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated
            </div>
            <div className="text-sm font-bold text-foreground">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      ) : (
        <div className="mt-5 p-8 border-2 border-dashed border-gray-200 rounded-xl text-center flex flex-col items-center justify-center text-gray-400">
          <MapPin className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">Set a valid location to see weather insights.</p>
        </div>
      )}
    </Card>
  )
}
