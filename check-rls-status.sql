-- Verificar status das políticas RLS
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('organizations', 'users', 'organization_members', 'projects', 'tasks')
ORDER BY tablename;

-- 2. Verificar políticas existentes
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('organizations', 'users', 'organization_members', 'projects', 'tasks', 'roles')
ORDER BY table_name;

-- 4. Verificar funções RPC
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('create_organization', 'add_user_to_org', 'switch_organization', 'current_user_id', 'current_org_id')
ORDER BY routine_name;

-- 5. Verificar triggers
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%user%' OR trigger_name LIKE '%org%'
ORDER BY event_object_table, trigger_name;
