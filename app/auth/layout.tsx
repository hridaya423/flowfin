import { PropsWithChildren } from 'react'

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md animate-fade-in space-y-4 bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-gray-800/50 shadow-xl">
        {children}
      </div>
    </div>
  )
}
