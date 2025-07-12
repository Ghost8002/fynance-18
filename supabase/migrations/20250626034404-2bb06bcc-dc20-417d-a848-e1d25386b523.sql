
-- Create table for debts (dívidas a pagar)
CREATE TABLE public.debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_date DATE,
    notes TEXT,
    account_id UUID,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own debts" ON public.debts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts" ON public.debts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts" ON public.debts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts" ON public.debts
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at_debts
    BEFORE UPDATE ON public.debts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to automatically update overdue status for debts
CREATE OR REPLACE FUNCTION update_overdue_debts()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.debts 
  SET status = 'overdue' 
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
$$;

-- Create function to create next recurring debt
CREATE OR REPLACE FUNCTION create_next_recurring_debt(debt_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_debt RECORD;
  next_due_date DATE;
  new_debt_id UUID;
BEGIN
  -- Get the current debt details
  SELECT * INTO current_debt FROM public.debts WHERE id = debt_id;
  
  -- Only proceed if debt is recurring
  IF NOT current_debt.is_recurring THEN
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
    is_recurring, recurrence_type, account_id
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
    current_debt.account_id
  )
  RETURNING id INTO new_debt_id;
  
  RETURN new_debt_id;
END;
$function$
