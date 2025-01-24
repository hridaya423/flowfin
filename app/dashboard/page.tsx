/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, format, subMonths, differenceInDays } from 'date-fns'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts'
import DateRangePicker from '@/components/DateRangePicker'
import { Progress } from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { TransactionCategory } from '@/types/supabase'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react'

interface BudgetProgress {
  category: TransactionCategory
  budgeted: number
  spent: number
  remaining: number
  percentUsed: number
}

interface CategoryComparison {
  category: TransactionCategory
  amount: number
  budgeted: number
  percentOfBudget: number
}

interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  type: string
}

export default function DashboardPage() {
  const [startDate, setStartDate] = useState(startOfMonth(subMonths(new Date(), 2)))
  const [endDate, setEndDate] = useState(endOfMonth(new Date()))
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalBudgeted: 0,
    balance: 0
  })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<CategoryComparison[]>([])
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingFunds, setIsAddingFunds] = useState<string | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const fetchData = async () => {
    const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

const [transactionResult, budgetResult, goalsResult] = await Promise.all([
  supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user?.id)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString()),
  supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user?.id)
    .eq('month', format(startOfMonth(new Date()), 'yyyy-MM-dd')),
  supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', user?.id)
])

    const { data: transactions, error } = transactionResult
    const { data: budgets } = budgetResult
    const { data: savingsGoals } = goalsResult

    if (error) {
      console.error('Error fetching data:', error)
      return
    }

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalBudgeted = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0

    setSummary({
      totalIncome: income,
      totalExpenses: expenses,
      totalBudgeted,
      balance: income - expenses
    })

    const monthlyGroups = transactions.reduce((acc, transaction) => {
      const month = format(new Date(transaction.date), 'MMM yyyy')
      if (!acc[month]) {
        acc[month] = { month, income: 0, expenses: 0 }
      }
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount
      } else {
        acc[month].expenses += transaction.amount
      }
      return acc
    }, {})

    setMonthlyData(Object.values(monthlyGroups))

    const categoryGroups: Record<string, CategoryComparison> = {}
    
    budgets?.forEach(budget => {
      categoryGroups[budget.category] = {
        category: budget.category,
        amount: 0,
        budgeted: budget.amount,
        percentOfBudget: 0
      }
    })

    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        if (!categoryGroups[transaction.category]) {
          categoryGroups[transaction.category] = {
            category: transaction.category,
            amount: 0,
            budgeted: 0,
            percentOfBudget: 0
          }
        }
        categoryGroups[transaction.category].amount += transaction.amount
      })

    Object.values(categoryGroups).forEach(category => {
      category.percentOfBudget = category.budgeted ? (category.amount / category.budgeted) * 100 : 0
    })

    setCategoryData(Object.values(categoryGroups))
    
    if (budgets) {
      const progress: BudgetProgress[] = []

      for (const budget of budgets) {
        const spent = transactions
          .filter(t => t.category === budget.category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        progress.push({
          category: budget.category,
          budgeted: budget.amount,
          spent,
          remaining: budget.amount - spent,
          percentUsed: (spent / budget.amount) * 100
        })
      }

      setBudgetProgress(progress)
    }

    setGoals(savingsGoals || [])
    setLoading(false)
  }
  const handleQuickContribution = (goal: any) => {
    setIsAddingFunds(goal.id)
    setContributionAmount('')
  }
  const handleContribution = async (e: React.FormEvent, goal: any) => {
    e.preventDefault()
    const supabase = createClient()
    const amount = parseFloat(contributionAmount)

    await supabase
      .from('savings_goals')
      .update({
        current_amount: goal.current_amount + amount
      })
      .eq('id', goal.id)

    await supabase
      .from('transactions')
      .insert([{
        user_id: (await supabase.auth.getUser()).data.user?.id,
        type: 'expense',
        category: 'savings',
        amount: amount,
        description: `Contribution to ${goal.name}`,
        date: new Date().toISOString().split('T')[0]
      }])

    setIsAddingFunds(null)
    fetchData()
  }

  const calculateDaysRemaining = (targetDate: string) => {
    return differenceInDays(new Date(targetDate), new Date())
  }

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  const getOptimalGridLayout = () => {
  const goalsLayout = goals.length === 0 ? '' : 
                     goals.length === 1 ? 'lg:col-span-2' : 
                     'grid grid-cols-1 md:grid-cols-2 gap-6'

  const budgetsLayout = budgetProgress.length === 0 ? '' :
                       budgetProgress.length === 1 ? 'lg:col-span-2' : 
                       'grid grid-cols-1 md:grid-cols-2 gap-6'

  return {
    goalsClass: `${goals.length > 0 ? 'lg:col-span-2' : ''}`,
    goalsGridClass: goalsLayout,
    budgetsClass: `${budgetProgress.length > 0 ? 'lg:col-span-2' : ''}`,
    budgetsGridClass: budgetsLayout
  }
}

  const layout = getOptimalGridLayout()

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-black to-gray-900 p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
          Financial Overview
        </h1>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start)
            setEndDate(end)
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { title: 'Total Income', amount: summary.totalIncome, color: 'from-emerald-400 to-teal-500', icon: <TrendingUp className="w-6 h-6" /> },
          { title: 'Total Expenses', amount: summary.totalExpenses, color: 'from-rose-400 to-red-500', icon: <TrendingDown className="w-6 h-6" /> },
          { title: 'Total Budgeted', amount: summary.totalBudgeted, color: 'from-blue-400 to-indigo-500', icon: <DollarSign className="w-6 h-6" /> },
          { title: 'Balance', amount: summary.balance, color: summary.balance >= 0 ? 'from-emerald-400 to-teal-500' : 'from-rose-400 to-red-500', icon: <PiggyBank className="w-6 h-6" /> }
        ].map((item, index) => (
          <Card key={item.title} className="bg-black/20 backdrop-blur-xl border border-gray-800/50 p-6 hover:bg-black/30 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
              </div>
              <h2 className="text-lg font-medium text-gray-300">{item.title}</h2>
            </div>
            <p className={`text-3xl font-bold mt-4 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
              ${Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card className="bg-black/20 backdrop-blur-xl border border-gray-800/50 p-8">
          <h2 className="text-2xl font-bold text-gray-200 mb-8">Income vs Expenses</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                  tickFormatter={value => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    borderRadius: '8px',
                  }}
                  formatter={value => `$${value.toLocaleString()}`}
                />
                  <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#incomeGradient)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#expenseGradient)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-black/20 backdrop-blur-xl border border-gray-800/50 p-8">
          <h2 className="text-2xl font-bold text-gray-200 mb-8">Category Analysis</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F87171" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="budgetedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="category"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                  tickFormatter={value => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    borderRadius: '8px',
                  }}
                  formatter={value => `$${value.toLocaleString()}`}
                />
                  <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                <Bar
                  dataKey="amount"
                  name="Spent"
                  fill="url(#spentGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="budgeted"
                  name="Budgeted"
                  fill="url(#budgetedGradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {goals.length > 0 && (
  <Card className={`bg-black/20 backdrop-blur-xl border border-gray-800/50 p-8 ${layout.goalsClass}`}>
    <h2 className="text-2xl font-bold text-gray-200 mb-8">Savings Goals</h2>
    <div className={layout.goalsGridClass}>
      {goals.map(goal => {
        const progress = (goal.current_amount / goal.target_amount) * 100
        const daysRemaining = goal.target_date ? calculateDaysRemaining(goal.target_date) : null
        return (
          <Card key={goal.id} className="bg-gray-900/30 border border-gray-800/50 p-6 hover:bg-gray-900/40 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-medium text-gray-200">{goal.name}</h3>
                <p className="text-sm text-gray-400 capitalize mt-1">{goal.type}</p>
              </div>
              <Button
                onClick={() => handleQuickContribution(goal)}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-all duration-300"
                size="sm"
              >
                Add Funds
              </Button>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">Progress</span>
                <span className="text-sm font-medium text-gray-300">
                  {progress.toFixed(1)}%
                </span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-800" />
              
              <div className="flex justify-between items-center mt-4 text-sm text-gray-300">
                <span className="font-medium">
                  ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                </span>
                {daysRemaining !== null && daysRemaining > 0 && (
                  <span className="text-gray-500">
                    {daysRemaining} days left
                  </span>
                )}
              </div>
            </div>

            {progress < 50 && daysRemaining !== null && daysRemaining < 90 && (
              <Alert variant="destructive" className="mt-4 bg-red-900/20 border border-red-900">
                <AlertTitle>Goal Alert</AlertTitle>
                <AlertDescription className="text-gray-300">
                  Consider increasing your monthly contribution to reach your goal.
                </AlertDescription>
              </Alert>
            )}
          </Card>
        )
      })}
    </div>
  </Card>
)}
{budgetProgress.length > 0 && (
 <Card className={`bg-black/20 backdrop-blur-xl border border-gray-800/50 p-8 ${layout.budgetsClass}`}>
   <h2 className="text-2xl font-bold text-gray-200 mb-8">Budget Progress</h2>
   <div className={layout.budgetsGridClass}>
     {budgetProgress.map((budget) => (
       <Card key={budget.category} className="bg-gray-900/30 border border-gray-800/50 p-6 hover:bg-gray-900/40 transition-all duration-300">
         <div className="flex justify-between items-center mb-4">
           <span className="text-lg font-medium text-gray-200 capitalize">
             {budget.category.replace('_', ' ')}
           </span>
           <span className={`text-sm font-medium px-3 py-1 rounded-full ${
             budget.percentUsed >= 90 ? 'bg-red-500/20 text-red-400' :
             budget.percentUsed >= 75 ? 'bg-yellow-500/20 text-yellow-400' :
             'bg-green-500/20 text-green-400'
           }`}>
             {budget.percentUsed.toFixed(1)}% Used
           </span>
         </div>
         
         <div className="mt-4">
           <div className="flex justify-between items-center mb-2">
             <span className="text-sm text-gray-400">
               Spent: ${budget.spent.toLocaleString()}
             </span>
             <span className="text-sm text-gray-400">
               Budget: ${budget.budgeted.toLocaleString()}
             </span>
           </div>
           <Progress 
             value={budget.percentUsed} 
             className={`h-2 mb-2 transition-all duration-300 ${
               budget.percentUsed >= 90 ? 'bg-red-900/20' :
               budget.percentUsed >= 75 ? 'bg-yellow-900/20' :
               'bg-green-900/20'
             }`}
           />
           <div className="flex justify-end">
             <span className="text-sm text-gray-400">
               Remaining: ${budget.remaining.toLocaleString()}
             </span>
           </div>
         </div>

         {budget.percentUsed >= 90 && (
           <Alert variant="destructive" className="mt-4 bg-red-900/20 border border-red-900">
             <AlertTitle className="text-red-400">Budget Alert</AlertTitle>
             <AlertDescription className="text-gray-300">
               You&apos;ve nearly exhausted this budget category.
             </AlertDescription>
           </Alert>
         )}
       </Card>
     ))}
   </div>
 </Card>
)}  
      </div>
      <Dialog open={isAddingFunds !== null} onOpenChange={() => setIsAddingFunds(null)}>
        <DialogContent className="bg-gray-900 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-200">
              Add Funds to {goals.find(g => g.id === isAddingFunds)?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => handleContribution(e, goals.find(g => g.id === isAddingFunds))} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Amount to Add</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter amount..."
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-all duration-300"
            >
              Confirm Contribution
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}