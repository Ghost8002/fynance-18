-- Add color column to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- Add constraint to ensure color is a valid hex color
ALTER TABLE public.accounts 
DROP CONSTRAINT IF EXISTS accounts_color_format;

ALTER TABLE public.accounts 
ADD CONSTRAINT accounts_color_format 
CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');

-- Add comment for the new column
COMMENT ON COLUMN public.accounts.color IS 'Account color in hex format (e.g., #FF0000)';
