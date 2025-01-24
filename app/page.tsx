import { Button } from "@/components/ui/button"
import { ArrowRight, LineChart, PiggyBank, Target, ChartBar } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-black to-gray-900">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#3B82F620,transparent)]" />
      </div>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              
              <img src="/logo.png" className='h-8 w-auto'/>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90">
                Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="relative pt-24">
        <div className="relative px-6 pt-20 pb-20 md:pt-32 md:pb-28 mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-xl px-6 py-2 text-sm text-gray-400">
              ✨ Discover a better way to manage your finances
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 pb-2 animate-gradient-x">
              Smart Money Management Made Simple
            </h1>
            <p className="text-xl md:text-2xl text-gray-300">
              Track expenses, set budgets, and achieve your savings goals with our comprehensive financial dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button className="w-full sm:w-auto text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 py-6 rounded-lg hover:opacity-90 transition-all">
                  Get Started <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-24 mx-auto max-w-7xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3B82F610,transparent)]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {[
            {
              icon: LineChart,
              title: "Financial Dashboard",
              description: "Get a clear overview of your finances with our intuitive dashboard showing income, expenses, and savings at a glance."
            },
            {
              icon: Target,
              title: "Budget Management",
              description: "Create and track custom budgets for different spending categories. Stay on top of your expenses with real-time tracking."
            },
            {
              icon: PiggyBank,
              title: "Savings Goals",
              description: "Set and achieve your savings targets with dedicated goal tracking, progress monitoring, and milestone celebrations."
            },
            {
              icon: ChartBar,
              title: "Expense Analytics",
              description: "Understand your spending patterns with detailed breakdowns and visual reports of your transaction history."
            }
          ].map((feature, index) => (
            <div key={index} className="group relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-25 blur transition duration-500 group-hover:opacity-75" />
              <div className="relative h-full bg-black/40 backdrop-blur-xl border border-gray-800 rounded-lg p-8 transition duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
                <feature.icon className="h-12 w-12 mb-6 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-200 mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="relative px-6 py-24 mx-auto max-w-7xl">
          <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl" />
            <h2 className="relative text-3xl md:text-4xl font-bold text-gray-200 mb-4">
              Ready to Master Your Finances?
            </h2>
            <p className="relative text-lg text-gray-400 mb-8">
              Join thousands of users who are taking control of their financial future.
            </p>
            <Link href="/signup" className="relative">
              <Button className="text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 py-6 rounded-lg hover:opacity-90 transition-all">
                Start Your Journey <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}