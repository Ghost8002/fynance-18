
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
