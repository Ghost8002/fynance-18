-- Habilitar REPLICA IDENTITY FULL para budgets e subcategories
ALTER TABLE public.budgets REPLICA IDENTITY FULL;
ALTER TABLE public.subcategories REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subcategories;