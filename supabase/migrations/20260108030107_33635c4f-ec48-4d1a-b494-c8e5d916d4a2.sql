-- Add support for transfer transactions
-- Add columns to track transfer source and destination accounts
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS transfer_to_account_id UUID REFERENCES public.accounts(id),
ADD COLUMN IF NOT EXISTS transfer_from_account_id UUID REFERENCES public.accounts(id);

-- Add index for faster transfer queries
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_to ON public.transactions(transfer_to_account_id) WHERE transfer_to_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_from ON public.transactions(transfer_from_account_id) WHERE transfer_from_account_id IS NOT NULL;