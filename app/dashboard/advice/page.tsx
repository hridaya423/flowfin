'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from "@/components/ui/card"
import { startOfMonth, subMonths } from 'date-fns'

interface FinancialMetrics {
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  topExpenseCategories: Array<{ category: string; amount: number }>
  expenseGrowthRate: number
  hasRecurringSubscriptions: boolean
}

export default function AIAdvicePage() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const analyzeFinances = async () => {
    const supabase = createClient()
    const now = new Date()
    const currentMonth = startOfMonth(now)
    const lastMonth = startOfMonth(subMonths(now, 1))

    const { data: currentData } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', currentMonth.toISOString())

    const { data: previousData } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', lastMonth.toISOString())
      .lt('date', currentMonth.toISOString())
    if (!currentData || !previousData) return null
    const currentIncome = currentData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const currentExpenses = currentData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const previousExpenses = previousData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const expensesByCategory = currentData
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const topCategories = (Object.entries(expensesByCategory) as [string, number][])
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }))

    const expenseGrowthRate = previousExpenses ? 
      ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0

    const { data: recurringData } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('type', 'expense')

    setMetrics({
      monthlyIncome: currentIncome,
      monthlyExpenses: currentExpenses,
      savingsRate: currentIncome ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0,
      topExpenseCategories: topCategories,
      expenseGrowthRate,
      hasRecurringSubscriptions: (recurringData?.length || 0) > 0
    })

    setLoading(false)
  }

  useEffect(() => {
    analyzeFinances()
  }, [])

  const generateAdvice = () => {
    if (!metrics) return []

    const advice = []
    if (metrics.savingsRate > 50) {
      advice.push({
        title: "Excellent Savings Rate",
        description: `Your savings rate of ${metrics.savingsRate.toFixed(1)}% is exceptional. Consider exploring investment opportunities to make your money work harder for you.`,
        actionItems: [
          "Research different investment vehicles (stocks, bonds, ETFs)",
          "Consider consulting with a financial advisor about wealth building",
          "Look into tax-advantaged investment accounts"
        ]
      })
    } else if (metrics.savingsRate < 20) {
      advice.push({
        title: "Improve Your Savings Rate",
        description: "Aim to save at least 20% of your income. Consider using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.",
        actionItems: [
          "Review and cut non-essential expenses",
          "Set up automatic transfers to savings",
          "Look for additional income opportunities"
        ]
      })
    }

    if (metrics.expenseGrowthRate > 10) {
      advice.push({
        title: "Managing Expense Growth",
        description: `Your expenses have grown by ${metrics.expenseGrowthRate.toFixed(1)}% compared to last month. Focus on your top spending categories: ${metrics.topExpenseCategories.map(c => c.category).join(', ')}.`,
        actionItems: [
          "Track daily expenses",
          "Create category-specific budgets",
          "Find alternatives for high-cost services"
        ]
      })
    }

    if (metrics.hasRecurringSubscriptions) {
      advice.push({
        title: "Optimize Subscriptions",
        description: "Review your recurring payments to ensure you're getting value from each subscription.",
        actionItems: [
          "List all active subscriptions",
          "Cancel unused services",
          "Look for bundle deals or annual discounts"
        ]
      })
    }

    advice.push({
      title: "Spending Pattern Analysis",
      description: `Your top spending categories show ${metrics.topExpenseCategories.map(c => c.category).join(', ')}. Understanding these patterns can help optimize your budget.`,
      actionItems: [
        "Review recurring expenses in these categories",
        "Look for potential areas of cost reduction",
        "Set category-specific spending limits"
      ]
    })

    advice.push({
      title: "Future Financial Planning",
      description: "Regular financial planning helps secure your future and achieve long-term goals.",
      actionItems: [
        "Set specific financial goals for the next 1-5 years",
        "Consider diversifying income sources",
        "Review and adjust your financial strategy quarterly"
      ]
    })

    return advice
  }

 if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    )
  }

  const advice = generateAdvice()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
        Financial Advisor
      </h1>
      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Your Financial Health Score</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-400">Savings Rate</p>
            <p className={`text-3xl font-bold ${
              (metrics?.savingsRate || 0) >= 20 ? 'text-green-400' : 'text-red-400'
            }`}>
              {metrics?.savingsRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-400">Monthly Income</p>
            <p className="text-3xl font-bold text-gray-200">
              ${metrics?.monthlyIncome.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Monthly Expenses</p>
            <p className={`text-3xl font-bold ${
              (metrics?.expenseGrowthRate || 0) > 10 ? 'text-red-400' : 'text-gray-200'
            }`}>
              ${metrics?.monthlyExpenses.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
      {advice.map((item, index) => (
        <Card key={index} className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
          <h2 className="text-2xl font-bold text-gray-200 mb-4">{item.title}</h2>
          <p className="text-gray-300 mb-6">{item.description}</p>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-200">Recommended Actions:</h3>
            <ul className="space-y-3">
              {item.actionItems.map((action, i) => (
                <li key={i} className="flex items-center text-gray-300">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 to-green-400 mr-3" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  )
}