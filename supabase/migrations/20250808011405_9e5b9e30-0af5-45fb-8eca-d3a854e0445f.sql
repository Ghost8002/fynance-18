-- Add missing columns to receivable_payments table
ALTER TABLE public.receivable_payments 
ADD COLUMN IF NOT EXISTS account_id uuid,
ADD COLUMN IF NOT EXISTS category_id uuid,
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type text;