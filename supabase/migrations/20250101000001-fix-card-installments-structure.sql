-- Migração para corrigir a estrutura das tabelas de parcelamentos
-- Adicionar campos faltantes que são necessários para o funcionamento

-- 1. Adicionar campos faltantes na tabela card_installments
ALTER TABLE public.card_installments 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS first_installment_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
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

-- 4. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_card_installments_user_id ON public.card_installments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_card_id ON public.card_installments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_category_id ON public.card_installments(category_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_status ON public.card_installments(status);

CREATE INDEX IF NOT EXISTS idx_card_installment_items_installment_id ON public.card_installment_items(installment_id);
CREATE INDEX IF NOT EXISTS idx_card_installment_items_status ON public.card_installment_items(status);
CREATE INDEX IF NOT EXISTS idx_card_installment_items_due_date ON public.card_installment_items(due_date);

-- 5. Criar ou atualizar triggers para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS handle_updated_at_card_installments ON public.card_installments;
DROP TRIGGER IF EXISTS handle_updated_at_card_installment_items ON public.card_installment_items;

-- Criar novos triggers
CREATE TRIGGER handle_updated_at_card_installments
    BEFORE UPDATE ON public.card_installments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_card_installment_items
    BEFORE UPDATE ON public.card_installment_items
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 6. Verificar e criar políticas RLS se necessário
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

-- 7. Comentários para clareza
COMMENT ON TABLE public.card_installments IS 'Stores installment purchases that are not yet converted to transactions';
COMMENT ON TABLE public.card_installment_items IS 'Stores individual installments for each purchase';
COMMENT ON COLUMN public.card_installments.category_id IS 'Reference to the category of the purchase';
COMMENT ON COLUMN public.card_installments.first_installment_date IS 'Date of the first installment';
COMMENT ON COLUMN public.card_installments.status IS 'Status of the installment purchase: active, completed, or cancelled';
