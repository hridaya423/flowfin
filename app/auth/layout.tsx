import { PropsWithChildren } from 'react'

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-6">
      <div className="w-full max-w-2xl space-y-6 bg-black/40 backdrop-blur-lg p-12 rounded-xl border border-gray-800 shadow-2xl">
        {children}
      </div>
    </div>
  )
}