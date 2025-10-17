-- 🔍 VERIFICAÇÃO COMPLETA DAS FUNÇÕES RPC
-- Data: 17/10/2025
-- Objetivo: Verificar se todas as funções RPC necessárias existem e têm permissões corretas

-- ================================================================
-- 1. LISTAR TODAS AS FUNÇÕES RPC RELACIONADAS A CONVERSÕES
-- ================================================================
SELECT 
    '1. FUNÇÕES RPC EXISTENTES' as verificacao,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type,
    prosecdef as is_security_definer,
    provolatile as volatility
FROM pg_proc
WHERE proname IN (
    'increment_variant_conversions',
    'increment_variant_visitors',
    'get_experiment_stats',
    'get_daily_conversions',
    'get_experiment_metrics'
)
ORDER BY proname;

-- ================================================================
-- 2. VER DEFINIÇÃO COMPLETA DA increment_variant_conversions
-- ================================================================
SELECT 
    '2. DEFINIÇÃO increment_variant_conversions' as verificacao,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'increment_variant_conversions';

-- ================================================================
-- 3. TESTAR EXECUÇÃO DA FUNÇÃO increment_variant_conversions
-- ================================================================
-- Primeiro, vamos pegar um variant_id e experiment_id reais para testar
DO $$
DECLARE
    test_variant_id UUID;
    test_experiment_id UUID;
    current_conversions INT;
    current_revenue DECIMAL;
    new_conversions INT;
    new_revenue DECIMAL;
BEGIN
    -- Buscar uma variante real para teste
    SELECT v.id, v.experiment_id
    INTO test_variant_id, test_experiment_id
    FROM variants v
    WHERE v.is_active = true
    LIMIT 1;
    
    IF test_variant_id IS NULL THEN
        RAISE NOTICE '⚠️  Nenhuma variante ativa encontrada para teste';
        RETURN;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '3. TESTE DA FUNÇÃO increment_variant_conversions';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Variant ID de teste: %', test_variant_id;
    RAISE NOTICE 'Experiment ID: %', test_experiment_id;
    
    -- Verificar valores antes
    SELECT conversions, revenue
    INTO current_conversions, current_revenue
    FROM variant_stats
    WHERE variant_id = test_variant_id
      AND experiment_id = test_experiment_id;
      
    RAISE NOTICE 'Conversões ANTES: %', COALESCE(current_conversions, 0);
    RAISE NOTICE 'Receita ANTES: R$ %', COALESCE(current_revenue, 0);
    
    -- Executar função
    RAISE NOTICE 'Chamando increment_variant_conversions...';
    PERFORM increment_variant_conversions(
        p_variant_id := test_variant_id,
        p_experiment_id := test_experiment_id,
        p_revenue := 150.00
    );
    
    -- Verificar valores depois
    SELECT conversions, revenue
    INTO new_conversions, new_revenue
    FROM variant_stats
    WHERE variant_id = test_variant_id
      AND experiment_id = test_experiment_id;
      
    RAISE NOTICE 'Conversões DEPOIS: %', COALESCE(new_conversions, 0);
    RAISE NOTICE 'Receita DEPOIS: R$ %', COALESCE(new_revenue, 0);
    
    -- Verificar se funcionou
    IF COALESCE(new_conversions, 0) > COALESCE(current_conversions, 0) THEN
        RAISE NOTICE '✅ SUCESSO: Função incrementou conversões corretamente!';
    ELSE
        RAISE WARNING '❌ ERRO: Função não incrementou conversões!';
    END IF;
    
    -- Reverter o teste
    RAISE NOTICE 'Revertendo teste...';
    UPDATE variant_stats
    SET conversions = COALESCE(current_conversions, 0),
        revenue = COALESCE(current_revenue, 0)
    WHERE variant_id = test_variant_id
      AND experiment_id = test_experiment_id;
    
    RAISE NOTICE '✅ Teste revertido com sucesso';
    RAISE NOTICE '========================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ ERRO ao executar função: %', SQLERRM;
END $$;

-- ================================================================
-- 4. VERIFICAR PERMISSÕES NO SCHEMA PUBLIC
-- ================================================================
SELECT 
    '4. PERMISSÕES NO SCHEMA PUBLIC' as verificacao,
    nspname as schema_name,
    pg_catalog.has_schema_privilege('anon', nspname, 'USAGE') as anon_can_use,
    pg_catalog.has_schema_privilege('authenticated', nspname, 'USAGE') as authenticated_can_use
FROM pg_namespace
WHERE nspname = 'public';

-- ================================================================
-- 5. VERIFICAR PERMISSÕES DAS FUNÇÕES
-- ================================================================
SELECT 
    '5. PERMISSÕES DAS FUNÇÕES RPC' as verificacao,
    proname as function_name,
    pg_catalog.has_function_privilege('anon', oid, 'EXECUTE') as anon_can_execute,
    pg_catalog.has_function_privilege('authenticated', oid, 'EXECUTE') as authenticated_can_execute
FROM pg_proc
WHERE proname IN (
    'increment_variant_conversions',
    'increment_variant_visitors',
    'get_experiment_stats'
)
ORDER BY proname;

-- ================================================================
-- 6. VERIFICAR SE VARIANT_STATS TEM REGISTROS INICIALIZADOS
-- ================================================================
WITH variant_check AS (
    SELECT
        v.id as variant_id,
        v.experiment_id,
        v.name as variant_name,
        e.name as experiment_name,
        v.is_active,
        EXISTS(
            SELECT 1 FROM variant_stats vs 
            WHERE vs.variant_id = v.id 
              AND vs.experiment_id = v.experiment_id
        ) as has_stats_record
    FROM variants v
    JOIN experiments e ON v.experiment_id = e.id
    WHERE v.is_active = true
)
SELECT 
    '6. STATUS VARIANT_STATS PARA VARIANTES ATIVAS' as verificacao,
    experiment_name,
    variant_name,
    CASE 
        WHEN has_stats_record THEN '✅ OK'
        ELSE '❌ FALTANDO'
    END as status,
    variant_id,
    experiment_id
FROM variant_check
ORDER BY experiment_name, variant_name;

-- ================================================================
-- 7. VERIFICAR SE increment_variant_visitors TAMBÉM FUNCIONA
-- ================================================================
DO $$
DECLARE
    test_variant_id UUID;
    test_experiment_id UUID;
    current_visitors INT;
    new_visitors INT;
BEGIN
    -- Buscar uma variante real para teste
    SELECT v.id, v.experiment_id
    INTO test_variant_id, test_experiment_id
    FROM variants v
    WHERE v.is_active = true
    LIMIT 1;
    
    IF test_variant_id IS NULL THEN
        RAISE NOTICE '⚠️  Nenhuma variante ativa encontrada para teste';
        RETURN;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '7. TESTE DA FUNÇÃO increment_variant_visitors';
    RAISE NOTICE '========================================';
    
    -- Verificar valores antes
    SELECT visitors
    INTO current_visitors
    FROM variant_stats
    WHERE variant_id = test_variant_id
      AND experiment_id = test_experiment_id;
      
    RAISE NOTICE 'Visitantes ANTES: %', COALESCE(current_visitors, 0);
    
    -- Executar função
    PERFORM increment_variant_visitors(
        p_variant_id := test_variant_id,
        p_experiment_id := test_experiment_id
    );
    
    -- Verificar valores depois
    SELECT visitors
    INTO new_visitors
    FROM variant_stats
    WHERE variant_id = test_variant_id
      AND experiment_id = test_experiment_id;
      
    RAISE NOTICE 'Visitantes DEPOIS: %', COALESCE(new_visitors, 0);
    
    -- Verificar se funcionou
    IF COALESCE(new_visitors, 0) > COALESCE(current_visitors, 0) THEN
        RAISE NOTICE '✅ SUCESSO: Função incrementou visitantes corretamente!';
    ELSE
        RAISE WARNING '❌ ERRO: Função não incrementou visitantes!';
    END IF;
    
    -- Reverter o teste
    UPDATE variant_stats
    SET visitors = COALESCE(current_visitors, 0)
    WHERE variant_id = test_variant_id
      AND experiment_id = test_experiment_id;
    
    RAISE NOTICE '✅ Teste revertido';
    RAISE NOTICE '========================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ ERRO ao executar função: %', SQLERRM;
END $$;

-- ================================================================
-- 8. RESUMO FINAL
-- ================================================================
WITH function_check AS (
    SELECT
        COUNT(*) FILTER (WHERE proname = 'increment_variant_conversions') as has_conversions_func,
        COUNT(*) FILTER (WHERE proname = 'increment_variant_visitors') as has_visitors_func,
        COUNT(*) FILTER (WHERE proname = 'get_experiment_stats') as has_stats_func
    FROM pg_proc
    WHERE proname IN ('increment_variant_conversions', 'increment_variant_visitors', 'get_experiment_stats')
),
permission_check AS (
    SELECT
        COUNT(*) FILTER (WHERE pg_catalog.has_function_privilege('anon', oid, 'EXECUTE')) as anon_can_execute,
        COUNT(*) FILTER (WHERE pg_catalog.has_function_privilege('authenticated', oid, 'EXECUTE')) as auth_can_execute
    FROM pg_proc
    WHERE proname IN ('increment_variant_conversions', 'increment_variant_visitors')
),
variant_stats_check AS (
    SELECT
        COUNT(*) as total_variants_active,
        COUNT(*) FILTER (WHERE EXISTS(
            SELECT 1 FROM variant_stats vs 
            WHERE vs.variant_id = v.id 
              AND vs.experiment_id = v.experiment_id
        )) as variants_with_stats
    FROM variants v
    WHERE v.is_active = true
)
SELECT
    '8. RESUMO FINAL' as diagnostico,
    fc.has_conversions_func > 0 as funcao_conversions_existe,
    fc.has_visitors_func > 0 as funcao_visitors_existe,
    fc.has_stats_func > 0 as funcao_stats_existe,
    pc.anon_can_execute >= 2 as anon_pode_executar,
    pc.auth_can_execute >= 2 as authenticated_pode_executar,
    vsc.total_variants_active as total_variantes_ativas,
    vsc.variants_with_stats as variantes_com_stats,
    CASE 
        WHEN fc.has_conversions_func = 0 THEN '❌ CRÍTICO: Função increment_variant_conversions NÃO EXISTE'
        WHEN pc.anon_can_execute < 2 THEN '❌ CRÍTICO: Funções sem permissão para anon'
        WHEN vsc.variants_with_stats < vsc.total_variants_active THEN '⚠️  AVISO: Algumas variantes sem registro em variant_stats'
        ELSE '✅ TUDO OK: Funções existem e têm permissões corretas'
    END as status_geral
FROM function_check fc, permission_check pc, variant_stats_check vsc;

-- ================================================================
-- FIM DA VERIFICAÇÃO
-- ================================================================
SELECT '✅ VERIFICAÇÃO DE FUNÇÕES RPC COMPLETA' as status;

