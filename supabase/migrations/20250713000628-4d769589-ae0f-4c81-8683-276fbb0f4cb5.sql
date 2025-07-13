
-- Add missing columns to transactions table for installment functionality
ALTER TABLE public.transactions 
ADD COLUMN installments_count INTEGER DEFAULT 1,
ADD COLUMN installment_number INTEGER DEFAULT 1,
ADD COLUMN parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Create debts table (from the original schema.sql)
CREATE TABLE public.debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    notes TEXT,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')),
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on debts table
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debts
CREATE POLICY "Users can view their own debts" ON public.debts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own debts" ON public.debts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own debts" ON public.debts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own debts" ON public.debts
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for debts
CREATE TRIGGER handle_updated_at_debts
    BEFORE UPDATE ON public.debts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
