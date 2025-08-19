export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
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
          type: string;
          bank?: string | null;
          balance?: number;
          account_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          bank?: string | null;
          balance?: number;
          account_number?: string | null;
          created_at?: string;
          updated_at?: string;
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
      card_installments: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          category_id: string | null;
          description: string;
          total_amount: number;
          installments_count: number;
          first_installment_date: string;
          notes: string | null;
          tags: Array<{id: string; name: string; color: string}> | null;
          status: 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          category_id?: string | null;
          description: string;
          total_amount: number;
          installments_count: number;
          first_installment_date: string;
          notes?: string | null;
          tags?: Array<{id: string; name: string; color: string}> | null;
          status?: 'active' | 'completed' | 'cancelled';
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          category_id?: string | null;
          description?: string;
          total_amount?: number;
          installments_count?: number;
          first_installment_date?: string;
          notes?: string | null;
          tags?: Array<{id: string; name: string; color: string}> | null;
          status?: 'active' | 'completed' | 'cancelled';
        };
      };
      card_installment_items: {
        Row: {
          id: string;
          installment_id: string;
          installment_number: number;
          amount: number;
          due_date: string;
          status: 'pending' | 'paid' | 'overdue';
          paid_date: string | null;
          account_id: string | null;
          transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          installment_id: string;
          installment_number: number;
          amount: number;
          due_date: string;
          status?: 'pending' | 'paid' | 'overdue';
          paid_date?: string | null;
          account_id?: string | null;
          transaction_id?: string | null;
        };
        Update: {
          id?: string;
          installment_id?: string;
          installment_number?: number;
          amount?: number;
          due_date?: string;
          status?: 'pending' | 'paid' | 'overdue';
          paid_date?: string | null;
          account_id?: string | null;
          transaction_id?: string | null;
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
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          color?: string;
          created_at?: string;
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
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          limit_amount: number;
          spent_amount: number;
          period: string;
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
          period?: string;
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          limit_amount?: number;
          spent_amount?: number;
          period?: string;
          start_date?: string;
          end_date?: string;
          created_at?: string;
          updated_at?: string;
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
          status: string;
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
          status?: string;
          created_at?: string;
          updated_at?: string;
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
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          due_date: string;
          status: string;
          notes: string | null;
          account_id: string | null;
          category_id: string | null;
          is_recurring: boolean;
          recurrence_type: string | null;
          paid_date: string | null;
          card_id: string | null;
          is_card_bill: boolean;
          bill_month: number | null;
          bill_year: number | null;
          installment_id: string | null;
          installment_number: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          amount: number;
          due_date: string;
          status?: string;
          notes?: string | null;
          account_id?: string | null;
          category_id?: string | null;
          is_recurring?: boolean;
          recurrence_type?: string | null;
          paid_date?: string | null;
          card_id?: string | null;
          is_card_bill?: boolean;
          bill_month?: number | null;
          bill_year?: number | null;
          installment_id?: string | null;
          installment_number?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          due_date?: string;
          status?: string;
          notes?: string | null;
          account_id?: string | null;
          category_id?: string | null;
          is_recurring?: boolean;
          recurrence_type?: string | null;
          paid_date?: string | null;
          card_id?: string | null;
          is_card_bill?: boolean;
          bill_month?: number | null;
          bill_year?: number | null;
          installment_id?: string | null;
          installment_number?: number | null;
          created_at?: string;
          updated_at?: string;
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
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
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
};
