-- Add subcategory_id column to receivable_payments table
ALTER TABLE public.receivable_payments 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_receivable_payments_subcategory_id ON public.receivable_payments(subcategory_id);

-- Update the function to create next recurring payment to include subcategory_id
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
    is_recurring, recurrence_type, account_id, category_id, subcategory_id
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
    current_payment.category_id,
    current_payment.subcategory_id
  )
  RETURNING id INTO new_payment_id;
  
  RETURN new_payment_id;
END;
$$;