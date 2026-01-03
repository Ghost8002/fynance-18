-- Strengthen security on junction tables
-- Apply FORCE RLS and revoke anonymous access

ALTER TABLE public.debt_tags FORCE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payment_tags FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tags FORCE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.debt_tags FROM anon;
REVOKE ALL ON public.receivable_payment_tags FROM anon;
REVOKE ALL ON public.tags FROM anon;
REVOKE ALL ON public.categories FROM anon;
REVOKE ALL ON public.subcategories FROM anon;

GRANT SELECT, INSERT, DELETE ON public.debt_tags TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.receivable_payment_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;