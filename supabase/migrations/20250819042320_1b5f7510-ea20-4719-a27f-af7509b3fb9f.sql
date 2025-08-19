-- Create function to automatically create debt from card bill
CREATE OR REPLACE FUNCTION public.create_debt_from_card_bill(
  p_card_id UUID,
  p_bill_month INTEGER,
  p_bill_year INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill RECORD;
  v_debt_id UUID;
  v_due_date DATE;
BEGIN
  -- Get bill information
  SELECT * INTO v_bill
  FROM public.card_bills
  WHERE card_id = p_card_id 
    AND bill_month = p_bill_month 
    AND bill_year = p_bill_year
    AND user_id = auth.uid();
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card bill not found';
  END IF;
  
  -- Calculate due date (use bill due_date)
  v_due_date := v_bill.due_date;
  
  -- Create debt only if bill has remaining amount and no debt exists
  IF v_bill.remaining_amount > 0 AND NOT EXISTS (
    SELECT 1 FROM public.debts 
    WHERE description LIKE 'Fatura ' || (SELECT name FROM public.cards WHERE id = p_card_id) || ' %'
      AND due_date = v_due_date
      AND user_id = auth.uid()
  ) THEN
    INSERT INTO public.debts (
      user_id,
      description,
      amount,
      due_date,
      status,
      notes
    ) VALUES (
      auth.uid(),
      'Fatura ' || (SELECT name FROM public.cards WHERE id = p_card_id) || ' ' || p_bill_month || '/' || p_bill_year,
      v_bill.remaining_amount,
      v_due_date,
      'pending',
      'Dívida gerada automaticamente da fatura do cartão'
    ) RETURNING id INTO v_debt_id;
    
    RETURN v_debt_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create function to sync all card debts
CREATE OR REPLACE FUNCTION public.sync_card_debts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill RECORD;
  v_debt_count INTEGER := 0;
BEGIN
  -- Create debts for unpaid card bills
  FOR v_bill IN 
    SELECT * FROM public.card_bills 
    WHERE user_id = auth.uid() 
    AND status IN ('open', 'partial')
    AND remaining_amount > 0
  LOOP
    IF create_debt_from_card_bill(v_bill.card_id, v_bill.bill_month, v_bill.bill_year) IS NOT NULL THEN
      v_debt_count := v_debt_count + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object('success', true, 'debts_created', v_debt_count);
END;
$$;