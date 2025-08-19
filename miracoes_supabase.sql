-- MIGRAÇÕES SUPABASE: Sincronização Cartões x Dívidas (idempotente)
-- Este script cria/atualiza colunas, índices, funções e triggers necessários
-- para garantir a sincronização 100% funcional entre cartões e dívidas a pagar.

-- =====================================================
-- 1) ESQUEMA: Colunas e índices em public.debts
-- =====================================================
ALTER TABLE public.debts 
  ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_card_bill BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bill_month INTEGER,
  ADD COLUMN IF NOT EXISTS bill_year INTEGER,
  ADD COLUMN IF NOT EXISTS installment_id UUID REFERENCES public.card_installments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installment_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_debts_card_id ON public.debts(card_id);
CREATE INDEX IF NOT EXISTS idx_debts_is_card_bill ON public.debts(is_card_bill);
CREATE INDEX IF NOT EXISTS idx_debts_installment_id ON public.debts(installment_id);

COMMENT ON COLUMN public.debts.card_id IS 'Cartão relacionado (quando dívida é de cartão/parcelamento)';
COMMENT ON COLUMN public.debts.is_card_bill IS 'Indica se a dívida representa uma fatura do cartão';
COMMENT ON COLUMN public.debts.bill_month IS 'Mês da fatura (1-12)';
COMMENT ON COLUMN public.debts.bill_year IS 'Ano da fatura';
COMMENT ON COLUMN public.debts.installment_id IS 'ID do parcelamento de cartão';
COMMENT ON COLUMN public.debts.installment_number IS 'Número da parcela no parcelamento';

-- =====================================================
-- 2) FUNÇÕES PRINCIPAIS (RPC)
-- =====================================================

-- Pré-limpeza idempotente para evitar erro de mudança de tipo de retorno
-- (Algumas instalações possuem versão antiga de create_debts_from_installments)
DROP TRIGGER IF EXISTS trigger_auto_create_debts ON public.card_installments;
DROP FUNCTION IF EXISTS public.auto_create_debts_from_installment();
DROP FUNCTION IF EXISTS public.sync_card_debts();
DROP FUNCTION IF EXISTS public.create_debts_from_installments(uuid);

-- 2.1) Criar dívida a partir de fatura de cartão
CREATE OR REPLACE FUNCTION public.create_debt_from_card_bill(
  p_card_id UUID,
  p_bill_month INTEGER,
  p_bill_year INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill RECORD;
  v_card RECORD;
  v_debt_id UUID;
BEGIN
  -- Garantir que a fatura pertence ao usuário logado
  SELECT * INTO v_bill
  FROM public.card_bills
  WHERE card_id = p_card_id
    AND bill_month = p_bill_month
    AND bill_year = p_bill_year
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fatura não encontrada para o usuário ou parâmetros inválidos';
  END IF;

  -- Garantir que o cartão pertence ao usuário
  SELECT * INTO v_card
  FROM public.cards
  WHERE id = p_card_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado para o usuário';
  END IF;

  -- Evitar duplicidade
  SELECT id INTO v_debt_id
  FROM public.debts
  WHERE user_id = auth.uid()
    AND card_id = p_card_id
    AND bill_month = p_bill_month
    AND bill_year = p_bill_year
    AND is_card_bill = TRUE;

  IF FOUND THEN
    RETURN v_debt_id;
  END IF;

  INSERT INTO public.debts (
    user_id, description, amount, due_date, status,
    card_id, is_card_bill, bill_month, bill_year, category_id
  ) VALUES (
    auth.uid(),
    'Fatura ' || v_card.name || ' - ' || p_bill_month || '/' || p_bill_year,
    v_bill.remaining_amount,
    v_bill.due_date,
    CASE
      WHEN v_bill.status = 'paid' THEN 'paid'
      WHEN v_bill.due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'pending'
    END,
    p_card_id, TRUE, p_bill_month, p_bill_year,
    NULL
  ) RETURNING id INTO v_debt_id;

  RETURN v_debt_id;
END;
$$;

-- 2.2) Criar dívidas a partir de parcelamento (retorna os IDs criados)
-- Retorna SETOF UUID para o frontend e permite contagem por SELECT COUNT(*)
CREATE OR REPLACE FUNCTION public.create_debts_from_installments(
  p_installment_id UUID
) RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_installment RECORD;
  v_item RECORD;
  v_debt_id UUID;
BEGIN
  SELECT * INTO v_installment
  FROM public.card_installments
  WHERE id = p_installment_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parcelamento não encontrado para o usuário';
  END IF;

  FOR v_item IN
    SELECT * FROM public.card_installment_items
    WHERE installment_id = p_installment_id
    ORDER BY installment_number
  LOOP
    -- Evitar duplicidade por (installment_id, installment_number, user_id)
    SELECT id INTO v_debt_id
    FROM public.debts
    WHERE user_id = auth.uid()
      AND installment_id = p_installment_id
      AND installment_number = v_item.installment_number;

    IF NOT FOUND THEN
      INSERT INTO public.debts (
        user_id, description, amount, due_date, status,
        card_id, installment_id, installment_number, category_id, notes
      ) VALUES (
        auth.uid(),
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
        v_installment.category_id,
        'Dívida gerada automaticamente do parcelamento'
      ) RETURNING id INTO v_debt_id;
    END IF;

    RETURN NEXT v_debt_id;
  END LOOP;

  RETURN;
END;
$$;

-- 2.3) Sincronizar pagamento de dívida com cartão (fatura/parcela)
CREATE OR REPLACE FUNCTION public.sync_debt_payment(
  p_debt_id UUID,
  p_payment_amount NUMERIC,
  p_payment_date DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_debt RECORD;
  v_bill RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_debt
  FROM public.debts
  WHERE id = p_debt_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dívida não encontrada para o usuário';
  END IF;

  -- Fatura
  IF v_debt.is_card_bill THEN
    SELECT * INTO v_bill
    FROM public.card_bills
    WHERE card_id = v_debt.card_id
      AND bill_month = v_debt.bill_month
      AND bill_year = v_debt.bill_year
      AND user_id = auth.uid();

    IF FOUND THEN
      UPDATE public.card_bills
      SET paid_amount = paid_amount + COALESCE(p_payment_amount, 0),
          remaining_amount = GREATEST(0, remaining_amount - COALESCE(p_payment_amount, 0)),
          status = CASE WHEN remaining_amount - COALESCE(p_payment_amount, 0) <= 0 THEN 'paid' ELSE 'partial' END,
          updated_at = NOW()
      WHERE id = v_bill.id;
    END IF;
  END IF;

  -- Parcela
  IF v_debt.installment_id IS NOT NULL AND v_debt.installment_number IS NOT NULL THEN
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

  RETURN TRUE;
END;
$$;

-- 2.4) Sincronização geral (cria dívidas faltantes)
CREATE OR REPLACE FUNCTION public.sync_card_debts()
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
  -- Faturas em aberto/parcial com valor pendente
  FOR v_bill IN 
    SELECT * FROM public.card_bills
    WHERE user_id = auth.uid()
      AND status IN ('open', 'partial')
      AND remaining_amount > 0
  LOOP
    IF public.create_debt_from_card_bill(v_bill.card_id, v_bill.bill_month, v_bill.bill_year) IS NOT NULL THEN
      v_bill_debt_count := v_bill_debt_count + 1;
    END IF;
  END LOOP;

  -- Parcelamentos ativos: contar quantas dívidas foram criadas pela função SETOF
  FOR v_installment IN 
    SELECT * FROM public.card_installments
    WHERE user_id = auth.uid()
      AND status = 'active'
  LOOP
    SELECT COUNT(*) INTO v_debt_count
    FROM public.create_debts_from_installments(v_installment.id);
    v_installment_debt_count := v_installment_debt_count + COALESCE(v_debt_count, 0);
  END LOOP;

  v_total_debts := v_bill_debt_count + v_installment_debt_count;

  RETURN json_build_object(
    'success', TRUE,
    'debts_created', v_total_debts,
    'bills_synced', v_bill_debt_count,
    'installments_synced', v_installment_debt_count
  );
END;
$$;

-- =====================================================
-- 3) TRIGGERS DE SINCRONIZAÇÃO
-- =====================================================

-- 3.1) Criar dívidas automaticamente ao inserir um novo parcelamento
CREATE OR REPLACE FUNCTION public.auto_create_debts_from_installment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_debts_from_installments(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_debts ON public.card_installments;
CREATE TRIGGER trigger_auto_create_debts
  AFTER INSERT ON public.card_installments
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_debts_from_installment();

-- 3.2) Atualizar dívida quando uma parcela é marcada como paga
CREATE OR REPLACE FUNCTION public.update_debt_when_installment_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    UPDATE public.debts
    SET status = 'paid',
        paid_date = COALESCE(NEW.paid_date, CURRENT_DATE),
        updated_at = NOW()
    WHERE installment_id = NEW.installment_id
      AND installment_number = NEW.installment_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_debt_on_payment ON public.card_installment_items;
CREATE TRIGGER trigger_update_debt_on_payment
  AFTER UPDATE ON public.card_installment_items
  FOR EACH ROW EXECUTE FUNCTION public.update_debt_when_installment_paid();

-- 3.3) Atualizar dívida da fatura quando a fatura for paga
CREATE OR REPLACE FUNCTION public.update_debt_when_bill_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    UPDATE public.debts
    SET status = 'paid',
        paid_date = COALESCE(paid_date, CURRENT_DATE),
        updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND is_card_bill = TRUE
      AND card_id = NEW.card_id
      AND bill_month = NEW.bill_month
      AND bill_year = NEW.bill_year;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_debt_on_bill_payment ON public.card_bills;
CREATE TRIGGER trigger_update_debt_on_bill_payment
  AFTER UPDATE ON public.card_bills
  FOR EACH ROW EXECUTE FUNCTION public.update_debt_when_bill_paid();

-- 3.4) Ao mudar dívida para paga, sincronizar o cartão (mão dupla)
CREATE OR REPLACE FUNCTION public.sync_payment_on_debt_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    PERFORM public.sync_debt_payment(NEW.id, NEW.amount, COALESCE(NEW.paid_date, CURRENT_DATE));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_card_on_debt_paid ON public.debts;
CREATE TRIGGER trigger_sync_card_on_debt_paid
  AFTER UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.sync_payment_on_debt_update();

-- =====================================================
-- 4) NOTAS
-- - Todas as funções usam SECURITY DEFINER e search_path = public
-- - RLS deve estar habilitado e tabelas vinculadas ao user_id
-- - As operações são idempotentes (evitam duplicidade)
-- =====================================================


