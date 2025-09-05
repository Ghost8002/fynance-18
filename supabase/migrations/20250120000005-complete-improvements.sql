-- =====================================================
-- MELHORIAS COMPLETAS: Contas e Dívidas
-- =====================================================
-- Este arquivo aplica todas as melhorias identificadas na análise crítica

-- 1. Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_debts_user_due_date ON public.debts(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_debts_user_status ON public.debts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_debts_user_description ON public.debts(user_id, description);

CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_due_date ON public.receivable_payments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_status ON public.receivable_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_description ON public.receivable_payments(user_id, description);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON public.transactions(user_id, account_id);

-- 2. Adicionar constraints para evitar dados inválidos
ALTER TABLE public.debts 
ADD CONSTRAINT IF NOT EXISTS check_debt_amount_positive 
CHECK (amount > 0);

ALTER TABLE public.receivable_payments 
ADD CONSTRAINT IF NOT EXISTS check_receivable_amount_positive 
CHECK (amount > 0);

ALTER TABLE public.debts 
ADD CONSTRAINT IF NOT EXISTS check_debt_due_date_not_future 
CHECK (due_date <= CURRENT_DATE + INTERVAL '10 years');

ALTER TABLE public.receivable_payments 
ADD CONSTRAINT IF NOT EXISTS check_receivable_due_date_not_future 
CHECK (due_date <= CURRENT_DATE + INTERVAL '10 years');

-- 3. Função para limpeza geral do sistema
CREATE OR REPLACE FUNCTION public.cleanup_accounts_debts_system()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_results JSON := '{}';
    v_duplicate_debts JSON;
    v_duplicate_receivables JSON;
    v_balance_inconsistencies JSON;
    v_period_inconsistencies JSON;
    v_fixed_balances JSON;
    v_fixed_periods JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- 1. Limpar duplicatas
    SELECT public.cleanup_duplicate_debts() INTO v_duplicate_debts;
    SELECT public.cleanup_duplicate_receivables() INTO v_duplicate_receivables;
    
    -- 2. Verificar e corrigir inconsistências de saldo
    SELECT public.check_balance_inconsistencies() INTO v_balance_inconsistencies;
    SELECT public.fix_balance_inconsistencies() INTO v_fixed_balances;
    
    -- 3. Verificar e corrigir inconsistências de período
    SELECT public.check_period_inconsistencies(
        CURRENT_DATE - INTERVAL '1 year',
        CURRENT_DATE + INTERVAL '1 year'
    ) INTO v_period_inconsistencies;
    
    SELECT public.fix_period_status_inconsistencies(
        CURRENT_DATE - INTERVAL '1 year',
        CURRENT_DATE + INTERVAL '1 year'
    ) INTO v_fixed_periods;
    
    -- Compilar resultados
    v_results := json_build_object(
        'success', true,
        'user_id', v_user_id,
        'cleanup_date', CURRENT_TIMESTAMP,
        'duplicate_cleanup', json_build_object(
            'debts', v_duplicate_debts,
            'receivables', v_duplicate_receivables
        ),
        'balance_fixes', json_build_object(
            'inconsistencies_found', v_balance_inconsistencies,
            'fixes_applied', v_fixed_balances
        ),
        'period_fixes', json_build_object(
            'inconsistencies_found', v_period_inconsistencies,
            'fixes_applied', v_fixed_periods
        ),
        'message', 'Limpeza e correções aplicadas com sucesso'
    );
    
    RETURN v_results;
END;
$$;

-- 4. Função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION public.get_accounts_debts_statistics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_stats JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    SELECT json_build_object(
        'success', true,
        'user_id', v_user_id,
        'generated_at', CURRENT_TIMESTAMP,
        'debts', json_build_object(
            'total_count', (SELECT COUNT(*) FROM public.debts WHERE user_id = v_user_id),
            'pending_count', (SELECT COUNT(*) FROM public.debts WHERE user_id = v_user_id AND status = 'pending'),
            'overdue_count', (SELECT COUNT(*) FROM public.debts WHERE user_id = v_user_id AND status = 'pending' AND due_date < CURRENT_DATE),
            'paid_count', (SELECT COUNT(*) FROM public.debts WHERE user_id = v_user_id AND status = 'paid'),
            'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.debts WHERE user_id = v_user_id),
            'pending_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.debts WHERE user_id = v_user_id AND status = 'pending'),
            'overdue_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.debts WHERE user_id = v_user_id AND status = 'pending' AND due_date < CURRENT_DATE),
            'recurring_count', (SELECT COUNT(*) FROM public.debts WHERE user_id = v_user_id AND is_recurring = true)
        ),
        'receivables', json_build_object(
            'total_count', (SELECT COUNT(*) FROM public.receivable_payments WHERE user_id = v_user_id),
            'pending_count', (SELECT COUNT(*) FROM public.receivable_payments WHERE user_id = v_user_id AND status = 'pending'),
            'overdue_count', (SELECT COUNT(*) FROM public.receivable_payments WHERE user_id = v_user_id AND status = 'pending' AND due_date < CURRENT_DATE),
            'received_count', (SELECT COUNT(*) FROM public.receivable_payments WHERE user_id = v_user_id AND status = 'received'),
            'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.receivable_payments WHERE user_id = v_user_id),
            'pending_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.receivable_payments WHERE user_id = v_user_id AND status = 'pending'),
            'overdue_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.receivable_payments WHERE user_id = v_user_id AND status = 'pending' AND due_date < CURRENT_DATE),
            'recurring_count', (SELECT COUNT(*) FROM public.receivable_payments WHERE user_id = v_user_id AND is_recurring = true)
        ),
        'accounts', json_build_object(
            'total_count', (SELECT COUNT(*) FROM public.accounts WHERE user_id = v_user_id),
            'total_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.accounts WHERE user_id = v_user_id)
        ),
        'transactions', json_build_object(
            'total_count', (SELECT COUNT(*) FROM public.transactions WHERE user_id = v_user_id),
            'income_count', (SELECT COUNT(*) FROM public.transactions WHERE user_id = v_user_id AND type = 'income'),
            'expense_count', (SELECT COUNT(*) FROM public.transactions WHERE user_id = v_user_id AND type = 'expense'),
            'total_income', (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE user_id = v_user_id AND type = 'income'),
            'total_expense', (SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.transactions WHERE user_id = v_user_id AND type = 'expense')
        )
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$;

-- 5. Função para validar integridade do sistema
CREATE OR REPLACE FUNCTION public.validate_system_integrity()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_issues JSON[] := '{}';
    v_issue_count INTEGER := 0;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Verificar duplicatas
    IF EXISTS (
        SELECT 1 FROM public.debts 
        WHERE user_id = v_user_id 
        GROUP BY description, amount, due_date 
        HAVING COUNT(*) > 1
    ) THEN
        v_issue_count := v_issue_count + 1;
        v_issues := array_append(v_issues, 
            json_build_object(
                'type', 'duplicate_debts',
                'severity', 'medium',
                'description', 'Existem dívidas duplicadas no sistema'
            )
        );
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM public.receivable_payments 
        WHERE user_id = v_user_id 
        GROUP BY description, amount, due_date 
        HAVING COUNT(*) > 1
    ) THEN
        v_issue_count := v_issue_count + 1;
        v_issues := array_append(v_issues, 
            json_build_object(
                'type', 'duplicate_receivables',
                'severity', 'medium',
                'description', 'Existem pagamentos duplicados no sistema'
            )
        );
    END IF;
    
    -- Verificar inconsistências de saldo
    IF EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.user_id = v_user_id
        AND ABS(a.balance - (
            COALESCE(a.initial_balance, 0) + 
            COALESCE((
                SELECT SUM(
                    CASE 
                        WHEN t.type = 'income' THEN t.amount
                        WHEN t.type = 'expense' THEN -t.amount
                        ELSE 0
                    END
                )
                FROM public.transactions t
                WHERE t.account_id = a.id AND t.user_id = v_user_id
            ), 0)
        )) > 0.01
    ) THEN
        v_issue_count := v_issue_count + 1;
        v_issues := array_append(v_issues, 
            json_build_object(
                'type', 'balance_inconsistency',
                'severity', 'high',
                'description', 'Existem inconsistências de saldo nas contas'
            )
        );
    END IF;
    
    -- Verificar status incorretos
    IF EXISTS (
        SELECT 1 FROM public.debts 
        WHERE user_id = v_user_id 
        AND status = 'pending' 
        AND due_date < CURRENT_DATE - INTERVAL '1 day'
    ) THEN
        v_issue_count := v_issue_count + 1;
        v_issues := array_append(v_issues, 
            json_build_object(
                'type', 'incorrect_debt_status',
                'severity', 'low',
                'description', 'Existem dívidas com status incorreto (deveriam estar em atraso)'
            )
        );
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM public.receivable_payments 
        WHERE user_id = v_user_id 
        AND status = 'pending' 
        AND due_date < CURRENT_DATE - INTERVAL '1 day'
    ) THEN
        v_issue_count := v_issue_count + 1;
        v_issues := array_append(v_issues, 
            json_build_object(
                'type', 'incorrect_receivable_status',
                'severity', 'low',
                'description', 'Existem pagamentos com status incorreto (deveriam estar em atraso)'
            )
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'validated_at', CURRENT_TIMESTAMP,
        'issue_count', v_issue_count,
        'issues', v_issues,
        'status', CASE 
            WHEN v_issue_count = 0 THEN 'healthy'
            WHEN v_issue_count <= 2 THEN 'warning'
            ELSE 'critical'
        END,
        'message', CASE 
            WHEN v_issue_count = 0 THEN 'Sistema íntegro - nenhum problema encontrado'
            ELSE 'Problemas encontrados - recomenda-se correção'
        END
    );
END;
$$;

-- 6. Função para aplicar todas as correções automaticamente
CREATE OR REPLACE FUNCTION public.apply_all_fixes()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_results JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Aplicar limpeza geral
    SELECT public.cleanup_accounts_debts_system() INTO v_results;
    
    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'applied_at', CURRENT_TIMESTAMP,
        'cleanup_results', v_results,
        'message', 'Todas as correções foram aplicadas com sucesso'
    );
END;
$$;

-- Comentários das funções
COMMENT ON FUNCTION public.cleanup_accounts_debts_system IS 'Aplica limpeza geral e correções no sistema de contas e dívidas';
COMMENT ON FUNCTION public.get_accounts_debts_statistics IS 'Obtém estatísticas completas do sistema';
COMMENT ON FUNCTION public.validate_system_integrity IS 'Valida integridade do sistema e identifica problemas';
COMMENT ON FUNCTION public.apply_all_fixes IS 'Aplica todas as correções automaticamente';

-- 7. Criar view para relatório de contas e dívidas
CREATE OR REPLACE VIEW public.accounts_debts_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT d.id) as total_debts,
    COUNT(DISTINCT CASE WHEN d.status = 'pending' THEN d.id END) as pending_debts,
    COUNT(DISTINCT CASE WHEN d.status = 'paid' THEN d.id END) as paid_debts,
    COUNT(DISTINCT CASE WHEN d.status = 'pending' AND d.due_date < CURRENT_DATE THEN d.id END) as overdue_debts,
    COALESCE(SUM(d.amount), 0) as total_debt_amount,
    COALESCE(SUM(CASE WHEN d.status = 'pending' THEN d.amount ELSE 0 END), 0) as pending_debt_amount,
    COALESCE(SUM(CASE WHEN d.status = 'pending' AND d.due_date < CURRENT_DATE THEN d.amount ELSE 0 END), 0) as overdue_debt_amount,
    COUNT(DISTINCT r.id) as total_receivables,
    COUNT(DISTINCT CASE WHEN r.status = 'pending' THEN r.id END) as pending_receivables,
    COUNT(DISTINCT CASE WHEN r.status = 'received' THEN r.id END) as received_receivables,
    COUNT(DISTINCT CASE WHEN r.status = 'pending' AND r.due_date < CURRENT_DATE THEN r.id END) as overdue_receivables,
    COALESCE(SUM(r.amount), 0) as total_receivable_amount,
    COALESCE(SUM(CASE WHEN r.status = 'pending' THEN r.amount ELSE 0 END), 0) as pending_receivable_amount,
    COALESCE(SUM(CASE WHEN r.status = 'pending' AND r.due_date < CURRENT_DATE THEN r.amount ELSE 0 END), 0) as overdue_receivable_amount,
    COUNT(DISTINCT a.id) as total_accounts,
    COALESCE(SUM(a.balance), 0) as total_account_balance
FROM auth.users u
LEFT JOIN public.debts d ON u.id = d.user_id
LEFT JOIN public.receivable_payments r ON u.id = r.user_id
LEFT JOIN public.accounts a ON u.id = a.user_id
GROUP BY u.id, u.email;

COMMENT ON VIEW public.accounts_debts_summary IS 'Resumo consolidado de contas e dívidas por usuário';

