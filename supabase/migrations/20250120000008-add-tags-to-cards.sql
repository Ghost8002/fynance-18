-- Add tags support to cards table
ALTER TABLE public.cards 
ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on tags queries
CREATE INDEX idx_cards_tags ON public.cards USING GIN (tags);

-- Add comment to document the new column
COMMENT ON COLUMN public.cards.tags IS 'Array of tag IDs associated with this card';
