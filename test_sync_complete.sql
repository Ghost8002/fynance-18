-- SCRIPT DE TESTE COMPLETO PARA VERIFICAR SINCRONIZAÇÃO
-- Execute este script após executar o complete_installments_fix.sql

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

-- Verificar se card_installments tem todos os campos necessários
SELECT 
  'card_installments' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'card_installments'
ORDER BY ordinal_position;

-- Verificar se card_installment_items tem todos os campos necessários
SELECT 
  'card_installment_items' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'card_installment_items'
ORDER BY ordinal_position;

-- Verificar se debts tem os campos de integração
SELECT 
  'debts' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name IN ('installment_id', 'installment_number', 'card_id', 'category_id')
ORDER BY ordinal_position;

-- =====================================================
-- 2. VERIFICAR FUNÇÕES
-- =====================================================

-- Verificar se a função create_debts_from_installments existe
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_debts_from_installments';

-- Verificar se a função sync_card_debts existe
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_card_debts';

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Verificar políticas RLS para todas as tabelas relacionadas
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
WHERE tablename IN ('debts', 'card_installments', 'card_installment_items')
ORDER BY tablename, policyname;

-- =====================================================
-- 4. VERIFICAR DADOS EXISTENTES
-- =====================================================

-- Verificar se existem parcelamentos ativos
SELECT 
  'PARCELAMENTOS ATIVOS' as info,
  COUNT(*) as total
FROM public.card_installments 
WHERE status = 'active';

-- Verificar se existem itens de parcelamento
SELECT 
  'ITENS DE PARCELAMENTO' as info,
  COUNT(*) as total
FROM public.card_installment_items;

-- Verificar se já existem dívidas para parcelamentos
SELECT 
  'DÍVIDAS DE PARCELAMENTOS' as info,
  COUNT(*) as total
FROM public.debts 
WHERE installment_id IS NOT NULL;

-- =====================================================
-- 5. TESTAR FUNÇÃO create_debts_from_installments
-- =====================================================

-- Primeiro, vamos ver se há parcelamentos para testar
DO $$
DECLARE
  v_installment_id UUID;
  v_test_result INTEGER;
BEGIN
  -- Buscar um parcelamento ativo para testar
  SELECT id INTO v_installment_id
  FROM public.card_installments 
  WHERE status = 'active'
  LIMIT 1;
  
  IF v_installment_id IS NOT NULL THEN
    RAISE NOTICE 'Testando função com parcelamento: %', v_installment_id;
    
    -- Testar a função
    SELECT create_debts_from_installments(v_installment_id) INTO v_test_result;
    
    RAISE NOTICE 'Resultado do teste: % dívidas criadas', v_test_result;
  ELSE
    RAISE NOTICE 'Nenhum parcelamento ativo encontrado para teste';
  END IF;
END $$;

-- =====================================================
-- 6. TESTAR FUNÇÃO sync_card_debts
-- =====================================================

-- Testar a sincronização completa
DO $$
DECLARE
  v_result JSON;
BEGIN
  RAISE NOTICE 'Testando sincronização completa...';
  
  SELECT sync_card_debts() INTO v_result;
  
  RAISE NOTICE 'Resultado da sincronização: %', v_result;
END $$;

-- =====================================================
-- 7. VERIFICAR RESULTADOS FINAIS
-- =====================================================

-- Verificar todas as dívidas criadas
SELECT 
  d.id,
  d.description,
  d.amount,
  d.due_date,
  d.status,
  d.installment_id,
  d.installment_number,
  d.card_id,
  d.category_id,
  d.created_at,
  ci.description as installment_description,
  c.name as card_name
FROM public.debts d
LEFT JOIN public.card_installments ci ON d.installment_id = ci.id
LEFT JOIN public.cards c ON d.card_id = c.id
WHERE d.installment_id IS NOT NULL
ORDER BY d.created_at DESC;

-- =====================================================
-- 8. VERIFICAR ÍNDICES
-- =====================================================

-- Verificar se os índices foram criados
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('card_installments', 'card_installment_items', 'debts')
AND indexname LIKE '%installment%' OR indexname LIKE '%card%'
ORDER BY tablename, indexname;

-- =====================================================
-- 9. VERIFICAR TRIGGERS
-- =====================================================

-- Verificar se os triggers foram criados
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%updated_at%'
AND event_object_table IN ('card_installments', 'card_installment_items')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 10. RESUMO FINAL
-- =====================================================

SELECT 
  'RESUMO DA VERIFICAÇÃO' as info,
  'Execute este script para verificar se tudo está funcionando' as descricao;
