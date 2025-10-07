-- =====================================================
-- CORREÇÃO: Melhorias nos Filtros de Período
-- =====================================================
-- Este arquivo melhora as funções de filtro de período para maior precisão

-- 1. Função para obter dados de valores a receber e pagar por período com precisão
CREATE OR REPLACE FUNCTION public.get_accounts_debts_by_period(
    p_start_date DATE,
    p_end_date DATE,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_receivables JSON;
    v_debts JSON;
    v_result JSON;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Buscar pagamentos a receber no período
    SELECT json_agg(
        json_build_object(
            'id', id,
            'description', description,
            'amount', amount,
            'due_date', due_date,
            'status', status,
            'account_id', account_id,
            'category_id', category_id,
            'is_recurring', is_recurring,
            'recurrence_type', recurrence_type,
            'created_at', created_at
        )
    ) INTO v_receivables
    FROM public.receivable_payments
    WHERE user_id = p_user_id
        AND due_date >= p_start_date
        AND due_date <= p_end_date;
    
    -- Buscar dívidas no período
    SELECT json_agg(
        json_build_object(
            'id', id,
            'description', description,
            'amount', amount,
            'due_date', due_date,
            'status', status,
            'account_id', account_id,
            'category_id', category_id,
            'is_recurring', is_recurring,
            'recurrence_type', recurrence_type,
            'card_id', card_id,
            'is_card_bill', is_card_bill,
            'created_at', created_at
        )
    ) INTO v_debts
    FROM public.debts
    WHERE user_id = p_user_id
        AND due_date >= p_start_date
        AND due_date <= p_end_date;
    
    RETURN json_build_object(
        'success', true,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'receivables', COALESCE(v_receivables, '[]'::json),
        'debts', COALESCE(v_debts, '[]'::json),
        'receivables_count', COALESCE(json_array_length(v_receivables), 0),
        'debts_count', COALESCE(json_array_length(v_debts), 0)
    );
END;
$$;

-- 2. Função para calcular totais por período com status correto
CREATE OR REPLACE FUNCTION public.calculate_period_totals(
    p_start_date DATE,
    p_end_date DATE,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_receivables_totals JSON;
    v_debts_totals JSON;
    v_result JSON;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Calcular totais de pagamentos a receber
    SELECT json_build_object(
        'pending', COALESCE(SUM(
            CASE 
                WHEN status = 'pending' AND due_date >= CURRENT_DATE THEN amount
                ELSE 0
            END
        ), 0),
        'overdue', COALESCE(SUM(
            CASE 
                WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount
                ELSE 0
            END
        ), 0),
        'received', COALESCE(SUM(
            CASE 
                WHEN status = 'received' THEN amount
                ELSE 0
            END
        ), 0),
        'total', COALESCE(SUM(amount), 0)
    ) INTO v_receivables_totals
    FROM public.receivable_payments
    WHERE user_id = p_user_id
        AND due_date >= p_start_date
        AND due_date <= p_end_date;
    
    -- Calcular totais de dívidas
    SELECT json_build_object(
        'pending', COALESCE(SUM(
            CASE 
                WHEN status = 'pending' AND due_date >= CURRENT_DATE THEN amount
                ELSE 0
            END
        ), 0),
        'overdue', COALESCE(SUM(
            CASE 
                WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount
                ELSE 0
            END
        ), 0),
        'paid', COALESCE(SUM(
            CASE 
                WHEN status = 'paid' THEN amount
                ELSE 0
            END
        ), 0),
        'total', COALESCE(SUM(amount), 0)
    ) INTO v_debts_totals
    FROM public.debts
    WHERE user_id = p_user_id
        AND due_date >= p_start_date
        AND due_date <= p_end_date;
    
    RETURN json_build_object(
        'success', true,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'receivables_totals', v_receivables_totals,
        'debts_totals', v_debts_totals
    );
END;
$$;

-- 3. Função para obter resumo financeiro do período
CREATE OR REPLACE FUNCTION public.get_financial_period_summary(
    p_start_date DATE,
    p_end_date DATE,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_receivables_total DECIMAL := 0;
    v_debts_total DECIMAL := 0;
    v_net_flow DECIMAL := 0;
    v_transactions_income DECIMAL := 0;
    v_transactions_expense DECIMAL := 0;
    v_result JSON;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Total de pagamentos a receber no período
    SELECT COALESCE(SUM(amount), 0) INTO v_receivables_total
    FROM public.receivable_payments
    WHERE user_id = p_user_id
        AND due_date >= p_start_date
        AND due_date <= p_end_date;
    
    -- Total de dívidas no período
    SELECT COALESCE(SUM(amount), 0) INTO v_debts_total
    FROM public.debts
    WHERE user_id = p_user_id
        AND due_date >= p_start_date
        AND due_date <= p_end_date;
    
    -- Transações de receita no período
    SELECT COALESCE(SUM(amount), 0) INTO v_transactions_income
    FROM public.transactions
    WHERE user_id = p_user_id
        AND type = 'income'
        AND date >= p_start_date
        AND date <= p_end_date;
    
    -- Transações de despesa no período
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_transactions_expense
    FROM public.transactions
    WHERE user_id = p_user_id
        AND type = 'expense'
        AND date >= p_start_date
        AND date <= p_end_date;
    
    -- Fluxo líquido = Receitas - Despesas
    v_net_flow := v_transactions_income - v_transactions_expense;
    
    RETURN json_build_object(
        'success', true,
        'period', json_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'receivables', json_build_object(
            'total', v_receivables_total,
            'description', 'Total de pagamentos a receber no período'
        ),
        'debts', json_build_object(
            'total', v_debts_total,
            'description', 'Total de dívidas no período'
        ),
        'transactions', json_build_object(
            'income', v_transactions_income,
            'expense', v_transactions_expense,
            'net_flow', v_net_flow
        ),
        'summary', json_build_object(
            'expected_income', v_receivables_total,
            'expected_expenses', v_debts_total,
            'actual_income', v_transactions_income,
            'actual_expenses', v_transactions_expense,
            'net_flow', v_net_flow
        )
    );
END;
$$;

-- 4. Função para verificar inconsistências de período
CREATE OR REPLACE FUNCTION public.check_period_inconsistencies(
    p_start_date DATE,
    p_end_date DATE,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inconsistencies JSON[] := '{}';
    v_inconsistency_count INTEGER := 0;
    v_receivable RECORD;
    v_debt RECORD;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Verificar pagamentos a receber com status incorreto
    FOR v_receivable IN 
        SELECT id, description, due_date, status
        FROM public.receivable_payments
        WHERE user_id = p_user_id
            AND due_date >= p_start_date
            AND due_date <= p_end_date
            AND (
                (status = 'pending' AND due_date < CURRENT_DATE) OR
                (status = 'received' AND due_date > CURRENT_DATE + INTERVAL '30 days')
            )
    LOOP
        v_inconsistency_count := v_inconsistency_count + 1;
        
        v_inconsistencies := array_append(v_inconsistencies,
            json_build_object(
                'type', 'receivable',
                'id', v_receivable.id,
                'description', v_receivable.description,
                'due_date', v_receivable.due_date,
                'current_status', v_receivable.status,
                'expected_status', CASE 
                    WHEN v_receivable.due_date < CURRENT_DATE THEN 'overdue'
                    ELSE 'pending'
                END,
                'issue', 'Status não reflete a data de vencimento'
            )
        );
    END LOOP;
    
    -- Verificar dívidas com status incorreto
    FOR v_debt IN 
        SELECT id, description, due_date, status
        FROM public.debts
        WHERE user_id = p_user_id
            AND due_date >= p_start_date
            AND due_date <= p_end_date
            AND (
                (status = 'pending' AND due_date < CURRENT_DATE) OR
                (status = 'paid' AND due_date > CURRENT_DATE + INTERVAL '30 days')
            )
    LOOP
        v_inconsistency_count := v_inconsistency_count + 1;
        
        v_inconsistencies := array_append(v_inconsistencies,
            json_build_object(
                'type', 'debt',
                'id', v_debt.id,
                'description', v_debt.description,
                'due_date', v_debt.due_date,
                'current_status', v_debt.status,
                'expected_status', CASE 
                    WHEN v_debt.due_date < CURRENT_DATE THEN 'overdue'
                    ELSE 'pending'
                END,
                'issue', 'Status não reflete a data de vencimento'
            )
        );
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'period', json_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'inconsistency_count', v_inconsistency_count,
        'inconsistencies', v_inconsistencies,
        'message', CASE 
            WHEN v_inconsistency_count = 0 THEN 'Nenhuma inconsistência encontrada'
            ELSE 'Inconsistências encontradas - recomenda-se correção'
        END
    );
END;
$$;

-- 5. Função para corrigir status automaticamente
CREATE OR REPLACE FUNCTION public.fix_period_status_inconsistencies(
    p_start_date DATE,
    p_end_date DATE,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_fixed_receivables INTEGER := 0;
    v_fixed_debts INTEGER := 0;
    v_result JSON;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Corrigir status de pagamentos a receber
    UPDATE public.receivable_payments
    SET 
        status = 'overdue',
        updated_at = NOW()
    WHERE user_id = p_user_id
        AND due_date >= p_start_date
        AND due_date <= p_end_date
        AND status = 'pending'
        AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS v_fixed_receivables = ROW_COUNT;
    
    -- Corrigir status de dívidas
    UPDATE public.debts
    SET 
        status = 'overdue',
        updated_at = NOW()
    WHERE user_id = p_user_id
        AND due_date >= p_start_date
        AND due_date <= p_end_date
        AND status = 'pending'
        AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS v_fixed_debts = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'period', json_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'fixed_receivables', v_fixed_receivables,
        'fixed_debts', v_fixed_debts,
        'total_fixed', v_fixed_receivables + v_fixed_debts,
        'message', 'Status corrigidos automaticamente'
    );
END;
$$;

-- Comentários das funções
COMMENT ON FUNCTION public.get_accounts_debts_by_period IS 'Obtém valores a receber e pagar por período com precisão';
COMMENT ON FUNCTION public.calculate_period_totals IS 'Calcula totais por período com status correto';
COMMENT ON FUNCTION public.get_financial_period_summary IS 'Obtém resumo financeiro completo do período';
COMMENT ON FUNCTION public.check_period_inconsistencies IS 'Verifica inconsistências de status por período';
COMMENT ON FUNCTION public.fix_period_status_inconsistencies IS 'Corrige status automaticamente por período';

