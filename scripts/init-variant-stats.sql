-- 🔧 SCRIPT DE INICIALIZAÇÃO/CORREÇÃO DE VARIANT_STATS
-- Data: 17/10/2025
-- Objetivo: Popular variant_stats com dados corretos de events e assignments

-- ================================================================
-- IMPORTANTE: Este script é IDEMPOTENTE
-- Pode ser executado múltiplas vezes sem causar problemas
-- ================================================================

BEGIN;

-- ================================================================
-- 1. GARANTIR QUE VARIANT_STATS EXISTE PARA TODAS AS VARIANTES ATIVAS
-- ================================================================
INSERT INTO variant_stats (experiment_id, variant_id, visitors, conversions, revenue, last_updated)
SELECT 
    v.experiment_id,
    v.id as variant_id,
    0 as visitors,
    0 as conversions,
    0 as revenue,
    NOW() as last_updated
FROM variants v
WHERE v.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM variant_stats vs 
    WHERE vs.variant_id = v.id 
      AND vs.experiment_id = v.experiment_id
  )
ON CONFLICT (experiment_id, variant_id) DO NOTHING;

-- ================================================================
-- 2. ATUALIZAR CONTADORES DE VISITANTES BASEADO EM ASSIGNMENTS
-- ================================================================
WITH visitor_counts AS (
    SELECT
        a.experiment_id,
        a.variant_id,
        COUNT(DISTINCT a.visitor_id) as total_visitors
    FROM assignments a
    GROUP BY a.experiment_id, a.variant_id
)
UPDATE variant_stats vs
SET 
    visitors = COALESCE(vc.total_visitors, 0),
    last_updated = NOW()
FROM visitor_counts vc
WHERE vs.experiment_id = vc.experiment_id
  AND vs.variant_id = vc.variant_id;

-- ================================================================
-- 3. ATUALIZAR CONVERSÕES E RECEITA BASEADO EM EVENTS
-- ================================================================
WITH conversion_counts AS (
    SELECT
        e.experiment_id,
        e.variant_id,
        COUNT(*) as total_conversions,
        SUM(COALESCE(e.value, 0)) as total_revenue
    FROM events e
    WHERE e.event_type = 'conversion'
      AND e.variant_id IS NOT NULL
    GROUP BY e.experiment_id, e.variant_id
)
UPDATE variant_stats vs
SET 
    conversions = COALESCE(cc.total_conversions, 0),
    revenue = COALESCE(cc.total_revenue, 0),
    last_updated = NOW()
FROM conversion_counts cc
WHERE vs.experiment_id = cc.experiment_id
  AND vs.variant_id = cc.variant_id;

-- ================================================================
-- 4. CORRIGIR EVENTOS DE CONVERSÃO SEM variant_id
-- ================================================================
-- Tentar associar conversões que foram salvas sem variant_id
-- usando o nome da variante armazenado em event_data

WITH missing_variant_ids AS (
    SELECT 
        e.id as event_id,
        e.experiment_id,
        e.event_data->>'variant' as variant_name,
        v.id as correct_variant_id
    FROM events e
    JOIN variants v ON v.experiment_id = e.experiment_id 
                    AND v.name = e.event_data->>'variant'
    WHERE e.event_type = 'conversion'
      AND e.variant_id IS NULL
      AND e.event_data->>'variant' IS NOT NULL
)
UPDATE events e
SET 
    variant_id = mvi.correct_variant_id
FROM missing_variant_ids mvi
WHERE e.id = mvi.event_id;

-- Após corrigir, atualizar novamente as estatísticas
WITH conversion_counts_fixed AS (
    SELECT
        e.experiment_id,
        e.variant_id,
        COUNT(*) as total_conversions,
        SUM(COALESCE(e.value, 0)) as total_revenue
    FROM events e
    WHERE e.event_type = 'conversion'
      AND e.variant_id IS NOT NULL
    GROUP BY e.experiment_id, e.variant_id
)
UPDATE variant_stats vs
SET 
    conversions = COALESCE(ccf.total_conversions, 0),
    revenue = COALESCE(ccf.total_revenue, 0),
    last_updated = NOW()
FROM conversion_counts_fixed ccf
WHERE vs.experiment_id = ccf.experiment_id
  AND vs.variant_id = ccf.variant_id;

-- ================================================================
-- 5. RELATÓRIO FINAL
-- ================================================================
SELECT 
    '✅ INICIALIZAÇÃO COMPLETA' as status,
    (SELECT COUNT(*) FROM variant_stats) as total_variant_stats_registros,
    (SELECT SUM(visitors) FROM variant_stats) as total_visitantes,
    (SELECT SUM(conversions) FROM variant_stats) as total_conversoes,
    (SELECT SUM(revenue) FROM variant_stats) as receita_total,
    (SELECT COUNT(*) FROM events WHERE event_type = 'conversion' AND variant_id IS NULL) as conversoes_ainda_sem_variant_id;

-- Detalhe por experimento
SELECT 
    e.name as experimento,
    v.name as variante,
    vs.visitors,
    vs.conversions,
    vs.revenue,
    CASE 
        WHEN vs.visitors > 0 THEN ROUND((vs.conversions::numeric / vs.visitors) * 100, 2)
        ELSE 0
    END as taxa_conversao_percentual,
    vs.last_updated
FROM variant_stats vs
JOIN variants v ON vs.variant_id = v.id
JOIN experiments e ON vs.experiment_id = e.id
WHERE vs.conversions > 0 OR vs.visitors > 0
ORDER BY e.created_at DESC, v.created_at ASC;

COMMIT;

-- ================================================================
-- INSTRUÇÕES DE USO
-- ================================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique o relatório final para confirmar que os dados foram atualizados
-- 3. Se ainda houver conversões sem variant_id, investigue manualmente
-- 4. Após executar, recarregue o dashboard para ver os números atualizados

