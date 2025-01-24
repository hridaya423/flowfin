/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        router.push('/auth/login')
      } else {
        setUser(session.user)
      }
    }
    checkUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navLinks = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/transactions", label: "Transactions" },
    { href: "/dashboard/summary", label: "Summary" },
    { href: "/dashboard/advice", label: "Advice" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100">
      <nav className="bg-black/40 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <img src="/logo.png" className='h-8 w-auto' />
                  
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center px-1 pt-1 text-gray-400 hover:text-gray-100 transition-colors border-b-2 border-transparent hover:border-gray-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}