-- Atualizar estrutura da tabela receivable_payments para suportar funcionalidade completa
-- Similar à tabela debts

-- Adicionar colunas que podem estar faltando
ALTER TABLE public.receivable_payments 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS received_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar constraint para consistência de recorrência
ALTER TABLE public.receivable_payments 
ADD CONSTRAINT IF NOT EXISTS check_receivable_recurrence_consistency 
CHECK (
  (is_recurring = FALSE AND recurrence_type IS NULL) OR 
  (is_recurring = TRUE AND recurrence_type IS NOT NULL)
);

-- Adicionar constraint para status válidos
ALTER TABLE public.receivable_payments 
ADD CONSTRAINT IF NOT EXISTS check_receivable_status 
CHECK (status IN ('pending', 'received', 'overdue'));

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_receivable_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_receivable_payments_updated_at ON public.receivable_payments;
CREATE TRIGGER trigger_update_receivable_payments_updated_at
  BEFORE UPDATE ON public.receivable_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_receivable_payments_updated_at();

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_status ON public.receivable_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_due_date ON public.receivable_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_due_date ON public.receivable_payments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_account_id ON public.receivable_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_category_id ON public.receivable_payments(category_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_received_date ON public.receivable_payments(received_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_is_recurring ON public.receivable_payments(is_recurring);

-- Atualizar RLS (Row Level Security) policies se necessário
DROP POLICY IF EXISTS "Users can view own receivable payments" ON public.receivable_payments;
CREATE POLICY "Users can view own receivable payments" ON public.receivable_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own receivable payments" ON public.receivable_payments;
CREATE POLICY "Users can insert own receivable payments" ON public.receivable_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own receivable payments" ON public.receivable_payments;
CREATE POLICY "Users can update own receivable payments" ON public.receivable_payments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own receivable payments" ON public.receivable_payments;
CREATE POLICY "Users can delete own receivable payments" ON public.receivable_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Garantir que a tabela tenha RLS habilitado
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE public.receivable_payments IS 'Tabela para armazenar pagamentos a receber (contas a receber)';
COMMENT ON COLUMN public.receivable_payments.account_id IS 'Conta onde o pagamento será recebido';
COMMENT ON COLUMN public.receivable_payments.category_id IS 'Categoria de receita do pagamento';
COMMENT ON COLUMN public.receivable_payments.is_recurring IS 'Indica se o pagamento é recorrente';
COMMENT ON COLUMN public.receivable_payments.recurrence_type IS 'Tipo de recorrência: weekly, monthly, yearly';
COMMENT ON COLUMN public.receivable_payments.received_date IS 'Data em que o pagamento foi recebido';
COMMENT ON COLUMN public.receivable_payments.updated_at IS 'Data/hora da última atualização'; 