-- 🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE CONVERSÕES
-- Data: 17/10/2025
-- Objetivo: Identificar onde está o problema na contabilização de conversões

-- ================================================================
-- 1. VERIFICAR SE EVENTOS DE CONVERSÃO ESTÃO SENDO SALVOS
-- ================================================================
SELECT 
    '1. EVENTOS DE CONVERSÃO NA TABELA EVENTS' as diagnostico,
    COUNT(*) as total_eventos_conversao
FROM events
WHERE event_type = 'conversion';

-- Detalhe dos últimos 10 eventos de conversão
SELECT 
    '1.1. ÚLTIMOS 10 EVENTOS DE CONVERSÃO' as info,
    id,
    experiment_id,
    visitor_id,
    variant_id,
    value,
    event_data,
    created_at
FROM events
WHERE event_type = 'conversion'
ORDER BY created_at DESC
LIMIT 10;

-- ================================================================
-- 2. VERIFICAR TABELA VARIANT_STATS
-- ================================================================
SELECT 
    '2. STATUS DA TABELA VARIANT_STATS' as diagnostico,
    COUNT(*) as total_registros
FROM variant_stats;

-- Detalhe de todas as entradas em variant_stats
SELECT 
    '2.1. REGISTROS EM VARIANT_STATS' as info,
    vs.id,
    vs.experiment_id,
    vs.variant_id,
    vs.visitors,
    vs.conversions,
    vs.revenue,
    vs.last_updated,
    v.name as variant_name,
    e.name as experiment_name
FROM variant_stats vs
JOIN variants v ON vs.variant_id = v.id
JOIN experiments e ON vs.experiment_id = e.id
ORDER BY vs.last_updated DESC;

-- ================================================================
-- 3. COMPARAR EVENTS vs VARIANT_STATS (DISCREPÂNCIAS)
-- ================================================================
WITH events_count AS (
    SELECT 
        experiment_id,
        variant_id,
        COUNT(*) FILTER (WHERE event_type = 'page_view') as events_visitors,
        COUNT(*) FILTER (WHERE event_type = 'conversion') as events_conversions,
        SUM(value) FILTER (WHERE event_type = 'conversion') as events_revenue
    FROM events
    WHERE variant_id IS NOT NULL
    GROUP BY experiment_id, variant_id
),
assignments_count AS (
    SELECT
        experiment_id,
        variant_id,
        COUNT(DISTINCT visitor_id) as assigned_visitors
    FROM assignments
    GROUP BY experiment_id, variant_id
)
SELECT 
    '3. COMPARAÇÃO EVENTS vs VARIANT_STATS' as diagnostico,
    e.name as experiment_name,
    v.name as variant_name,
    COALESCE(ac.assigned_visitors, 0) as visitors_em_assignments,
    COALESCE(vs.visitors, 0) as visitors_em_variant_stats,
    COALESCE(ec.events_conversions, 0) as conversions_em_events,
    COALESCE(vs.conversions, 0) as conversions_em_variant_stats,
    COALESCE(ec.events_revenue, 0) as revenue_em_events,
    COALESCE(vs.revenue, 0) as revenue_em_variant_stats,
    -- Flags de problema
    CASE 
        WHEN COALESCE(ec.events_conversions, 0) > 0 AND COALESCE(vs.conversions, 0) = 0 
        THEN '⚠️ CONVERSÕES EM EVENTS MAS NÃO EM VARIANT_STATS'
        WHEN COALESCE(ec.events_conversions, 0) != COALESCE(vs.conversions, 0)
        THEN '⚠️ NÚMEROS DIVERGENTES'
        WHEN COALESCE(vs.conversions, 0) > 0
        THEN '✅ OK'
        ELSE '❌ SEM CONVERSÕES'
    END as status
FROM variants v
JOIN experiments e ON v.experiment_id = e.id
LEFT JOIN variant_stats vs ON v.id = vs.variant_id
LEFT JOIN events_count ec ON v.id = ec.variant_id AND v.experiment_id = ec.experiment_id
LEFT JOIN assignments_count ac ON v.id = ac.variant_id AND v.experiment_id = ac.experiment_id
WHERE v.is_active = true
ORDER BY e.created_at DESC, v.created_at ASC;

-- ================================================================
-- 4. VERIFICAR SE FUNÇÃO RPC EXISTE
-- ================================================================
SELECT 
    '4. FUNÇÕES RPC RELACIONADAS A CONVERSÕES' as diagnostico,
    proname as function_name,
    pg_get_functiondef(oid) as definition_preview
FROM pg_proc
WHERE proname IN ('increment_variant_conversions', 'increment_variant_visitors', 'get_experiment_stats')
ORDER BY proname;

-- ================================================================
-- 5. VERIFICAR PERMISSÕES DA TABELA VARIANT_STATS
-- ================================================================
SELECT 
    '5. POLÍTICAS RLS EM VARIANT_STATS' as diagnostico,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'variant_stats';

-- ================================================================
-- 6. VERIFICAR EXPERIMENTOS ATIVOS
-- ================================================================
SELECT 
    '6. EXPERIMENTOS ATIVOS' as diagnostico,
    e.id,
    e.name,
    e.status,
    e.conversion_url,
    e.conversion_value,
    e.conversion_type,
    COUNT(DISTINCT v.id) as num_variants,
    COUNT(DISTINCT a.visitor_id) as total_visitors
FROM experiments e
LEFT JOIN variants v ON e.id = v.experiment_id AND v.is_active = true
LEFT JOIN assignments a ON e.id = a.experiment_id
WHERE e.status IN ('running', 'active')
GROUP BY e.id, e.name, e.status, e.conversion_url, e.conversion_value, e.conversion_type
ORDER BY e.created_at DESC;

-- ================================================================
-- 7. VERIFICAR EVENTOS SEM variant_id (PROBLEMA COMUM)
-- ================================================================
SELECT 
    '7. EVENTOS DE CONVERSÃO SEM variant_id' as diagnostico,
    COUNT(*) as total_eventos_sem_variant_id,
    COUNT(DISTINCT experiment_id) as experimentos_afetados,
    COUNT(DISTINCT visitor_id) as visitantes_afetados
FROM events
WHERE event_type = 'conversion'
  AND variant_id IS NULL;

-- Detalhe dos eventos sem variant_id
SELECT 
    '7.1. DETALHE DE CONVERSÕES SEM variant_id' as info,
    id,
    experiment_id,
    visitor_id,
    event_data->>'variant' as variant_name,
    value,
    created_at
FROM events
WHERE event_type = 'conversion'
  AND variant_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- ================================================================
-- 8. RESUMO EXECUTIVO
-- ================================================================
WITH summary AS (
    SELECT
        COUNT(DISTINCT CASE WHEN e.status = 'running' THEN e.id END) as experimentos_ativos,
        COUNT(DISTINCT a.visitor_id) as total_visitantes,
        COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.id END) as total_conversoes_events,
        SUM(CASE WHEN ev.event_type = 'conversion' THEN COALESCE(ev.value, 0) ELSE 0 END) as receita_total_events,
        (SELECT COUNT(*) FROM variant_stats) as registros_variant_stats,
        (SELECT SUM(conversions) FROM variant_stats) as total_conversoes_variant_stats,
        (SELECT SUM(revenue) FROM variant_stats) as receita_total_variant_stats
    FROM experiments e
    LEFT JOIN assignments a ON e.id = a.experiment_id
    LEFT JOIN events ev ON e.id = ev.experiment_id
)
SELECT
    '8. RESUMO EXECUTIVO' as diagnostico,
    experimentos_ativos,
    total_visitantes,
    total_conversoes_events,
    total_conversoes_variant_stats,
    receita_total_events,
    receita_total_variant_stats,
    CASE 
        WHEN total_conversoes_events > 0 AND total_conversoes_variant_stats = 0 
        THEN '🔴 PROBLEMA: Conversões em EVENTS mas não em VARIANT_STATS'
        WHEN total_conversoes_events > 0 AND total_conversoes_variant_stats > 0 AND total_conversoes_events != total_conversoes_variant_stats
        THEN '🟡 AVISO: Números divergentes entre EVENTS e VARIANT_STATS'
        WHEN total_conversoes_events = 0 AND total_conversoes_variant_stats = 0
        THEN '🔵 INFO: Nenhuma conversão registrada ainda'
        ELSE '🟢 OK: Conversões sendo contabilizadas'
    END as status_geral
FROM summary;

-- ================================================================
-- 9. RECOMENDAÇÕES AUTOMÁTICAS
-- ================================================================
WITH diagnostics AS (
    SELECT
        (SELECT COUNT(*) FROM events WHERE event_type = 'conversion') as has_conversion_events,
        (SELECT COUNT(*) FROM variant_stats WHERE conversions > 0) as has_variant_stats,
        (SELECT COUNT(*) FROM events WHERE event_type = 'conversion' AND variant_id IS NULL) as conversions_without_variant_id,
        (SELECT COUNT(*) FROM pg_proc WHERE proname = 'increment_variant_conversions') as has_rpc_function
)
SELECT
    '9. RECOMENDAÇÕES' as diagnostico,
    CASE
        WHEN has_conversion_events = 0 THEN 
            '1️⃣ NENHUMA CONVERSÃO DETECTADA: Verifique se o conversion-tracker.js está instalado na página de sucesso'
        WHEN conversions_without_variant_id > 0 THEN
            '2️⃣ CONVERSÕES SEM variant_id: Execute o script de correção para associar conversões às variantes'
        WHEN has_conversion_events > 0 AND has_variant_stats = 0 THEN
            '3️⃣ VARIANT_STATS VAZIO: Execute o script init-variant-stats.sql para popular a tabela'
        WHEN has_rpc_function = 0 THEN
            '4️⃣ FUNÇÃO RPC NÃO EXISTE: Execute a migration 20250102000000_add_mab_algorithms.sql'
        ELSE
            '✅ SISTEMA APARENTEMENTE OK: Verifique logs do servidor em /api/track'
    END as acao_recomendada
FROM diagnostics;

-- ================================================================
-- FIM DO DIAGNÓSTICO
-- ================================================================
SELECT '✅ DIAGNÓSTICO COMPLETO' as status;

