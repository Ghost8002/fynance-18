-- Fix security for accounts and cards tables
-- Apply FORCE RLS and revoke anonymous access

-- 1. Force RLS on accounts and cards tables
ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cards FORCE ROW LEVEL SECURITY;

-- 2. Revoke all access from anonymous users
REVOKE ALL ON public.accounts FROM anon;
REVOKE ALL ON public.cards FROM anon;

-- 3. Grant access only to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;

-- 4. Also secure related financial tables
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.debts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.budgets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.goals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.card_bills FORCE ROW LEVEL SECURITY;
ALTER TABLE public.card_installments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.card_installment_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.transactions FROM anon;
REVOKE ALL ON public.debts FROM anon;
REVOKE ALL ON public.budgets FROM anon;
REVOKE ALL ON public.goals FROM anon;
REVOKE ALL ON public.card_bills FROM anon;
REVOKE ALL ON public.card_installments FROM anon;
REVOKE ALL ON public.card_installment_items FROM anon;
REVOKE ALL ON public.receivable_payments FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_bills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_installments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_installment_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receivable_payments TO authenticated;