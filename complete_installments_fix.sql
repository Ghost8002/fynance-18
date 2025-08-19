-- SOLUÇÃO COMPLETA E DEFINITIVA PARA SINCRONIZAÇÃO DE PARCELAMENTOS
-- Execute este script completo no SQL Editor do Supabase

-- =====================================================
-- 1. CORRIGIR ESTRUTURA DAS TABELAS
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

-- Adicionar constraint UNIQUE se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'card_installment_items_installment_number_unique'
    ) THEN
        ALTER TABLE public.card_installment_items 
        ADD CONSTRAINT card_installment_items_installment_number_unique 
        UNIQUE (installment_id, installment_number);
    END IF;
END $$;

-- =====================================================
-- 2. CRIAR FUNÇÃO handle_updated_at SE NÃO EXISTIR
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 3. CRIAR TRIGGERS PARA updated_at
-- =====================================================

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS handle_updated_at_card_installments ON public.card_installments;
DROP TRIGGER IF EXISTS handle_updated_at_card_installment_items ON public.card_installment_items;

-- Criar novos triggers
CREATE TRIGGER handle_updated_at_card_installments
    BEFORE UPDATE ON public.card_installments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_card_installment_items
    BEFORE UPDATE ON public.card_installment_items
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =====================================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_card_installments_user_id ON public.card_installments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_card_id ON public.card_installments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_category_id ON public.card_installments(category_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_status ON public.card_installments(status);

CREATE INDEX IF NOT EXISTS idx_card_installment_items_installment_id ON public.card_installment_items(installment_id);
CREATE INDEX IF NOT EXISTS idx_card_installment_items_status ON public.card_installment_items(status);
CREATE INDEX IF NOT EXISTS idx_card_installment_items_due_date ON public.card_installment_items(due_date);

-- =====================================================
-- 5. CRIAR POLÍTICAS RLS PARA card_installments
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.card_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_installment_items ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Users can view their own installments" ON public.card_installments;
DROP POLICY IF EXISTS "Users can insert their own installments" ON public.card_installments;
DROP POLICY IF EXISTS "Users can update their own installments" ON public.card_installments;
DROP POLICY IF EXISTS "Users can delete their own installments" ON public.card_installments;

-- Criar novas políticas
CREATE POLICY "Users can view their own installments" ON public.card_installments 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own installments" ON public.card_installments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own installments" ON public.card_installments 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own installments" ON public.card_installments 
FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. CRIAR POLÍTICAS RLS PARA card_installment_items
-- =====================================================

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Users can view their own installment items" ON public.card_installment_items;
DROP POLICY IF EXISTS "Users can insert their own installment items" ON public.card_installment_items;
DROP POLICY IF EXISTS "Users can update their own installment items" ON public.card_installment_items;
DROP POLICY IF EXISTS "Users can delete their own installment items" ON public.card_installment_items;

-- Criar novas políticas
CREATE POLICY "Users can view their own installment items" ON public.card_installment_items 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
);

CREATE POLICY "Users can insert their own installment items" ON public.card_installment_items 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own installment items" ON public.card_installment_items 
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete their own installment items" ON public.card_installment_items 
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
);

-- =====================================================
-- 7. CRIAR FUNÇÃO create_debts_from_installments CORRIGIDA
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
      );
      
      v_debt_count := v_debt_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_debt_count;
END;
$$;

-- =====================================================
-- 8. CRIAR FUNÇÃO sync_card_debts CORRIGIDA
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
  
  -- Create debts for active installments
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
-- 9. VERIFICAR E CRIAR POLÍTICAS RLS PARA debts
-- =====================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para debts se não existirem
DO $$ 
BEGIN
  -- Política para inserção
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can insert their own debts'
  ) THEN
    CREATE POLICY "Users can insert their own debts" ON public.debts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Política para visualização
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can view their own debts'
  ) THEN
    CREATE POLICY "Users can view their own debts" ON public.debts 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  -- Política para atualização
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debts' 
    AND policyname = 'Users can update their own debts'
  ) THEN
    CREATE POLICY "Users can update their own debts" ON public.debts 
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  -- Política para exclusão
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
-- 10. TESTAR A SINCRONIZAÇÃO
-- =====================================================

-- Testar a sincronização (descomente para testar)
-- SELECT * FROM sync_card_debts();

-- =====================================================
-- 11. VERIFICAR RESULTADOS
-- =====================================================

-- Verificar se as dívidas foram criadas (descomente para verificar)
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

-- =====================================================
-- 12. VERIFICAR ESTRUTURA FINAL
-- =====================================================

-- Verificar estrutura da tabela debts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name IN ('installment_id', 'installment_number', 'card_id')
ORDER BY ordinal_position;

-- Verificar políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('debts', 'card_installments', 'card_installment_items')
ORDER BY tablename, policyname;
