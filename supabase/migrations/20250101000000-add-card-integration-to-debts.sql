-- Adicionar campos para integração com cartões na tabela debts
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_card_bill BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bill_month INTEGER,
ADD COLUMN IF NOT EXISTS bill_year INTEGER,
ADD COLUMN IF NOT EXISTS installment_id UUID REFERENCES public.card_installments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS installment_number INTEGER;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_debts_card_id ON public.debts(card_id);
CREATE INDEX IF NOT EXISTS idx_debts_is_card_bill ON public.debts(is_card_bill);
CREATE INDEX IF NOT EXISTS idx_debts_installment_id ON public.debts(installment_id);

-- Adicionar comentários para clareza
COMMENT ON COLUMN public.debts.card_id IS 'Referência ao cartão quando a dívida é relacionada a cartão de crédito';
COMMENT ON COLUMN public.debts.is_card_bill IS 'Indica se a dívida representa uma fatura de cartão';
COMMENT ON COLUMN public.debts.bill_month IS 'Mês da fatura (1-12) quando is_card_bill = true';
COMMENT ON COLUMN public.debts.bill_year IS 'Ano da fatura quando is_card_bill = true';
COMMENT ON COLUMN public.debts.installment_id IS 'Referência ao parcelamento quando a dívida é uma parcela';
COMMENT ON COLUMN public.debts.installment_number IS 'Número da parcela quando installment_id não é nulo';

-- Função para criar dívidas automaticamente a partir de faturas de cartão
CREATE OR REPLACE FUNCTION create_debt_from_card_bill(
  p_card_id UUID,
  p_bill_month INTEGER,
  p_bill_year INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_bill RECORD;
  v_card RECORD;
  v_debt_id UUID;
BEGIN
  -- Buscar a fatura do cartão
  SELECT * INTO v_bill 
  FROM public.card_bills 
  WHERE card_id = p_card_id 
    AND bill_month = p_bill_month 
    AND bill_year = p_bill_year;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fatura não encontrada para o cartão % no período %/%', p_card_id, p_bill_month, p_bill_year;
  END IF;
  
  -- Buscar informações do cartão
  SELECT * INTO v_card 
  FROM public.cards 
  WHERE id = p_card_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado: %', p_card_id;
  END IF;
  
  -- Verificar se já existe uma dívida para esta fatura
  SELECT id INTO v_debt_id 
  FROM public.debts 
  WHERE card_id = p_card_id 
    AND bill_month = p_bill_month 
    AND bill_year = p_bill_year 
    AND is_card_bill = true;
  
  IF FOUND THEN
    RETURN v_debt_id;
  END IF;
  
  -- Criar nova dívida baseada na fatura
  INSERT INTO public.debts (
    user_id,
    description,
    amount,
    due_date,
    status,
    card_id,
    is_card_bill,
    bill_month,
    bill_year,
    category_id
  ) VALUES (
    v_card.user_id,
    'Fatura ' || v_card.name || ' - ' || p_bill_month || '/' || p_bill_year,
    v_bill.remaining_amount,
    v_bill.due_date,
    CASE 
      WHEN v_bill.status = 'paid' THEN 'paid'
      WHEN v_bill.due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'pending'
    END,
    p_card_id,
    true,
    p_bill_month,
    p_bill_year,
    NULL
  ) RETURNING id INTO v_debt_id;
  
  RETURN v_debt_id;
END;
$$;

-- Função para criar dívidas a partir de parcelamentos
CREATE OR REPLACE FUNCTION create_debts_from_installments(
  p_installment_id UUID
)
RETURNS SETOF UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_installment RECORD;
  v_card RECORD;
  v_item RECORD;
  v_debt_id UUID;
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
      AND installment_number = v_item.installment_number;
    
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
        category_id
      ) VALUES (
        v_card.user_id,
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
        v_installment.category_id
      ) RETURNING id INTO v_debt_id;
    END IF;
    
    RETURN NEXT v_debt_id;
  END LOOP;
  
  RETURN;
END;
$$;

-- Função para sincronizar pagamentos de dívidas com faturas/parcelas
CREATE OR REPLACE FUNCTION sync_debt_payment(
  p_debt_id UUID,
  p_payment_amount NUMERIC,
  p_payment_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_debt RECORD;
  v_bill RECORD;
  v_item RECORD;
BEGIN
  -- Buscar a dívida
  SELECT * INTO v_debt 
  FROM public.debts 
  WHERE id = p_debt_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dívida não encontrada: %', p_debt_id;
  END IF;
  
  -- Se é uma fatura de cartão, sincronizar com a fatura
  IF v_debt.is_card_bill THEN
    SELECT * INTO v_bill 
    FROM public.card_bills 
    WHERE card_id = v_debt.card_id 
      AND bill_month = v_debt.bill_month 
      AND bill_year = v_debt.bill_year;
    
    IF FOUND THEN
      UPDATE public.card_bills 
      SET paid_amount = paid_amount + p_payment_amount,
          remaining_amount = GREATEST(0, remaining_amount - p_payment_amount),
          status = CASE 
            WHEN remaining_amount - p_payment_amount <= 0 THEN 'paid'
            ELSE 'partial'
          END,
          updated_at = NOW()
      WHERE id = v_bill.id;
    END IF;
  END IF;
  
  -- Se é uma parcela, sincronizar com o item do parcelamento
  IF v_debt.installment_id IS NOT NULL THEN
    SELECT * INTO v_item 
    FROM public.card_installment_items 
    WHERE installment_id = v_debt.installment_id 
      AND installment_number = v_debt.installment_number;
    
    IF FOUND THEN
      UPDATE public.card_installment_items 
      SET status = 'paid',
          paid_date = p_payment_date,
          updated_at = NOW()
      WHERE id = v_item.id;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;
