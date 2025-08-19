-- Fix cards table structure to match the form requirements
-- Add missing fields if they don't exist

-- Add bank field if it doesn't exist
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS bank TEXT;

-- Add expiry_date field if it doesn't exist (it's in schema but might be missing)
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS expiry_date TEXT;

-- Ensure all required fields have proper defaults
ALTER TABLE public.cards ALTER COLUMN credit_limit SET DEFAULT 0;
ALTER TABLE public.cards ALTER COLUMN used_amount SET DEFAULT 0;
ALTER TABLE public.cards ALTER COLUMN color SET DEFAULT '#3B82F6';
ALTER TABLE public.cards ALTER COLUMN closing_day SET DEFAULT 15;
ALTER TABLE public.cards ALTER COLUMN due_day SET DEFAULT 22;

-- Update existing records to have default values where NULL
UPDATE public.cards SET bank = 'Banco não especificado' WHERE bank IS NULL;
UPDATE public.cards SET color = '#3B82F6' WHERE color IS NULL;
UPDATE public.cards SET closing_day = 15 WHERE closing_day IS NULL;
UPDATE public.cards SET due_day = 22 WHERE due_day IS NULL;

-- Make bank field required for future inserts
ALTER TABLE public.cards ALTER COLUMN bank SET NOT NULL;

-- Add constraints to ensure data integrity
ALTER TABLE public.cards ADD CONSTRAINT IF NOT EXISTS check_credit_limit_positive 
  CHECK (credit_limit >= 0);

ALTER TABLE public.cards ADD CONSTRAINT IF NOT EXISTS check_used_amount_positive 
  CHECK (used_amount >= 0);

ALTER TABLE public.cards ADD CONSTRAINT IF NOT EXISTS check_closing_day_range 
  CHECK (closing_day >= 1 AND closing_day <= 31);

ALTER TABLE public.cards ADD CONSTRAINT IF NOT EXISTS check_due_day_range 
  CHECK (due_day >= 1 AND due_day <= 31);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_type ON public.cards(type);
