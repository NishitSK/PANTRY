'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { getApiBaseUrl } from '@/lib/api'
import { Package, Calendar, MapPin, Banknote, User as UserIcon, Mail, ArrowLeft } from 'lucide-react'

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    city: ''
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || '',
          city: data.city || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: formData.city }) // Currently API only supports updating city
      })

      if (response.ok) {
        setMessage('Profile updated successfully!')
        setProfile({ ...profile, ...formData })
        setEditMode(false)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to update profile')
      }
    } catch (error) {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <SectionHeading>My Profile</SectionHeading>
          <p className="text-muted-foreground mt-1">Manage your personal information and view your stats.</p>
        </div>
        {!editMode && (
          <Button onClick={() => setEditMode(true)} variant="outline">
            Edit Profile
          </Button>
        )}
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-lg border ${message.includes('success') ? 'bg-green-50/50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 'bg-red-50/50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: User Card & Stats */}
        <div className="space-y-6">
          <Card className="p-6 flex flex-col items-center text-center border-border">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mb-4 border-2 border-primary/20">
              {profile.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{profile.email}</p>
            
            <div className="w-full pt-4 border-t border-border mt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Member Since
                </span>
                <span className="font-medium text-foreground">{formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" /> Pantry Value
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                ₹{profile.stats?.totalValue?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated based on category averages
            </p>
          </Card>
        </div>

        {/* Right Column: Details & More Stats */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 border-border">
            <h3 className="font-semibold text-lg text-foreground mb-6">Personal Information</h3>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" /> Full Name
                </label>
                <input
                  type="text"
                  value={editMode ? formData.name : profile.name} // Note: API might not support name update yet, but UI is ready
                  disabled={true} // Name update not in API yet
                  className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> City / Location
                </label>
                <input
                  type="text"
                  value={editMode ? formData.city : profile.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!editMode}
                  placeholder="Enter your city"
                  className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${editMode ? 'border-input' : 'border-transparent pl-0'}`}
                />
              </div>

              {editMode && (
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => {
                    setEditMode(false)
                    setFormData({ name: profile.name, city: profile.city })
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 border-border flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{profile.stats?.totalItems || 0}</p>
              </div>
            </Card>

             <Card className="p-6 border-border flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Joined</p>
                <p className="text-lg font-bold text-foreground">{profile.createdAt ? new Date(profile.createdAt).getFullYear() : '-'}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
