-- ===================================================
-- SCRIPT DE VERIFICAÇÃO - ROTA FINAL
-- ===================================================
-- Verifica se todas as tabelas, funções e configurações
-- foram criadas corretamente
-- Data: 2024-01-01

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
    result_text TEXT := '';
BEGIN
    result_text := result_text || E'🔍 VERIFICAÇÃO DO SETUP DO ROTA FINAL\n';
    result_text := result_text || E'=====================================\n\n';

    -- Verificar tabelas principais
    result_text := result_text || E'📋 TABELAS CRIADAS:\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'organizations';
    result_text := result_text || E'  ✅ organizations: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'organization_members';
    result_text := result_text || E'  ✅ organization_members: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'projects';
    result_text := result_text || E'  ✅ projects: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'experiments';
    result_text := result_text || E'  ✅ experiments: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'variants';
    result_text := result_text || E'  ✅ variants: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'goals';
    result_text := result_text || E'  ✅ goals: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'assignments';
    result_text := result_text || E'  ✅ assignments: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'events';
    result_text := result_text || E'  ✅ events: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'metrics_snapshots';
    result_text := result_text || E'  ✅ metrics_snapshots: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'visitor_sessions';
    result_text := result_text || E'  ✅ visitor_sessions: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Verificar views materializadas
    result_text := result_text || E'\n📊 VIEWS MATERIALIZADAS:\n';
    
    SELECT COUNT(*) INTO table_count FROM pg_matviews WHERE matviewname = 'experiment_stats';
    result_text := result_text || E'  ✅ experiment_stats: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO table_count FROM pg_matviews WHERE matviewname = 'variant_stats';
    result_text := result_text || E'  ✅ variant_stats: ' || CASE WHEN table_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Verificar funções principais
    result_text := result_text || E'\n⚙️ FUNÇÕES PRINCIPAIS:\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_member';
    result_text := result_text || E'  ✅ is_member: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_variant_weights';
    result_text := result_text || E'  ✅ get_variant_weights: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'assign_variant';
    result_text := result_text || E'  ✅ assign_variant: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'track_event';
    result_text := result_text || E'  ✅ track_event: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'calculate_significance';
    result_text := result_text || E'  ✅ calculate_significance: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Verificar algoritmos MAB
    result_text := result_text || E'\n🤖 ALGORITMOS MAB:\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'thompson_sampling_weights';
    result_text := result_text || E'  ✅ thompson_sampling_weights: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'ucb1_weights';
    result_text := result_text || E'  ✅ ucb1_weights: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'epsilon_greedy_weights';
    result_text := result_text || E'  ✅ epsilon_greedy_weights: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Verificar políticas RLS
    result_text := result_text || E'\n🔐 POLÍTICAS RLS:\n';
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'organizations';
    result_text := result_text || E'  ✅ organizations (' || policy_count || ' políticas): ' || CASE WHEN policy_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'projects';
    result_text := result_text || E'  ✅ projects (' || policy_count || ' políticas): ' || CASE WHEN policy_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'experiments';
    result_text := result_text || E'  ✅ experiments (' || policy_count || ' políticas): ' || CASE WHEN policy_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'events';
    result_text := result_text || E'  ✅ events (' || policy_count || ' políticas): ' || CASE WHEN policy_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Verificar extensões
    result_text := result_text || E'\n🧩 EXTENSÕES:\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_extension WHERE extname = 'uuid-ossp';
    result_text := result_text || E'  ✅ uuid-ossp: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';
    
    SELECT COUNT(*) INTO function_count FROM pg_extension WHERE extname = 'pgcrypto';
    result_text := result_text || E'  ✅ pgcrypto: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Verificar triggers importantes
    result_text := result_text || E'\n⚡ TRIGGERS:\n';
    
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE trigger_name LIKE '%updated_at%';
    result_text := result_text || E'  ✅ triggers updated_at: ' || trigger_count || E'\n';
    
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE trigger_name LIKE '%generate%';
    result_text := result_text || E'  ✅ triggers de geração: ' || trigger_count || E'\n';

    -- Verificar partições de eventos
    result_text := result_text || E'\n📊 PARTIÇÕES DE EVENTOS:\n';
    
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE tablename LIKE 'events_%';
    result_text := result_text || E'  ✅ partições criadas: ' || table_count || E'\n';

    -- Verificar índices importantes
    result_text := result_text || E'\n🗂️ ÍNDICES DE PERFORMANCE:\n';
    
    SELECT COUNT(*) INTO index_count FROM pg_indexes 
    WHERE tablename IN ('experiments', 'variants', 'assignments', 'events');
    result_text := result_text || E'  ✅ índices principais: ' || index_count || E'\n';

    -- Resumo final
    result_text := result_text || E'\n🎯 RESUMO:\n';
    result_text := result_text || E'================\n';
    
    -- Contar total de tabelas esperadas
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN (
        'organizations', 'organization_members', 'projects', 'experiments', 
        'variants', 'goals', 'assignments', 'events', 'metrics_snapshots', 'visitor_sessions'
    );
    
    result_text := result_text || E'📋 Tabelas: ' || table_count || '/10' || E'\n';
    
    -- Contar funções principais
    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN (
        'is_member', 'get_variant_weights', 'assign_variant', 'track_event',
        'thompson_sampling_weights', 'ucb1_weights', 'epsilon_greedy_weights'
    );
    
    result_text := result_text || E'⚙️ Funções MAB: ' || function_count || '/7' || E'\n';
    
    -- Contar views materializadas
    SELECT COUNT(*) INTO table_count FROM pg_matviews 
    WHERE matviewname IN ('experiment_stats', 'variant_stats');
    
    result_text := result_text || E'📊 Views: ' || table_count || '/2' || E'\n';
    
    result_text := result_text || E'\n';
    
    IF table_count >= 2 AND function_count >= 7 THEN
        result_text := result_text || E'🚀 STATUS: SETUP COMPLETO!\n';
        result_text := result_text || E'✅ O Rota Final está pronto para uso.\n\n';
        result_text := result_text || E'Próximos passos:\n';
        result_text := result_text || E'1. Configure as variáveis de ambiente no Next.js\n';
        result_text := result_text || E'2. Teste a criação de uma organização\n';
        result_text := result_text || E'3. Crie seu primeiro experimento\n';
        result_text := result_text || E'4. Integre o SDK no frontend\n';
    ELSE
        result_text := result_text || E'❌ STATUS: SETUP INCOMPLETO\n';
        result_text := result_text || E'Alguns componentes estão faltando.\n';
        result_text := result_text || E'Verifique se todas as migrações foram executadas.\n';
    END IF;

    -- Imprimir resultado
    RAISE NOTICE '%', result_text;
END $$;
