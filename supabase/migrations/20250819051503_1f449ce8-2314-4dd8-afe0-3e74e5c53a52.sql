-- MIGRAÇÃO CORRETIVA PARA INTEGRAÇÃO CARTÕES-DÍVIDAS
-- Adicionar colunas faltantes na tabela debts para integração com parcelamentos

-- 1. Adicionar colunas faltantes na tabela debts
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS installment_id UUID REFERENCES public.card_installments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS installment_number INTEGER,
ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL;

-- 2. Adicionar campos faltantes na tabela card_installments (se não existirem)
ALTER TABLE public.card_installments 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS first_installment_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Adicionar campos faltantes na tabela card_installment_items
ALTER TABLE public.card_installment_items 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Criar constraint UNIQUE para evitar duplicação de parcelas
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

-- 5. Criar função handle_updated_at se não existir
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar triggers para updated_at se não existirem
DROP TRIGGER IF EXISTS handle_updated_at_card_installments ON public.card_installments;
DROP TRIGGER IF EXISTS handle_updated_at_card_installment_items ON public.card_installment_items;

CREATE TRIGGER handle_updated_at_card_installments
    BEFORE UPDATE ON public.card_installments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_card_installment_items
    BEFORE UPDATE ON public.card_installment_items
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_card_installments_user_id ON public.card_installments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_card_id ON public.card_installments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_status ON public.card_installments(status);
CREATE INDEX IF NOT EXISTS idx_card_installment_items_installment_id ON public.card_installment_items(installment_id);
CREATE INDEX IF NOT EXISTS idx_card_installment_items_status ON public.card_installment_items(status);
CREATE INDEX IF NOT EXISTS idx_card_installment_items_due_date ON public.card_installment_items(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_installment_id ON public.debts(installment_id);
CREATE INDEX IF NOT EXISTS idx_debts_card_id ON public.debts(card_id);

-- 8. Criar/Atualizar função create_debts_from_installments
CREATE OR REPLACE FUNCTION create_debts_from_installments(
  p_installment_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Para cada item do parcelamento, criar uma dívida se não existir
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

-- 9. Atualizar função sync_card_debts
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