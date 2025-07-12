
-- Create table for receivable payments
CREATE TABLE public.receivable_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue')),
    received_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own receivable payments" ON public.receivable_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receivable payments" ON public.receivable_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receivable payments" ON public.receivable_payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receivable payments" ON public.receivable_payments
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at_receivable_payments
    BEFORE UPDATE ON public.receivable_payments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to automatically update overdue status
CREATE OR REPLACE FUNCTION update_overdue_receivable_payments()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.receivable_payments 
  SET status = 'overdue' 
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
$$;
