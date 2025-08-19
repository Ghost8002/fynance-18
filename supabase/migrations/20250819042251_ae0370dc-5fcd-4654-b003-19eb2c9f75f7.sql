-- Add bank column to cards table
ALTER TABLE public.cards ADD COLUMN bank TEXT;

-- Update existing cards with a default bank value
UPDATE public.cards SET bank = 'Não informado' WHERE bank IS NULL;

-- Make bank column not nullable after setting default values
ALTER TABLE public.cards ALTER COLUMN bank SET NOT NULL;