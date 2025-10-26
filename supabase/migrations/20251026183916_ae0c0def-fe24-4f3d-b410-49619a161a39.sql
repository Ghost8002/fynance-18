-- Fix SECURITY DEFINER functions by adding SET search_path TO 'public'
-- This prevents schema injection attacks and RLS bypasses

-- 1. mark_debt_as_paid_with_rollback
CREATE OR REPLACE FUNCTION public.mark_debt_as_paid_with_rollback(p_debt_id uuid, p_account_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_debt RECORD;
    v_transaction_id UUID;
    v_next_debt_id UUID;
    v_result JSON;
BEGIN
    SELECT * INTO v_debt
    FROM public.debts
    WHERE id = p_debt_id AND user_id = auth.uid() AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Dívida não encontrada ou já foi paga'
        );
    END IF;
    
    IF p_account_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE id = p_account_id AND user_id = auth.uid()
    ) THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Conta não encontrada ou não pertence ao usuário'
        );
    END IF;
    
    BEGIN
        INSERT INTO public.transactions (
            user_id,
            type,
            description,
            amount,
            date,
            category_id,
            subcategory_id,
            account_id,
            notes
        ) VALUES (
            auth.uid(),
            'expense',
            'Pagamento: ' || v_debt.description,
            -ABS(v_debt.amount),
            v_debt.due_date,
            v_debt.category_id,
            v_debt.subcategory_id,
            p_account_id,
            'Transação gerada automaticamente da dívida paga. Data de vencimento: ' || 
            TO_CHAR(v_debt.due_date, 'DD/MM/YYYY') ||
            CASE 
                WHEN v_debt.is_recurring THEN 
                    ' (Dívida recorrente - ' || 
                    CASE v_debt.recurrence_type
                        WHEN 'weekly' THEN 'Semanal'
                        WHEN 'monthly' THEN 'Mensal'
                        WHEN 'yearly' THEN 'Anual'
                        ELSE 'Recorrente'
                    END || ')'
                ELSE ''
            END
        ) RETURNING id INTO v_transaction_id;

        UPDATE public.debts 
        SET 
            status = 'paid',
            paid_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = p_debt_id AND user_id = auth.uid();

        IF p_account_id IS NOT NULL THEN
            UPDATE public.accounts 
            SET 
                balance = balance - ABS(v_debt.amount),
                updated_at = NOW()
            WHERE id = p_account_id AND user_id = auth.uid();
        END IF;

        IF v_debt.is_recurring THEN
            INSERT INTO public.debts (
                user_id,
                description,
                amount,
                due_date,
                account_id,
                category_id,
                subcategory_id,
                status,
                is_recurring,
                recurrence_type,
                notes
            ) VALUES (
                auth.uid(),
                v_debt.description,
                v_debt.amount,
                CASE v_debt.recurrence_type
                    WHEN 'weekly' THEN v_debt.due_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN v_debt.due_date + INTERVAL '1 month'
                    WHEN 'yearly' THEN v_debt.due_date + INTERVAL '1 year'
                    ELSE v_debt.due_date + INTERVAL '1 month'
                END,
                v_debt.account_id,
                v_debt.category_id,
                v_debt.subcategory_id,
                'pending',
                v_debt.is_recurring,
                v_debt.recurrence_type,
                COALESCE(v_debt.notes, '')
            ) RETURNING id INTO v_next_debt_id;
        END IF;

        v_result := json_build_object(
            'success', true,
            'transaction_id', v_transaction_id,
            'next_debt_id', v_next_debt_id,
            'message', 'Dívida marcada como paga com sucesso'
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            v_result := json_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao processar operação. Rollback executado automaticamente.'
            );
            
            RETURN v_result;
    END;
END;
$function$;

-- 2. mark_receivable_as_received_with_rollback
CREATE OR REPLACE FUNCTION public.mark_receivable_as_received_with_rollback(p_receivable_id uuid, p_account_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_receivable RECORD;
    v_transaction_id UUID;
    v_next_receivable_id UUID;
    v_result JSON;
BEGIN
    SELECT * INTO v_receivable
    FROM public.receivable_payments
    WHERE id = p_receivable_id AND user_id = auth.uid() AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Pagamento não encontrado ou já foi recebido'
        );
    END IF;
    
    IF p_account_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE id = p_account_id AND user_id = auth.uid()
    ) THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Conta não encontrada ou não pertence ao usuário'
        );
    END IF;
    
    BEGIN
        INSERT INTO public.transactions (
            user_id,
            type,
            description,
            amount,
            date,
            category_id,
            subcategory_id,
            account_id,
            notes
        ) VALUES (
            auth.uid(),
            'income',
            'Recebimento: ' || v_receivable.description,
            ABS(v_receivable.amount),
            v_receivable.due_date,
            v_receivable.category_id,
            v_receivable.subcategory_id,
            p_account_id,
            'Transação gerada automaticamente do pagamento recebido. Data de vencimento: ' || 
            TO_CHAR(v_receivable.due_date, 'DD/MM/YYYY') ||
            CASE 
                WHEN v_receivable.is_recurring THEN 
                    ' (Pagamento recorrente - ' || 
                    CASE v_receivable.recurrence_type
                        WHEN 'weekly' THEN 'Semanal'
                        WHEN 'monthly' THEN 'Mensal'
                        WHEN 'yearly' THEN 'Anual'
                        ELSE 'Recorrente'
                    END || ')'
                ELSE ''
            END
        ) RETURNING id INTO v_transaction_id;

        UPDATE public.receivable_payments 
        SET 
            status = 'received',
            received_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = p_receivable_id AND user_id = auth.uid();

        IF p_account_id IS NOT NULL THEN
            UPDATE public.accounts 
            SET 
                balance = balance + ABS(v_receivable.amount),
                updated_at = NOW()
            WHERE id = p_account_id AND user_id = auth.uid();
        END IF;

        IF v_receivable.is_recurring THEN
            INSERT INTO public.receivable_payments (
                user_id,
                description,
                amount,
                due_date,
                account_id,
                category_id,
                subcategory_id,
                status,
                is_recurring,
                recurrence_type,
                notes
            ) VALUES (
                auth.uid(),
                v_receivable.description,
                v_receivable.amount,
                CASE v_receivable.recurrence_type
                    WHEN 'weekly' THEN v_receivable.due_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN v_receivable.due_date + INTERVAL '1 month'
                    WHEN 'yearly' THEN v_receivable.due_date + INTERVAL '1 year'
                    ELSE v_receivable.due_date + INTERVAL '1 month'
                END,
                v_receivable.account_id,
                v_receivable.category_id,
                v_receivable.subcategory_id,
                'pending',
                v_receivable.is_recurring,
                v_receivable.recurrence_type,
                COALESCE(v_receivable.notes, '')
            ) RETURNING id INTO v_next_receivable_id;
        END IF;

        v_result := json_build_object(
            'success', true,
            'transaction_id', v_transaction_id,
            'next_receivable_id', v_next_receivable_id,
            'message', 'Pagamento marcado como recebido com sucesso'
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            v_result := json_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao processar operação. Rollback executado automaticamente.'
            );
            
            RETURN v_result;
    END;
END;
$function$;

-- 3. unmark_debt_as_paid_with_rollback
CREATE OR REPLACE FUNCTION public.unmark_debt_as_paid_with_rollback(p_debt_id uuid, p_account_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_debt RECORD;
  v_account_id uuid;
BEGIN
  SELECT * INTO v_debt
  FROM public.debts
  WHERE id = p_debt_id AND user_id = auth.uid() AND status = 'paid';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Debt not found or not paid');
  END IF;

  v_account_id := COALESCE(p_account_id, v_debt.account_id);

  UPDATE public.debts
  SET status = 'pending', paid_date = NULL, updated_at = NOW(), transaction_id = NULL
  WHERE id = p_debt_id AND user_id = auth.uid();

  IF v_account_id IS NOT NULL THEN
    UPDATE public.accounts 
    SET balance = balance + v_debt.amount, updated_at = NOW()
    WHERE id = v_account_id AND user_id = auth.uid();
  END IF;

  IF v_debt.transaction_id IS NOT NULL THEN
    DELETE FROM public.transactions
    WHERE id = v_debt.transaction_id AND user_id = auth.uid();
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;

-- 4. unmark_receivable_as_received_with_rollback
CREATE OR REPLACE FUNCTION public.unmark_receivable_as_received_with_rollback(p_receivable_id uuid, p_account_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_receivable RECORD;
  v_account_id uuid;
BEGIN
  SELECT * INTO v_receivable
  FROM public.receivable_payments
  WHERE id = p_receivable_id AND user_id = auth.uid() AND status = 'received';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Receivable not found or not received');
  END IF;

  v_account_id := COALESCE(p_account_id, v_receivable.account_id);

  UPDATE public.receivable_payments
  SET status = 'pending', received_date = NULL, updated_at = NOW(), transaction_id = NULL
  WHERE id = p_receivable_id AND user_id = auth.uid();

  IF v_account_id IS NOT NULL THEN
    UPDATE public.accounts
    SET balance = balance - v_receivable.amount, updated_at = NOW()
    WHERE id = v_account_id AND user_id = auth.uid();
  END IF;

  IF v_receivable.transaction_id IS NOT NULL THEN
    DELETE FROM public.transactions
    WHERE id = v_receivable.transaction_id AND user_id = auth.uid();
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;

-- 5. create_next_recurring_debt
CREATE OR REPLACE FUNCTION public.create_next_recurring_debt(debt_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_debt RECORD;
  next_due_date DATE;
  new_debt_id UUID;
  v_can_create_next BOOLEAN := FALSE;
  v_total_created INTEGER;
BEGIN
  SELECT * INTO current_debt FROM public.debts WHERE id = debt_id AND user_id = auth.uid();
  
  IF NOT FOUND OR NOT current_debt.is_recurring THEN
    RETURN NULL;
  END IF;
  
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
  
  v_can_create_next := TRUE;
  
  IF current_debt.max_occurrences IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total_created
    FROM public.debts
    WHERE user_id = auth.uid()
    AND description = current_debt.description
    AND amount = current_debt.amount
    AND is_recurring = TRUE
    AND recurrence_type = current_debt.recurrence_type;
    
    IF v_total_created >= current_debt.max_occurrences THEN
        v_can_create_next := FALSE;
    END IF;
  END IF;
  
  IF v_can_create_next AND current_debt.recurrence_end_date IS NOT NULL THEN
    IF next_due_date > current_debt.recurrence_end_date THEN
        v_can_create_next := FALSE;
    END IF;
  END IF;
  
  IF v_can_create_next THEN
    INSERT INTO public.debts (
      user_id, description, amount, due_date, status, notes,
      is_recurring, recurrence_type, account_id, category_id,
      max_occurrences, recurrence_end_date, current_count
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
      current_debt.category_id,
      current_debt.max_occurrences,
      current_debt.recurrence_end_date,
      COALESCE(current_debt.current_count, 1) + 1
    )
    RETURNING id INTO new_debt_id;
  END IF;
  
  RETURN new_debt_id;
END;
$function$;

-- 6. create_next_recurring_payment
CREATE OR REPLACE FUNCTION public.create_next_recurring_payment(payment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_payment RECORD;
  next_due_date DATE;
  new_payment_id UUID;
BEGIN
  SELECT * INTO current_payment FROM public.receivable_payments WHERE id = payment_id AND user_id = auth.uid();
  
  IF NOT FOUND OR NOT current_payment.is_recurring THEN
    RETURN NULL;
  END IF;
  
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
$function$;

-- 7. remove_tag_from_transactions
CREATE OR REPLACE FUNCTION public.remove_tag_from_transactions(p_tag_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.transactions
  SET tags = (
    SELECT jsonb_agg(tag)
    FROM jsonb_array_elements(tags) AS tag
    WHERE (tag->>'id')::uuid != p_tag_id
  )
  WHERE tags @> jsonb_build_array(jsonb_build_object('id', p_tag_id));
END;
$function$;

-- 8. process_card_payment_secure
CREATE OR REPLACE FUNCTION public.process_card_payment_secure(p_card_id uuid, p_amount numeric, p_account_id uuid DEFAULT NULL::uuid, p_description text DEFAULT 'Card payment'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_current_used DECIMAL;
    v_new_used DECIMAL;
BEGIN
    SELECT used_amount INTO v_current_used
    FROM public.cards 
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    v_new_used := GREATEST(0, v_current_used - p_amount);
    
    UPDATE public.cards 
    SET used_amount = v_new_used, updated_at = NOW()
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE id = p_account_id AND user_id = auth.uid();
    END IF;
    
    INSERT INTO public.card_limit_history (
        user_id, card_id, movement_type, amount,
        previous_used_amount, new_used_amount, description
    ) VALUES (
        auth.uid(), p_card_id, 'payment', p_amount,
        v_current_used, v_new_used, p_description
    );
    
    RETURN json_build_object('success', true, 'message', 'Payment processed successfully');
END;
$function$;

-- 9. process_installment_payment
CREATE OR REPLACE FUNCTION public.process_installment_payment(p_installment_item_id uuid, p_amount numeric, p_account_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN json_build_object('success', true, 'message', 'Installment payment processed');
END;
$function$;

-- 10. create_installment_purchase
CREATE OR REPLACE FUNCTION public.create_installment_purchase(p_user_id uuid, p_card_id uuid, p_category_id uuid, p_description text, p_total_amount numeric, p_installments_count integer, p_first_installment_date date, p_notes text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_installment_id UUID;
  v_installment_amount NUMERIC;
  v_current_date DATE;
  i INTEGER;
BEGIN
  v_installment_amount := p_total_amount / p_installments_count;
  
  INSERT INTO public.card_installments (
    user_id, card_id, description, total_amount, installments_count
  ) VALUES (
    p_user_id, p_card_id, p_description, p_total_amount, p_installments_count
  ) RETURNING id INTO v_installment_id;
  
  FOR i IN 1..p_installments_count LOOP
    v_current_date := p_first_installment_date + ((i - 1) * INTERVAL '1 month');
    
    INSERT INTO public.card_installment_items (
      installment_id, installment_number, amount, due_date
    ) VALUES (
      v_installment_id, i, v_installment_amount, v_current_date
    );
  END LOOP;
  
  UPDATE public.cards 
  SET used_amount = used_amount + p_total_amount
  WHERE id = p_card_id AND user_id = p_user_id;
  
  RETURN json_build_object('success', true, 'installment_id', v_installment_id);
END;
$function$;

-- 11. sync_debt_payment (first version)
CREATE OR REPLACE FUNCTION public.sync_debt_payment(p_installment_id uuid, p_installment_number integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.card_installment_items 
  SET status = 'paid', paid_date = CURRENT_DATE, updated_at = NOW()
  WHERE installment_id = p_installment_id 
    AND installment_number = p_installment_number;

  UPDATE public.debts 
  SET status = 'paid', paid_date = CURRENT_DATE, updated_at = NOW()
  WHERE installment_id = p_installment_id 
    AND installment_number = p_installment_number
    AND user_id = auth.uid();

  RETURN json_build_object('success', true);
END;
$function$;

-- 12. sync_existing_installments
CREATE OR REPLACE FUNCTION public.sync_existing_installments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_installment RECORD;
  v_total_debts INTEGER := 0;
  v_debt_count INTEGER;
BEGIN
  FOR v_installment IN 
    SELECT * FROM public.card_installments 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.debts 
      WHERE installment_id = v_installment.id 
      AND user_id = auth.uid()
    ) THEN
      SELECT create_debts_from_installments(v_installment.id) INTO v_debt_count;
      v_total_debts := v_total_debts + v_debt_count;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true, 
    'debts_created', v_total_debts,
    'message', 'Parcelamentos existentes sincronizados com sucesso'
  );
END;
$function$;

-- 13. create_debt_from_card_bill
CREATE OR REPLACE FUNCTION public.create_debt_from_card_bill(p_card_id uuid, p_bill_month integer, p_bill_year integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bill RECORD;
  v_card RECORD;
  v_debt_id UUID;
BEGIN
  SELECT * INTO v_bill
  FROM public.card_bills
  WHERE card_id = p_card_id
    AND bill_month = p_bill_month
    AND bill_year = p_bill_year
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fatura não encontrada para o usuário ou parâmetros inválidos';
  END IF;

  SELECT * INTO v_card
  FROM public.cards
  WHERE id = p_card_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado para o usuário';
  END IF;

  SELECT id INTO v_debt_id
  FROM public.debts
  WHERE user_id = auth.uid()
    AND card_id = p_card_id
    AND bill_month = p_bill_month
    AND bill_year = p_bill_year
    AND is_card_bill = TRUE;

  IF FOUND THEN
    RETURN v_debt_id;
  END IF;

  INSERT INTO public.debts (
    user_id, description, amount, due_date, status,
    card_id, is_card_bill, bill_month, bill_year, category_id
  ) VALUES (
    auth.uid(),
    'Fatura ' || v_card.name || ' - ' || p_bill_month || '/' || p_bill_year,
    v_bill.remaining_amount,
    v_bill.due_date,
    CASE
      WHEN v_bill.status = 'paid' THEN 'paid'
      WHEN v_bill.due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'pending'
    END,
    p_card_id, TRUE, p_bill_month, p_bill_year,
    NULL
  ) RETURNING id INTO v_debt_id;

  RETURN v_debt_id;
END;
$function$;

-- 14. create_debts_from_installments
CREATE OR REPLACE FUNCTION public.create_debts_from_installments(p_installment_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_installment RECORD;
  v_item RECORD;
  v_debt_id UUID;
BEGIN
  SELECT * INTO v_installment
  FROM public.card_installments
  WHERE id = p_installment_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parcelamento não encontrado para o usuário';
  END IF;

  FOR v_item IN
    SELECT * FROM public.card_installment_items
    WHERE installment_id = p_installment_id
    ORDER BY installment_number
  LOOP
    SELECT id INTO v_debt_id
    FROM public.debts
    WHERE user_id = auth.uid()
      AND installment_id = p_installment_id
      AND installment_number = v_item.installment_number;

    IF NOT FOUND THEN
      INSERT INTO public.debts (
        user_id, description, amount, due_date, status,
        card_id, installment_id, installment_number, category_id, notes
      ) VALUES (
        auth.uid(),
        v_installment.description || ' - ' || v_item.installment_number || '/' || v_installment.installments_count,
        v_item.amount,
        v_item.due_date,
        CASE
          WHEN v_item.status = 'paid' THEN 'paid'
          WHEN v_item.due_date < CURRENT_DATE THEN 'overdue'
          ELSE 'pending'
        END,
        v_installment.card_id,
        p_installment_id,
        v_item.installment_number,
        v_installment.category_id,
        'Dívida gerada automaticamente do parcelamento'
      ) RETURNING id INTO v_debt_id;
    END IF;

    RETURN NEXT v_debt_id;
  END LOOP;

  RETURN;
END;
$function$;

-- 15. sync_debt_payment (second version - overload)
CREATE OR REPLACE FUNCTION public.sync_debt_payment(p_debt_id uuid, p_payment_amount numeric, p_payment_date date DEFAULT CURRENT_DATE)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_debt RECORD;
  v_bill RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_debt
  FROM public.debts
  WHERE id = p_debt_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dívida não encontrada para o usuário';
  END IF;

  IF v_debt.is_card_bill THEN
    SELECT * INTO v_bill
    FROM public.card_bills
    WHERE card_id = v_debt.card_id
      AND bill_month = v_debt.bill_month
      AND bill_year = v_debt.bill_year
      AND user_id = auth.uid();

    IF FOUND THEN
      UPDATE public.card_bills
      SET paid_amount = paid_amount + COALESCE(p_payment_amount, 0),
          remaining_amount = GREATEST(0, remaining_amount - COALESCE(p_payment_amount, 0)),
          status = CASE WHEN remaining_amount - COALESCE(p_payment_amount, 0) <= 0 THEN 'paid' ELSE 'partial' END,
          updated_at = NOW()
      WHERE id = v_bill.id;
    END IF;
  END IF;

  IF v_debt.installment_id IS NOT NULL AND v_debt.installment_number IS NOT NULL THEN
    SELECT * INTO v_item
    FROM public.card_installment_items
    WHERE installment_id = v_debt.installment_id
      AND installment_number = v_debt.installment_number;

    IF FOUND THEN
      UPDATE public.card_installment_items
      SET status = 'paid',
          paid_date = p_payment_date,
          updated_at = NOW()
      WHERE id = v_item.id;
    END IF;
  END IF;

  RETURN TRUE;
END;
$function$;

-- 16. sync_card_debts
CREATE OR REPLACE FUNCTION public.sync_card_debts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bill RECORD;
  v_installment RECORD;
  v_total_debts INTEGER := 0;
  v_bill_debt_count INTEGER := 0;
  v_installment_debt_count INTEGER := 0;
  v_debt_count INTEGER;
BEGIN
  FOR v_bill IN 
    SELECT * FROM public.card_bills
    WHERE user_id = auth.uid()
      AND status IN ('open', 'partial')
      AND remaining_amount > 0
  LOOP
    IF public.create_debt_from_card_bill(v_bill.card_id, v_bill.bill_month, v_bill.bill_year) IS NOT NULL THEN
      v_bill_debt_count := v_bill_debt_count + 1;
    END IF;
  END LOOP;

  FOR v_installment IN 
    SELECT * FROM public.card_installments
    WHERE user_id = auth.uid()
      AND status = 'active'
  LOOP
    SELECT COUNT(*) INTO v_debt_count
    FROM public.create_debts_from_installments(v_installment.id);
    v_installment_debt_count := v_installment_debt_count + COALESCE(v_debt_count, 0);
  END LOOP;

  v_total_debts := v_bill_debt_count + v_installment_debt_count;

  RETURN json_build_object(
    'success', TRUE,
    'debts_created', v_total_debts,
    'bills_synced', v_bill_debt_count,
    'installments_synced', v_installment_debt_count
  );
END;
$function$;

-- 17. adjust_card_limit
CREATE OR REPLACE FUNCTION public.adjust_card_limit(p_card_id uuid, p_new_limit numeric, p_reason text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_current_limit DECIMAL;
    v_used_amount DECIMAL;
BEGIN
    SELECT credit_limit, used_amount 
    INTO v_current_limit, v_used_amount
    FROM public.cards 
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    UPDATE public.cards 
    SET credit_limit = p_new_limit, updated_at = NOW()
    WHERE id = p_card_id AND user_id = auth.uid();
    
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
$function$;

-- 18. generate_monthly_bill
CREATE OR REPLACE FUNCTION public.generate_monthly_bill(p_card_id uuid, p_month integer, p_year integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_total_amount DECIMAL := 0;
    v_closing_date DATE;
    v_due_date DATE;
    v_card_closing_day INTEGER;
    v_card_due_day INTEGER;
BEGIN
    SELECT closing_day, due_day 
    INTO v_card_closing_day, v_card_due_day
    FROM public.cards 
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    v_closing_date := make_date(p_year, p_month, v_card_closing_day);
    v_due_date := make_date(p_year, p_month, v_card_due_day);
    
    SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
    FROM public.transactions
    WHERE card_id = p_card_id 
    AND user_id = auth.uid()
    AND type = 'expense'
    AND date <= v_closing_date
    AND date >= (v_closing_date - INTERVAL '1 month');
    
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
        remaining_amount = EXCLUDED.total_amount - card_bills.paid_amount,
        updated_at = NOW();
    
    RETURN json_build_object('success', true, 'amount', v_total_amount);
END;
$function$;

-- 19. process_card_payment
CREATE OR REPLACE FUNCTION public.process_card_payment(p_card_id uuid, p_amount numeric, p_account_id uuid DEFAULT NULL::uuid, p_description text DEFAULT 'Card payment'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_current_used DECIMAL;
    v_new_used DECIMAL;
BEGIN
    SELECT used_amount INTO v_current_used
    FROM public.cards 
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    v_new_used := GREATEST(0, v_current_used - p_amount);
    
    UPDATE public.cards 
    SET used_amount = v_new_used, updated_at = NOW()
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE id = p_account_id AND user_id = auth.uid();
    END IF;
    
    INSERT INTO public.card_limit_history (
        user_id, card_id, movement_type, amount,
        previous_used_amount, new_used_amount, description
    ) VALUES (
        auth.uid(), p_card_id, 'payment', p_amount,
        v_current_used, v_new_used, p_description
    );
    
    RETURN json_build_object('success', true);
END;
$function$;

-- 20. process_bill_payment
CREATE OR REPLACE FUNCTION public.process_bill_payment(p_bill_id uuid, p_amount numeric, p_account_id uuid DEFAULT NULL::uuid, p_description text DEFAULT 'Bill payment'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_remaining DECIMAL;
    v_new_paid DECIMAL;
    v_new_remaining DECIMAL;
BEGIN
    SELECT remaining_amount, paid_amount 
    INTO v_remaining, v_new_paid
    FROM public.card_bills 
    WHERE id = p_bill_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill not found';
    END IF;
    
    v_new_paid := v_new_paid + p_amount;
    v_new_remaining := GREATEST(0, v_remaining - p_amount);
    
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
    
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE id = p_account_id AND user_id = auth.uid();
    END IF;
    
    RETURN json_build_object('success', true);
END;
$function$;

-- 21. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$function$;