-- Create debt_tags junction table
CREATE TABLE public.debt_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(debt_id, tag_id)
);

-- Add indexes for better performance
CREATE INDEX idx_debt_tags_debt_id ON public.debt_tags(debt_id);
CREATE INDEX idx_debt_tags_tag_id ON public.debt_tags(tag_id);

-- Enable Row Level Security
ALTER TABLE public.debt_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debt_tags table
CREATE POLICY "Users can view their own debt tags"
  ON public.debt_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.debts d
      WHERE d.id = debt_tags.debt_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create debt tags for their debts"
  ON public.debt_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.debts d
      WHERE d.id = debt_tags.debt_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own debt tags"
  ON public.debt_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.debts d
      WHERE d.id = debt_tags.debt_id
      AND d.user_id = auth.uid()
    )
  );