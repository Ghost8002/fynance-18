-- Add installments_count column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN installments_count INTEGER DEFAULT 1 NOT NULL;

-- Add installment_number column to track which installment this is (1 of 3, 2 of 3, etc.)
ALTER TABLE public.transactions 
ADD COLUMN installment_number INTEGER DEFAULT 1 NOT NULL;

-- Add parent_transaction_id to link installments to the original purchase
ALTER TABLE public.transactions 
ADD COLUMN parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Create index for better performance on installment queries
CREATE INDEX idx_transactions_installments ON public.transactions(parent_transaction_id, installment_number);

-- Add comments for clarity
COMMENT ON COLUMN public.transactions.installments_count IS 'Total number of installments for this purchase (1 for single payment)';
COMMENT ON COLUMN public.transactions.installment_number IS 'Current installment number (1, 2, 3, etc.)';
COMMENT ON COLUMN public.transactions.parent_transaction_id IS 'Links to the original transaction for installment purchases';