export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          balance: number
          bank: string | null
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number
          bank?: string | null
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number
          bank?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_history: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          message: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          message: string
          tokens_used?: number
          user_id: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          message?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: []
      }
      asset_valuations: {
        Row: {
          asset_id: string
          created_at: string | null
          id: string
          notes: string | null
          user_id: string
          valuation_date: string
          value: number
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
          valuation_date: string
          value: number
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
          valuation_date?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_valuations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          category: string | null
          condition: string | null
          created_at: string | null
          current_value: number
          description: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          condition?: string | null
          created_at?: string | null
          current_value: number
          description?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          condition?: string | null
          created_at?: string | null
          current_value?: number
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string
          created_at: string
          end_date: string
          id: string
          limit_amount: number
          period: string
          spent_amount: number
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          end_date: string
          id?: string
          limit_amount: number
          period?: string
          spent_amount?: number
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          end_date?: string
          id?: string
          limit_amount?: number
          period?: string
          spent_amount?: number
          start_date?: string
          updated_at?: string
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
      card_bills: {
        Row: {
          bill_month: number
          bill_year: number
          card_id: string
          closing_date: string
          created_at: string | null
          due_date: string
          id: string
          paid_amount: number
          remaining_amount: number
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bill_month: number
          bill_year: number
          card_id: string
          closing_date: string
          created_at?: string | null
          due_date: string
          id?: string
          paid_amount?: number
          remaining_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bill_month?: number
          bill_year?: number
          card_id?: string
          closing_date?: string
          created_at?: string | null
          due_date?: string
          id?: string
          paid_amount?: number
          remaining_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string | null
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
      card_installment_items: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_id: string
          installment_number: number
          paid_date: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_id: string
          installment_number: number
          paid_date?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_id?: string
          installment_number?: number
          paid_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_installment_items_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "card_installments"
            referencedColumns: ["id"]
          },
        ]
      }
      card_installments: {
        Row: {
          card_id: string
          created_at: string
          description: string
          id: string
          installments_count: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          description: string
          id?: string
          installments_count: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          description?: string
          id?: string
          installments_count?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      card_limit_history: {
        Row: {
          amount: number
          card_id: string
          created_at: string | null
          description: string
          id: string
          movement_type: string
          new_used_amount: number
          previous_used_amount: number
          user_id: string
        }
        Insert: {
          amount: number
          card_id: string
          created_at?: string | null
          description: string
          id?: string
          movement_type: string
          new_used_amount: number
          previous_used_amount: number
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          created_at?: string | null
          description?: string
          id?: string
          movement_type?: string
          new_used_amount?: number
          previous_used_amount?: number
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
        ]
      }
      cards: {
        Row: {
          bank: string
          closing_day: number
          color: string
          created_at: string
          credit_limit: number
          due_day: number
          expiry_date: string | null
          id: string
          last_four_digits: string
          name: string
          type: string
          updated_at: string
          used_amount: number
          user_id: string
        }
        Insert: {
          bank: string
          closing_day?: number
          color?: string
          created_at?: string
          credit_limit?: number
          due_day?: number
          expiry_date?: string | null
          id?: string
          last_four_digits: string
          name: string
          type: string
          updated_at?: string
          used_amount?: number
          user_id: string
        }
        Update: {
          bank?: string
          closing_day?: number
          color?: string
          created_at?: string
          credit_limit?: number
          due_day?: number
          expiry_date?: string | null
          id?: string
          last_four_digits?: string
          name?: string
          type?: string
          updated_at?: string
          used_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          sort_order: number | null
          type: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          type: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
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
          category_id: string | null
          created_at: string | null
          current_count: number | null
          description: string
          due_date: string
          id: string
          is_recurring: boolean | null
          max_occurrences: number | null
          notes: string | null
          paid_date: string | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          current_count?: number | null
          description: string
          due_date: string
          id?: string
          is_recurring?: boolean | null
          max_occurrences?: number | null
          notes?: string | null
          paid_date?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          current_count?: number | null
          description?: string
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          max_occurrences?: number | null
          notes?: string | null
          paid_date?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          description: string | null
          id: string
          status: string
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          id?: string
          status?: string
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          id?: string
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receivable_payments: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          current_count: number | null
          description: string
          due_date: string
          id: string
          is_recurring: boolean | null
          max_occurrences: number | null
          notes: string | null
          received_date: string | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          current_count?: number | null
          description: string
          due_date: string
          id?: string
          is_recurring?: boolean | null
          max_occurrences?: number | null
          notes?: string | null
          received_date?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          current_count?: number | null
          description?: string
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          max_occurrences?: number | null
          notes?: string | null
          received_date?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          installment_number: number | null
          installments_count: number | null
          notes: string | null
          parent_transaction_id: string | null
          tags: Json | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          installment_number?: number | null
          installments_count?: number | null
          notes?: string | null
          parent_transaction_id?: string | null
          tags?: Json | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          installment_number?: number | null
          installments_count?: number | null
          notes?: string | null
          parent_transaction_id?: string | null
          tags?: Json | null
          type?: string
          updated_at?: string
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
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
        Args: { p_card_id: string; p_new_limit: number; p_reason: string }
        Returns: Json
      }
      create_installment_purchase: {
        Args: {
          p_card_id: string
          p_category_id: string
          p_description: string
          p_first_installment_date: string
          p_installments_count: number
          p_notes?: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: Json
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
        Returns: Json
      }
      mark_debt_as_paid_with_rollback: {
        Args: { p_account_id?: string; p_debt_id: string }
        Returns: Json
      }
      mark_receivable_as_received_with_rollback: {
        Args: { p_account_id?: string; p_receivable_id: string }
        Returns: Json
      }
      process_bill_payment: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_bill_id: string
          p_description?: string
        }
        Returns: Json
      }
      process_card_payment: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_card_id: string
          p_description?: string
        }
        Returns: Json
      }
      process_card_payment_secure: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_card_id: string
          p_description?: string
        }
        Returns: Json
      }
      process_installment_payment: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_installment_item_id: string
        }
        Returns: Json
      }
      unmark_debt_as_paid_with_rollback: {
        Args: { p_account_id?: string; p_debt_id: string }
        Returns: Json
      }
      unmark_receivable_as_received_with_rollback: {
        Args: { p_account_id?: string; p_receivable_id: string }
        Returns: Json
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
