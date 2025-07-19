-- Função para marcar dívida como paga com rollback automático
CREATE OR REPLACE FUNCTION mark_debt_as_paid_with_rollback(
  p_debt_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_account_id UUID,
  p_category_id UUID,
  p_is_recurring BOOLEAN,
  p_recurrence_type TEXT,
  p_due_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id UUID;
  v_next_debt_id UUID;
  v_result JSON;
  v_current_user_id UUID;
BEGIN
  -- Verificar se o usuário está autenticado e é o dono da dívida
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado',
      'message', 'É necessário estar logado para realizar esta operação.'
    );
  END IF;

  -- Verificar se a dívida pertence ao usuário
  IF NOT EXISTS (SELECT 1 FROM debts WHERE id = p_debt_id AND user_id = v_current_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Dívida não encontrada',
      'message', 'Dívida não encontrada ou não pertence ao usuário.'
    );
  END IF;

  -- Verificar se a conta pertence ao usuário
  IF p_account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_account_id AND user_id = v_current_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Conta não encontrada',
      'message', 'Conta não encontrada ou não pertence ao usuário.'
    );
  END IF;

  -- Iniciar transação
  BEGIN
    -- 1. Criar transação
    INSERT INTO transactions (
      user_id,
      type,
      description,
      amount,
      date,
      category_id,
      account_id,
      card_id,
      notes
    ) VALUES (
      v_current_user_id,
      'expense',
      p_description,
      -ABS(p_amount),
      CURRENT_DATE,
      p_category_id,
      p_account_id,
      NULL,
      'Transação gerada automaticamente a partir da dívida paga. Data de vencimento original: ' || 
      TO_CHAR(p_due_date, 'DD/MM/YYYY') ||
      CASE 
        WHEN p_is_recurring THEN 
          ' (Dívida recorrente - ' || 
          CASE p_recurrence_type
            WHEN 'weekly' THEN 'Semanal'
            WHEN 'monthly' THEN 'Mensal'
            WHEN 'yearly' THEN 'Anual'
            ELSE 'Recorrente'
          END || ')'
        ELSE ''
      END
    ) RETURNING id INTO v_transaction_id;

    -- 2. Atualizar status da dívida
    UPDATE debts 
    SET 
      status = 'paid',
      paid_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = p_debt_id AND user_id = v_current_user_id;

    -- 3. Atualizar saldo da conta
    IF p_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET 
        balance = balance - ABS(p_amount),
        updated_at = NOW()
      WHERE id = p_account_id AND user_id = v_current_user_id;
    END IF;

    -- 4. Se for recorrente, criar próxima dívida
    IF p_is_recurring THEN
      INSERT INTO debts (
        user_id,
        description,
        amount,
        due_date,
        account_id,
        category_id,
        status,
        is_recurring,
        recurrence_type,
        notes
      ) VALUES (
        v_current_user_id,
        p_description,
        p_amount,
        CASE p_recurrence_type
          WHEN 'weekly' THEN p_due_date + INTERVAL '1 week'
          WHEN 'monthly' THEN p_due_date + INTERVAL '1 month'
          WHEN 'yearly' THEN p_due_date + INTERVAL '1 year'
          ELSE p_due_date + INTERVAL '1 month'
        END,
        p_account_id,
        p_category_id,
        'pending',
        p_is_recurring,
        p_recurrence_type,
        COALESCE((SELECT notes FROM debts WHERE id = p_debt_id), '')
      ) RETURNING id INTO v_next_debt_id;
    END IF;

    -- Se chegou até aqui, commit automático
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

-- Função para desmarcar dívida como paga com rollback automático
CREATE OR REPLACE FUNCTION unmark_debt_as_paid_with_rollback(
  p_debt_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_account_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id UUID;
  v_result JSON;
  v_current_user_id UUID;
BEGIN
  -- Verificar se o usuário está autenticado e é o dono da dívida
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado',
      'message', 'É necessário estar logado para realizar esta operação.'
    );
  END IF;

  -- Verificar se a dívida pertence ao usuário
  IF NOT EXISTS (SELECT 1 FROM debts WHERE id = p_debt_id AND user_id = v_current_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Dívida não encontrada',
      'message', 'Dívida não encontrada ou não pertence ao usuário.'
    );
  END IF;

  -- Iniciar transação
  BEGIN
    -- 1. Encontrar e deletar transação associada
    DELETE FROM transactions 
    WHERE 
      user_id = v_current_user_id
      AND account_id = p_account_id 
      AND amount = -ABS(p_amount)
      AND description LIKE '%' || p_description || '%'
      AND notes LIKE '%Transação gerada automaticamente a partir da dívida paga%'
    RETURNING id INTO v_transaction_id;

    -- 2. Atualizar saldo da conta (adicionar de volta o valor)
    IF p_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET 
        balance = balance + ABS(p_amount),
        updated_at = NOW()
      WHERE id = p_account_id AND user_id = v_current_user_id;
    END IF;

    -- 3. Atualizar status da dívida de volta para pendente
    UPDATE debts 
    SET 
      status = 'pending',
      paid_date = NULL,
      updated_at = NOW()
    WHERE id = p_debt_id AND user_id = v_current_user_id;

    -- Se chegou até aqui, commit automático
    v_result := json_build_object(
      'success', true,
      'transaction_id', v_transaction_id,
      'message', 'Dívida desmarcada como paga com sucesso'
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

-- Comentários para documentação
COMMENT ON FUNCTION mark_debt_as_paid_with_rollback IS 'Marca uma dívida como paga com rollback automático em caso de erro. Cria transação, atualiza saldo e gerencia recorrências.';
COMMENT ON FUNCTION unmark_debt_as_paid_with_rollback IS 'Desmarca uma dívida como paga com rollback automático em caso de erro. Remove transação e reverte saldo da conta.'; 