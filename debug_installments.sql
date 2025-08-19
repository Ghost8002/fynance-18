-- Script para debugar o processo de criação de dívidas a partir de parcelamentos
-- Execute este script no SQL Editor do Supabase para verificar o que está acontecendo

-- 1. Verificar se existem parcelamentos ativos
SELECT 
  id,
  description,
  total_amount,
  installments_count,
  first_installment_date,
  status,
  created_at
FROM public.card_installments 
WHERE status = 'active'
ORDER BY created_at DESC;

-- 2. Verificar se existem itens de parcelamento
SELECT 
  ii.id,
  ii.installment_id,
  ii.installment_number,
  ii.amount,
  ii.due_date,
  ii.status,
  ci.description as installment_description
FROM public.card_installment_items ii
JOIN public.card_installments ci ON ii.installment_id = ci.id
WHERE ci.status = 'active'
ORDER BY ci.created_at DESC, ii.installment_number;

-- 3. Verificar se já existem dívidas para os parcelamentos
SELECT 
  d.id,
  d.description,
  d.amount,
  d.due_date,
  d.status,
  d.installment_id,
  d.installment_number,
  d.card_id
FROM public.debts d
WHERE d.installment_id IS NOT NULL
ORDER BY d.created_at DESC;

-- 4. Testar a função create_debts_from_installments manualmente
-- (Substitua o UUID pelo ID real de um parcelamento ativo)
-- SELECT * FROM create_debts_from_installments('00000000-0000-0000-0000-000000000000');

-- 5. Verificar se a função sync_card_debts está funcionando
-- SELECT * FROM sync_card_debts();

-- 6. Verificar a estrutura da tabela debts para confirmar se tem os campos necessários
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name IN ('installment_id', 'installment_number', 'card_id')
ORDER BY ordinal_position;

-- 7. Verificar se as políticas RLS estão permitindo inserção
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'debts';
