-- Add tags support to goals table
ALTER TABLE public.goals 
ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on tags queries
CREATE INDEX idx_goals_tags ON public.goals USING GIN (tags);

-- Add comment to document the new column
COMMENT ON COLUMN public.goals.tags IS 'Array of tag IDs associated with this goal';
