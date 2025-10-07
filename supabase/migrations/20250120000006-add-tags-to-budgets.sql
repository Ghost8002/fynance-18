-- Add tags support to budgets table
ALTER TABLE public.budgets 
ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on tags queries
CREATE INDEX idx_budgets_tags ON public.budgets USING GIN (tags);

-- Add comment to document the new column
COMMENT ON COLUMN public.budgets.tags IS 'Array of tag IDs associated with this budget';
