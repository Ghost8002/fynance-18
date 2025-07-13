
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'investment' | 'wallet' | 'other';
          bank: string | null;
          balance: number;
          account_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'investment' | 'wallet' | 'other';
          bank?: string | null;
          balance?: number;
          account_number?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'checking' | 'savings' | 'investment' | 'wallet' | 'other';
          bank?: string | null;
          balance?: number;
          account_number?: string | null;
        };
      };
      ai_chat_history: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          ai_response: string;
          tokens_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          ai_response: string;
          tokens_used?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          ai_response?: string;
          tokens_used?: number;
        };
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          last_four_digits: string;
          expiry_date: string | null;
          credit_limit: number;
          used_amount: number;
          color: string;
          closing_day: number;
          due_day: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          last_four_digits: string;
          expiry_date?: string | null;
          credit_limit: number;
          used_amount?: number;
          color?: string;
          closing_day?: number;
          due_day?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          last_four_digits?: string;
          expiry_date?: string | null;
          credit_limit?: number;
          used_amount?: number;
          color?: string;
          closing_day?: number;
          due_day?: number;
        };
      };
      card_bills: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          bill_month: number;
          bill_year: number;
          due_date: string;
          closing_date: string;
          total_amount: number;
          paid_amount: number;
          remaining_amount: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          bill_month: number;
          bill_year: number;
          due_date: string;
          closing_date: string;
          total_amount?: number;
          paid_amount?: number;
          remaining_amount?: number;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          bill_month?: number;
          bill_year?: number;
          due_date?: string;
          closing_date?: string;
          total_amount?: number;
          paid_amount?: number;
          remaining_amount?: number;
          status?: string;
        };
      };
      card_limit_history: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          movement_type: string;
          amount: number;
          previous_used_amount: number;
          new_used_amount: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          movement_type: string;
          amount: number;
          previous_used_amount: number;
          new_used_amount: number;
          description: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          movement_type?: string;
          amount?: number;
          previous_used_amount?: number;
          new_used_amount?: number;
          description?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          color: string;
          is_default: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          color?: string;
          is_default?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'income' | 'expense';
          color?: string;
          is_default?: boolean;
          sort_order?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          card_id: string | null;
          category_id: string | null;
          type: 'income' | 'expense';
          amount: number;
          description: string;
          date: string;
          notes: string | null;
          tags: Array<{id: string; name: string; color: string}>;
          installments_count: number;
          installment_number: number;
          parent_transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          card_id?: string | null;
          category_id?: string | null;
          type: 'income' | 'expense';
          amount: number;
          description: string;
          date: string;
          notes?: string | null;
          tags?: Array<{id: string; name: string; color: string}>;
          installments_count?: number;
          installment_number?: number;
          parent_transaction_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          card_id?: string | null;
          category_id?: string | null;
          type?: 'income' | 'expense';
          amount?: number;
          description?: string;
          date?: string;
          notes?: string | null;
          tags?: Array<{id: string; name: string; color: string}>;
          installments_count?: number;
          installment_number?: number;
          parent_transaction_id?: string | null;
        };
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          due_date: string;
          status: 'pending' | 'paid' | 'overdue';
          paid_date: string | null;
          notes: string | null;
          account_id: string | null;
          category_id: string | null;
          is_recurring: boolean;
          recurrence_type: 'weekly' | 'monthly' | 'yearly' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          amount: number;
          due_date: string;
          status?: 'pending' | 'paid' | 'overdue';
          paid_date?: string | null;
          notes?: string | null;
          account_id?: string | null;
          category_id?: string | null;
          is_recurring?: boolean;
          recurrence_type?: 'weekly' | 'monthly' | 'yearly' | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          due_date?: string;
          status?: 'pending' | 'paid' | 'overdue';
          paid_date?: string | null;
          notes?: string | null;
          account_id?: string | null;
          category_id?: string | null;
          is_recurring?: boolean;
          recurrence_type?: 'weekly' | 'monthly' | 'yearly' | null;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          limit_amount: number;
          spent_amount: number;
          period: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          limit_amount: number;
          spent_amount?: number;
          period?: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          limit_amount?: number;
          spent_amount?: number;
          period?: 'weekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          category: string | null;
          status: 'active' | 'completed' | 'paused';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_amount: number;
          current_amount?: number;
          deadline?: string | null;
          category?: string | null;
          status?: 'active' | 'completed' | 'paused';
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          target_amount?: number;
          current_amount?: number;
          deadline?: string | null;
          category?: string | null;
          status?: 'active' | 'completed' | 'paused';
        };
      };
      receivable_payments: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          due_date: string;
          status: 'pending' | 'received' | 'overdue';
          received_date: string | null;
          notes: string | null;
          account_id: string | null;
          category_id: string | null;
          is_recurring: boolean;
          recurrence_type: 'weekly' | 'monthly' | 'yearly' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          amount: number;
          due_date: string;
          status?: 'pending' | 'received' | 'overdue';
          received_date?: string | null;
          notes?: string | null;
          account_id?: string | null;
          category_id?: string | null;
          is_recurring?: boolean;
          recurrence_type?: 'weekly' | 'monthly' | 'yearly' | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          due_date?: string;
          status?: 'pending' | 'received' | 'overdue';
          received_date?: string | null;
          notes?: string | null;
          account_id?: string | null;
          category_id?: string | null;
          is_recurring?: boolean;
          recurrence_type?: 'weekly' | 'monthly' | 'yearly' | null;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          is_active?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
