/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TransactionType, TransactionCategory } from '@/types/supabase'
import { Trash2} from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'

interface RecurringTransaction {
  id: string
  type: TransactionType
  category: TransactionCategory
  amount: number
  description: string
  frequency: 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
}

const FREQUENCIES = ['weekly', 'monthly', 'yearly'] as const
const CATEGORIES: Record<TransactionType, TransactionCategory[]> = {
  income: ['salary', 'investment', 'freelance', 'other_income'],
  expense: ['housing', 'transportation', 'food', 'utilities', 'healthcare', 'entertainment', 'shopping', 'other_expense']
}

export default function RecurringTransactions() {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [type, setType] = useState<TransactionType>('expense')
  const [category, setCategory] = useState<TransactionCategory>('food')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')

  const fetchRecurringTransactions = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('start_date', { ascending: false })

      if (error) throw error
      setTransactions(data)
    } catch (error) {
      setError((error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('recurring_transactions').insert({
        user_id: user.id,
        type,
        category,
        amount: Number(amount),
        description,
        frequency,
        start_date: startDate,
        end_date: endDate || null
      })

      if (error) throw error
      setAmount('')
      setDescription('')
      setEndDate('')
      fetchRecurringTransactions()
    } catch (error) {
      setError((error as any).message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring transaction?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRecurringTransactions()
    } catch (error) {
      console.error('Error deleting recurring transaction:', error)
    }
  }

  useEffect(() => {
    fetchRecurringTransactions()
  }, [])

  return (
    <div className="space-y-8">
      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Add Recurring Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as TransactionType)
                  setCategory(CATEGORIES[e.target.value as TransactionType][0])
                }}
                className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-gray-100"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-gray-100"
              >
                {CATEGORIES[type].map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-900">
                    {cat.replace('_', ' ').charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400">$</span>
              </div>
              <Input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 bg-gray-900/50 border-gray-700 text-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-gray-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as typeof FREQUENCIES[number])}
                className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-gray-100"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq} className="bg-gray-900">
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <Input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date (Optional)</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-gray-100"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white hover:opacity-90">
            Add Recurring Transaction
          </Button>
        </form>
      </Card>

      <Card className="bg-black/40 backdrop-blur-lg border border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Recurring Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-800">
            <thead className="bg-gray-900/50">
              <tr>
                {["Type", "Category", "Amount", "Frequency", "Start Date", "End Date", "Actions"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="bg-black/20">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {transaction.category.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {transaction.frequency.charAt(0).toUpperCase() + transaction.frequency.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(transaction.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {transaction.end_date ? new Date(transaction.end_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}