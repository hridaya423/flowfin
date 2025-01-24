/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import DateRangePicker from '@/components/DateRangePicker'
import { Pencil, Trash2, X, Check, FileText, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from './ui/button'
type Transaction = Database['public']['Tables']['transactions']['Row']
export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState(endOfMonth(new Date()))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedDescription, setEditedDescription] = useState('')
  const fetchTransactions = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data)
    } catch (error) {
      setError((error as any).message)
    } finally {
      setLoading(false)
    }
  }
  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditedDescription(transaction.description || '')
  }
  const handleSaveEdit = async (transactionId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .update({ description: editedDescription })
        .eq('id', transactionId)

      if (error) throw error
      
      setEditingId(null)
      fetchTransactions()
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  }
  const handleDelete = async (transactionId: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error
      
      fetchTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleExport = async () => {
    const supabase = createClient()
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true })
 
    if (error) {
      console.error('Error fetching data:', error)
      return
    }

    const csvContent = [
      ['Date', 'Type', 'Category', 'Amount', 'Description', 'Receipt URL'].join(','),
      ...transactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.amount,
        `"${t.description || ''}"`,
        t.receipt_url || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${format(startDate, 'yyyy-MM')}_${format(endDate, 'yyyy-MM')}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url.toLowerCase())
  }

  const isPDF = (url: string) => {
    return /\.pdf$/.test(url.toLowerCase())
  }

  useEffect(() => {
    fetchTransactions()
  }, [startDate, endDate])

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start)
          setEndDate(end)
        }}
      />
      <Button 
        onClick={handleExport}
        className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white hover:opacity-90"
      >
        Export CSV
      </Button>
    </div>

    {loading ? (
      <div className="text-center py-8 text-gray-400">Loading...</div>
    ) : error ? (
      <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-lg">
        {error}
      </div>
    ) : (
      <div className="bg-black/40 backdrop-blur-lg border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-900/50">
              <tr>
                {["Date", "Type", "Category", "Description", "Amount", "Receipt", "Actions"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No transactions found for this period
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="bg-black/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.category.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingId === transaction.id ? (
                        <input
                          type="text"
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-1 text-gray-100 w-full"
                        />
                      ) : (
                        transaction.description
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.receipt_url ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border border-gray-800 max-w-4xl">
                            <DialogHeader>
                              <DialogTitle className="text-gray-100">Receipt</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Transaction from {new Date(transaction.date).toLocaleDateString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              {isImage(transaction.receipt_url) ? (
                                <img 
                                  src={transaction.receipt_url} 
                                  alt="Receipt" 
                                  className="max-w-full h-auto"
                                />
                              ) : isPDF(transaction.receipt_url) ? (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                  <FileText className="h-16 w-16 text-gray-500" />
                                  <a
                                    href={transaction.receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-400 hover:text-blue-300"
                                  >
                                    Open PDF <ExternalLink className="h-4 w-4 ml-1" />
                                  </a>
                                </div>
                              ) : (
                                <div className="text-gray-400">Unsupported file type</div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-gray-500">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingId === transaction.id ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveEdit(transaction.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
  )
}