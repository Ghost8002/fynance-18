-- Criar tabelas para parcelamentos de cartão
CREATE TABLE public.card_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  installments_count INTEGER NOT NULL,
  first_installment_date DATE NOT NULL,
  notes TEXT,
  tags JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.card_installment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_id UUID NOT NULL REFERENCES public.card_installments(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_date DATE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(installment_id, installment_number)
);

-- Habilitar RLS
ALTER TABLE public.card_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_installment_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para card_installments
CREATE POLICY "Users can view their own installments" ON public.card_installments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own installments" ON public.card_installments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own installments" ON public.card_installments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own installments" ON public.card_installments FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para card_installment_items  
CREATE POLICY "Users can view their own installment items" ON public.card_installment_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert their own installment items" ON public.card_installment_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their own installment items" ON public.card_installment_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete their own installment items" ON public.card_installment_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
);

-- Criar índices para melhor performance
CREATE INDEX idx_card_installments_user_id ON public.card_installments(user_id);
CREATE INDEX idx_card_installments_card_id ON public.card_installments(card_id);
CREATE INDEX idx_card_installment_items_installment_id ON public.card_installment_items(installment_id);
CREATE INDEX idx_card_installment_items_status ON public.card_installment_items(status);
CREATE INDEX idx_card_installment_items_due_date ON public.card_installment_items(due_date);

-- Criar triggers para updated_at
CREATE TRIGGER handle_updated_at_card_installments
    BEFORE UPDATE ON public.card_installments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_card_installment_items
    BEFORE UPDATE ON public.card_installment_items
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Função para criar compra parcelada
CREATE OR REPLACE FUNCTION public.create_installment_purchase(
  p_user_id UUID,
  p_card_id UUID,
  p_category_id UUID,
  p_description TEXT,
  p_total_amount NUMERIC,
  p_installments_count INTEGER,
  p_first_installment_date DATE,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_installment_id UUID;
  v_installment_amount NUMERIC;
  v_current_date DATE;
  i INTEGER;
BEGIN
  -- Calcular valor de cada parcela
  v_installment_amount := p_total_amount / p_installments_count;
  
  -- Criar registro principal
  INSERT INTO public.card_installments (
    user_id, card_id, description, total_amount, installments_count
  ) VALUES (
    p_user_id, p_card_id, p_description, p_total_amount, p_installments_count
  ) RETURNING id INTO v_installment_id;
  
  -- Criar itens de parcela
  FOR i IN 1..p_installments_count LOOP
    v_current_date := p_first_installment_date + ((i - 1) * INTERVAL '1 month');
    
    INSERT INTO public.card_installment_items (
      installment_id, installment_number, amount, due_date
    ) VALUES (
      v_installment_id, i, v_installment_amount, v_current_date
    );
  END LOOP;
  
  -- Atualizar valor usado do cartão
  UPDATE public.cards 
  SET used_amount = used_amount + p_total_amount
  WHERE id = p_card_id AND user_id = p_user_id;
  
  RETURN json_build_object('success', true, 'installment_id', v_installment_id);
END;
$$;