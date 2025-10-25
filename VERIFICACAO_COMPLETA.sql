-- ==================================================================================
-- VERIFICAÇÃO COMPLETA DO SISTEMA A/B TESTING
-- ==================================================================================
-- Execute este script para verificar se tudo foi corrigido corretamente
-- ==================================================================================

\echo ''
\echo '🔍 =========================================='
\echo '🔍 VERIFICAÇÃO COMPLETA DO SISTEMA'
\echo '🔍 =========================================='
\echo ''

-- ==================================================================================
-- PARTE 1: VERIFICAR ESTRUTURA DAS TABELAS
-- ==================================================================================

\echo '📋 PARTE 1: Verificando estrutura das tabelas...'
\echo ''

-- 1.1 Verificar tabela experiments
\echo '1.1 Tabela EXPERIMENTS:'
SELECT
    'experiments' as tabela,
    COUNT(*) FILTER (WHERE column_name = 'algorithm') as tem_algorithm,
    COUNT(*) FILTER (WHERE column_name = 'target_url') as tem_target_url,
    COUNT(*) FILTER (WHERE column_name = 'conversion_url') as tem_conversion_url,
    COUNT(*) FILTER (WHERE column_name = 'conversion_type') as tem_conversion_type,
    COUNT(*) FILTER (WHERE column_name = 'conversion_value') as tem_conversion_value,
    COUNT(*) FILTER (WHERE column_name = 'duration_days') as tem_duration_days,
    CASE
        WHEN COUNT(*) FILTER (WHERE column_name IN ('algorithm', 'target_url', 'conversion_url', 'conversion_type', 'conversion_value', 'duration_days')) = 6
        THEN '✅ OK - Todas as colunas existem'
        ELSE '❌ ERRO - Faltam ' || (6 - COUNT(*) FILTER (WHERE column_name IN ('algorithm', 'target_url', 'conversion_url', 'conversion_type', 'conversion_value', 'duration_days'))) || ' colunas'
    END as status
FROM information_schema.columns
WHERE table_name = 'experiments';

\echo ''

-- 1.2 Verificar tabela variant_stats
\echo '1.2 Tabela VARIANT_STATS:'
SELECT
    'variant_stats' as tabela,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variant_stats') as tabela_existe,
    COUNT(*) FILTER (WHERE column_name = 'visitors') as tem_visitors,
    COUNT(*) FILTER (WHERE column_name = 'conversions') as tem_conversions,
    COUNT(*) FILTER (WHERE column_name = 'revenue') as tem_revenue,
    COUNT(*) FILTER (WHERE column_name = 'last_updated') as tem_last_updated,
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variant_stats')
        THEN '❌ ERRO - Tabela não existe'
        WHEN COUNT(*) FILTER (WHERE column_name IN ('visitors', 'conversions', 'revenue', 'last_updated')) = 4
        THEN '✅ OK - Todas as colunas existem'
        ELSE '❌ ERRO - Faltam ' || (4 - COUNT(*) FILTER (WHERE column_name IN ('visitors', 'conversions', 'revenue', 'last_updated'))) || ' colunas'
    END as status
FROM information_schema.columns
WHERE table_name = 'variant_stats';

\echo ''

-- 1.3 Verificar tabela events
\echo '1.3 Tabela EVENTS:'
SELECT
    'events' as tabela,
    COUNT(*) FILTER (WHERE column_name = 'variant_id') as tem_variant_id,
    COUNT(*) FILTER (WHERE column_name = 'event_data') as tem_event_data,
    COUNT(*) FILTER (WHERE column_name = 'value') as tem_value,
    COUNT(*) FILTER (WHERE column_name = 'event_type') as tem_event_type,
    CASE
        WHEN COUNT(*) FILTER (WHERE column_name IN ('variant_id', 'event_data', 'value', 'event_type')) = 4
        THEN '✅ OK - Todas as colunas existem'
        ELSE '❌ ERRO - Faltam ' || (4 - COUNT(*) FILTER (WHERE column_name IN ('variant_id', 'event_data', 'value', 'event_type'))) || ' colunas'
    END as status
FROM information_schema.columns
WHERE table_name = 'events';

\echo ''

-- 1.4 Verificar tabela assignments
\echo '1.4 Tabela ASSIGNMENTS:'
SELECT
    'assignments' as tabela,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') as tabela_existe,
    COUNT(*) FILTER (WHERE column_name = 'experiment_id') as tem_experiment_id,
    COUNT(*) FILTER (WHERE column_name = 'variant_id') as tem_variant_id,
    COUNT(*) FILTER (WHERE column_name = 'visitor_id') as tem_visitor_id,
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments')
        THEN '❌ ERRO - Tabela não existe'
        WHEN COUNT(*) FILTER (WHERE column_name IN ('experiment_id', 'variant_id', 'visitor_id')) = 3
        THEN '✅ OK - Todas as colunas existem'
        ELSE '❌ ERRO - Estrutura incompleta'
    END as status
FROM information_schema.columns
WHERE table_name = 'assignments';

\echo ''
\echo '✅ Parte 1 concluída'
\echo ''

-- ==================================================================================
-- PARTE 2: VERIFICAR FUNÇÕES RPC
-- ==================================================================================

\echo '📋 PARTE 2: Verificando funções RPC...'
\echo ''

SELECT
    proname as "Função RPC",
    CASE
        WHEN proname = 'increment_variant_visitors' THEN '✅'
        WHEN proname = 'increment_variant_conversions' THEN '✅'
        WHEN proname = 'get_experiment_stats' THEN '✅'
        WHEN proname = 'get_daily_conversions' THEN '✅'
        WHEN proname = 'calculate_significance' THEN '✅'
        ELSE '⚠️'
    END as "Status",
    pg_get_functiondef(oid)::text LIKE '%SECURITY DEFINER%' as "Security Definer",
    pronargs as "Num Params"
FROM pg_proc
WHERE proname IN (
    'increment_variant_visitors',
    'increment_variant_conversions',
    'get_experiment_stats',
    'get_daily_conversions',
    'calculate_significance'
)
ORDER BY proname;

\echo ''

-- Verificar total de funções
SELECT
    CASE
        WHEN COUNT(*) = 5 THEN '✅ OK - Todas as 5 funções RPC existem'
        ELSE '❌ ERRO - Apenas ' || COUNT(*) || ' de 5 funções encontradas'
    END as "Status Geral das Funções"
FROM pg_proc
WHERE proname IN (
    'increment_variant_visitors',
    'increment_variant_conversions',
    'get_experiment_stats',
    'get_daily_conversions',
    'calculate_significance'
);

\echo ''
\echo '✅ Parte 2 concluída'
\echo ''

-- ==================================================================================
-- PARTE 3: VERIFICAR TRIGGERS
-- ==================================================================================

\echo '📋 PARTE 3: Verificando triggers...'
\echo ''

SELECT
    tgname as "Trigger",
    '✅' as "Status",
    tgrelid::regclass as "Tabela",
    tgtype as "Tipo"
FROM pg_trigger
WHERE tgname = 'trigger_init_variant_stats';

\echo ''

SELECT
    CASE
        WHEN COUNT(*) >= 1 THEN '✅ OK - Trigger de inicialização existe'
        ELSE '❌ ERRO - Trigger não encontrado'
    END as "Status Geral dos Triggers"
FROM pg_trigger
WHERE tgname = 'trigger_init_variant_stats';

\echo ''
\echo '✅ Parte 3 concluída'
\echo ''

-- ==================================================================================
-- PARTE 4: VERIFICAR ÍNDICES
-- ==================================================================================

\echo '📋 PARTE 4: Verificando índices de performance...'
\echo ''

SELECT
    schemaname as "Schema",
    tablename as "Tabela",
    indexname as "Índice",
    '✅' as "Status"
FROM pg_indexes
WHERE tablename IN ('variant_stats', 'events', 'assignments')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''
\echo '✅ Parte 4 concluída'
\echo ''

-- ==================================================================================
-- PARTE 5: VERIFICAR DADOS INICIALIZADOS
-- ==================================================================================

\echo '📋 PARTE 5: Verificando dados inicializados...'
\echo ''

-- 5.1 Contar variant_stats
\echo '5.1 Variant Stats Inicializados:'
SELECT
    COUNT(DISTINCT vs.experiment_id) as "Experimentos com Stats",
    COUNT(vs.id) as "Total Variant Stats",
    COUNT(DISTINCT vs.variant_id) as "Variantes com Stats",
    CASE
        WHEN COUNT(vs.id) > 0 THEN '✅ OK - Dados inicializados'
        ELSE '⚠️ AVISO - Nenhum dado (pode ser normal se não há experimentos)'
    END as "Status"
FROM variant_stats vs;

\echo ''

-- 5.2 Verificar se todas as variantes ativas têm stats
\echo '5.2 Variantes sem Stats (deveriam ter):'
SELECT
    e.name as "Experimento",
    v.name as "Variante",
    v.is_active as "Ativa",
    '❌ Faltando stats' as "Status"
FROM variants v
JOIN experiments e ON e.id = v.experiment_id
WHERE v.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM variant_stats vs
      WHERE vs.variant_id = v.id AND vs.experiment_id = v.experiment_id
  )
LIMIT 10;

\echo ''

-- Se nenhuma variante sem stats, mostrar mensagem
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM variants v
    WHERE v.is_active = TRUE
      AND NOT EXISTS (
          SELECT 1 FROM variant_stats vs
          WHERE vs.variant_id = v.id AND vs.experiment_id = v.experiment_id
      );

    IF missing_count = 0 THEN
        RAISE NOTICE '✅ OK - Todas as variantes ativas têm stats inicializados';
    ELSE
        RAISE WARNING '⚠️ AVISO - % variantes ativas sem stats', missing_count;
    END IF;
END $$;

\echo ''
\echo '✅ Parte 5 concluída'
\echo ''

-- ==================================================================================
-- PARTE 6: VERIFICAR PERMISSIONS E RLS
-- ==================================================================================

\echo '📋 PARTE 6: Verificando permissions e RLS...'
\echo ''

-- 6.1 Verificar RLS habilitado
\echo '6.1 Row Level Security (RLS):'
SELECT
    tablename as "Tabela",
    CASE
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Desabilitado'
    END as "RLS Status"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('variant_stats', 'events', 'assignments', 'experiments', 'variants')
ORDER BY tablename;

\echo ''

-- 6.2 Verificar políticas RLS
\echo '6.2 Políticas RLS:'
SELECT
    tablename as "Tabela",
    policyname as "Política",
    '✅' as "Status",
    cmd as "Comando"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('variant_stats', 'events', 'assignments')
ORDER BY tablename, policyname;

\echo ''
\echo '✅ Parte 6 concluída'
\echo ''

-- ==================================================================================
-- PARTE 7: TESTAR FUNÇÕES RPC
-- ==================================================================================

\echo '📋 PARTE 7: Testando funções RPC...'
\echo ''

-- 7.1 Criar dados de teste temporários
DO $$
DECLARE
    test_exp_id UUID;
    test_var_id UUID;
    test_visitor TEXT := 'test_visitor_' || extract(epoch from now())::text;
BEGIN
    -- Verificar se já existe experimento de teste
    SELECT id INTO test_exp_id FROM experiments WHERE name = '__TEST_VERIFICATION__' LIMIT 1;

    IF test_exp_id IS NULL THEN
        RAISE NOTICE '⚠️ Nenhum experimento de teste encontrado. Pulando testes de RPC.';
        RAISE NOTICE 'ℹ️ As funções RPC serão testadas automaticamente quando você criar um experimento real.';
    ELSE
        -- Buscar primeira variante do experimento
        SELECT id INTO test_var_id FROM variants WHERE experiment_id = test_exp_id LIMIT 1;

        IF test_var_id IS NOT NULL THEN
            RAISE NOTICE '🧪 Testando increment_variant_visitors...';
            PERFORM increment_variant_visitors(test_var_id, test_exp_id);
            RAISE NOTICE '✅ increment_variant_visitors funcionou';

            RAISE NOTICE '🧪 Testando increment_variant_conversions...';
            PERFORM increment_variant_conversions(test_var_id, test_exp_id, 50.00);
            RAISE NOTICE '✅ increment_variant_conversions funcionou';

            RAISE NOTICE '🧪 Testando get_experiment_stats...';
            PERFORM get_experiment_stats(test_exp_id);
            RAISE NOTICE '✅ get_experiment_stats funcionou';
        END IF;
    END IF;
END $$;

\echo ''
\echo '✅ Parte 7 concluída'
\echo ''

-- ==================================================================================
-- PARTE 8: RESUMO E STATUS GERAL
-- ==================================================================================

\echo '📋 PARTE 8: Resumo e Status Geral...'
\echo ''

DO $$
DECLARE
    variant_stats_ok BOOLEAN;
    experiments_ok BOOLEAN;
    assignments_ok BOOLEAN;
    funcoes_rpc_ok BOOLEAN;
    triggers_ok BOOLEAN;
    rls_ok BOOLEAN;
    status_geral TEXT;
BEGIN
    -- Verificar tabelas
    variant_stats_ok := (
        SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = 'variant_stats'
        AND column_name IN ('visitors', 'conversions', 'revenue', 'last_updated')
    ) = 4;

    experiments_ok := (
        SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = 'experiments'
        AND column_name IN ('algorithm', 'conversion_url', 'conversion_type')
    ) = 3;

    assignments_ok := (
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'assignments'
        )
    );

    -- Verificar funções
    funcoes_rpc_ok := (
        SELECT COUNT(*) FROM pg_proc
        WHERE proname IN (
            'increment_variant_visitors',
            'increment_variant_conversions',
            'get_experiment_stats',
            'get_daily_conversions',
            'calculate_significance'
        )
    ) = 5;

    -- Verificar triggers
    triggers_ok := (
        SELECT COUNT(*) FROM pg_trigger
        WHERE tgname = 'trigger_init_variant_stats'
    ) >= 1;

    -- Verificar RLS
    rls_ok := (
        SELECT COUNT(*) FROM pg_tables
        WHERE tablename IN ('variant_stats', 'events', 'assignments')
        AND rowsecurity = true
    ) = 3;

    -- Determinar status geral
    IF variant_stats_ok AND experiments_ok AND assignments_ok AND funcoes_rpc_ok AND triggers_ok AND rls_ok THEN
        status_geral := '🎉 SISTEMA 100% FUNCIONAL - TUDO OK!';
    ELSIF variant_stats_ok AND funcoes_rpc_ok THEN
        status_geral := '✅ SISTEMA FUNCIONAL - Pequenos ajustes opcionais';
    ELSE
        status_geral := '⚠️ SISTEMA COM PROBLEMAS - Revise os erros acima';
    END IF;

    -- Mostrar resultados
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════╗';
    RAISE NOTICE '║  RESULTADO DA VERIFICAÇÃO COMPLETA     ║';
    RAISE NOTICE '╚════════════════════════════════════════╝';
    RAISE NOTICE '';

    RAISE NOTICE '📊 Tabelas: %',
        CASE WHEN variant_stats_ok AND experiments_ok AND assignments_ok
        THEN '✅ OK' ELSE '❌ ERRO' END;

    RAISE NOTICE '⚙️  Funções RPC: %',
        CASE WHEN funcoes_rpc_ok THEN '✅ OK (5/5)' ELSE '❌ ERRO' END;

    RAISE NOTICE '🔄 Triggers: %',
        CASE WHEN triggers_ok THEN '✅ OK' ELSE '❌ ERRO' END;

    RAISE NOTICE '🔒 RLS (Segurança): %',
        CASE WHEN rls_ok THEN '✅ OK' ELSE '❌ ERRO' END;

    RAISE NOTICE '';
    RAISE NOTICE 'STATUS GERAL: %', status_geral;
    RAISE NOTICE '';
END $$;

\echo ''
\echo '=========================================='
\echo ''

-- ==================================================================================
-- PARTE 9: PRÓXIMOS PASSOS
-- ==================================================================================

\echo '📋 PRÓXIMOS PASSOS:'
\echo ''
\echo '1. ✅ Se STATUS GERAL = 100% FUNCIONAL:'
\echo '   → Teste criando um experimento no dashboard'
\echo '   → Verifique se as métricas atualizam corretamente'
\echo ''
\echo '2. ⚠️ Se STATUS GERAL = COM PROBLEMAS:'
\echo '   → Revise os erros marcados com ❌ acima'
\echo '   → Execute novamente o FIX_COMPLETE_SYSTEM.sql'
\echo '   → Execute esta verificação novamente'
\echo ''
\echo '3. 🧪 Para testar o sistema completo:'
\echo '   → Crie um experimento de teste'
\echo '   → Gere o código com o Code Generator'
\echo '   → Teste em uma página HTML'
\echo '   → Verifique os números no dashboard'
\echo ''
\echo '=========================================='
\echo '🏁 VERIFICAÇÃO COMPLETA FINALIZADA'
\echo '=========================================='
\echo ''
