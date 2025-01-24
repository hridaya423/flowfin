/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDemoLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email: 'demo@flowfin.com',
        password: 'demopass123',
      })
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@flowfin.com',
        password: 'demopass123'
      })
      if (signInError) throw signInError
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError((error as any).message)
    } finally {
      setLoading(false)
    }
  }
  const handleLogin = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError((error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      setError((error as any).message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
          Welcome to FlowFin
        </h2>
        <p className="text-gray-400 text-lg">Sign in to manage your finances</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleDemoLogin}
        type="button"
        disabled={loading}
        className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white py-4 px-6 rounded-lg text-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Signing in...' : 'Try Demo Account'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-black/40 text-gray-400">Or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-base font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3.5 text-gray-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-base font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3.5 text-gray-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white py-4 px-6 rounded-lg text-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-black/40 text-gray-400">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-white/5 border border-gray-700 text-gray-300 py-4 px-6 rounded-lg hover:bg-white/10 transition-colors text-lg"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>

      <p className="text-center text-base text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}