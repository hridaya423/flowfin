'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import TransactionsList from '@/components/TransactionsList'
import RecurringTransactions from '@/components/RecurringTransactions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import TransactionForm from '@/components/TransactionsForm'
import BudgetManager from '@/components/BudgetManager'
import SavingsGoals from '@/components/SavingGoals'

export default function TransactionsPage() {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false)
  const [key, setKey] = useState(0)

  const handleTransactionSuccess = () => {
    setKey(prev => prev + 1)
    setIsTransactionFormOpen(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
          Transactions
        </h1>
        <Dialog open={isTransactionFormOpen} onOpenChange={setIsTransactionFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-200">Add New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={handleTransactionSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-800">Transactions</TabsTrigger>
          <TabsTrigger value="recurring" className="data-[state=active]:bg-gray-800">Recurring</TabsTrigger>
          <TabsTrigger value="budgets" className="data-[state=active]:bg-gray-800">Budgets</TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-gray-800">Savings Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <TransactionsList key={key} />
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringTransactions />
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>

        <TabsContent value="goals">
          <SavingsGoals />
        </TabsContent>
      </Tabs>
    </div>
  )
}