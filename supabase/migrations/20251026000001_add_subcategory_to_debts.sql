-- Add subcategory_id column to debts table
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_debts_subcategory_id ON public.debts(subcategory_id);