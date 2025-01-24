export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TransactionType = 'income' | 'expense'

export type TransactionCategory =
  | 'salary'
  | 'investment'
  | 'freelance'
  | 'other_income'
  | 'housing'
  | 'transportation'
  | 'food'
  | 'utilities'
  | 'healthcare'
  | 'entertainment'
  | 'shopping'
  | 'other_expense'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: TransactionCategory
          amount: number
          month: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: TransactionCategory
          amount: number
          month: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: TransactionCategory
          amount?: number
          month?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: TransactionType
          category: TransactionCategory
          amount: number
          description: string | null
          receipt_url: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: TransactionType
          category: TransactionCategory
          amount: number
          description?: string | null
          receipt_url?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: TransactionType
          category?: TransactionCategory
          amount?: number
          description?: string | null
          receipt_url?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      transaction_type: TransactionType
      transaction_category: TransactionCategory
    }
  }
}