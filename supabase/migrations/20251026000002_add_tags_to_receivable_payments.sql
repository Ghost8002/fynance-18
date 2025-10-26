-- Create receivable_payment_tags junction table
CREATE TABLE public.receivable_payment_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receivable_payment_id UUID NOT NULL REFERENCES public.receivable_payments(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(receivable_payment_id, tag_id)
);

-- Add indexes for better performance
CREATE INDEX idx_receivable_payment_tags_receivable_payment_id ON public.receivable_payment_tags(receivable_payment_id);
CREATE INDEX idx_receivable_payment_tags_tag_id ON public.receivable_payment_tags(tag_id);

-- Enable Row Level Security
ALTER TABLE public.receivable_payment_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for receivable_payment_tags table
CREATE POLICY "Users can view their own receivable payment tags"
  ON public.receivable_payment_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.receivable_payments rp
      WHERE rp.id = receivable_payment_tags.receivable_payment_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create receivable payment tags for their receivable payments"
  ON public.receivable_payment_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.receivable_payments rp
      WHERE rp.id = receivable_payment_tags.receivable_payment_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own receivable payment tags"
  ON public.receivable_payment_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.receivable_payments rp
      WHERE rp.id = receivable_payment_tags.receivable_payment_id
      AND rp.user_id = auth.uid()
    )
  );