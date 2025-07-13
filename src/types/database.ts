
export interface Database {
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
        };
        Update: {
          id?: string;
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
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          color?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'income' | 'expense';
          color?: string;
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
