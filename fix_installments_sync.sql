-- Script para corrigir e testar a sincronização de parcelamentos com dívidas
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos verificar se a função create_debts_from_installments está funcionando
-- Vamos recriar a função com melhor tratamento de erros

CREATE OR REPLACE FUNCTION create_debts_from_installments(
  p_installment_id UUID
)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_installment RECORD;
  v_card RECORD;
  v_item RECORD;
  v_debt_id UUID;
  v_debt_count INTEGER := 0;
BEGIN
  -- Buscar o parcelamento
  SELECT * INTO v_installment 
  FROM public.card_installments 
  WHERE id = p_installment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parcelamento não encontrado: %', p_installment_id;
  END IF;
  
  -- Buscar informações do cartão
  SELECT * INTO v_card 
  FROM public.cards 
  WHERE id = v_installment.card_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado: %', v_installment.card_id;
  END IF;
  
  -- Para cada item do parcelamento, criar uma dívida
  FOR v_item IN 
    SELECT * FROM public.card_installment_items 
    WHERE installment_id = p_installment_id 
    ORDER BY installment_number
  LOOP
    -- Verificar se já existe uma dívida para esta parcela
    SELECT id INTO v_debt_id 
    FROM public.debts 
    WHERE installment_id = p_installment_id 
      AND installment_number = v_item.installment_number
      AND user_id = v_installment.user_id;
    
    IF NOT FOUND THEN
      -- Criar nova dívida para a parcela
      INSERT INTO public.debts (
        user_id,
        description,
        amount,
        due_date,
        status,
        card_id,
        installment_id,
        installment_number,
        category_id,
        notes
      ) VALUES (
        v_installment.user_id,
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
        COALESCE(v_installment.category_id, NULL),
        'Dívida gerada automaticamente do parcelamento'
      ) RETURNING id INTO v_debt_id;
      
      v_debt_count := v_debt_count + 1;
      RAISE NOTICE 'Dívida criada para parcela %: %', v_item.installment_number, v_debt_id;
    ELSE
      RAISE NOTICE 'Dívida já existe para parcela %: %', v_item.installment_number, v_debt_id;
    END IF;
    
    RETURN NEXT v_debt_id;
  END LOOP;
  
  RAISE NOTICE 'Total de dívidas criadas/retornadas: %', v_debt_count;
  RETURN;
END;
$$;

-- 2. Agora vamos melhorar a função sync_card_debts para ter melhor logging

CREATE OR REPLACE FUNCTION sync_card_debts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill RECORD;
  v_installment RECORD;
  v_debt_count INTEGER := 0;
  v_bill_debt_count INTEGER := 0;
  v_installment_debt_count INTEGER := 0;
  v_debt_ids UUID[];
BEGIN
  RAISE NOTICE 'Iniciando sincronização de dívidas de cartão...';
  
  -- Create debts for unpaid card bills
  FOR v_bill IN 
    SELECT * FROM public.card_bills 
    WHERE user_id = auth.uid() 
    AND status IN ('open', 'partial')
    AND remaining_amount > 0
  LOOP
    RAISE NOTICE 'Processando fatura do cartão % para %/%', v_bill.card_id, v_bill.bill_month, v_bill.bill_year;
    
    IF create_debt_from_card_bill(v_bill.card_id, v_bill.bill_month, v_bill.bill_year) IS NOT NULL THEN
      v_bill_debt_count := v_bill_debt_count + 1;
      RAISE NOTICE 'Dívida criada para fatura do cartão %', v_bill.card_id;
    END IF;
  END LOOP;
  
  -- Create debts for active installments
  FOR v_installment IN 
    SELECT * FROM public.card_installments 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  LOOP
    RAISE NOTICE 'Processando parcelamento: %', v_installment.description;
    
    -- Verificar se já existem dívidas para este parcelamento
    IF NOT EXISTS (
      SELECT 1 FROM public.debts 
      WHERE installment_id = v_installment.id 
      AND user_id = auth.uid()
    ) THEN
      RAISE NOTICE 'Criando dívidas para parcelamento %', v_installment.id;
      
      -- Criar dívidas para cada parcela pendente
      SELECT array_agg(id) INTO v_debt_ids
      FROM create_debts_from_installments(v_installment.id);
      
      IF v_debt_ids IS NOT NULL THEN
        v_installment_debt_count := array_length(v_debt_ids, 1);
        RAISE NOTICE 'Dívidas criadas para parcelamento %: %', v_installment.id, v_debt_ids;
      END IF;
    ELSE
      RAISE NOTICE 'Dívidas já existem para parcelamento %', v_installment.id;
    END IF;
  END LOOP;
  
  v_debt_count := v_bill_debt_count + v_installment_debt_count;
  
  RAISE NOTICE 'Sincronização concluída. Total: %, Faturas: %, Parcelamentos: %', 
    v_debt_count, v_bill_debt_count, v_installment_debt_count;
  
  RETURN json_build_object(
    'success', true, 
    'debts_created', v_debt_count,
    'bills_synced', v_bill_debt_count,
    'installments_synced', v_installment_debt_count
  );
END;
$$;

-- 3. Vamos testar a sincronização
-- SELECT * FROM sync_card_debts();

-- 4. Verificar se as dívidas foram criadas
-- SELECT 
--   d.id,
--   d.description,
--   d.amount,
--   d.due_date,
--   d.status,
--   d.installment_id,
--   d.installment_number,
--   d.card_id,
--   d.created_at
-- FROM public.debts d
-- WHERE d.installment_id IS NOT NULL
-- ORDER BY d.created_at DESC;

-- 5. Verificar se as políticas RLS estão corretas para a tabela debts
DO $$ 
BEGIN
  -- Verificar se existe política para inserção
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can insert their own debts'
  ) THEN
    CREATE POLICY "Users can insert their own debts" ON public.debts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Verificar se existe política para visualização
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can view their own debts'
  ) THEN
    CREATE POLICY "Users can view their own debts" ON public.debts 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  -- Verificar se existe política para atualização
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can update their own debts'
  ) THEN
    CREATE POLICY "Users can update their own debts" ON public.debts 
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  -- Verificar se existe política para exclusão
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can delete their own debts'
  ) THEN
    CREATE POLICY "Users can delete their own debts" ON public.debts 
    FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
