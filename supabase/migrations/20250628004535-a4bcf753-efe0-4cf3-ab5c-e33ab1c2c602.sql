
-- Add category_id column to receivable_payments table
ALTER TABLE public.receivable_payments 
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add index for better performance on category lookups
CREATE INDEX idx_receivable_payments_category_id ON public.receivable_payments(category_id);
