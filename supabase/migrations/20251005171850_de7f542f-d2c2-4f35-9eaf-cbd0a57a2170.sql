-- Adicionar colunas para integração com Pluggy na tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS provider_account_id TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_provider TEXT;

-- Criar índice para melhorar performance de buscas por provider
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON public.accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account_id ON public.accounts(provider_account_id);

-- Adicionar colunas para rastreamento de transações externas na tabela transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_provider TEXT,
ADD COLUMN IF NOT EXISTS original_description TEXT;

-- Criar índice para evitar duplicatas de transações importadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_external_unique 
ON public.transactions(user_id, external_provider, external_id) 
WHERE external_provider IS NOT NULL AND external_id IS NOT NULL;

-- Criar tabela para armazenar tokens de acesso do Pluggy
CREATE TABLE IF NOT EXISTS public.pluggy_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  access_token TEXT,
  connector_id TEXT,
  connector_name TEXT,
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_pluggy_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS na tabela pluggy_connections
ALTER TABLE public.pluggy_connections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pluggy_connections
CREATE POLICY "Users can view their own pluggy connections"
ON public.pluggy_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pluggy connections"
ON public.pluggy_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pluggy connections"
ON public.pluggy_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pluggy connections"
ON public.pluggy_connections FOR DELETE
USING (auth.uid() = user_id);

-- Criar índice para a tabela pluggy_connections
CREATE INDEX IF NOT EXISTS idx_pluggy_connections_user_id ON public.pluggy_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_pluggy_connections_item_id ON public.pluggy_connections(item_id);

-- Adicionar trigger para updated_at
CREATE OR REPLACE FUNCTION update_pluggy_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pluggy_connections_updated_at
BEFORE UPDATE ON public.pluggy_connections
FOR EACH ROW
EXECUTE FUNCTION update_pluggy_connections_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.pluggy_connections IS 'Armazena conexões ativas com instituições financeiras via Pluggy';
COMMENT ON COLUMN public.accounts.provider IS 'Provedor da conta: manual, pluggy, etc';
COMMENT ON COLUMN public.accounts.provider_account_id IS 'ID da conta no provedor externo';
COMMENT ON COLUMN public.accounts.last_sync_at IS 'Data da última sincronização com o provedor';
COMMENT ON COLUMN public.transactions.external_id IS 'ID da transação no sistema externo';
COMMENT ON COLUMN public.transactions.external_provider IS 'Provedor que originou a transação';
COMMENT ON COLUMN public.transactions.original_description IS 'Descrição original da transação antes de qualquer processamento';