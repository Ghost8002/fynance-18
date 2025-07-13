
-- Adicionar colunas faltantes à tabela receivable_payments
ALTER TABLE public.receivable_payments 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')) DEFAULT NULL;

-- Adicionar constraint para garantir consistência na recorrência
ALTER TABLE public.receivable_payments 
ADD CONSTRAINT IF NOT EXISTS check_recurrence_consistency 
CHECK (
  (is_recurring = FALSE AND recurrence_type IS NULL) OR 
  (is_recurring = TRUE AND recurrence_type IS NOT NULL)
);

-- Adicionar colunas faltantes à tabela categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_receivable_payments_account ON public.receivable_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_category ON public.receivable_payments(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);

-- Atualizar categorias existentes com valores padrão
UPDATE public.categories 
SET is_default = FALSE, sort_order = 0 
WHERE is_default IS NULL OR sort_order IS NULL;
