-- Script para corrigir imediatamente o problema das tabelas de parcelamentos
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Adicionar campos faltantes na tabela card_installments
ALTER TABLE public.card_installments 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS first_installment_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Adicionar campos faltantes na tabela card_installment_items
ALTER TABLE public.card_installment_items 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Adicionar constraint UNIQUE se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'card_installment_items_installment_number_unique'
    ) THEN
        ALTER TABLE public.card_installment_items 
        ADD CONSTRAINT card_installment_items_installment_number_unique 
        UNIQUE (installment_id, installment_number);
    END IF;
END $$;

-- 4. Verificar se as políticas RLS estão ativas
-- Se não estiverem, habilitar RLS
ALTER TABLE public.card_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_installment_items ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS básicas se não existirem
DO $$ 
BEGIN
    -- Políticas para card_installments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'card_installments' 
        AND policyname = 'Users can view their own installments'
    ) THEN
        CREATE POLICY "Users can view their own installments" ON public.card_installments 
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'card_installments' 
        AND policyname = 'Users can insert their own installments'
    ) THEN
        CREATE POLICY "Users can insert their own installments" ON public.card_installments 
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'card_installments' 
        AND policyname = 'Users can update their own installments'
    ) THEN
        CREATE POLICY "Users can update their own installments" ON public.card_installments 
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'card_installments' 
        AND policyname = 'Users can delete their own installments'
    ) THEN
        CREATE POLICY "Users can delete their own installments" ON public.card_installments 
        FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Políticas para card_installment_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'card_installment_items' 
        AND policyname = 'Users can view their own installment items'
    ) THEN
        CREATE POLICY "Users can view their own installment items" ON public.card_installment_items 
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'card_installment_items' 
        AND policyname = 'Users can insert their own installment items'
    ) THEN
        CREATE POLICY "Users can insert their own installment items" ON public.card_installment_items 
        FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'card_installment_items' 
        AND policyname = 'Users can update their own installment items'
    ) THEN
        CREATE POLICY "Users can update their own installment items" ON public.card_installment_items 
        FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'card_installment_items' 
        AND policyname = 'Users can delete their own installment items'
    ) THEN
        CREATE POLICY "Users can delete their own installment items" ON public.card_installment_items 
        FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.card_installments WHERE id = installment_id AND user_id = auth.uid())
        );
    END IF;
END $$;

-- 6. Verificar a estrutura atual das tabelas
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('card_installments', 'card_installment_items')
ORDER BY table_name, ordinal_position;
