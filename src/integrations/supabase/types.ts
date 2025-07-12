export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          balance: number | null
          bank: string | null
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number | null
          bank?: string | null
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number | null
          bank?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_history: {
        Row: {
          ai_response: string
          created_at: string | null
          id: string
          message: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          ai_response: string
          created_at?: string | null
          id?: string
          message: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          ai_response?: string
          created_at?: string | null
          id?: string
          message?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string
          created_at: string | null
          end_date: string
          id: string
          limit_amount: number
          period: string
          spent_amount: number | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          end_date: string
          id?: string
          limit_amount: number
          period?: string
          spent_amount?: number | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          limit_amount?: number
          period?: string
          spent_amount?: number | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      card_bill_payments: {
        Row: {
          account_id: string | null
          amount: number
          bill_id: string
          created_at: string
          description: string | null
          id: string
          payment_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          bill_id: string
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          bill_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_bill_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "card_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      card_bills: {
        Row: {
          bill_month: number
          bill_year: number
          card_id: string
          closing_date: string
          created_at: string
          due_date: string
          id: string
          paid_amount: number
          remaining_amount: number
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bill_month: number
          bill_year: number
          card_id: string
          closing_date: string
          created_at?: string
          due_date: string
          id?: string
          paid_amount?: number
          remaining_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bill_month?: number
          bill_year?: number
          card_id?: string
          closing_date?: string
          created_at?: string
          due_date?: string
          id?: string
          paid_amount?: number
          remaining_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_bills_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_limit_adjustments: {
        Row: {
          adjustment_amount: number
          card_id: string
          created_at: string
          id: string
          new_limit: number
          previous_limit: number
          reason: string | null
          user_id: string
        }
        Insert: {
          adjustment_amount: number
          card_id: string
          created_at?: string
          id?: string
          new_limit: number
          previous_limit: number
          reason?: string | null
          user_id: string
        }
        Update: {
          adjustment_amount?: number
          card_id?: string
          created_at?: string
          id?: string
          new_limit?: number
          previous_limit?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_limit_adjustments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_limit_history: {
        Row: {
          amount: number
          card_id: string
          created_at: string
          description: string
          id: string
          movement_type: string
          new_used_amount: number
          previous_used_amount: number
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id: string
          created_at?: string
          description: string
          id?: string
          movement_type: string
          new_used_amount?: number
          previous_used_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          created_at?: string
          description?: string
          id?: string
          movement_type?: string
          new_used_amount?: number
          previous_used_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_limit_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_limit_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_limit_movements: {
        Row: {
          amount: number
          card_id: string
          created_at: string
          description: string
          id: string
          movement_type: string
          reference_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id: string
          created_at?: string
          description: string
          id?: string
          movement_type: string
          reference_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          created_at?: string
          description?: string
          id?: string
          movement_type?: string
          reference_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_limit_movements_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_payments: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string
          created_at: string
          description: string | null
          id: string
          payment_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id: string
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          closing_day: number | null
          color: string | null
          created_at: string | null
          credit_limit: number
          due_day: number | null
          expiry_date: string | null
          id: string
          last_four_digits: string
          name: string
          type: string
          updated_at: string | null
          used_amount: number | null
          user_id: string
        }
        Insert: {
          closing_day?: number | null
          color?: string | null
          created_at?: string | null
          credit_limit: number
          due_day?: number | null
          expiry_date?: string | null
          id?: string
          last_four_digits: string
          name: string
          type: string
          updated_at?: string | null
          used_amount?: number | null
          user_id: string
        }
        Update: {
          closing_day?: number | null
          color?: string | null
          created_at?: string | null
          credit_limit?: number
          due_day?: number | null
          expiry_date?: string | null
          id?: string
          last_four_digits?: string
          name?: string
          type?: string
          updated_at?: string | null
          used_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          sort_order: number | null
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          description: string
          due_date: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          paid_date: string | null
          recurrence_type: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          paid_date?: string | null
          recurrence_type?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          paid_date?: string | null
          recurrence_type?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string | null
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          description: string | null
          id: string
          status: string | null
          target_amount: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          status?: string | null
          target_amount: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          status?: string | null
          target_amount?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      receivable_payments: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          description: string
          due_date: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          received_date: string | null
          recurrence_type: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          received_date?: string | null
          recurrence_type?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          received_date?: string | null
          recurrence_type?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivable_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_payments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          installment_number: number
          installments_count: number
          notes: string | null
          parent_transaction_id: string | null
          tags: Json | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          installment_number?: number
          installments_count?: number
          notes?: string | null
          parent_transaction_id?: string | null
          tags?: Json | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          installment_number?: number
          installments_count?: number
          notes?: string | null
          parent_transaction_id?: string | null
          tags?: Json | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string
          device_type: string
          id: string
          ip_address: unknown | null
          is_current: boolean | null
          last_active: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name: string
          device_type: string
          id?: string
          ip_address?: unknown | null
          is_current?: boolean | null
          last_active?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string
          device_type?: string
          id?: string
          ip_address?: unknown | null
          is_current?: boolean | null
          last_active?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_general_settings: {
        Row: {
          categories_expanded: boolean | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          id: string
          language: string | null
          month_start_day: string | null
          tags_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categories_expanded?: boolean | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          id?: string
          language?: string | null
          month_start_day?: string | null
          tags_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categories_expanded?: boolean | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          id?: string
          language?: string | null
          month_start_day?: string | null
          tags_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          bill_reminders: boolean | null
          budget_alerts: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          goal_achieved: boolean | null
          id: string
          monthly_report: boolean | null
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string
          weekly_report: boolean | null
        }
        Insert: {
          bill_reminders?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          goal_achieved?: boolean | null
          id?: string
          monthly_report?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_report?: boolean | null
        }
        Update: {
          bill_reminders?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          goal_achieved?: boolean | null
          id?: string
          monthly_report?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_report?: boolean | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          created_at: string | null
          id: string
          security_alerts: boolean | null
          session_timeout: boolean | null
          two_factor_auth: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          security_alerts?: boolean | null
          session_timeout?: boolean | null
          two_factor_auth?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          security_alerts?: boolean | null
          session_timeout?: boolean | null
          two_factor_auth?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_card_limit: {
        Args: { p_card_id: string; p_new_limit: number; p_reason?: string }
        Returns: string
      }
      create_next_recurring_debt: {
        Args: { debt_id: string }
        Returns: string
      }
      create_next_recurring_payment: {
        Args: { payment_id: string }
        Returns: string
      }
      generate_monthly_bill: {
        Args: { p_card_id: string; p_month: number; p_year: number }
        Returns: string
      }
      process_bill_payment: {
        Args: {
          p_bill_id: string
          p_amount: number
          p_account_id?: string
          p_description?: string
        }
        Returns: string
      }
      process_card_payment: {
        Args: {
          p_card_id: string
          p_amount: number
          p_account_id?: string
          p_description?: string
        }
        Returns: string
      }
      recalculate_card_used_amount: {
        Args: { card_id_param: string }
        Returns: number
      }
      update_overdue_bills: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_overdue_debts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_overdue_receivable_payments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
