
-- Criar tabela para histórico de movimentações do limite do cartão
CREATE TABLE IF NOT EXISTS public.card_limit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('charge', 'payment', 'adjustment')),
  amount NUMERIC NOT NULL,
  previous_used_amount NUMERIC NOT NULL DEFAULT 0,
  new_used_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.card_limit_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para card_limit_history
CREATE POLICY "Users can view their own card limit history" 
  ON public.card_limit_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card limit history" 
  ON public.card_limit_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card limit history" 
  ON public.card_limit_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card limit history" 
  ON public.card_limit_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_card_limit_history_card_id ON public.card_limit_history(card_id);
CREATE INDEX idx_card_limit_history_user_id ON public.card_limit_history(user_id);
CREATE INDEX idx_card_limit_history_created_at ON public.card_limit_history(created_at DESC);

-- Função para automaticamente criar histórico quando o limite usado for alterado
CREATE OR REPLACE FUNCTION public.track_card_limit_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se houve mudança no used_amount
  IF OLD.used_amount IS DISTINCT FROM NEW.used_amount THEN
    INSERT INTO public.card_limit_history (
      user_id,
      card_id,
      movement_type,
      amount,
      previous_used_amount,
      new_used_amount,
      description
    ) VALUES (
      NEW.user_id,
      NEW.id,
      CASE 
        WHEN NEW.used_amount > OLD.used_amount THEN 'charge'
        WHEN NEW.used_amount < OLD.used_amount THEN 'payment'
        ELSE 'adjustment'
      END,
      ABS(NEW.used_amount - OLD.used_amount),
      COALESCE(OLD.used_amount, 0),
      NEW.used_amount,
      CASE 
        WHEN NEW.used_amount > OLD.used_amount THEN 'Aumento do limite usado'
        WHEN NEW.used_amount < OLD.used_amount THEN 'Redução do limite usado'
        ELSE 'Ajuste no limite usado'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para rastrear mudanças no limite
DROP TRIGGER IF EXISTS trigger_track_card_limit_changes ON public.cards;
CREATE TRIGGER trigger_track_card_limit_changes
  AFTER UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.track_card_limit_changes();

-- Criar função para pagamento de cartão que atualiza o limite usado
CREATE OR REPLACE FUNCTION public.process_card_payment(
  p_card_id UUID,
  p_amount NUMERIC,
  p_account_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Pagamento de cartão'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_payment_id UUID;
  v_current_used NUMERIC;
  v_new_used NUMERIC;
BEGIN
  -- Buscar dados do cartão e validar
  SELECT user_id, COALESCE(used_amount, 0)
  INTO v_user_id, v_current_used
  FROM public.cards 
  WHERE id = p_card_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado';
  END IF;
  
  -- Verificar se o usuário é o dono do cartão
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  -- Calcular novo valor usado (não pode ser negativo)
  v_new_used := GREATEST(0, v_current_used - p_amount);
  
  -- Criar registro de pagamento
  INSERT INTO public.card_payments (
    user_id,
    card_id,
    account_id,
    amount,
    description,
    payment_date
  ) VALUES (
    v_user_id,
    p_card_id,
    p_account_id,
    p_amount,
    p_description,
    CURRENT_DATE
  ) RETURNING id INTO v_payment_id;
  
  -- Atualizar limite usado do cartão
  UPDATE public.cards 
  SET used_amount = v_new_used,
      updated_at = now()
  WHERE id = p_card_id;
  
  -- Se há conta vinculada, debitar da conta
  IF p_account_id IS NOT NULL THEN
    UPDATE public.accounts 
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = v_user_id;
  END IF;
  
  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
