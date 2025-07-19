
-- Adicionar colunas faltantes na tabela receivable_payments para corresponder à funcionalidade de debts
ALTER TABLE public.receivable_payments 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')) DEFAULT NULL;

-- Adicionar constraint para consistência de recorrência
ALTER TABLE public.receivable_payments 
ADD CONSTRAINT IF NOT EXISTS check_receivable_recurrence_consistency 
CHECK (
  (is_recurring = FALSE AND recurrence_type IS NULL) OR 
  (is_recurring = TRUE AND recurrence_type IS NOT NULL)
);

-- Atualizar a função para criar próximos pagamentos recorrentes
CREATE OR REPLACE FUNCTION public.create_next_recurring_payment(payment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  current_payment RECORD;
  next_due_date DATE;
  new_payment_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Verificar se o usuário está autenticado
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get the current payment details
  SELECT * INTO current_payment FROM public.receivable_payments 
  WHERE id = payment_id AND user_id = v_current_user_id;
  
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
  
  -- Create the next recurring payment
  INSERT INTO public.receivable_payments (
    user_id, description, amount, due_date, status, notes,
    is_recurring, recurrence_type, account_id, category_id
  )
  VALUES (
    v_current_user_id, 
    current_payment.description, 
    current_payment.amount, 
    next_due_date, 
    'pending', 
    current_payment.notes,
    current_payment.is_recurring,
    current_payment.recurrence_type,
    current_payment.account_id,
    current_payment.category_id
  )
  RETURNING id INTO new_payment_id;
  
  RETURN new_payment_id;
END;
$$;

-- Função para marcar pagamento a receber como recebido com rollback automático
CREATE OR REPLACE FUNCTION mark_receivable_as_received_with_rollback(
  p_payment_id UUID,
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
  v_next_payment_id UUID;
  v_result JSON;
  v_current_user_id UUID;
BEGIN
  -- Verificar se o usuário está autenticado e é o dono do pagamento
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado',
      'message', 'É necessário estar logado para realizar esta operação.'
    );
  END IF;

  -- Verificar se o pagamento pertence ao usuário
  IF NOT EXISTS (SELECT 1 FROM receivable_payments WHERE id = p_payment_id AND user_id = v_current_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Pagamento não encontrado',
      'message', 'Pagamento não encontrado ou não pertence ao usuário.'
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
    -- 1. Criar transação de receita
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
      'income',
      p_description,
      ABS(p_amount),
      CURRENT_DATE,
      p_category_id,
      p_account_id,
      NULL,
      'Transação gerada automaticamente a partir do pagamento recebido. Data de vencimento original: ' || 
      TO_CHAR(p_due_date, 'DD/MM/YYYY') ||
      CASE 
        WHEN p_is_recurring THEN 
          ' (Pagamento recorrente - ' || 
          CASE p_recurrence_type
            WHEN 'weekly' THEN 'Semanal'
            WHEN 'monthly' THEN 'Mensal'
            WHEN 'yearly' THEN 'Anual'
            ELSE 'Recorrente'
          END || ')'
        ELSE ''
      END
    ) RETURNING id INTO v_transaction_id;

    -- 2. Atualizar status do pagamento
    UPDATE receivable_payments 
    SET 
      status = 'received',
      received_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = p_payment_id AND user_id = v_current_user_id;

    -- 3. Atualizar saldo da conta
    IF p_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET 
        balance = balance + ABS(p_amount),
        updated_at = NOW()
      WHERE id = p_account_id AND user_id = v_current_user_id;
    END IF;

    -- 4. Se for recorrente, criar próximo pagamento
    IF p_is_recurring THEN
      INSERT INTO receivable_payments (
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
        COALESCE((SELECT notes FROM receivable_payments WHERE id = p_payment_id), '')
      ) RETURNING id INTO v_next_payment_id;
    END IF;

    -- Se chegou até aqui, commit automático
    v_result := json_build_object(
      'success', true,
      'transaction_id', v_transaction_id,
      'next_payment_id', v_next_payment_id,
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

-- Função para desmarcar pagamento como recebido com rollback automático
CREATE OR REPLACE FUNCTION unmark_receivable_as_received_with_rollback(
  p_payment_id UUID,
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
  -- Verificar se o usuário está autenticado e é o dono do pagamento
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado',
      'message', 'É necessário estar logado para realizar esta operação.'
    );
  END IF;

  -- Verificar se o pagamento pertence ao usuário
  IF NOT EXISTS (SELECT 1 FROM receivable_payments WHERE id = p_payment_id AND user_id = v_current_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Pagamento não encontrado',
      'message', 'Pagamento não encontrado ou não pertence ao usuário.'
    );
  END IF;

  -- Iniciar transação
  BEGIN
    -- 1. Encontrar e deletar transação associada
    DELETE FROM transactions 
    WHERE 
      user_id = v_current_user_id
      AND account_id = p_account_id 
      AND amount = ABS(p_amount)
      AND description LIKE '%' || p_description || '%'
      AND notes LIKE '%Transação gerada automaticamente a partir do pagamento recebido%'
    RETURNING id INTO v_transaction_id;

    -- 2. Atualizar saldo da conta (subtrair o valor)
    IF p_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET 
        balance = balance - ABS(p_amount),
        updated_at = NOW()
      WHERE id = p_account_id AND user_id = v_current_user_id;
    END IF;

    -- 3. Atualizar status do pagamento de volta para pendente
    UPDATE receivable_payments 
    SET 
      status = 'pending',
      received_date = NULL,
      updated_at = NOW()
    WHERE id = p_payment_id AND user_id = v_current_user_id;

    -- Se chegou até aqui, commit automático
    v_result := json_build_object(
      'success', true,
      'transaction_id', v_transaction_id,
      'message', 'Pagamento desmarcado como recebido com sucesso'
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

-- Função para automaticamente atualizar pagamentos vencidos
CREATE OR REPLACE FUNCTION update_overdue_receivable_payments()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.receivable_payments 
  SET status = 'overdue' 
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION mark_receivable_as_received_with_rollback IS 'Marca um pagamento a receber como recebido com rollback automático em caso de erro. Cria transação, atualiza saldo e gerencia recorrências.';
COMMENT ON FUNCTION unmark_receivable_as_received_with_rollback IS 'Desmarca um pagamento a receber como recebido com rollback automático em caso de erro. Remove transação e reverte saldo da conta.';
