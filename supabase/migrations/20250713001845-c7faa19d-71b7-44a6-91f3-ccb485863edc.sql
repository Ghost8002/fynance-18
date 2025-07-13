
-- Create the debts table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_date DATE,
    notes TEXT,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the tags table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debts
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debts' AND policyname = 'Users can view own debts') THEN
        CREATE POLICY "Users can view own debts" ON public.debts
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debts' AND policyname = 'Users can insert own debts') THEN
        CREATE POLICY "Users can insert own debts" ON public.debts
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debts' AND policyname = 'Users can update own debts') THEN
        CREATE POLICY "Users can update own debts" ON public.debts
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debts' AND policyname = 'Users can delete own debts') THEN
        CREATE POLICY "Users can delete own debts" ON public.debts
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for tags
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can view own tags') THEN
        CREATE POLICY "Users can view own tags" ON public.tags
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can insert own tags') THEN
        CREATE POLICY "Users can insert own tags" ON public.tags
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can update own tags') THEN
        CREATE POLICY "Users can update own tags" ON public.tags
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can delete own tags') THEN
        CREATE POLICY "Users can delete own tags" ON public.tags
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add updated_at triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_debts') THEN
        CREATE TRIGGER handle_updated_at_debts
            BEFORE UPDATE ON public.debts
            FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_tags') THEN
        CREATE TRIGGER handle_updated_at_tags
            BEFORE UPDATE ON public.tags
            FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- Create function to create next recurring debt
CREATE OR REPLACE FUNCTION public.create_next_recurring_debt(debt_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_debt RECORD;
  next_due_date DATE;
  new_debt_id UUID;
BEGIN
  -- Get the current debt details
  SELECT * INTO current_debt FROM public.debts WHERE id = debt_id AND user_id = auth.uid();
  
  -- Only proceed if debt is recurring
  IF NOT FOUND OR NOT current_debt.is_recurring THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next due date based on recurrence type
  CASE current_debt.recurrence_type
    WHEN 'monthly' THEN
      next_due_date := current_debt.due_date + INTERVAL '1 month';
    WHEN 'weekly' THEN
      next_due_date := current_debt.due_date + INTERVAL '1 week';
    WHEN 'yearly' THEN
      next_due_date := current_debt.due_date + INTERVAL '1 year';
    ELSE
      RETURN NULL;
  END CASE;
  
  -- Create the next recurring debt
  INSERT INTO public.debts (
    user_id, description, amount, due_date, status, notes,
    is_recurring, recurrence_type, account_id, category_id
  )
  VALUES (
    current_debt.user_id, 
    current_debt.description, 
    current_debt.amount, 
    next_due_date, 
    'pending', 
    current_debt.notes,
    current_debt.is_recurring,
    current_debt.recurrence_type,
    current_debt.account_id,
    current_debt.category_id
  )
  RETURNING id INTO new_debt_id;
  
  RETURN new_debt_id;
END;
$$;

-- Create function to create next recurring payment
CREATE OR REPLACE FUNCTION public.create_next_recurring_payment(payment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_payment RECORD;
  next_due_date DATE;
  new_payment_id UUID;
BEGIN
  -- Get the current payment details (assuming it has similar structure)
  SELECT * INTO current_payment FROM public.receivable_payments WHERE id = payment_id AND user_id = auth.uid();
  
  -- Only proceed if payment exists
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next due date (assuming monthly for now)
  next_due_date := current_payment.due_date + INTERVAL '1 month';
  
  -- Create the next recurring payment
  INSERT INTO public.receivable_payments (
    user_id, description, amount, due_date, status, notes
  )
  VALUES (
    current_payment.user_id, 
    current_payment.description, 
    current_payment.amount, 
    next_due_date, 
    'pending', 
    current_payment.notes
  )
  RETURNING id INTO new_payment_id;
  
  RETURN new_payment_id;
END;
$$;
