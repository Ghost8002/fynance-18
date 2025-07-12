
-- Add category_id column to debts table
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add index for better performance on category lookups
CREATE INDEX IF NOT EXISTS idx_debts_category_id ON public.debts(category_id);
