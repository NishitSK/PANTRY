'use client'

import { signOut, useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/shadcn-button'
import { getApiBaseUrl } from '@/lib/api'
import { Package, Calendar, MapPin, Banknote, User as UserIcon, Mail, ArrowLeft, LogOut } from 'lucide-react'

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
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group px-4 py-2 rounded-full hover:bg-muted/50">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-2 text-lg font-light">Manage your personal information and view your stats.</p>
        </div>
        {!editMode && (
          <div className="flex gap-3">
            <Button onClick={() => signOut({ callbackUrl: '/' })} variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-6">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <Button onClick={() => setEditMode(true)} variant="outline" className="rounded-full px-6 border-primary/20 hover:bg-primary/5 hover:text-primary">
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 mb-8 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${message.includes('success') ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' : 'bg-red-50/50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'}`}>
          {message.includes('success') ? <div className="h-2 w-2 rounded-full bg-emerald-500" /> : <div className="h-2 w-2 rounded-full bg-red-500" />}
          {message}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: User Card & Stats */}
        <div className="space-y-6">
          <Card className="p-8 flex flex-col items-center text-center border-border/50 !rounded-[2.5rem] bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
                <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl font-serif font-medium text-primary mb-6 shadow-inner ring-4 ring-background">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-background p-1.5 rounded-xl shadow-sm">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                </div>
            </div>
            
            <h2 className="text-2xl font-serif font-bold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground mb-6 font-medium">{profile.email}</p>
            
            <div className="w-full pt-6 border-t border-border/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Member Since
                </span>
                <span className="font-semibold text-foreground">{formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 !rounded-[2rem] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-100 dark:border-emerald-900/30">
            <h3 className="font-medium text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Banknote className="w-4 h-4" /> Pantry Value
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-medium text-emerald-900 dark:text-emerald-100">
                ₹{profile.stats?.totalValue?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-2 font-medium">
              Estimated total value
            </p>
          </Card>
        </div>

        {/* Right Column: Details & More Stats */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8 border-border/50 !rounded-[2.5rem] shadow-sm">
            <h3 className="font-serif text-2xl font-medium text-foreground mb-8">Personal Information</h3>
            
            <div className="space-y-6">
              <div className="grid gap-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Full Name
                </label>
                <input
                  type="text"
                  value={editMode ? formData.name : profile.name} // Note: API might not support name update yet, but UI is ready
                  disabled={true} // Name update not in API yet
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-transparent bg-muted/40 text-foreground cursor-not-allowed font-medium"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-transparent bg-muted/40 text-foreground cursor-not-allowed font-medium"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> City / Location
                </label>
                <input
                  type="text"
                  value={editMode ? formData.city : profile.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!editMode}
                  placeholder="Enter your city"
                  className={`w-full px-5 py-3.5 rounded-2xl border-2 bg-background text-foreground transition-all outline-none font-medium ${editMode ? 'border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10' : 'border-transparent bg-muted/40 pl-5'}`}
                />
              </div>

              {editMode && (
                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="ghost" onClick={() => {
                    setEditMode(false)
                    setFormData({ name: profile.name, city: profile.city })
                  }} className="rounded-full px-6">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="rounded-full px-8 shadow-lg shadow-primary/20">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 border-border/50 !rounded-[2rem] flex items-center gap-5 hover:bg-muted/5 transition-colors">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-[1.2rem] text-blue-600 dark:text-blue-400 shadow-sm">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Items</p>
                <p className="text-3xl font-serif font-medium text-foreground">{profile.stats?.totalItems || 0}</p>
              </div>
            </Card>

             <Card className="p-6 border-border/50 !rounded-[2rem] flex items-center gap-5 hover:bg-muted/5 transition-colors">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-[1.2rem] text-purple-600 dark:text-purple-400 shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Joined Year</p>
                <p className="text-3xl font-serif font-medium text-foreground">{profile.createdAt ? new Date(profile.createdAt).getFullYear() : '-'}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
