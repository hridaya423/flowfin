/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  format 
} from 'date-fns'
import { Card } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TimePeriodSummary {
  income: number
  expenses: number
  savings: number
  topExpenseCategory: string
  percentChange: {
    income: number
    expenses: number
    savings: number
  }
}

export default function SummaryPage() {
  const [weeklySummary, setWeeklySummary] = useState<TimePeriodSummary | null>(null)
  const [monthlySummary, setMonthlySummary] = useState<TimePeriodSummary | null>(null)
  const [yearlySummary, setYearlySummary] = useState<TimePeriodSummary | null>(null)
  const [trendData, setTrendData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const calculatePercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / Math.abs(previous)) * 100
}

const fetchPeriodData = async (start: Date, end: Date, previousStart: Date, previousEnd: Date) => {
    const supabase = createClient()
    
    const { data: currentData } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', start.toISOString())
      .lte('date', end.toISOString())

    const { data: previousData } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', previousStart.toISOString())
      .lte('date', previousEnd.toISOString())

    const currentIncome = currentData?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0
    const currentExpenses = currentData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0
    const previousIncome = previousData?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0
    const previousExpenses = previousData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0

    const expensesByCategory = currentData
      ?.filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
    
    const topExpenseCategory = (Object.entries(expensesByCategory || {}) as [string, number][])
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'

    return {
      income: currentIncome,
      expenses: currentExpenses,
      savings: currentIncome - currentExpenses,
      topExpenseCategory,
      percentChange: {
        income: calculatePercentChange(currentIncome, previousIncome),
        expenses: calculatePercentChange(currentExpenses, previousExpenses),
        savings: calculatePercentChange(
          currentIncome - currentExpenses,
          previousIncome - previousExpenses
        )
      }
    }
  }

  const fetchData = async () => {
    const now = new Date()
    
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const previousWeekStart = startOfWeek(subWeeks(now, 1))
    const previousWeekEnd = endOfWeek(subWeeks(now, 1))
    
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const previousMonthStart = startOfMonth(subMonths(now, 1))
    const previousMonthEnd = endOfMonth(subMonths(now, 1))
    
    const yearStart = startOfYear(now)
    const yearEnd = endOfYear(now)
    const previousYearStart = startOfYear(subYears(now, 1))
    const previousYearEnd = endOfYear(subYears(now, 1))

    const [weekly, monthly, yearly] = await Promise.all([
      fetchPeriodData(weekStart, weekEnd, previousWeekStart, previousWeekEnd),
      fetchPeriodData(monthStart, monthEnd, previousMonthStart, previousMonthEnd),
      fetchPeriodData(yearStart, yearEnd, previousYearStart, previousYearEnd)
    ])

    setWeeklySummary(weekly)
    setMonthlySummary(monthly)
    setYearlySummary(yearly)
    const supabase = createClient()
    const sixMonthsAgo = subMonths(now, 6)
    
    const { data: trendTransactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', sixMonthsAgo.toISOString())
      .lte('date', now.toISOString())

    const monthlyTrends = trendTransactions?.reduce((acc, transaction) => {
      const month = format(new Date(transaction.date), 'MMM yyyy')
      if (!acc[month]) {
        acc[month] = { month, income: 0, expenses: 0, savings: 0 }
      }
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount
      } else {
        acc[month].expenses += transaction.amount
      }
      acc[month].savings = acc[month].income - acc[month].expenses
      return acc
    }, {} as Record<string, any>)

    setTrendData(Object.values(monthlyTrends || {}))
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
        Financial Summary
      </h1>
      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Weekly Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Income', value: weeklySummary?.income, change: weeklySummary?.percentChange.income },
            { label: 'Expenses', value: weeklySummary?.expenses, change: weeklySummary?.percentChange.expenses, inverse: true },
            { label: 'Savings', value: weeklySummary?.savings, change: weeklySummary?.percentChange.savings }
          ].map(item => (
            <div key={item.label}>
              <p className="text-gray-400">{item.label}</p>
              <p className="text-3xl font-bold text-gray-200">${item?.value?.toFixed(2)}</p>
              <p className={`text-sm ${(item.inverse ? -(item.change ?? 0) : (item.change ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.change?.toFixed(1)}% vs last week
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Monthly Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Income', value: monthlySummary?.income, change: monthlySummary?.percentChange.income },
            { label: 'Expenses', value: monthlySummary?.expenses, change: monthlySummary?.percentChange.expenses, inverse: true },
            { label: 'Savings', value: monthlySummary?.savings, change: monthlySummary?.percentChange.savings }
          ].map(item => (
            <div key={item.label}>
              <p className="text-gray-400">{item.label}</p>
              <p className="text-3xl font-bold text-gray-200">${item?.value?.toFixed(2)}</p>
              <p className={`text-sm ${(item.inverse ? -(item.change ?? 0) : (item.change ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.change?.toFixed(1)}% vs last month
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Yearly Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Income', value: yearlySummary?.income, change: yearlySummary?.percentChange.income },
            { label: 'Expenses', value: yearlySummary?.expenses, change: yearlySummary?.percentChange.expenses, inverse: true },
            { label: 'Savings', value: yearlySummary?.savings, change: yearlySummary?.percentChange.savings }
          ].map(item => (
            <div key={item.label}>
              <p className="text-gray-400">{item.label}</p>
              <p className="text-3xl font-bold text-gray-200">${item?.value?.toFixed(2)}</p>
              <p className={`text-sm ${(item.inverse ? -(item.change ?? 0) : (item.change ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.change?.toFixed(1)}% vs last year
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">6-Month Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#E5E7EB' }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10B981" name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Expenses" />
              <Line type="monotone" dataKey="savings" stroke="#3B82F6" name="Savings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Financial Insights</h2>
        <div className="space-y-4">
          {(monthlySummary?.percentChange.expenses ?? 0) > 10 && (
            <Alert className="bg-yellow-900/20 border border-yellow-900">
              <AlertTitle className="text-yellow-400">High Expense Growth</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your expenses have increased by {monthlySummary?.percentChange.expenses.toFixed(1)}% compared to last month. 
                The highest spending category is {monthlySummary?.topExpenseCategory ?? 'N/A'}.
              </AlertDescription>
            </Alert>
          )}
          
          {(monthlySummary?.savings ?? 0) < 0 && (
            <Alert className="bg-red-900/20 border border-red-900">
              <AlertTitle className="text-red-400">Negative Savings</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your expenses exceeded your income by ${Math.abs(monthlySummary?.savings ?? 0).toFixed(2)} this month.
                Consider reviewing your budget.
              </AlertDescription>
            </Alert>
          )}
          
          {monthlySummary?.percentChange?.savings !== undefined && monthlySummary.percentChange.savings > 20 && (
            <Alert className="bg-green-900/20 border border-green-900">
              <AlertTitle className="text-green-400">Great Savings Progress!</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your savings rate has improved by {monthlySummary.percentChange.savings.toFixed(1)}% compared to last month.
                Keep up the good work!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  )
}