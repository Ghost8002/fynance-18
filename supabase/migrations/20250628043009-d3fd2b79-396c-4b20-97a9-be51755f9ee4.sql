
-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_tags junction table
CREATE TABLE public.transaction_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(transaction_id, tag_id)
);

-- Add indexes for better performance
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_tags_is_active ON public.tags(is_active);
CREATE INDEX idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag_id ON public.transaction_tags(tag_id);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags table
CREATE POLICY "Users can view their own tags"
  ON public.tags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON public.tags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON public.tags
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.tags
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for transaction_tags table
CREATE POLICY "Users can view their own transaction tags"
  ON public.transaction_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_tags.transaction_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transaction tags for their transactions"
  ON public.transaction_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_tags.transaction_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own transaction tags"
  ON public.transaction_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_tags.transaction_id
      AND t.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add tags_enabled setting to user_general_settings table
ALTER TABLE public.user_general_settings 
ADD COLUMN tags_enabled BOOLEAN DEFAULT false;
