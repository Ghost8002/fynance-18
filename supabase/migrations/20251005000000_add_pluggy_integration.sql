-- Pluggy integration: add provider columns and external transaction identifiers
-- Accounts: provider metadata
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_account_id TEXT,
  ADD COLUMN IF NOT EXISTS institution TEXT,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Transactions: external identifiers for idempotent upserts and raw description
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS external_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS original_description TEXT;

-- Unique index to prevent duplicates per external source (nullable-aware)
CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_user_provider_external_id
  ON public.transactions (user_id, external_provider, external_id)
  WHERE external_id IS NOT NULL AND external_provider IS NOT NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS ix_accounts_provider_account_id
  ON public.accounts (provider, provider_account_id);

CREATE INDEX IF NOT EXISTS ix_transactions_external_keys
  ON public.transactions (external_provider, external_id);

