-- ========================================
-- QUERIES DE VALIDAÇÃO - SISTEMA COMPLETO
-- ========================================
-- Use estas queries para validar que o sistema está funcionando corretamente
-- Data: 02/10/2025

-- ========================================
-- 1. VALIDAR MIGRAÇÃO
-- ========================================

-- Verificar se coluna algorithm existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'experiments' 
  AND column_name = 'algorithm';
-- Resultado esperado: 1 linha com 'algorithm' | 'text'

-- Verificar se tabela variant_stats existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'variant_stats';
-- Resultado esperado: 1 linha com 'variant_stats'

-- Verificar funções SQL criadas
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN (
    'increment_variant_visitors',
    'increment_variant_conversions',
    'get_experiment_stats',
    'get_daily_conversions',
    'get_experiment_metrics'
)
ORDER BY proname;
-- Resultado esperado: 5 linhas (5 funções)

-- ========================================
-- 2. VALIDAR EXPERIMENTOS
-- ========================================

-- Listar todos os experimentos com algoritmo
SELECT 
    id,
    name,
    status,
    algorithm,
    created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 10;

-- Ver experimentos rodando com MAB
SELECT 
    id,
    name,
    algorithm,
    status
FROM experiments
WHERE status = 'running'
  AND algorithm IN ('thompson_sampling', 'ucb1', 'epsilon_greedy');

-- ========================================
-- 3. VALIDAR VARIANTES E ESTATÍSTICAS
-- ========================================

-- Ver variantes de um experimento com estatísticas
-- SUBSTITUA 'seu-experimento-id' pelo ID real
SELECT 
    v.name as variante,
    v.is_control,
    v.traffic_percentage,
    COALESCE(vs.visitors, 0) as visitantes,
    COALESCE(vs.conversions, 0) as conversoes,
    COALESCE(vs.revenue, 0) as receita,
    CASE 
        WHEN COALESCE(vs.visitors, 0) > 0 
        THEN ROUND((COALESCE(vs.conversions, 0)::DECIMAL / vs.visitors) * 100, 2)
        ELSE 0
    END as taxa_conversao_percent
FROM variants v
LEFT JOIN variant_stats vs ON v.id = vs.variant_id
WHERE v.experiment_id = 'seu-experimento-id'
ORDER BY v.created_at;

-- Ver experimentos com mais de 100 visitantes (MAB ativo)
SELECT 
    e.id,
    e.name,
    e.algorithm,
    SUM(vs.visitors) as total_visitors,
    SUM(vs.conversions) as total_conversions,
    CASE 
        WHEN SUM(vs.visitors) >= 100 THEN 'MAB Ativo ✅'
        ELSE 'Cold Start (< 100 visitantes)'
    END as status_mab
FROM experiments e
LEFT JOIN variant_stats vs ON e.id = vs.experiment_id
WHERE e.status = 'running'
GROUP BY e.id, e.name, e.algorithm
ORDER BY SUM(vs.visitors) DESC;

-- ========================================
-- 4. VALIDAR CONVERSÕES
-- ========================================

-- Ver últimas 20 conversões
SELECT 
    e.id,
    e.visitor_id,
    e.event_type,
    e.value,
    e.properties->>'variant' as variant,
    e.properties->>'url' as url,
    e.created_at
FROM events e
WHERE e.event_type = 'conversion'
ORDER BY e.created_at DESC
LIMIT 20;

-- Ver conversões por experimento (últimos 7 dias)
SELECT 
    exp.name as experimento,
    e.properties->>'variant' as variante,
    COUNT(*) as num_conversoes,
    SUM(e.value) as receita_total,
    ROUND(AVG(e.value), 2) as ticket_medio
FROM events e
JOIN experiments exp ON e.experiment_id = exp.id
WHERE e.event_type = 'conversion'
  AND e.created_at >= NOW() - INTERVAL '7 days'
GROUP BY exp.name, e.properties->>'variant'
ORDER BY num_conversoes DESC;

-- Ver conversões por dia (últimos 7 dias)
SELECT 
    DATE(e.created_at) as dia,
    COUNT(*) as total_conversoes,
    COUNT(DISTINCT e.visitor_id) as visitantes_unicos,
    SUM(e.value) as receita_dia
FROM events e
WHERE e.event_type = 'conversion'
  AND e.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(e.created_at)
ORDER BY dia DESC;

-- ========================================
-- 5. VALIDAR ASSIGNMENTS (ATRIBUIÇÕES)
-- ========================================

-- Ver últimas atribuições
SELECT 
    a.id,
    a.visitor_id,
    e.name as experimento,
    v.name as variante,
    a.assigned_at
FROM assignments a
JOIN experiments e ON a.experiment_id = e.id
JOIN variants v ON a.variant_id = v.id
ORDER BY a.assigned_at DESC
LIMIT 20;

-- Ver distribuição de atribuições por experimento
SELECT 
    e.name as experimento,
    v.name as variante,
    COUNT(*) as num_atribuicoes,
    ROUND((COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER (PARTITION BY e.id)) * 100, 2) as percentual
FROM assignments a
JOIN experiments e ON a.experiment_id = e.id
JOIN variants v ON a.variant_id = v.id
WHERE e.status = 'running'
GROUP BY e.id, e.name, v.id, v.name
ORDER BY e.name, num_atribuicoes DESC;

-- ========================================
-- 6. VALIDAR PERFORMANCE
-- ========================================

-- Top 10 experimentos por conversão
SELECT 
    e.name as experimento,
    e.algorithm,
    SUM(vs.visitors) as visitantes,
    SUM(vs.conversions) as conversoes,
    SUM(vs.revenue) as receita,
    CASE 
        WHEN SUM(vs.visitors) > 0 
        THEN ROUND((SUM(vs.conversions)::DECIMAL / SUM(vs.visitors)) * 100, 2)
        ELSE 0
    END as taxa_conversao
FROM experiments e
LEFT JOIN variant_stats vs ON e.id = vs.experiment_id
WHERE e.status = 'running'
GROUP BY e.id, e.name, e.algorithm
HAVING SUM(vs.visitors) > 0
ORDER BY taxa_conversao DESC
LIMIT 10;

-- Comparar performance de algoritmos
SELECT 
    e.algorithm,
    COUNT(DISTINCT e.id) as num_experimentos,
    ROUND(AVG(
        CASE 
            WHEN SUM(vs.visitors) > 0 
            THEN (SUM(vs.conversions)::DECIMAL / SUM(vs.visitors)) * 100
            ELSE 0
        END
    ), 2) as taxa_conversao_media
FROM experiments e
LEFT JOIN variant_stats vs ON e.id = vs.experiment_id
WHERE e.status = 'running'
GROUP BY e.algorithm
ORDER BY taxa_conversao_media DESC;

-- ========================================
-- 7. VALIDAR DADOS EM TEMPO REAL
-- ========================================

-- Ver eventos em tempo real (últimos 5 minutos)
SELECT 
    e.event_type,
    e.visitor_id,
    e.properties->>'variant' as variant,
    e.value,
    e.created_at,
    NOW() - e.created_at as tempo_atras
FROM events e
WHERE e.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY e.created_at DESC;

-- Ver variantes sendo atualizadas recentemente
SELECT 
    e.name as experimento,
    v.name as variante,
    vs.visitors,
    vs.conversions,
    vs.last_updated,
    NOW() - vs.last_updated as tempo_ultima_atualizacao
FROM variant_stats vs
JOIN experiments e ON vs.experiment_id = e.id
JOIN variants v ON vs.variant_id = v.id
WHERE vs.last_updated >= NOW() - INTERVAL '1 hour'
ORDER BY vs.last_updated DESC;

-- ========================================
-- 8. DIAGNÓSTICO DE PROBLEMAS
-- ========================================

-- Experimentos sem estatísticas
SELECT 
    e.id,
    e.name,
    e.status,
    COUNT(vs.id) as num_variant_stats
FROM experiments e
LEFT JOIN variant_stats vs ON e.id = vs.experiment_id
WHERE e.status = 'running'
GROUP BY e.id, e.name, e.status
HAVING COUNT(vs.id) = 0;
-- Se retornar linhas: Executar inicialização de variant_stats

-- Variantes sem estatísticas
SELECT 
    v.id,
    v.name,
    v.experiment_id,
    EXISTS(
        SELECT 1 FROM variant_stats vs 
        WHERE vs.variant_id = v.id
    ) as tem_stats
FROM variants v
WHERE v.is_active = TRUE
  AND NOT EXISTS(
    SELECT 1 FROM variant_stats vs 
    WHERE vs.variant_id = v.id
  );
-- Se retornar linhas: Variantes sem stats (precisa inicializar)

-- Conversões sem variant_stats atualizado
SELECT 
    e.experiment_id,
    COUNT(*) as conversoes_eventos
FROM events e
WHERE e.event_type = 'conversion'
  AND e.created_at >= NOW() - INTERVAL '1 day'
GROUP BY e.experiment_id
HAVING NOT EXISTS(
    SELECT 1 FROM variant_stats vs
    WHERE vs.experiment_id = e.experiment_id
      AND vs.conversions > 0
);
-- Se retornar linhas: Conversões não estão atualizando stats

-- ========================================
-- 9. QUERIES DE ADMINISTRAÇÃO
-- ========================================

-- Limpar eventos antigos (> 90 dias)
-- CUIDADO: Isso deleta dados permanentemente!
-- DELETE FROM events 
-- WHERE created_at < NOW() - INTERVAL '90 days';

-- Recalcular variant_stats para um experimento
-- SUBSTITUA 'seu-experimento-id'
/*
UPDATE variant_stats vs
SET 
    visitors = (
        SELECT COUNT(DISTINCT a.visitor_id)
        FROM assignments a
        WHERE a.variant_id = vs.variant_id
    ),
    conversions = (
        SELECT COUNT(*)
        FROM events e
        WHERE e.experiment_id = vs.experiment_id
          AND e.event_type = 'conversion'
          AND e.properties->>'variant' = (
            SELECT v.name FROM variants v WHERE v.id = vs.variant_id
          )
    ),
    revenue = (
        SELECT COALESCE(SUM(e.value), 0)
        FROM events e
        WHERE e.experiment_id = vs.experiment_id
          AND e.event_type = 'conversion'
          AND e.properties->>'variant' = (
            SELECT v.name FROM variants v WHERE v.id = vs.variant_id
          )
    ),
    last_updated = NOW()
WHERE vs.experiment_id = 'seu-experimento-id';
*/

-- ========================================
-- 10. VALIDAÇÃO COMPLETA (CHECKLIST)
-- ========================================

-- Execute esta query para ver status geral do sistema
SELECT 
    'Migração' as componente,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'algorithm')
        THEN '✅ OK'
        ELSE '❌ FALTA'
    END as status
UNION ALL
SELECT 
    'Tabela variant_stats',
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'variant_stats')
        THEN '✅ OK'
        ELSE '❌ FALTA'
    END
UNION ALL
SELECT 
    'Funções SQL',
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('increment_variant_visitors', 'increment_variant_conversions', 'get_experiment_stats')) = 3
        THEN '✅ OK'
        ELSE '❌ FALTA'
    END
UNION ALL
SELECT 
    'Experimentos Rodando',
    CASE 
        WHEN EXISTS(SELECT 1 FROM experiments WHERE status = 'running')
        THEN '✅ OK (' || (SELECT COUNT(*) FROM experiments WHERE status = 'running') || ')'
        ELSE '⚠️  NENHUM'
    END
UNION ALL
SELECT 
    'Conversões Registradas',
    CASE 
        WHEN EXISTS(SELECT 1 FROM events WHERE event_type = 'conversion')
        THEN '✅ OK (' || (SELECT COUNT(*) FROM events WHERE event_type = 'conversion') || ')'
        ELSE '⚠️  NENHUMA'
    END
UNION ALL
SELECT 
    'Variant Stats Atualizado',
    CASE 
        WHEN EXISTS(SELECT 1 FROM variant_stats WHERE visitors > 0)
        THEN '✅ OK'
        ELSE '⚠️  SEM DADOS'
    END;

-- ========================================
-- FIM
-- ========================================
-- Para mais informações, consulte:
-- - SISTEMA_CONVERSOES_COMPLETO.md
-- - ALGORITMOS_MAB_IMPLEMENTADOS.md
-- - RESUMO_FINAL_IMPLEMENTACAO.md

