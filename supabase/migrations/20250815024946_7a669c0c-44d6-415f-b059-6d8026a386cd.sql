-- Add fields for limited recurrence to receivable_payments table
ALTER TABLE public.receivable_payments ADD COLUMN IF NOT EXISTS max_occurrences INTEGER;
ALTER TABLE public.receivable_payments ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 1;
ALTER TABLE public.receivable_payments ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Add fields for limited recurrence to debts table  
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS max_occurrences INTEGER;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 1;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Add check constraint to ensure either max_occurrences or recurrence_end_date is set for recurring items
ALTER TABLE public.receivable_payments ADD CONSTRAINT check_recurrence_limit 
  CHECK (
    NOT is_recurring OR 
    (is_recurring AND (max_occurrences IS NOT NULL OR recurrence_end_date IS NOT NULL))
  );

ALTER TABLE public.debts ADD CONSTRAINT check_recurrence_limit 
  CHECK (
    NOT is_recurring OR 
    (is_recurring AND (max_occurrences IS NOT NULL OR recurrence_end_date IS NOT NULL))
  );

-- Update existing recurring items to have unlimited by default
UPDATE public.receivable_payments 
SET current_count = 1 
WHERE is_recurring = true AND current_count IS NULL;

UPDATE public.debts 
SET current_count = 1 
WHERE is_recurring = true AND current_count IS NULL;