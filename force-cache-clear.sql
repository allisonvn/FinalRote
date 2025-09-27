-- =====================================================
-- FORÇAR LIMPEZA DE CACHE DO SUPABASE
-- =====================================================
-- Este script força a limpeza completa do cache de schema
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Limpar cache de schema do PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- 2. Forçar refresh do cache de tipos
SELECT pg_notify('pgrst', 'reload config');

-- 3. Limpar cache de funções RPC
SELECT pg_notify('pgrst', 'reload functions');

-- 4. Forçar refresh completo do schema
SELECT pg_notify('pgrst', 'reload all');

-- 5. Verificar se há views ou tabelas que podem estar causando confusão
-- (Este comando apenas verifica, não modifica)
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%experiment%'
ORDER BY tablename;

-- 6. Verificar se há views que podem estar sendo usadas
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE '%experiment%'
ORDER BY viewname;

-- 7. Forçar refresh das estatísticas do banco
ANALYZE;

-- 8. Verificar se há triggers que podem estar interferindo
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'experiments'
AND event_object_schema = 'public';

-- 9. Limpar cache de conexões ativas (se possível)
-- NOTA: Este comando pode não funcionar em ambientes gerenciados
-- SELECT pg_terminate_backend(pid) 
-- FROM pg_stat_activity 
-- WHERE state = 'idle' 
-- AND query_start < now() - interval '5 minutes';

-- 10. Verificar se há configurações específicas do Supabase
SELECT 
    name,
    setting,
    context
FROM pg_settings 
WHERE name LIKE '%postgrest%' 
OR name LIKE '%supabase%'
OR name LIKE '%cache%';

-- =====================================================
-- COMANDOS ADICIONAIS PARA FORÇAR REFRESH
-- =====================================================

-- 11. Recriar a view experiments_public para garantir consistência
DROP VIEW IF EXISTS public.experiments_public CASCADE;

CREATE VIEW public.experiments_public AS
SELECT 
    id,
    project_id,
    name,
    description,
    hypothesis,
    type,
    traffic_allocation,
    status,
    started_at,
    ended_at,
    url_targeting,
    audience_targeting,
    mab_config,
    primary_goal,
    secondary_goals,
    total_visitors,
    total_conversions,
    confidence_level,
    statistical_significance,
    tags,
    notes,
    created_at,
    updated_at,
    conversions_config,
    conversion_goals,
    created_by,
    tracking_config,
    user_id
FROM public.experiments;

-- 12. Garantir que as permissões estão corretas
GRANT SELECT ON public.experiments_public TO anon;
GRANT SELECT ON public.experiments_public TO authenticated;
GRANT SELECT ON public.experiments_public TO service_role;

-- 13. Verificar se a função RPC está acessível
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_experiment_direct';

-- 14. Forçar refresh das permissões
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 15. Verificar se há índices que podem estar causando problemas
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'experiments' 
AND schemaname = 'public';

-- =====================================================
-- COMANDOS DE VERIFICAÇÃO FINAL
-- =====================================================

-- 16. Verificar schema atual da tabela experiments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'experiments' 
ORDER BY ordinal_position;

-- 17. Verificar se há constraints que podem estar causando problemas
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.experiments'::regclass
ORDER BY conname;

-- 18. Teste de inserção para verificar se o cache foi limpo
-- (Execute apenas se quiser testar)
/*
INSERT INTO public.experiments (
    name,
    project_id,
    type,
    traffic_allocation,
    status
) VALUES (
    'Teste_Cache_Clear',
    'b302fac6-3255-4923-833b-5e71a11d5bfe',
    'redirect',
    99.99,
    'draft'
) RETURNING id, name, traffic_allocation;

-- Limpar o teste
DELETE FROM public.experiments WHERE name = 'Teste_Cache_Clear';
*/

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
/*
1. Execute este script no SQL Editor do Supabase Dashboard
2. Aguarde 2-3 minutos para propagação
3. Execute o teste: node test-final-system.js
4. Se ainda houver problemas, aguarde mais 5-10 minutos
5. Execute novamente o teste

NOTA: Alguns comandos podem não funcionar em ambientes gerenciados
como o Supabase, mas a maioria deve forçar o refresh do cache.
*/
