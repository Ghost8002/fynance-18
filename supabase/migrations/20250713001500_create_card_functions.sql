
-- Create card_bills table
CREATE TABLE public.card_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    bill_month INTEGER NOT NULL,
    bill_year INTEGER NOT NULL,
    due_date DATE NOT NULL,
    closing_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on card_bills
ALTER TABLE public.card_bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card_bills
CREATE POLICY "Users can view their own card bills" ON public.card_bills
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own card bills" ON public.card_bills
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own card bills" ON public.card_bills
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own card bills" ON public.card_bills
    FOR DELETE USING (auth.uid() = user_id);

-- Create card_limit_history table
CREATE TABLE public.card_limit_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('charge', 'payment', 'adjustment')),
    amount DECIMAL(15,2) NOT NULL,
    previous_used_amount DECIMAL(15,2) NOT NULL,
    new_used_amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on card_limit_history
ALTER TABLE public.card_limit_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card_limit_history
CREATE POLICY "Users can view their own card limit history" ON public.card_limit_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own card limit history" ON public.card_limit_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to adjust card limit
CREATE OR REPLACE FUNCTION adjust_card_limit(
    p_card_id UUID,
    p_new_limit DECIMAL,
    p_reason TEXT DEFAULT 'Limit adjustment'
) RETURNS VOID AS $$
BEGIN
    UPDATE public.cards 
    SET credit_limit = p_new_limit, updated_at = NOW()
    WHERE id = p_card_id;
    
    INSERT INTO public.card_limit_history (
        user_id, card_id, movement_type, amount, 
        previous_used_amount, new_used_amount, description
    )
    SELECT 
        user_id, id, 'adjustment', 0,
        used_amount, used_amount, p_reason
    FROM public.cards 
    WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process card payment
CREATE OR REPLACE FUNCTION process_card_payment(
    p_card_id UUID,
    p_amount DECIMAL,
    p_account_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT 'Card payment'
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_previous_used DECIMAL;
    v_new_used DECIMAL;
BEGIN
    -- Get card info and update used amount
    SELECT user_id, used_amount INTO v_user_id, v_previous_used
    FROM public.cards WHERE id = p_card_id;
    
    v_new_used := GREATEST(0, v_previous_used - p_amount);
    
    UPDATE public.cards 
    SET used_amount = v_new_used, updated_at = NOW()
    WHERE id = p_card_id;
    
    -- Record in limit history
    INSERT INTO public.card_limit_history (
        user_id, card_id, movement_type, amount, 
        previous_used_amount, new_used_amount, description
    ) VALUES (
        v_user_id, p_card_id, 'payment', p_amount,
        v_previous_used, v_new_used, p_description
    );
    
    -- Update account balance if specified
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE id = p_account_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate monthly bill
CREATE OR REPLACE FUNCTION generate_monthly_bill(
    p_card_id UUID,
    p_month INTEGER,
    p_year INTEGER
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_closing_day INTEGER;
    v_due_day INTEGER;
    v_bill_id UUID;
    v_total_amount DECIMAL := 0;
    v_closing_date DATE;
    v_due_date DATE;
BEGIN
    -- Get card info
    SELECT user_id, closing_day, due_day INTO v_user_id, v_closing_day, v_due_day
    FROM public.cards WHERE id = p_card_id;
    
    -- Calculate dates
    v_closing_date := DATE(p_year || '-' || p_month || '-' || v_closing_day);
    v_due_date := DATE(p_year || '-' || p_month || '-' || v_due_day);
    
    -- If due day is before closing day, move to next month
    IF v_due_day <= v_closing_day THEN
        v_due_date := v_due_date + INTERVAL '1 month';
    END IF;
    
    -- Calculate total from transactions in the period
    SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
    FROM public.transactions
    WHERE card_id = p_card_id 
    AND type = 'expense'
    AND date <= v_closing_date
    AND date > (v_closing_date - INTERVAL '1 month');
    
    -- Create bill
    INSERT INTO public.card_bills (
        user_id, card_id, bill_month, bill_year,
        due_date, closing_date, total_amount, remaining_amount
    ) VALUES (
        v_user_id, p_card_id, p_month, p_year,
        v_due_date, v_closing_date, v_total_amount, v_total_amount
    ) RETURNING id INTO v_bill_id;
    
    RETURN v_bill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process bill payment
CREATE OR REPLACE FUNCTION process_bill_payment(
    p_bill_id UUID,
    p_amount DECIMAL,
    p_account_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT 'Bill payment'
) RETURNS VOID AS $$
DECLARE
    v_remaining DECIMAL;
BEGIN
    -- Update bill
    UPDATE public.card_bills 
    SET 
        paid_amount = paid_amount + p_amount,
        remaining_amount = GREATEST(0, remaining_amount - p_amount),
        status = CASE 
            WHEN (remaining_amount - p_amount) <= 0 THEN 'paid'
            WHEN paid_amount > 0 THEN 'partial'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_bill_id;
    
    -- Update account balance if specified
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE id = p_account_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
