-- Create card_installments table to manage installment purchases
CREATE TABLE public.card_installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    installments_count INTEGER NOT NULL,
    first_installment_date DATE NOT NULL,
    notes TEXT,
    tags JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_installment_items table to track individual installments
CREATE TABLE public.card_installment_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    installment_id UUID REFERENCES public.card_installments(id) ON DELETE CASCADE NOT NULL,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_date DATE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(installment_id, installment_number)
);

-- Enable RLS on new tables
ALTER TABLE public.card_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_installment_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card_installments
CREATE POLICY "Users can view their own card installments" ON public.card_installments
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own card installments" ON public.card_installments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own card installments" ON public.card_installments
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own card installments" ON public.card_installments
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for card_installment_items
CREATE POLICY "Users can view their own card installment items" ON public.card_installment_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.card_installments 
            WHERE id = card_installment_items.installment_id 
            AND user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own card installment items" ON public.card_installment_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.card_installments 
            WHERE id = card_installment_items.installment_id 
            AND user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own card installment items" ON public.card_installment_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.card_installments 
            WHERE id = card_installment_items.installment_id 
            AND user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete their own card installment items" ON public.card_installment_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.card_installments 
            WHERE id = card_installment_items.installment_id 
            AND user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_card_installments_user_id ON public.card_installments(user_id);
CREATE INDEX idx_card_installments_card_id ON public.card_installments(card_id);
CREATE INDEX idx_card_installment_items_installment_id ON public.card_installment_items(installment_id);
CREATE INDEX idx_card_installment_items_status ON public.card_installment_items(status);
CREATE INDEX idx_card_installment_items_due_date ON public.card_installment_items(due_date);

-- Create updated_at triggers
CREATE TRIGGER handle_updated_at_card_installments
    BEFORE UPDATE ON public.card_installments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_card_installment_items
    BEFORE UPDATE ON public.card_installment_items
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Add comments for clarity
COMMENT ON TABLE public.card_installments IS 'Stores installment purchases that are not yet converted to transactions';
COMMENT ON TABLE public.card_installment_items IS 'Stores individual installments for each purchase';
COMMENT ON COLUMN public.card_installments.status IS 'active: still has pending installments, completed: all installments paid, cancelled: purchase cancelled';
COMMENT ON COLUMN public.card_installment_items.status IS 'pending: not paid yet, paid: installment paid, overdue: past due date';
COMMENT ON COLUMN public.card_installment_items.transaction_id IS 'Links to the actual transaction when installment is paid'; 