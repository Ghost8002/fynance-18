-- Função para atualização atômica do limite usado do cartão
CREATE OR REPLACE FUNCTION update_card_used_amount_atomic(
    p_card_id UUID,
    p_amount DECIMAL,
    p_operation TEXT DEFAULT 'add' -- 'add' ou 'subtract'
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_current_used DECIMAL;
    v_credit_limit DECIMAL;
    v_new_used DECIMAL;
BEGIN
    -- Validar autenticação
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar propriedade do cartão
    SELECT user_id, used_amount, credit_limit INTO v_user_id, v_current_used, v_credit_limit
    FROM public.cards WHERE id = p_card_id;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;
    
    -- Calcular novo valor usado
    IF p_operation = 'add' THEN
        v_new_used := v_current_used + p_amount;
    ELSE
        v_new_used := GREATEST(0, v_current_used - p_amount);
    END IF;
    
    -- Validar se não excede o limite
    IF v_new_used > v_credit_limit THEN
        RAISE EXCEPTION 'Operação excederia o limite do cartão';
    END IF;
    
    -- Atualizar de forma atômica
    UPDATE public.cards 
    SET used_amount = v_new_used, updated_at = NOW()
    WHERE id = p_card_id AND user_id = auth.uid();
    
    -- Registrar no histórico
    INSERT INTO public.card_limit_history (
        user_id, card_id, movement_type, amount, 
        previous_used_amount, new_used_amount, description
    ) VALUES (
        v_user_id, p_card_id, 
        CASE WHEN p_operation = 'add' THEN 'charge' ELSE 'payment' END,
        p_amount, v_current_used, v_new_used,
        CASE WHEN p_operation = 'add' THEN 'Compra no cartão' ELSE 'Pagamento do cartão' END
    );
END;
$$ LANGUAGE plpgsql;

-- Função para criar compra parcelada de forma atômica
CREATE OR REPLACE FUNCTION create_installment_purchase(
    p_user_id UUID,
    p_transactions JSONB,
    p_card_id UUID,
    p_total_amount DECIMAL
) RETURNS UUID AS $$
DECLARE
    v_parent_id UUID;
    v_transaction JSONB;
    v_card_user_id UUID;
    v_current_used DECIMAL;
    v_credit_limit DECIMAL;
    v_new_used DECIMAL;
BEGIN
    -- Validar autenticação
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;
    
    -- Verificar propriedade do cartão e validar limite
    SELECT user_id, used_amount, credit_limit INTO v_card_user_id, v_current_used, v_credit_limit
    FROM public.cards WHERE id = p_card_id;
    
    IF v_card_user_id != p_user_id THEN
        RAISE EXCEPTION 'Cartão não pertence ao usuário';
    END IF;
    
    v_new_used := v_current_used + p_total_amount;
    IF v_new_used > v_credit_limit THEN
        RAISE EXCEPTION 'Compra excederia o limite do cartão';
    END IF;
    
    -- Inserir transações em uma transação atômica
    BEGIN
        -- Inserir primeira transação (parent)
        INSERT INTO public.transactions (
            user_id, type, description, amount, category_id, card_id, 
            date, notes, installments_count, installment_number, tags
        ) VALUES (
            p_user_id,
            (p_transactions->0->>'type')::TEXT,
            p_transactions->0->>'description',
            (p_transactions->0->>'amount')::DECIMAL,
            (p_transactions->0->>'category_id')::UUID,
            p_card_id,
            p_transactions->0->>'date',
            p_transactions->0->>'notes',
            (p_transactions->0->>'installments_count')::INTEGER,
            (p_transactions->0->>'installment_number')::INTEGER,
            (p_transactions->0->>'tags')::JSONB
        ) RETURNING id INTO v_parent_id;
        
        -- Inserir transações filhas
        FOR i IN 1..jsonb_array_length(p_transactions)-1 LOOP
            v_transaction := p_transactions->i;
            
            INSERT INTO public.transactions (
                user_id, type, description, amount, category_id, card_id, 
                date, notes, installments_count, installment_number, 
                parent_transaction_id, tags
            ) VALUES (
                p_user_id,
                (v_transaction->>'type')::TEXT,
                v_transaction->>'description',
                (v_transaction->>'amount')::DECIMAL,
                (v_transaction->>'category_id')::UUID,
                p_card_id,
                v_transaction->>'date',
                v_transaction->>'notes',
                (v_transaction->>'installments_count')::INTEGER,
                (v_transaction->>'installment_number')::INTEGER,
                v_parent_id,
                (v_transaction->>'tags')::JSONB
            );
        END LOOP;
        
        -- Atualizar limite usado do cartão
        UPDATE public.cards 
        SET used_amount = v_new_used, updated_at = NOW()
        WHERE id = p_card_id;
        
        -- Registrar no histórico
        INSERT INTO public.card_limit_history (
            user_id, card_id, movement_type, amount, 
            previous_used_amount, new_used_amount, description
        ) VALUES (
            p_user_id, p_card_id, 'charge', p_total_amount,
            v_current_used, v_new_used, 'Compra parcelada'
        );
        
        RETURN v_parent_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback automático em caso de erro
            RAISE EXCEPTION 'Erro ao criar compra parcelada: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Função para processar pagamento de cartão com validações de segurança
CREATE OR REPLACE FUNCTION process_card_payment_secure(
    p_card_id UUID,
    p_amount DECIMAL,
    p_account_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT 'Card payment'
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_previous_used DECIMAL;
    v_new_used DECIMAL;
    v_account_user_id UUID;
BEGIN
    -- Validar autenticação
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar propriedade do cartão
    SELECT user_id, used_amount INTO v_user_id, v_previous_used
    FROM public.cards WHERE id = p_card_id;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;
    
    -- Validar valor do pagamento
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Valor do pagamento deve ser positivo';
    END IF;
    
    v_new_used := GREATEST(0, v_previous_used - p_amount);
    
    -- Verificar propriedade da conta se especificada
    IF p_account_id IS NOT NULL THEN
        SELECT user_id INTO v_account_user_id
        FROM public.accounts WHERE id = p_account_id;
        
        IF v_account_user_id != auth.uid() THEN
            RAISE EXCEPTION 'Conta não pertence ao usuário';
        END IF;
    END IF;
    
    -- Atualizar cartão
    UPDATE public.cards 
    SET used_amount = v_new_used, updated_at = NOW()
    WHERE id = p_card_id;
    
    -- Registrar no histórico
    INSERT INTO public.card_limit_history (
        user_id, card_id, movement_type, amount, 
        previous_used_amount, new_used_amount, description
    ) VALUES (
        v_user_id, p_card_id, 'payment', p_amount,
        v_previous_used, v_new_used, p_description
    );
    
    -- Atualizar saldo da conta se especificada
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE id = p_account_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_date ON public.transactions(card_id, date);
CREATE INDEX IF NOT EXISTS idx_card_bills_card_month_year ON public.card_bills(card_id, bill_month, bill_year);
CREATE INDEX IF NOT EXISTS idx_card_limit_history_card_id ON public.card_limit_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_limit_history_created_at ON public.card_limit_history(created_at DESC); 