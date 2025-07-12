-- Criar tabela de faturas de cartão
CREATE TABLE public.card_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  bill_month INTEGER NOT NULL, -- Mês da fatura (1-12)
  bill_year INTEGER NOT NULL, -- Ano da fatura
  due_date DATE NOT NULL,
  closing_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'partial')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pagamentos de faturas
CREATE TABLE public.card_bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bill_id UUID NOT NULL REFERENCES public.card_bills(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id),
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de histórico de ajustes de limite
CREATE TABLE public.card_limit_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  previous_limit NUMERIC NOT NULL,
  new_limit NUMERIC NOT NULL,
  adjustment_amount NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS policies para card_bills
ALTER TABLE public.card_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own card bills" 
ON public.card_bills 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card bills" 
ON public.card_bills 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card bills" 
ON public.card_bills 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card bills" 
ON public.card_bills 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar RLS policies para card_bill_payments
ALTER TABLE public.card_bill_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own card bill payments" 
ON public.card_bill_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card bill payments" 
ON public.card_bill_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card bill payments" 
ON public.card_bill_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card bill payments" 
ON public.card_bill_payments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar RLS policies para card_limit_adjustments
ALTER TABLE public.card_limit_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own card limit adjustments" 
ON public.card_limit_adjustments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card limit adjustments" 
ON public.card_limit_adjustments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Função para processar pagamento de fatura
CREATE OR REPLACE FUNCTION public.process_bill_payment(
  p_bill_id UUID,
  p_amount NUMERIC,
  p_account_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Pagamento de fatura'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_card_id UUID;
  v_bill RECORD;
  v_payment_id UUID;
  v_new_paid_amount NUMERIC;
  v_new_remaining_amount NUMERIC;
  v_new_status TEXT;
BEGIN
  -- Buscar dados da fatura
  SELECT b.*, c.user_id as card_user_id, c.id as card_id
  INTO v_bill
  FROM public.card_bills b
  JOIN public.cards c ON c.id = b.card_id
  WHERE b.id = p_bill_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fatura não encontrada';
  END IF;
  
  -- Verificar se o usuário é o dono
  IF v_bill.card_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  -- Verificar se o pagamento não excede o valor devido
  IF p_amount > v_bill.remaining_amount THEN
    RAISE EXCEPTION 'Valor do pagamento excede o valor devido';
  END IF;
  
  -- Verificar se a fatura não está paga
  IF v_bill.status = 'paid' THEN
    RAISE EXCEPTION 'Fatura já foi paga';
  END IF;
  
  -- Calcular novos valores
  v_new_paid_amount := v_bill.paid_amount + p_amount;
  v_new_remaining_amount := v_bill.total_amount - v_new_paid_amount;
  
  -- Determinar novo status
  IF v_new_remaining_amount = 0 THEN
    v_new_status := 'paid';
  ELSIF v_new_paid_amount > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := v_bill.status;
  END IF;
  
  -- Criar registro de pagamento
  INSERT INTO public.card_bill_payments (
    user_id,
    bill_id,
    account_id,
    amount,
    description
  ) VALUES (
    v_bill.card_user_id,
    p_bill_id,
    p_account_id,
    p_amount,
    p_description
  ) RETURNING id INTO v_payment_id;
  
  -- Atualizar fatura
  UPDATE public.card_bills 
  SET 
    paid_amount = v_new_paid_amount,
    remaining_amount = v_new_remaining_amount,
    status = v_new_status,
    updated_at = now()
  WHERE id = p_bill_id;
  
  -- Restaurar limite do cartão (reduzir used_amount)
  UPDATE public.cards 
  SET 
    used_amount = GREATEST(0, used_amount - p_amount),
    updated_at = now()
  WHERE id = v_bill.card_id;
  
  -- Se há conta vinculada, debitar da conta
  IF p_account_id IS NOT NULL THEN
    UPDATE public.accounts 
    SET 
      balance = balance - p_amount,
      updated_at = now()
    WHERE id = p_account_id AND user_id = v_bill.card_user_id;
  END IF;
  
  RETURN v_payment_id;
END;
$$;

-- Função para ajustar limite do cartão
CREATE OR REPLACE FUNCTION public.adjust_card_limit(
  p_card_id UUID,
  p_new_limit NUMERIC,
  p_reason TEXT DEFAULT 'Ajuste de limite'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_limit NUMERIC;
  v_adjustment_id UUID;
BEGIN
  -- Buscar dados do cartão
  SELECT user_id, credit_limit
  INTO v_user_id, v_current_limit
  FROM public.cards 
  WHERE id = p_card_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado';
  END IF;
  
  -- Verificar se o usuário é o dono
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  -- Verificar se o novo limite é positivo
  IF p_new_limit <= 0 THEN
    RAISE EXCEPTION 'O limite deve ser maior que zero';
  END IF;
  
  -- Registrar ajuste no histórico
  INSERT INTO public.card_limit_adjustments (
    user_id,
    card_id,
    previous_limit,
    new_limit,
    adjustment_amount,
    reason
  ) VALUES (
    v_user_id,
    p_card_id,
    v_current_limit,
    p_new_limit,
    p_new_limit - v_current_limit,
    p_reason
  ) RETURNING id INTO v_adjustment_id;
  
  -- Atualizar limite do cartão
  UPDATE public.cards 
  SET 
    credit_limit = p_new_limit,
    updated_at = now()
  WHERE id = p_card_id;
  
  RETURN v_adjustment_id;
END;
$$;

-- Função para gerar fatura automaticamente
CREATE OR REPLACE FUNCTION public.generate_monthly_bill(
  p_card_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_card RECORD;
  v_bill_id UUID;
  v_total_amount NUMERIC := 0;
  v_closing_date DATE;
  v_due_date DATE;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Buscar dados do cartão
  SELECT * INTO v_card
  FROM public.cards 
  WHERE id = p_card_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado';
  END IF;
  
  -- Verificar se o usuário é o dono
  IF v_card.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  -- Calcular datas da fatura
  v_closing_date := make_date(p_year, p_month, COALESCE(v_card.closing_day, 15));
  v_due_date := make_date(p_year, p_month, COALESCE(v_card.due_day, 22));
  
  -- Se a data de vencimento for antes do fechamento, avançar para o próximo mês
  IF v_due_date <= v_closing_date THEN
    v_due_date := v_due_date + INTERVAL '1 month';
  END IF;
  
  -- Período da fatura (mês anterior ao fechamento)
  v_start_date := (v_closing_date - INTERVAL '1 month')::DATE;
  v_end_date := v_closing_date;
  
  -- Calcular total das transações do período
  SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
  FROM public.transactions
  WHERE card_id = p_card_id 
    AND type = 'expense'
    AND date >= v_start_date 
    AND date <= v_end_date;
  
  -- Verificar se já existe fatura para este período
  IF EXISTS (
    SELECT 1 FROM public.card_bills 
    WHERE card_id = p_card_id 
      AND bill_month = p_month 
      AND bill_year = p_year
  ) THEN
    RAISE EXCEPTION 'Fatura já existe para este período';
  END IF;
  
  -- Criar fatura
  INSERT INTO public.card_bills (
    user_id,
    card_id,
    bill_month,
    bill_year,
    due_date,
    closing_date,
    total_amount,
    remaining_amount
  ) VALUES (
    v_card.user_id,
    p_card_id,
    p_month,
    p_year,
    v_due_date,
    v_closing_date,
    v_total_amount,
    v_total_amount
  ) RETURNING id INTO v_bill_id;
  
  RETURN v_bill_id;
END;
$$;

-- Trigger para atualizar faturas vencidas
CREATE OR REPLACE FUNCTION public.update_overdue_bills()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.card_bills 
  SET status = 'overdue' 
  WHERE status IN ('open', 'partial') 
    AND due_date < CURRENT_DATE;
$$;