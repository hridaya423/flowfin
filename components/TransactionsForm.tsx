/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TransactionType, TransactionCategory } from '@/types/supabase'
import { Upload } from 'lucide-react'

const CATEGORIES: Record<TransactionType, TransactionCategory[]> = {
  income: ['salary', 'investment', 'freelance', 'other_income'],
  expense: ['housing', 'transportation', 'food', 'utilities', 'healthcare', 'entertainment', 'shopping', 'other_expense']
}

export default function TransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [type, setType] = useState<TransactionType>('expense')
  const [category, setCategory] = useState<TransactionCategory>('food')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to add transactions')
      }

      let receipt_url = null
      if (receipt) {
        const fileExt = receipt.name.split('.').pop()
        const fileName = `${user.id}/${Math.random()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receipt, {
            upsert: true,
          })

        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)

        receipt_url = publicUrl
      }

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type,
        category,
        amount: Number(amount),
        description,
        date,
        receipt_url
      })

      if (error) throw error
      setAmount('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setReceipt(null)
      setUploadProgress(0)
      
      if (onSuccess) onSuccess()
    } catch (error) {
      setError((error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setReceipt(file)
    }
  }

  return (
<form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
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
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 pl-8 pr-4 py-3 text-gray-100"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Receipt (optional)</label>
        <label className="w-full flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer hover:border-gray-600 bg-gray-900/30">
          <div className="space-y-2 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-400">
              <span>Upload a receipt</span>
              <input
                type="file"
                className="sr-only"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
          </div>
        </label>
        {receipt && (
          <p className="mt-2 text-sm text-gray-400">
            Selected file: {receipt.name}
          </p>
        )}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="h-2 bg-gray-700 rounded-full">
              <div
                className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white py-4 px-6 rounded-lg text-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Saving...' : 'Save Transaction'}
      </button>
    </form>
  )
}