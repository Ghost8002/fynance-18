-- Add fields for limited recurrence to receivable_payments table
ALTER TABLE public.receivable_payments ADD COLUMN IF NOT EXISTS max_occurrences INTEGER;
ALTER TABLE public.receivable_payments ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 1;
ALTER TABLE public.receivable_payments ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Add fields for limited recurrence to debts table  
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS max_occurrences INTEGER;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 1;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Update existing recurring items to have unlimited by default (set a high max_occurrences)
UPDATE public.receivable_payments 
SET max_occurrences = 999, current_count = 1 
WHERE is_recurring = true AND max_occurrences IS NULL;

UPDATE public.debts 
SET max_occurrences = 999, current_count = 1 
WHERE is_recurring = true AND max_occurrences IS NULL;