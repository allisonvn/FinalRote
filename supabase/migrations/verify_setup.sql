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
    trigger_count INTEGER;
    result_text TEXT := '';
BEGIN
    result_text := result_text || E'🔍 VERIFICAÇÃO DO NOVO SETUP DO ROTA FINAL\n';
    result_text := result_text || E'===========================================\n\n';

    -- Verificar tabelas principais
    result_text := result_text || E'📋 TABELAS CRIADAS:\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles';
    result_text := result_text || E'  ✅ roles: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations';
    result_text := result_text || E'  ✅ organizations: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';
    result_text := result_text || E'  ✅ users: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members';
    result_text := result_text || E'  ✅ organization_members: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_statuses';
    result_text := result_text || E'  ✅ project_statuses: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_statuses';
    result_text := result_text || E'  ✅ task_statuses: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_priorities';
    result_text := result_text || E'  ✅ task_priorities: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects';
    result_text := result_text || E'  ✅ projects: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks';
    result_text := result_text || E'  ✅ tasks: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_comments';
    result_text := result_text || E'  ✅ task_comments: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attachments';
    result_text := result_text || E'  ✅ attachments: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs';
    result_text := result_text || E'  ✅ audit_logs: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Verificar funções principais
    result_text := result_text || E'\n⚙️ FUNÇÕES PRINCIPAIS:\n';

    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN (
        'current_user_id', 'current_org_id', 'handle_new_user',
        'add_user_to_org', 'create_organization', 'switch_organization'
    );
    result_text := result_text || E'  ✅ funções de identidade/org: ' || function_count || '/6\n';

    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'enforce_same_org';
    result_text := result_text || E'  ✅ enforce_same_org: ' || CASE WHEN function_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Verificar triggers
    result_text := result_text || E'\n⚡ TRIGGERS CRÍTICOS:\n';

    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE event_object_table = 'users' AND trigger_name = 'set_users_updated_at';
    result_text := result_text || E'  ✅ set_users_updated_at: ' || CASE WHEN trigger_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE event_object_table = 'tasks' AND trigger_name = 'enforce_tasks_org';
    result_text := result_text || E'  ✅ enforce_tasks_org: ' || CASE WHEN trigger_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE event_object_table = 'task_comments' AND trigger_name = 'enforce_task_comments_org';
    result_text := result_text || E'  ✅ enforce_task_comments_org: ' || CASE WHEN trigger_count > 0 THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE trigger_name LIKE 'audit_%';
    result_text := result_text || E'  ✅ triggers de auditoria: ' || trigger_count || E'\n';

    -- Verificar políticas RLS principais
    result_text := result_text || E'\n🔐 POLÍTICAS RLS:\n';

    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizations';
    result_text := result_text || E'  ✅ organizations: ' || policy_count || ' políticas\n';

    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects';
    result_text := result_text || E'  ✅ projects: ' || policy_count || ' políticas\n';

    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks';
    result_text := result_text || E'  ✅ tasks: ' || policy_count || ' políticas\n';

    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attachments';
    result_text := result_text || E'  ✅ attachments: ' || policy_count || ' políticas\n';

    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs';
    result_text := result_text || E'  ✅ audit_logs: ' || policy_count || ' políticas\n';

    -- Verificar extensões
    result_text := result_text || E'\n🧩 EXTENSÕES:\n';

    PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
    result_text := result_text || E'  ✅ pgcrypto: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    PERFORM 1 FROM pg_extension WHERE extname = 'citext';
    result_text := result_text || E'  ✅ citext: ' || CASE WHEN FOUND THEN 'OK' ELSE '❌ FALTANDO' END || E'\n';

    -- Resumo final
    result_text := result_text || E'\n🎯 RESUMO:\n';

    SELECT COUNT(*) INTO table_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN (
        'roles','organizations','users','organization_members','project_statuses',
        'task_statuses','task_priorities','projects','tasks','task_comments','attachments','audit_logs'
    );
    result_text := result_text || E'📋 Tabelas encontradas: ' || table_count || '/12\n';

    SELECT COUNT(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN (
        'current_user_id','current_org_id','handle_new_user','add_user_to_org',
        'create_organization','switch_organization','enforce_same_org','log_audit'
    );
    result_text := result_text || E'⚙️ Funções críticas: ' || function_count || '/8\n';

    IF table_count = 12 AND function_count = 8 THEN
        result_text := result_text || E'\n🚀 STATUS: SETUP COMPLETO!\n';
        result_text := result_text || E'✅ Banco alinhado com o novo modelo multi-tenant.\n';
    ELSE
        result_text := result_text || E'\n❌ STATUS: VERIFICAR ITENS ACIMA\n';
    END IF;

    RAISE NOTICE '%', result_text;
END $$;
