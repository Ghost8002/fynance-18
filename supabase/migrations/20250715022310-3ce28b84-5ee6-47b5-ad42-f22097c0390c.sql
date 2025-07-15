
-- Adicionar colunas faltantes na tabela receivable_payments para corresponder à funcionalidade de debts
ALTER TABLE public.receivable_payments 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')) DEFAULT NULL;

-- Adicionar constraint para consistência de recorrência
ALTER TABLE public.receivable_payments 
ADD CONSTRAINT IF NOT EXISTS check_receivable_recurrence_consistency 
CHECK (
  (is_recurring = FALSE AND recurrence_type IS NULL) OR 
  (is_recurring = TRUE AND recurrence_type IS NOT NULL)
);

-- Atualizar a função para criar próximos pagamentos recorrentes
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
  -- Get the current payment details
  SELECT * INTO current_payment FROM public.receivable_payments WHERE id = payment_id AND user_id = auth.uid();
  
  -- Only proceed if payment is recurring
  IF NOT FOUND OR NOT current_payment.is_recurring THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next due date based on recurrence type
  CASE current_payment.recurrence_type
    WHEN 'monthly' THEN
      next_due_date := current_payment.due_date + INTERVAL '1 month';
    WHEN 'weekly' THEN
      next_due_date := current_payment.due_date + INTERVAL '1 week';
    WHEN 'yearly' THEN
      next_due_date := current_payment.due_date + INTERVAL '1 year';
    ELSE
      RETURN NULL;
  END CASE;
  
  -- Create the next recurring payment
  INSERT INTO public.receivable_payments (
    user_id, description, amount, due_date, status, notes,
    is_recurring, recurrence_type, account_id, category_id
  )
  VALUES (
    current_payment.user_id, 
    current_payment.description, 
    current_payment.amount, 
    next_due_date, 
    'pending', 
    current_payment.notes,
    current_payment.is_recurring,
    current_payment.recurrence_type,
    current_payment.account_id,
    current_payment.category_id
  )
  RETURNING id INTO new_payment_id;
  
  RETURN new_payment_id;
END;
$$;

-- Função para automaticamente atualizar pagamentos vencidos
CREATE OR REPLACE FUNCTION update_overdue_receivable_payments()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.receivable_payments 
  SET status = 'overdue' 
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
$$;
