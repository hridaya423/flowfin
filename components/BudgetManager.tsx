/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TransactionCategory } from '@/types/supabase'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { Progress } from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from '@/hooks/use-toast'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'

interface Budget {
  id: string
  category: TransactionCategory
  amount: number
  month: string
}

interface BudgetProgress {
  category: TransactionCategory
  budgeted: number
  spent: number
  remaining: number
  percentUsed: number
}

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'housing',
  'transportation',
  'food',
  'utilities',
  'healthcare',
  'entertainment',
  'shopping',
  'other_expense'
]

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('food')
  const [amount, setAmount] = useState('')
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([])

  const fetchBudgets = async () => {
    try {
      const supabase = createClient()
      const currentMonth = startOfMonth(new Date())
      
      const { data: { user } } = await supabase.auth.getUser()
const { data, error } = await supabase
  .from('budgets')
  .select('*')
  .eq('month', format(currentMonth, 'yyyy-MM-dd'))
  .eq('user_id', user?.id)

      if (error) throw error
      
      setBudgets(data || [])
      await calculateBudgetProgress(data || [])
    } catch (error) {
      console.error('Error fetching budgets:', error)
      toast({
        title: "Error fetching budgets",
        description: (error as any).message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateBudgetProgress = async (currentBudgets: Budget[]) => {
    try {
      const supabase = createClient()
      const startDate = startOfMonth(new Date())
      const endDate = endOfMonth(new Date())

      const progress: BudgetProgress[] = []

      for (const budget of currentBudgets) {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('category', budget.category)
          .eq('type', 'expense')
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))

        const spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
        const remaining = budget.amount - spent

        progress.push({
          category: budget.category,
          budgeted: budget.amount,
          spent,
          remaining,
          percentUsed: (spent / budget.amount) * 100
        })
      }

      setBudgetProgress(progress)
    } catch (error) {
      console.error('Error calculating budget progress:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('Not authenticated')

      const currentMonth = startOfMonth(new Date())

      const budgetData = {
        user_id: user.id,
        category: selectedCategory,
        amount: Number(amount),
        month: format(currentMonth, 'yyyy-MM-dd')
      }

      const { error: insertError } = await supabase
        .from('budgets')
        .insert(budgetData)

      if (insertError?.code === '23505') {
        const { error: updateError } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('user_id', user.id)
          .eq('category', selectedCategory)
          .eq('month', format(currentMonth, 'yyyy-MM-dd'))

        if (updateError) throw updateError
      } else if (insertError) {
        throw insertError
      }

      toast({
        title: "Success",
        description: "Budget has been saved",
      })

      setAmount('')
      await fetchBudgets()
    } catch (error) {
      console.error('Error saving budget:', error)
      toast({
        title: "Error saving budget",
        description: (error as any).message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  return (
    <div className="space-y-8">
      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Set Monthly Budget</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TransactionCategory)}
              className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-gray-100"
              disabled={loading}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-gray-900">
                  {cat.replace('_', ' ').charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400">$</span>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 bg-gray-900/50 border-gray-700 text-gray-100"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Set Budget'}
          </Button>
        </form>
      </Card>

      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Budget Progress</h2>
        <div className="space-y-6">
          {loading ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : budgetProgress.length === 0 ? (
            <p className="text-center text-gray-400">No budgets set for this month</p>
          ) : (
            budgetProgress.map((budget) => (
              <div key={budget.category} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-200 capitalize">
                    {budget.category.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-400">
                    ${budget.spent.toFixed(2)} / ${budget.budgeted.toFixed(2)}
                  </span>
                </div>
                <Progress 
                  value={budget.percentUsed} 
                  className="h-2 bg-gray-800" 
                />
                {budget.percentUsed >= 90 && (
                  <Alert variant="destructive" className="bg-red-900/20 border border-red-800">
                    <AlertTitle className="text-red-400">Budget Alert</AlertTitle>
                    <AlertDescription className="text-gray-300">
                      You&apos;ve used {budget.percentUsed.toFixed(1)}% of your {budget.category} budget
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}