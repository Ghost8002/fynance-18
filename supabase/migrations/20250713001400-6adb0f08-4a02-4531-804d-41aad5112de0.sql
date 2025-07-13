
-- Create missing tables that the code is expecting

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

-- Add missing columns to transactions table if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'installments_count') THEN
        ALTER TABLE public.transactions ADD COLUMN installments_count INTEGER DEFAULT 1;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'installment_number') THEN
        ALTER TABLE public.transactions ADD COLUMN installment_number INTEGER DEFAULT 1;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'parent_transaction_id') THEN
        ALTER TABLE public.transactions ADD COLUMN parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.card_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_limit_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card_bills
CREATE POLICY "Users can view their own card bills" ON public.card_bills
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own card bills" ON public.card_bills
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own card bills" ON public.card_bills
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own card bills" ON public.card_bills
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for card_limit_history
CREATE POLICY "Users can view their own card limit history" ON public.card_limit_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own card limit history" ON public.card_limit_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own card limit history" ON public.card_limit_history
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own card limit history" ON public.card_limit_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at triggers for new tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_updated_at_card_bills
    BEFORE UPDATE ON public.card_bills
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create some basic RPC functions that the code is expecting
CREATE OR REPLACE FUNCTION public.adjust_card_limit(
    p_card_id UUID,
    p_new_limit DECIMAL,
    p_reason TEXT
)
RETURNS JSON AS $$
DECLARE
    v_current_limit DECIMAL;
    v_used_amount DECIMAL;
BEGIN
    -- Get current card data
    SELECT credit_limit, used_amount 
    INTO v_current_limit, v_used_amount
    FROM public.cards 
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    -- Update card limit
    UPDATE public.cards 
    SET credit_limit = p_new_limit, updated_at = NOW()
    WHERE id = p_card_id AND user_id = auth.uid();
    
    -- Insert history record
    INSERT INTO public.card_limit_history (
        user_id, card_id, movement_type, amount, 
        previous_used_amount, new_used_amount, description
    ) VALUES (
        auth.uid(), p_card_id, 'adjustment', 
        p_new_limit - v_current_limit,
        v_used_amount, v_used_amount, p_reason
    );
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_card_payment(
    p_card_id UUID,
    p_amount DECIMAL,
    p_account_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT 'Card payment'
)
RETURNS JSON AS $$
DECLARE
    v_current_used DECIMAL;
    v_new_used DECIMAL;
BEGIN
    -- Get current used amount
    SELECT used_amount INTO v_current_used
    FROM public.cards 
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    -- Calculate new used amount
    v_new_used := GREATEST(0, v_current_used - p_amount);
    
    -- Update card used amount
    UPDATE public.cards 
    SET used_amount = v_new_used, updated_at = NOW()
    WHERE id = p_card_id AND user_id = auth.uid();
    
    -- Update account balance if account provided
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE id = p_account_id AND user_id = auth.uid();
    END IF;
    
    -- Insert history record
    INSERT INTO public.card_limit_history (
        user_id, card_id, movement_type, amount,
        previous_used_amount, new_used_amount, description
    ) VALUES (
        auth.uid(), p_card_id, 'payment', p_amount,
        v_current_used, v_new_used, p_description
    );
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.generate_monthly_bill(
    p_card_id UUID,
    p_month INTEGER,
    p_year INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_total_amount DECIMAL := 0;
    v_closing_date DATE;
    v_due_date DATE;
    v_card_closing_day INTEGER;
    v_card_due_day INTEGER;
BEGIN
    -- Get card info
    SELECT closing_day, due_day 
    INTO v_card_closing_day, v_card_due_day
    FROM public.cards 
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    -- Calculate dates
    v_closing_date := make_date(p_year, p_month, v_card_closing_day);
    v_due_date := make_date(p_year, p_month, v_card_due_day);
    
    -- Calculate total from transactions in the period
    SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
    FROM public.transactions
    WHERE card_id = p_card_id 
    AND user_id = auth.uid()
    AND type = 'expense'
    AND date <= v_closing_date
    AND date >= (v_closing_date - INTERVAL '1 month');
    
    -- Insert or update bill
    INSERT INTO public.card_bills (
        user_id, card_id, bill_month, bill_year,
        due_date, closing_date, total_amount, 
        paid_amount, remaining_amount, status
    ) VALUES (
        auth.uid(), p_card_id, p_month, p_year,
        v_due_date, v_closing_date, v_total_amount,
        0, v_total_amount, 
        CASE WHEN v_total_amount = 0 THEN 'paid' ELSE 'open' END
    )
    ON CONFLICT (user_id, card_id, bill_month, bill_year) 
    DO UPDATE SET 
        total_amount = EXCLUDED.total_amount,
        remaining_amount = EXCLUDED.total_amount - paid_amount,
        updated_at = NOW();
    
    RETURN json_build_object('success', true, 'amount', v_total_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_bill_payment(
    p_bill_id UUID,
    p_amount DECIMAL,
    p_account_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT 'Bill payment'
)
RETURNS JSON AS $$
DECLARE
    v_remaining DECIMAL;
    v_new_paid DECIMAL;
    v_new_remaining DECIMAL;
BEGIN
    -- Get current bill data
    SELECT remaining_amount, paid_amount 
    INTO v_remaining, v_new_paid
    FROM public.card_bills 
    WHERE id = p_bill_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill not found';
    END IF;
    
    -- Calculate new amounts
    v_new_paid := v_new_paid + p_amount;
    v_new_remaining := GREATEST(0, v_remaining - p_amount);
    
    -- Update bill
    UPDATE public.card_bills 
    SET 
        paid_amount = v_new_paid,
        remaining_amount = v_new_remaining,
        status = CASE 
            WHEN v_new_remaining = 0 THEN 'paid'
            WHEN v_new_remaining < v_remaining THEN 'partial'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_bill_id AND user_id = auth.uid();
    
    -- Update account if provided
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE id = p_account_id AND user_id = auth.uid();
    END IF;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint for bills
ALTER TABLE public.card_bills 
ADD CONSTRAINT card_bills_unique_month_year 
UNIQUE (user_id, card_id, bill_month, bill_year);
