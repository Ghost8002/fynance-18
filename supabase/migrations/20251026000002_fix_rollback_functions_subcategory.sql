-- Correção das funções de rollback para incluir subcategory_id nas transações geradas automaticamente

-- Função para marcar dívida como paga com rollback automático (incluindo subcategory_id)
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
BEGIN
    -- Buscar dados completos da dívida (incluindo subcategory_id)
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
        -- 1. Criar transação com a data de vencimento (incluindo subcategory_id)
        INSERT INTO public.transactions (
            user_id,
            type,
            description,
            amount,
            date,
            category_id,
            subcategory_id,  -- ✅ Incluindo subcategory_id
            account_id,
            notes
        ) VALUES (
            auth.uid(),
            'expense',
            'Pagamento: ' || v_debt.description,
            -ABS(v_debt.amount),
            v_debt.due_date,
            v_debt.category_id,
            v_debt.subcategory_id,  -- ✅ Incluindo subcategory_id
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

        -- 4. Se for recorrente, criar próxima dívida (incluindo subcategory_id)
        IF v_debt.is_recurring THEN
            INSERT INTO public.debts (
                user_id,
                description,
                amount,
                due_date,
                account_id,
                category_id,
                subcategory_id,  -- ✅ Incluindo subcategory_id
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
                v_debt.subcategory_id,  -- ✅ Incluindo subcategory_id
                'pending',
                v_debt.is_recurring,
                v_debt.recurrence_type,
                COALESCE(v_debt.notes, '')
            ) RETURNING id INTO v_next_debt_id;
        END IF;

        -- Retornar sucesso
        v_result := json_build_object(
            'success', true,
            'transaction_id', v_transaction_id,
            'next_debt_id', v_next_debt_id,
            'message', 'Dívida marcada como paga com sucesso'
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

-- Função para marcar recebível como recebido com rollback automático (incluindo subcategory_id)
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
BEGIN
    -- Buscar dados completos do pagamento (incluindo subcategory_id)
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
        -- 1. Criar transação com a data de vencimento (incluindo subcategory_id)
        INSERT INTO public.transactions (
            user_id,
            type,
            description,
            amount,
            date,
            category_id,
            subcategory_id,  -- ✅ Incluindo subcategory_id
            account_id,
            notes
        ) VALUES (
            auth.uid(),
            'income',
            'Recebimento: ' || v_receivable.description,
            ABS(v_receivable.amount),
            v_receivable.due_date,
            v_receivable.category_id,
            v_receivable.subcategory_id,  -- ✅ Incluindo subcategory_id
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

        -- 4. Se for recorrente, criar próximo pagamento (incluindo subcategory_id)
        IF v_receivable.is_recurring THEN
            INSERT INTO public.receivable_payments (
                user_id,
                description,
                amount,
                due_date,
                account_id,
                category_id,
                subcategory_id,  -- ✅ Incluindo subcategory_id
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
                v_receivable.subcategory_id,  -- ✅ Incluindo subcategory_id
                'pending',
                v_receivable.is_recurring,
                v_receivable.recurrence_type,
                COALESCE(v_receivable.notes, '')
            ) RETURNING id INTO v_next_receivable_id;
        END IF;

        -- Retornar sucesso
        v_result := json_build_object(
            'success', true,
            'transaction_id', v_transaction_id,
            'next_receivable_id', v_next_receivable_id,
            'message', 'Pagamento marcado como recebido com sucesso'
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