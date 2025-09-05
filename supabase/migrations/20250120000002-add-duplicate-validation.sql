-- =====================================================
-- CORREÇÃO: Validação de Duplicidade
-- =====================================================
-- Este arquivo adiciona validações para evitar criação de dívidas/contas duplicadas

-- 1. Função para validar duplicidade de dívidas
CREATE OR REPLACE FUNCTION public.validate_debt_duplicate(
    p_description TEXT,
    p_amount DECIMAL,
    p_due_date DATE,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN
    -- Verificar se já existe uma dívida com as mesmas características
    SELECT COUNT(*) INTO v_duplicate_count
    FROM public.debts
    WHERE user_id = p_user_id
        AND description = p_description
        AND amount = p_amount
        AND due_date = p_due_date
        AND status != 'paid'; -- Não considerar dívidas já pagas
    
    -- Retorna true se encontrar duplicata
    RETURN v_duplicate_count > 0;
END;
$$;

-- 2. Função para validar duplicidade de pagamentos a receber
CREATE OR REPLACE FUNCTION public.validate_receivable_duplicate(
    p_description TEXT,
    p_amount DECIMAL,
    p_due_date DATE,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN
    -- Verificar se já existe um pagamento com as mesmas características
    SELECT COUNT(*) INTO v_duplicate_count
    FROM public.receivable_payments
    WHERE user_id = p_user_id
        AND description = p_description
        AND amount = p_amount
        AND due_date = p_due_date
        AND status != 'received'; -- Não considerar pagamentos já recebidos
    
    -- Retorna true se encontrar duplicata
    RETURN v_duplicate_count > 0;
END;
$$;

-- 3. Função para criar dívida com validação de duplicidade
CREATE OR REPLACE FUNCTION public.create_debt_with_validation(
    p_description TEXT,
    p_amount DECIMAL,
    p_due_date DATE,
    p_account_id UUID DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_is_recurring BOOLEAN DEFAULT FALSE,
    p_recurrence_type TEXT DEFAULT NULL,
    p_max_occurrences INTEGER DEFAULT NULL,
    p_recurrence_end_date DATE DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_debt_id UUID;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Validar duplicidade
    IF validate_debt_duplicate(p_description, p_amount, p_due_date, v_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'DUPLICATE',
            'message', 'Já existe uma dívida com essas características'
        );
    END IF;
    
    -- Validar se a conta pertence ao usuário
    IF p_account_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE id = p_account_id AND user_id = v_user_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'INVALID_ACCOUNT',
            'message', 'Conta não encontrada ou não pertence ao usuário'
        );
    END IF;
    
    -- Validar se a categoria pertence ao usuário
    IF p_category_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.categories 
        WHERE id = p_category_id AND user_id = v_user_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'INVALID_CATEGORY',
            'message', 'Categoria não encontrada ou não pertence ao usuário'
        );
    END IF;
    
    BEGIN
        -- Criar a dívida
        INSERT INTO public.debts (
            user_id,
            description,
            amount,
            due_date,
            account_id,
            category_id,
            notes,
            is_recurring,
            recurrence_type,
            max_occurrences,
            recurrence_end_date,
            status
        ) VALUES (
            v_user_id,
            p_description,
            p_amount,
            p_due_date,
            p_account_id,
            p_category_id,
            p_notes,
            p_is_recurring,
            p_recurrence_type,
            p_max_occurrences,
            p_recurrence_end_date,
            'pending'
        ) RETURNING id INTO v_debt_id;
        
        RETURN json_build_object(
            'success', true,
            'debt_id', v_debt_id,
            'message', 'Dívida criada com sucesso'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao criar dívida'
            );
    END;
END;
$$;

-- 4. Função para criar pagamento a receber com validação de duplicidade
CREATE OR REPLACE FUNCTION public.create_receivable_with_validation(
    p_description TEXT,
    p_amount DECIMAL,
    p_due_date DATE,
    p_account_id UUID DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_is_recurring BOOLEAN DEFAULT FALSE,
    p_recurrence_type TEXT DEFAULT NULL,
    p_max_occurrences INTEGER DEFAULT NULL,
    p_recurrence_end_date DATE DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_receivable_id UUID;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Validar duplicidade
    IF validate_receivable_duplicate(p_description, p_amount, p_due_date, v_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'DUPLICATE',
            'message', 'Já existe um pagamento com essas características'
        );
    END IF;
    
    -- Validar se a conta pertence ao usuário
    IF p_account_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE id = p_account_id AND user_id = v_user_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'INVALID_ACCOUNT',
            'message', 'Conta não encontrada ou não pertence ao usuário'
        );
    END IF;
    
    -- Validar se a categoria pertence ao usuário
    IF p_category_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.categories 
        WHERE id = p_category_id AND user_id = v_user_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'INVALID_CATEGORY',
            'message', 'Categoria não encontrada ou não pertence ao usuário'
        );
    END IF;
    
    BEGIN
        -- Criar o pagamento
        INSERT INTO public.receivable_payments (
            user_id,
            description,
            amount,
            due_date,
            account_id,
            category_id,
            notes,
            is_recurring,
            recurrence_type,
            max_occurrences,
            recurrence_end_date,
            status
        ) VALUES (
            v_user_id,
            p_description,
            p_amount,
            p_due_date,
            p_account_id,
            p_category_id,
            p_notes,
            p_is_recurring,
            p_recurrence_type,
            p_max_occurrences,
            p_recurrence_end_date,
            'pending'
        ) RETURNING id INTO v_receivable_id;
        
        RETURN json_build_object(
            'success', true,
            'receivable_id', v_receivable_id,
            'message', 'Pagamento criado com sucesso'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao criar pagamento'
            );
    END;
END;
$$;

-- 5. Função para verificar e limpar duplicatas existentes
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_debts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_duplicate_count INTEGER := 0;
    v_cleaned_count INTEGER := 0;
    v_debt RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Encontrar duplicatas (manter apenas a mais recente)
    FOR v_debt IN 
        SELECT 
            description,
            amount,
            due_date,
            MIN(created_at) as oldest_created_at,
            COUNT(*) as duplicate_count
        FROM public.debts
        WHERE user_id = v_user_id
            AND status = 'pending'
        GROUP BY description, amount, due_date
        HAVING COUNT(*) > 1
    LOOP
        v_duplicate_count := v_duplicate_count + v_debt.duplicate_count;
        
        -- Deletar duplicatas antigas, mantendo apenas a mais recente
        DELETE FROM public.debts
        WHERE user_id = v_user_id
            AND description = v_debt.description
            AND amount = v_debt.amount
            AND due_date = v_debt.due_date
            AND status = 'pending'
            AND created_at = v_debt.oldest_created_at;
            
        v_cleaned_count := v_cleaned_count + (v_debt.duplicate_count - 1);
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'duplicate_count', v_duplicate_count,
        'cleaned_count', v_cleaned_count,
        'message', 'Limpeza de duplicatas concluída'
    );
END;
$$;

-- 6. Função para verificar e limpar duplicatas de pagamentos a receber
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_receivables()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_duplicate_count INTEGER := 0;
    v_cleaned_count INTEGER := 0;
    v_receivable RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Encontrar duplicatas (manter apenas a mais recente)
    FOR v_receivable IN 
        SELECT 
            description,
            amount,
            due_date,
            MIN(created_at) as oldest_created_at,
            COUNT(*) as duplicate_count
        FROM public.receivable_payments
        WHERE user_id = v_user_id
            AND status = 'pending'
        GROUP BY description, amount, due_date
        HAVING COUNT(*) > 1
    LOOP
        v_duplicate_count := v_duplicate_count + v_receivable.duplicate_count;
        
        -- Deletar duplicatas antigas, mantendo apenas a mais recente
        DELETE FROM public.receivable_payments
        WHERE user_id = v_user_id
            AND description = v_receivable.description
            AND amount = v_receivable.amount
            AND due_date = v_receivable.due_date
            AND status = 'pending'
            AND created_at = v_receivable.oldest_created_at;
            
        v_cleaned_count := v_cleaned_count + (v_receivable.duplicate_count - 1);
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'duplicate_count', v_duplicate_count,
        'cleaned_count', v_cleaned_count,
        'message', 'Limpeza de duplicatas concluída'
    );
END;
$$;

-- Comentários das funções
COMMENT ON FUNCTION public.validate_debt_duplicate IS 'Valida se já existe uma dívida duplicada';
COMMENT ON FUNCTION public.validate_receivable_duplicate IS 'Valida se já existe um pagamento duplicado';
COMMENT ON FUNCTION public.create_debt_with_validation IS 'Cria dívida com validação de duplicidade';
COMMENT ON FUNCTION public.create_receivable_with_validation IS 'Cria pagamento com validação de duplicidade';
COMMENT ON FUNCTION public.cleanup_duplicate_debts IS 'Remove duplicatas de dívidas existentes';
COMMENT ON FUNCTION public.cleanup_duplicate_receivables IS 'Remove duplicatas de pagamentos existentes';

