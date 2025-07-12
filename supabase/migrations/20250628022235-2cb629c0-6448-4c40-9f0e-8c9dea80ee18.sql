
-- Adicionar coluna is_default à tabela categories para distinguir categorias padrão das personalizadas
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Adicionar coluna sort_order para ordenação das categorias
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Atualizar categorias existentes como padrão
UPDATE public.categories 
SET is_default = TRUE 
WHERE created_at IS NOT NULL;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- Habilitar RLS para a tabela categories se ainda não estiver habilitado
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (ignorar erros se não existirem)
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own non-default categories" ON public.categories;

-- Criar políticas RLS para categorias
CREATE POLICY "Users can view their own categories" 
  ON public.categories 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
  ON public.categories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
  ON public.categories 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own non-default categories" 
  ON public.categories 
  FOR DELETE 
  USING (auth.uid() = user_id AND is_default = FALSE);
