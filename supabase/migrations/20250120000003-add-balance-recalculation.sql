-- =====================================================
-- CORREÇÃO: Recálculo de Saldos
-- =====================================================
-- Este arquivo adiciona funções para recalcular saldos das contas
-- baseado nas transações, corrigindo inconsistências

-- 1. Função para recalcular saldo de uma conta específica
CREATE OR REPLACE FUNCTION public.recalculate_account_balance(
    p_account_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_account RECORD;
    v_initial_balance DECIMAL;
    v_calculated_balance DECIMAL;
    v_transaction_balance DECIMAL;
    v_old_balance DECIMAL;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Buscar dados da conta
    SELECT * INTO v_account
    FROM public.accounts
    WHERE id = p_account_id AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Conta não encontrada'
        );
    END IF;
    
    -- Saldo inicial da conta
    v_initial_balance := COALESCE(v_account.initial_balance, 0);
    v_old_balance := v_account.balance;
    
    -- Calcular saldo baseado em transações
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'income' THEN amount
            WHEN type = 'expense' THEN -amount
            ELSE 0
        END
    ), 0) INTO v_transaction_balance
    FROM public.transactions 
    WHERE account_id = p_account_id 
        AND user_id = v_user_id;
    
    -- Saldo calculado = Saldo inicial + Transações
    v_calculated_balance := v_initial_balance + v_transaction_balance;
    
    -- Atualizar saldo da conta
    UPDATE public.accounts 
    SET 
        balance = v_calculated_balance,
        updated_at = NOW()
    WHERE id = p_account_id AND user_id = v_user_id;
    
    RETURN json_build_object(
        'success', true,
        'account_id', p_account_id,
        'account_name', v_account.name,
        'old_balance', v_old_balance,
        'new_balance', v_calculated_balance,
        'initial_balance', v_initial_balance,
        'transaction_balance', v_transaction_balance,
        'difference', v_calculated_balance - v_old_balance,
        'message', 'Saldo recalculado com sucesso'
    );
END;
$$;

-- 2. Função para recalcular saldos de todas as contas do usuário
CREATE OR REPLACE FUNCTION public.recalculate_all_account_balances()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_account RECORD;
    v_results JSON[] := '{}';
    v_total_accounts INTEGER := 0;
    v_successful_recalculations INTEGER := 0;
    v_failed_recalculations INTEGER := 0;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Recalcular cada conta
    FOR v_account IN 
        SELECT id, name FROM public.accounts 
        WHERE user_id = v_user_id
    LOOP
        v_total_accounts := v_total_accounts + 1;
        
        -- Recalcular saldo da conta
        SELECT public.recalculate_account_balance(v_account.id) INTO v_result;
        
        -- Adicionar resultado ao array
        v_results := array_append(v_results, v_result);
        
        -- Contar sucessos e falhas
        IF (v_result->>'success')::boolean THEN
            v_successful_recalculations := v_successful_recalculations + 1;
        ELSE
            v_failed_recalculations := v_failed_recalculations + 1;
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'total_accounts', v_total_accounts,
        'successful_recalculations', v_successful_recalculations,
        'failed_recalculations', v_failed_recalculations,
        'results', v_results,
        'message', 'Recálculo de saldos concluído'
    );
END;
$$;

-- 3. Função para verificar inconsistências de saldo
CREATE OR REPLACE FUNCTION public.check_balance_inconsistencies()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_account RECORD;
    v_inconsistencies JSON[] := '{}';
    v_inconsistency_count INTEGER := 0;
    v_initial_balance DECIMAL;
    v_transaction_balance DECIMAL;
    v_calculated_balance DECIMAL;
    v_difference DECIMAL;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Verificar cada conta
    FOR v_account IN 
        SELECT * FROM public.accounts 
        WHERE user_id = v_user_id
    LOOP
        -- Saldo inicial da conta
        v_initial_balance := COALESCE(v_account.initial_balance, 0);
        
        -- Calcular saldo baseado em transações
        SELECT COALESCE(SUM(
            CASE 
                WHEN type = 'income' THEN amount
                WHEN type = 'expense' THEN -amount
                ELSE 0
            END
        ), 0) INTO v_transaction_balance
        FROM public.transactions 
        WHERE account_id = v_account.id 
            AND user_id = v_user_id;
        
        -- Saldo calculado
        v_calculated_balance := v_initial_balance + v_transaction_balance;
        
        -- Verificar diferença
        v_difference := v_calculated_balance - v_account.balance;
        
        -- Se há diferença significativa (> 0.01), adicionar à lista
        IF ABS(v_difference) > 0.01 THEN
            v_inconsistency_count := v_inconsistency_count + 1;
            
            v_inconsistencies := array_append(v_inconsistencies, 
                json_build_object(
                    'account_id', v_account.id,
                    'account_name', v_account.name,
                    'current_balance', v_account.balance,
                    'calculated_balance', v_calculated_balance,
                    'initial_balance', v_initial_balance,
                    'transaction_balance', v_transaction_balance,
                    'difference', v_difference,
                    'needs_recalculation', true
                )
            );
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'inconsistency_count', v_inconsistency_count,
        'inconsistencies', v_inconsistencies,
        'message', CASE 
            WHEN v_inconsistency_count = 0 THEN 'Nenhuma inconsistência encontrada'
            ELSE 'Inconsistências encontradas - recomenda-se recálculo'
        END
    );
END;
$$;

-- 4. Função para corrigir saldos inconsistentes automaticamente
CREATE OR REPLACE FUNCTION public.fix_balance_inconsistencies()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_inconsistencies JSON;
    v_fixed_count INTEGER := 0;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Verificar inconsistências
    SELECT public.check_balance_inconsistencies() INTO v_inconsistencies;
    
    -- Se não há inconsistências, retornar
    IF (v_inconsistencies->>'inconsistency_count')::integer = 0 THEN
        RETURN json_build_object(
            'success', true,
            'fixed_count', 0,
            'message', 'Nenhuma inconsistência encontrada'
        );
    END IF;
    
    -- Recalcular todos os saldos
    SELECT public.recalculate_all_account_balances() INTO v_result;
    
    -- Contar quantas foram corrigidas
    v_fixed_count := (v_inconsistencies->>'inconsistency_count')::integer;
    
    RETURN json_build_object(
        'success', true,
        'fixed_count', v_fixed_count,
        'recalculation_result', v_result,
        'message', 'Inconsistências corrigidas com sucesso'
    );
END;
$$;

-- 5. Função para obter histórico de saldo de uma conta
CREATE OR REPLACE FUNCTION public.get_account_balance_history(
    p_account_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_account RECORD;
    v_start_date DATE;
    v_balance_history JSON[] := '{}';
    v_daily_balance DECIMAL;
    v_transaction_date DATE;
    v_transaction RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Verificar se a conta existe e pertence ao usuário
    SELECT * INTO v_account
    FROM public.accounts
    WHERE id = p_account_id AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Conta não encontrada'
        );
    END IF;
    
    -- Data de início (p_days atrás)
    v_start_date := CURRENT_DATE - INTERVAL '1 day' * p_days;
    
    -- Saldo inicial
    v_daily_balance := COALESCE(v_account.initial_balance, 0);
    
    -- Processar transações por data
    FOR v_transaction IN 
        SELECT 
            date,
            type,
            amount,
            description
        FROM public.transactions
        WHERE account_id = p_account_id 
            AND user_id = v_user_id
            AND date >= v_start_date
        ORDER BY date ASC
    LOOP
        -- Aplicar transação ao saldo
        IF v_transaction.type = 'income' THEN
            v_daily_balance := v_daily_balance + v_transaction.amount;
        ELSE
            v_daily_balance := v_daily_balance - v_transaction.amount;
        END IF;
        
        -- Adicionar ao histórico
        v_balance_history := array_append(v_balance_history,
            json_build_object(
                'date', v_transaction.date,
                'balance', v_daily_balance,
                'transaction_type', v_transaction.type,
                'transaction_amount', v_transaction.amount,
                'transaction_description', v_transaction.description
            )
        );
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'account_id', p_account_id,
        'account_name', v_account.name,
        'period_days', p_days,
        'start_date', v_start_date,
        'end_date', CURRENT_DATE,
        'initial_balance', COALESCE(v_account.initial_balance, 0),
        'current_balance', v_account.balance,
        'calculated_balance', v_daily_balance,
        'balance_history', v_balance_history,
        'message', 'Histórico de saldo obtido com sucesso'
    );
END;
$$;

-- 6. Trigger para atualizar saldo automaticamente quando transação é inserida
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_amount DECIMAL;
BEGIN
    -- Calcular valor da transação
    IF NEW.type = 'income' THEN
        v_amount := NEW.amount;
    ELSE
        v_amount := -NEW.amount;
    END IF;
    
    -- Atualizar saldo da conta
    UPDATE public.accounts 
    SET 
        balance = balance + v_amount,
        updated_at = NOW()
    WHERE id = NEW.account_id AND user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

-- 7. Trigger para atualizar saldo automaticamente quando transação é deletada
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_amount DECIMAL;
BEGIN
    -- Calcular valor da transação (inverso)
    IF OLD.type = 'income' THEN
        v_amount := -OLD.amount;
    ELSE
        v_amount := OLD.amount;
    END IF;
    
    -- Atualizar saldo da conta
    UPDATE public.accounts 
    SET 
        balance = balance + v_amount,
        updated_at = NOW()
    WHERE id = OLD.account_id AND user_id = OLD.user_id;
    
    RETURN OLD;
END;
$$;

-- 8. Trigger para atualizar saldo automaticamente quando transação é atualizada
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_amount DECIMAL;
    v_new_amount DECIMAL;
    v_difference DECIMAL;
BEGIN
    -- Calcular diferença entre valores antigo e novo
    IF OLD.type = 'income' THEN
        v_old_amount := OLD.amount;
    ELSE
        v_old_amount := -OLD.amount;
    END IF;
    
    IF NEW.type = 'income' THEN
        v_new_amount := NEW.amount;
    ELSE
        v_new_amount := -NEW.amount;
    END IF;
    
    v_difference := v_new_amount - v_old_amount;
    
    -- Atualizar saldo da conta com a diferença
    UPDATE public.accounts 
    SET 
        balance = balance + v_difference,
        updated_at = NOW()
    WHERE id = NEW.account_id AND user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

-- Criar triggers (se não existirem)
DROP TRIGGER IF EXISTS trigger_update_account_balance_insert ON public.transactions;
CREATE TRIGGER trigger_update_account_balance_insert
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_account_balance_on_transaction();

DROP TRIGGER IF EXISTS trigger_update_account_balance_delete ON public.transactions;
CREATE TRIGGER trigger_update_account_balance_delete
    AFTER DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_account_balance_on_transaction_delete();

DROP TRIGGER IF EXISTS trigger_update_account_balance_update ON public.transactions;
CREATE TRIGGER trigger_update_account_balance_update
    AFTER UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_account_balance_on_transaction_update();

-- Comentários das funções
COMMENT ON FUNCTION public.recalculate_account_balance IS 'Recalcula saldo de uma conta específica baseado nas transações';
COMMENT ON FUNCTION public.recalculate_all_account_balances IS 'Recalcula saldos de todas as contas do usuário';
COMMENT ON FUNCTION public.check_balance_inconsistencies IS 'Verifica inconsistências de saldo entre conta e transações';
COMMENT ON FUNCTION public.fix_balance_inconsistencies IS 'Corrige automaticamente inconsistências de saldo';
COMMENT ON FUNCTION public.get_account_balance_history IS 'Obtém histórico de saldo de uma conta';
COMMENT ON FUNCTION public.update_account_balance_on_transaction IS 'Atualiza saldo automaticamente ao inserir transação';
COMMENT ON FUNCTION public.update_account_balance_on_transaction_delete IS 'Atualiza saldo automaticamente ao deletar transação';
COMMENT ON FUNCTION public.update_account_balance_on_transaction_update IS 'Atualiza saldo automaticamente ao atualizar transação';

