-- SOLUÇÃO EM TEMPO REAL PARA PARCELAMENTOS
-- Execute este script completo no SQL Editor do Supabase

-- =====================================================
-- 1. CORRIGIR ESTRUTURA DAS TABELAS (se necessário)
-- =====================================================

-- Adicionar campos faltantes na tabela card_installments
ALTER TABLE public.card_installments 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS first_installment_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar campos faltantes na tabela card_installment_items
ALTER TABLE public.card_installment_items 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 2. CRIAR FUNÇÃO PARA SINCRONIZAÇÃO EM TEMPO REAL
-- =====================================================

CREATE OR REPLACE FUNCTION create_debts_from_installments(
  p_installment_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_installment RECORD;
  v_card RECORD;
  v_item RECORD;
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
    IF NOT EXISTS (
      SELECT 1 FROM public.debts 
      WHERE installment_id = p_installment_id 
        AND installment_number = v_item.installment_number
        AND user_id = v_installment.user_id
    ) THEN
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
      );
      
      v_debt_count := v_debt_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_debt_count;
END;
$$;

-- =====================================================
-- 3. CRIAR TRIGGER PARA SINCRONIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função que será executada pelo trigger
CREATE OR REPLACE FUNCTION auto_create_debts_from_installment()
RETURNS TRIGGER AS $$
BEGIN
  -- Se um novo parcelamento foi inserido, criar dívidas automaticamente
  IF TG_OP = 'INSERT' THEN
    PERFORM create_debts_from_installments(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela card_installments
DROP TRIGGER IF EXISTS trigger_auto_create_debts ON public.card_installments;
CREATE TRIGGER trigger_auto_create_debts
  AFTER INSERT ON public.card_installments
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_debts_from_installment();

-- =====================================================
-- 4. CRIAR TRIGGER PARA ATUALIZAR DÍVIDAS QUANDO PARCELAS SÃO PAGAS
-- =====================================================

-- Função para atualizar dívidas quando parcelas são pagas
CREATE OR REPLACE FUNCTION update_debt_when_installment_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status da parcela mudou para 'paid', atualizar a dívida correspondente
  IF OLD.status != NEW.status AND NEW.status = 'paid' THEN
    UPDATE public.debts 
    SET status = 'paid',
        updated_at = NOW()
    WHERE installment_id = NEW.installment_id 
      AND installment_number = NEW.installment_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela card_installment_items
DROP TRIGGER IF EXISTS trigger_update_debt_on_payment ON public.card_installment_items;
CREATE TRIGGER trigger_update_debt_on_payment
  AFTER UPDATE ON public.card_installment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_debt_when_installment_paid();

-- =====================================================
-- 5. CRIAR FUNÇÃO sync_card_debts CORRIGIDA
-- =====================================================

CREATE OR REPLACE FUNCTION sync_card_debts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill RECORD;
  v_installment RECORD;
  v_total_debts INTEGER := 0;
  v_bill_debt_count INTEGER := 0;
  v_installment_debt_count INTEGER := 0;
  v_debt_count INTEGER;
BEGIN
  -- Create debts for unpaid card bills
  FOR v_bill IN 
    SELECT * FROM public.card_bills 
    WHERE user_id = auth.uid() 
    AND status IN ('open', 'partial')
    AND remaining_amount > 0
  LOOP
    IF create_debt_from_card_bill(v_bill.card_id, v_bill.bill_month, v_bill.bill_year) IS NOT NULL THEN
      v_bill_debt_count := v_bill_debt_count + 1;
    END IF;
  END LOOP;
  
  -- Create debts for active installments that don't have debts yet
  FOR v_installment IN 
    SELECT * FROM public.card_installments 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  LOOP
    -- Verificar se já existem dívidas para este parcelamento
    IF NOT EXISTS (
      SELECT 1 FROM public.debts 
      WHERE installment_id = v_installment.id 
      AND user_id = auth.uid()
    ) THEN
      -- Criar dívidas para cada parcela pendente
      SELECT create_debts_from_installments(v_installment.id) INTO v_debt_count;
      v_installment_debt_count := v_installment_debt_count + v_debt_count;
    END IF;
  END LOOP;
  
  v_total_debts := v_bill_debt_count + v_installment_debt_count;
  
  RETURN json_build_object(
    'success', true, 
    'debts_created', v_total_debts,
    'bills_synced', v_bill_debt_count,
    'installments_synced', v_installment_debt_count
  );
END;
$$;

-- =====================================================
-- 6. CRIAR FUNÇÃO PARA SINCRONIZAR PARCELAMENTOS EXISTENTES
-- =====================================================

CREATE OR REPLACE FUNCTION sync_existing_installments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_installment RECORD;
  v_total_debts INTEGER := 0;
  v_debt_count INTEGER;
BEGIN
  -- Para cada parcelamento ativo que não tem dívidas, criar dívidas
  FOR v_installment IN 
    SELECT * FROM public.card_installments 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  LOOP
    -- Verificar se já existem dívidas para este parcelamento
    IF NOT EXISTS (
      SELECT 1 FROM public.debts 
      WHERE installment_id = v_installment.id 
      AND user_id = auth.uid()
    ) THEN
      -- Criar dívidas para cada parcela pendente
      SELECT create_debts_from_installments(v_installment.id) INTO v_debt_count;
      v_total_debts := v_total_debts + v_debt_count;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true, 
    'debts_created', v_total_debts,
    'message', 'Parcelamentos existentes sincronizados com sucesso'
  );
END;
$$;

-- =====================================================
-- 7. VERIFICAR E CRIAR POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.card_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_installment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para card_installments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_installments' 
    AND policyname = 'Users can view their own installments'
  ) THEN
    CREATE POLICY "Users can view their own installments" ON public.card_installments 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_installments' 
    AND policyname = 'Users can insert their own installments'
  ) THEN
    CREATE POLICY "Users can insert their own installments" ON public.card_installments 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_installments' 
    AND policyname = 'Users can update their own installments'
  ) THEN
    CREATE POLICY "Users can update their own installments" ON public.card_installments 
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_installments' 
    AND policyname = 'Users can delete their own installments'
  ) THEN
    CREATE POLICY "Users can delete their own installments" ON public.card_installments 
    FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Criar políticas RLS para card_installment_items
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_installment_items' 
    AND policyname = 'Users can view their own installment items'
  ) THEN
    CREATE POLICY "Users can view their own installment items" ON public.card_installment_items 
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_installment_items' 
    AND policyname = 'Users can insert their own installment items'
  ) THEN
    CREATE POLICY "Users can insert their own installment items" ON public.card_installment_items 
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_installment_items' 
    AND policyname = 'Users can update their own installment items'
  ) THEN
    CREATE POLICY "Users can update their own installment items" ON public.card_installment_items 
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_installment_items' 
    AND policyname = 'Users can delete their own installment items'
  ) THEN
    CREATE POLICY "Users can delete their own installment items" ON public.card_installment_items 
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
    );
  END IF;
END $$;

-- Criar políticas RLS para debts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can insert their own debts'
  ) THEN
    CREATE POLICY "Users can insert their own debts" ON public.debts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can view their own debts'
  ) THEN
    CREATE POLICY "Users can view their own debts" ON public.debts 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can update their own debts'
  ) THEN
    CREATE POLICY "Users can update their own debts" ON public.debts 
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can delete their own debts'
  ) THEN
    CREATE POLICY "Users can delete their own debts" ON public.debts 
    FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 8. SINCRONIZAR PARCELAMENTOS EXISTENTES
-- =====================================================

-- Sincronizar parcelamentos que já existem (executar uma vez)
SELECT sync_existing_installments();

-- =====================================================
-- 9. VERIFICAR RESULTADOS
-- =====================================================

-- Verificar se as dívidas foram criadas
SELECT 
  'DÍVIDAS CRIADAS' as info,
  COUNT(*) as total
FROM public.debts 
WHERE installment_id IS NOT NULL;

-- Verificar parcelamentos ativos
SELECT 
  'PARCELAMENTOS ATIVOS' as info,
  COUNT(*) as total
FROM public.card_installments 
WHERE status = 'active';

-- Verificar itens de parcelamento
SELECT 
  'ITENS DE PARCELAMENTO' as info,
  COUNT(*) as total
FROM public.card_installment_items;
