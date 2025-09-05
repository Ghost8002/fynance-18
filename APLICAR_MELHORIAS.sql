-- =====================================================
-- SCRIPT DE APLICAÇÃO DAS MELHORIAS
-- =====================================================
-- Execute este script para aplicar todas as melhorias
-- da aba "Contas e Dívidas"

-- AVISO: Faça backup do banco de dados antes de executar!

-- =====================================================
-- 1. VERIFICAÇÃO INICIAL
-- =====================================================

-- Verificar se o usuário está autenticado
DO $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado. Execute este script com um usuário logado.';
    END IF;
    
    RAISE NOTICE 'Usuário autenticado: %', auth.uid();
END $$;

-- =====================================================
-- 2. APLICAR MIGRAÇÕES (Execute os arquivos SQL em ordem)
-- =====================================================

-- NOTA: Execute os seguintes arquivos em ordem:
-- 1. 20250120000001-fix-retroactive-transactions.sql
-- 2. 20250120000002-add-duplicate-validation.sql  
-- 3. 20250120000003-add-balance-recalculation.sql
-- 4. 20250120000004-improve-period-filters.sql
-- 5. 20250120000005-complete-improvements.sql

-- =====================================================
-- 3. EXECUTAR LIMPEZA INICIAL
-- =====================================================

-- Limpar duplicatas existentes
SELECT 'Limpando duplicatas de dívidas...' as status;
SELECT public.cleanup_duplicate_debts() as resultado;

SELECT 'Limpando duplicatas de pagamentos...' as status;
SELECT public.cleanup_duplicate_receivables() as resultado;

-- =====================================================
-- 4. VERIFICAR E CORRIGIR INCONSISTÊNCIAS
-- =====================================================

-- Verificar inconsistências de saldo
SELECT 'Verificando inconsistências de saldo...' as status;
SELECT public.check_balance_inconsistencies() as resultado;

-- Corrigir inconsistências de saldo
SELECT 'Corrigindo inconsistências de saldo...' as status;
SELECT public.fix_balance_inconsistencies() as resultado;

-- Verificar inconsistências de período
SELECT 'Verificando inconsistências de período...' as status;
SELECT public.check_period_inconsistencies(
    CURRENT_DATE - INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '1 year'
) as resultado;

-- Corrigir inconsistências de período
SELECT 'Corrigindo inconsistências de período...' as status;
SELECT public.fix_period_status_inconsistencies(
    CURRENT_DATE - INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '1 year'
) as resultado;

-- =====================================================
-- 5. VALIDAR INTEGRIDADE DO SISTEMA
-- =====================================================

-- Validar integridade geral
SELECT 'Validando integridade do sistema...' as status;
SELECT public.validate_system_integrity() as resultado;

-- =====================================================
-- 6. OBTER ESTATÍSTICAS FINAIS
-- =====================================================

-- Obter estatísticas do sistema
SELECT 'Obtendo estatísticas do sistema...' as status;
SELECT public.get_accounts_debts_statistics() as resultado;

-- =====================================================
-- 7. RELATÓRIO FINAL
-- =====================================================

SELECT 
    'MELHORIAS APLICADAS COM SUCESSO!' as status,
    CURRENT_TIMESTAMP as aplicado_em,
    auth.uid() as usuario,
    'Todas as correções foram aplicadas. Sistema otimizado.' as mensagem;

-- =====================================================
-- 8. COMANDOS ÚTEIS PARA MANUTENÇÃO
-- =====================================================

/*
-- Para verificar duplicatas:
SELECT public.cleanup_duplicate_debts();
SELECT public.cleanup_duplicate_receivables();

-- Para verificar saldos:
SELECT public.check_balance_inconsistencies();
SELECT public.fix_balance_inconsistencies();

-- Para verificar período:
SELECT public.check_period_inconsistencies(
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE + INTERVAL '1 month'
);

-- Para obter estatísticas:
SELECT public.get_accounts_debts_statistics();

-- Para validar integridade:
SELECT public.validate_system_integrity();

-- Para limpeza geral:
SELECT public.cleanup_accounts_debts_system();
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

