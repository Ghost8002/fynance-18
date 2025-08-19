-- Add bank field to cards table
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS bank TEXT;

-- Update existing cards to have a default bank value if they don't have one
UPDATE public.cards SET bank = 'Banco não especificado' WHERE bank IS NULL;

-- Make bank field required for future inserts
ALTER TABLE public.cards ALTER COLUMN bank SET NOT NULL;
