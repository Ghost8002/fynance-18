
-- Adicionar colunas is_default e sort_order à tabela categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Atualizar categorias existentes para marcar como padrão se necessário
UPDATE public.categories 
SET is_default = TRUE 
WHERE created_at IS NOT NULL;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_user_sort ON public.categories(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_type_sort ON public.categories(type, sort_order);

-- Adicionar índices para debts (dívidas a pagar)
CREATE INDEX IF NOT EXISTS idx_debts_user_status ON public.debts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON public.debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_user_due_date ON public.debts(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_debts_account_id ON public.debts(account_id);
CREATE INDEX IF NOT EXISTS idx_debts_category_id ON public.debts(category_id);

-- Adicionar índices para receivable_payments (contas a receber)
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_status ON public.receivable_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_due_date ON public.receivable_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_due_date ON public.receivable_payments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_account_id ON public.receivable_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_category_id ON public.receivable_payments(category_id);

-- Adicionar índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);

-- Adicionar índices para accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_type ON public.accounts(user_id, type);
