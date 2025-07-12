
-- Adicionar coluna tags na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;

-- Criar índice para melhor performance nas consultas por tags
CREATE INDEX idx_transactions_tags ON public.transactions USING GIN (tags);

-- Comentário explicativo
COMMENT ON COLUMN public.transactions.tags IS 'Array de objetos JSON contendo as tags da transação: [{"id": "uuid", "name": "string", "color": "string"}]';
