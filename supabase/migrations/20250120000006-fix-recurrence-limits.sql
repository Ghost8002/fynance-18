-- MIGRAÇÃO PARA CORRIGIR LIMITES DE RECORRÊNCIA
-- Esta migração corrige o problema onde as recorrências continuam infinitamente
-- mesmo após atingir o número máximo de parcelas ou data limite

-- 1. Atualizar função para marcar recebível como recebido com controle de limites
CREATE OR REPLACE FUNCTION public.mark_receivable_as_received_with_rollback(
    p_receivable_id uuid,
    p_account_id uuid DEFAULT NULL::uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_receivable RECORD;
    v_transaction_id UUID;
    v_next_receivable_id UUID;
    v_result JSON;
    v_can_create_next BOOLEAN := FALSE;
    v_next_due_date DATE;
    v_total_created INTEGER;
BEGIN
    -- Buscar dados completos do pagamento
    SELECT * INTO v_receivable
    FROM public.receivable_payments
    WHERE id = p_receivable_id AND user_id = auth.uid() AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Pagamento não encontrado ou já foi recebido'
        );
    END IF;
    
    -- Verificar se a conta pertence ao usuário
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
        -- 1. Criar transação com a data de vencimento
        INSERT INTO public.transactions (
            user_id,
            type,
            description,
            amount,
            date,
            category_id,
            account_id,
            notes
        ) VALUES (
            auth.uid(),
            'income',
            'Recebimento: ' || v_receivable.description,
            ABS(v_receivable.amount),
            v_receivable.due_date,
            v_receivable.category_id,
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

        -- 2. Atualizar status do pagamento
        UPDATE public.receivable_payments 
        SET 
            status = 'received',
            received_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = p_receivable_id AND user_id = auth.uid();

        -- 3. Atualizar saldo da conta
        IF p_account_id IS NOT NULL THEN
            UPDATE public.accounts 
            SET 
                balance = balance + ABS(v_receivable.amount),
                updated_at = NOW()
            WHERE id = p_account_id AND user_id = auth.uid();
        END IF;

        -- 4. Se for recorrente, verificar se pode criar próxima parcela
        IF v_receivable.is_recurring THEN
            -- Calcular próxima data de vencimento
            v_next_due_date := CASE v_receivable.recurrence_type
                WHEN 'weekly' THEN v_receivable.due_date + INTERVAL '1 week'
                WHEN 'monthly' THEN v_receivable.due_date + INTERVAL '1 month'
                WHEN 'yearly' THEN v_receivable.due_date + INTERVAL '1 year'
                ELSE v_receivable.due_date + INTERVAL '1 month'
            END;
            
            -- Verificar se pode criar próxima parcela baseado nos limites
            v_can_create_next := TRUE;
            
            -- Verificar limite de quantidade (max_occurrences)
            IF v_receivable.max_occurrences IS NOT NULL THEN
                -- Contar quantas parcelas já foram criadas para esta recorrência
                SELECT COUNT(*) INTO v_total_created
                FROM public.receivable_payments
                WHERE user_id = auth.uid()
                AND description = v_receivable.description
                AND amount = v_receivable.amount
                AND is_recurring = TRUE
                AND recurrence_type = v_receivable.recurrence_type;
                
                -- Se já atingiu o limite, não criar próxima
                IF v_total_created >= v_receivable.max_occurrences THEN
                    v_can_create_next := FALSE;
                END IF;
            END IF;
            
            -- Verificar data limite (recurrence_end_date)
            IF v_can_create_next AND v_receivable.recurrence_end_date IS NOT NULL THEN
                IF v_next_due_date > v_receivable.recurrence_end_date THEN
                    v_can_create_next := FALSE;
                END IF;
            END IF;
            
            -- Criar próxima parcela apenas se permitido
            IF v_can_create_next THEN
                INSERT INTO public.receivable_payments (
                    user_id,
                    description,
                    amount,
                    due_date,
                    account_id,
                    category_id,
                    status,
                    is_recurring,
                    recurrence_type,
                    max_occurrences,
                    recurrence_end_date,
                    current_count,
                    notes
                ) VALUES (
                    auth.uid(),
                    v_receivable.description,
                    v_receivable.amount,
                    v_next_due_date,
                    v_receivable.account_id,
                    v_receivable.category_id,
                    'pending',
                    v_receivable.is_recurring,
                    v_receivable.recurrence_type,
                    v_receivable.max_occurrences,
                    v_receivable.recurrence_end_date,
                    COALESCE(v_receivable.current_count, 1) + 1,
                    COALESCE(v_receivable.notes, '')
                ) RETURNING id INTO v_next_receivable_id;
            END IF;
        END IF;

        -- Retornar sucesso
        v_result := json_build_object(
            'success', true,
            'transaction_id', v_transaction_id,
            'next_receivable_id', v_next_receivable_id,
            'recurrence_continued', v_can_create_next,
            'message', CASE 
                WHEN v_receivable.is_recurring AND NOT v_can_create_next THEN
                    'Pagamento marcado como recebido. Recorrência finalizada (limite atingido).'
                WHEN v_receivable.is_recurring AND v_can_create_next THEN
                    'Pagamento marcado como recebido e próxima parcela criada.'
                ELSE
                    'Pagamento marcado como recebido com sucesso.'
            END
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback automático em caso de erro
            v_result := json_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao processar operação. Rollback executado automaticamente.'
            );
            
            RETURN v_result;
    END;
END;
$$;

-- 2. Atualizar função para marcar dívida como paga com controle de limites
CREATE OR REPLACE FUNCTION public.mark_debt_as_paid_with_rollback(
    p_debt_id uuid,
    p_account_id uuid DEFAULT NULL::uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_debt RECORD;
    v_transaction_id UUID;
    v_next_debt_id UUID;
    v_result JSON;
    v_can_create_next BOOLEAN := FALSE;
    v_next_due_date DATE;
    v_total_created INTEGER;
BEGIN
    -- Buscar dados completos da dívida
    SELECT * INTO v_debt
    FROM public.debts
    WHERE id = p_debt_id AND user_id = auth.uid() AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Dívida não encontrada ou já foi paga'
        );
    END IF;
    
    -- Verificar se a conta pertence ao usuário
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
        -- 1. Criar transação com a data de vencimento
        INSERT INTO public.transactions (
            user_id,
            type,
            description,
            amount,
            date,
            category_id,
            account_id,
            notes
        ) VALUES (
            auth.uid(),
            'expense',
            'Pagamento: ' || v_debt.description,
            -ABS(v_debt.amount),
            v_debt.due_date,
            v_debt.category_id,
            p_account_id,
            'Transação gerada automaticamente do pagamento de dívida. Data de vencimento: ' || 
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

        -- 2. Atualizar status da dívida
        UPDATE public.debts 
        SET 
            status = 'paid',
            paid_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = p_debt_id AND user_id = auth.uid();

        -- 3. Atualizar saldo da conta
        IF p_account_id IS NOT NULL THEN
            UPDATE public.accounts 
            SET 
                balance = balance - ABS(v_debt.amount),
                updated_at = NOW()
            WHERE id = p_account_id AND user_id = auth.uid();
        END IF;

        -- 4. Se for recorrente, verificar se pode criar próxima parcela
        IF v_debt.is_recurring THEN
            -- Calcular próxima data de vencimento
            v_next_due_date := CASE v_debt.recurrence_type
                WHEN 'weekly' THEN v_debt.due_date + INTERVAL '1 week'
                WHEN 'monthly' THEN v_debt.due_date + INTERVAL '1 month'
                WHEN 'yearly' THEN v_debt.due_date + INTERVAL '1 year'
                ELSE v_debt.due_date + INTERVAL '1 month'
            END;
            
            -- Verificar se pode criar próxima parcela baseado nos limites
            v_can_create_next := TRUE;
            
            -- Verificar limite de quantidade (max_occurrences)
            IF v_debt.max_occurrences IS NOT NULL THEN
                -- Contar quantas dívidas já foram criadas para esta recorrência
                SELECT COUNT(*) INTO v_total_created
                FROM public.debts
                WHERE user_id = auth.uid()
                AND description = v_debt.description
                AND amount = v_debt.amount
                AND is_recurring = TRUE
                AND recurrence_type = v_debt.recurrence_type;
                
                -- Se já atingiu o limite, não criar próxima
                IF v_total_created >= v_debt.max_occurrences THEN
                    v_can_create_next := FALSE;
                END IF;
            END IF;
            
            -- Verificar data limite (recurrence_end_date)
            IF v_can_create_next AND v_debt.recurrence_end_date IS NOT NULL THEN
                IF v_next_due_date > v_debt.recurrence_end_date THEN
                    v_can_create_next := FALSE;
                END IF;
            END IF;
            
            -- Criar próxima parcela apenas se permitido
            IF v_can_create_next THEN
                INSERT INTO public.debts (
                    user_id,
                    description,
                    amount,
                    due_date,
                    account_id,
                    category_id,
                    status,
                    is_recurring,
                    recurrence_type,
                    max_occurrences,
                    recurrence_end_date,
                    current_count,
                    notes
                ) VALUES (
                    auth.uid(),
                    v_debt.description,
                    v_debt.amount,
                    v_next_due_date,
                    v_debt.account_id,
                    v_debt.category_id,
                    'pending',
                    v_debt.is_recurring,
                    v_debt.recurrence_type,
                    v_debt.max_occurrences,
                    v_debt.recurrence_end_date,
                    COALESCE(v_debt.current_count, 1) + 1,
                    COALESCE(v_debt.notes, '')
                ) RETURNING id INTO v_next_debt_id;
            END IF;
        END IF;

        -- Retornar sucesso
        v_result := json_build_object(
            'success', true,
            'transaction_id', v_transaction_id,
            'next_debt_id', v_next_debt_id,
            'recurrence_continued', v_can_create_next,
            'message', CASE 
                WHEN v_debt.is_recurring AND NOT v_can_create_next THEN
                    'Dívida marcada como paga. Recorrência finalizada (limite atingido).'
                WHEN v_debt.is_recurring AND v_can_create_next THEN
                    'Dívida marcada como paga e próxima parcela criada.'
                ELSE
                    'Dívida marcada como paga com sucesso.'
            END
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback automático em caso de erro
            v_result := json_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao processar operação. Rollback executado automaticamente.'
            );
            
            RETURN v_result;
    END;
END;
$$;

-- 3. Atualizar as funções create_next_recurring_payment e create_next_recurring_debt
-- para incluir os campos de controle de limite
CREATE OR REPLACE FUNCTION public.create_next_recurring_payment(payment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_payment RECORD;
  next_due_date DATE;
  new_payment_id UUID;
  v_can_create_next BOOLEAN := FALSE;
  v_total_created INTEGER;
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
  
  -- Verificar se pode criar próxima parcela baseado nos limites
  v_can_create_next := TRUE;
  
  -- Verificar limite de quantidade (max_occurrences)
  IF current_payment.max_occurrences IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total_created
    FROM public.receivable_payments
    WHERE user_id = auth.uid()
    AND description = current_payment.description
    AND amount = current_payment.amount
    AND is_recurring = TRUE
    AND recurrence_type = current_payment.recurrence_type;
    
    -- Se já atingiu o limite, não criar próxima
    IF v_total_created >= current_payment.max_occurrences THEN
        v_can_create_next := FALSE;
    END IF;
  END IF;
  
  -- Verificar data limite (recurrence_end_date)
  IF v_can_create_next AND current_payment.recurrence_end_date IS NOT NULL THEN
    IF next_due_date > current_payment.recurrence_end_date THEN
        v_can_create_next := FALSE;
    END IF;
  END IF;
  
  -- Criar próxima parcela apenas se permitido
  IF v_can_create_next THEN
    -- Create the next recurring payment
    INSERT INTO public.receivable_payments (
      user_id, description, amount, due_date, status, notes,
      is_recurring, recurrence_type, account_id, category_id,
      max_occurrences, recurrence_end_date, current_count
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
      current_payment.max_occurrences,
      current_payment.recurrence_end_date,
      COALESCE(current_payment.current_count, 1) + 1
    )
    RETURNING id INTO new_payment_id;
  END IF;
  
  RETURN new_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_next_recurring_debt(debt_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_debt RECORD;
  next_due_date DATE;
  new_debt_id UUID;
  v_can_create_next BOOLEAN := FALSE;
  v_total_created INTEGER;
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
  
  -- Verificar se pode criar próxima parcela baseado nos limites
  v_can_create_next := TRUE;
  
  -- Verificar limite de quantidade (max_occurrences)
  IF current_debt.max_occurrences IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total_created
    FROM public.debts
    WHERE user_id = auth.uid()
    AND description = current_debt.description
    AND amount = current_debt.amount
    AND is_recurring = TRUE
    AND recurrence_type = current_debt.recurrence_type;
    
    -- Se já atingiu o limite, não criar próxima
    IF v_total_created >= current_debt.max_occurrences THEN
        v_can_create_next := FALSE;
    END IF;
  END IF;
  
  -- Verificar data limite (recurrence_end_date)
  IF v_can_create_next AND current_debt.recurrence_end_date IS NOT NULL THEN
    IF next_due_date > current_debt.recurrence_end_date THEN
        v_can_create_next := FALSE;
    END IF;
  END IF;
  
  -- Criar próxima parcela apenas se permitido
  IF v_can_create_next THEN
    -- Create the next recurring debt
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
$$;

-- 4. Comentários para documentação
COMMENT ON FUNCTION public.mark_receivable_as_received_with_rollback IS 'Corrigida para respeitar limites de recorrência (max_occurrences e recurrence_end_date)';
COMMENT ON FUNCTION public.mark_debt_as_paid_with_rollback IS 'Corrigida para respeitar limites de recorrência (max_occurrences e recurrence_end_date)';
COMMENT ON FUNCTION public.create_next_recurring_payment IS 'Atualizada para respeitar limites de recorrência (max_occurrences e recurrence_end_date)';
COMMENT ON FUNCTION public.create_next_recurring_debt IS 'Atualizada para respeitar limites de recorrência (max_occurrences e recurrence_end_date)';
