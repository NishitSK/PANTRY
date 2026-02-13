'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/shadcn-button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Use window.location.href to force a full page reload
        // This ensures the session cookie is sent with the next request
        window.location.href = '/'
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#fafafa] dark:bg-neutral-950">
      {/* Background - Organic Mesh */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-100/40 to-purple-100/40 dark:from-indigo-900/10 dark:to-purple-900/10 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-emerald-100/40 to-teal-100/40 dark:from-emerald-900/10 dark:to-teal-900/10 blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-[1.2rem] bg-white dark:bg-neutral-900 text-primary mb-4 shadow-xl shadow-indigo-100/50 dark:shadow-none border border-indigo-50 dark:border-neutral-800 rotate-3 transition-transform hover:rotate-6 duration-300">
             <Package className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-serif font-medium tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-base font-light">Sign in to your Pantry Guardian account</p>
        </div>

        <div className="bg-white/80 dark:bg-neutral-900/80 text-card-foreground shadow-2xl shadow-black/5 border border-white/50 dark:border-neutral-800 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-xl">
          <div className="mb-8">
            <Button 
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                variant="outline" 
                className="w-full relative h-12 rounded-full border-border/60 hover:bg-white hover:border-indigo-200 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 group"
            >
                <svg className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Continue with Google
            </Button>
            
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-medium">
                    <span className="bg-white/50 dark:bg-neutral-900 px-4 text-muted-foreground/70 backdrop-blur-sm rounded-full">Or continue with</span>
                </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-300 text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="p-1 bg-red-100 dark:bg-red-900/40 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground ml-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-12 w-full rounded-2xl border border-transparent bg-muted/40 hover:bg-muted/60 focus:bg-white dark:focus:bg-neutral-800 px-5 py-3 text-sm shadow-inner transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-12 w-full rounded-2xl border border-transparent bg-muted/40 hover:bg-muted/60 focus:bg-white dark:focus:bg-neutral-800 px-5 py-3 text-sm shadow-inner transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full text-base font-medium shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 text-white transition-all mt-4 hover:scale-[1.02] active:scale-[0.98]">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

            <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground/80">Don&apos;t have an account? </span>
                <Link href="/auth/signup" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 underline-offset-4 hover:underline transition-colors">
                    Create account
                </Link>
            </div>
        </div>
      </div>
    </div>
  )
}
