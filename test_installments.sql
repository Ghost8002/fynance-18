-- Script de teste para verificar se as tabelas de parcelamentos estão funcionando
-- Execute este script no SQL Editor do Supabase para testar

-- 1. Verificar se as tabelas existem
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('card_installments', 'card_installment_items')
ORDER BY table_name, ordinal_position;

-- 2. Verificar se as políticas RLS estão ativas
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
WHERE tablename IN ('card_installments', 'card_installment_items');

-- 3. Verificar se os índices foram criados
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('card_installments', 'card_installment_items');

-- 4. Verificar se os triggers foram criados
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%card_installments%'
   OR trigger_name LIKE '%card_installment_items%';

-- 5. Teste de inserção (substitua os UUIDs pelos valores reais do seu banco)
-- INSERT INTO public.card_installments (
--   user_id,
--   card_id,
--   category_id,
--   description,
--   total_amount,
--   installments_count,
--   first_installment_date,
--   notes,
--   status
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000', -- user_id real
--   '00000000-0000-0000-0000-000000000000', -- card_id real
--   '00000000-0000-0000-0000-000000000000', -- category_id real
--   'Teste de Compra Parcelada',
--   1000.00,
--   3,
--   '2024-01-15',
--   'Teste de funcionalidade',
--   'active'
-- );

-- 6. Verificar se a função create_debts_from_installments existe
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_debts_from_installments';
