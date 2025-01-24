/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO } from 'date-fns'

const goalTypes = [
  { value: 'house', label: 'House' },
  { value: 'car', label: 'Car' },
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'education', label: 'Education' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'other', label: 'Other' }
]

export default function SavingsGoals() {
  const [goals, setGoals] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    type: 'house',
    name: '',
    target_amount: '',
    current_amount: '0',
    target_date: ''
  })

  const fetchGoals = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false })
    setGoals(data || [])
  }

  useEffect(() => {
    fetchGoals()
  }, [])
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const supabase = createClient()
      
    const goalData = {
      ...formData,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount)
    }
  
    if (editingGoal) {
      await supabase
        .from('savings_goals')
        .update(goalData)
        .eq('id', editingGoal.id)
    } else {
      await supabase
        .from('savings_goals')
        .insert([goalData])
    }
    setIsFormOpen(false)
    setEditingGoal(null)
    setFormData({
      type: 'house',
      name: '',
      target_amount: '',
      current_amount: '0',
      target_date: ''
    })
    fetchGoals()
  }
  const handleEdit = (goal: any) => {
    setEditingGoal(goal)
    setFormData({
      type: goal.type,
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date
    })
    setIsFormOpen(true)
  }
  const handleDelete = async (id: any) => {
    const supabase = createClient()
    await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id)
    fetchGoals()
  }
  return (
    <div className="space-y-8">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
        Savings Goals
      </h2>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              {editingGoal ? 'Edit Goal' : 'Add New Goal'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-700 text-gray-200">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {goalTypes.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-gray-200">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Goal name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-gray-900/50 border-gray-700 text-gray-200"
            />

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400">$</span>
              </div>
              <Input
                type="number"
                step="0.01"
                placeholder="Target amount"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="pl-8 bg-gray-900/50 border-gray-700 text-gray-200"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400">$</span>
              </div>
              <Input
                type="number"
                step="0.01"
                placeholder="Current amount"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                className="pl-8 bg-gray-900/50 border-gray-700 text-gray-200"
              />
            </div>

            <Input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="bg-gray-900/50 border-gray-700 text-gray-200"
            />

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white hover:opacity-90"
            >
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {goals.map(goal => {
        const progress = (goal.current_amount / goal.target_amount) * 100
        return (
          <Card key={goal.id} className="bg-black/40 backdrop-blur-lg border border-gray-800 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-200">{goal.name}</h3>
                <p className="text-sm text-gray-400 capitalize">{goal.type}</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEdit(goal)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(goal.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Progress 
              value={progress} 
              className="h-2 mb-4 bg-gray-800" 
            />
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">
                ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
              </span>
              <span className="text-gray-400">
                {goal.target_date && `Target: ${format(parseISO(goal.target_date), 'MMM d, yyyy')}`}
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  </div>
  )
}