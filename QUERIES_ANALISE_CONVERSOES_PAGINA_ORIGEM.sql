-- 📊 QUERIES PARA ANÁLISE DE CONVERSÕES POR PÁGINA DE ORIGEM
-- Data: 17/10/2025
-- Status: ✅ IMPLEMENTADO

-- ========================================
-- 1. CONVERSÕES POR PÁGINA DE ORIGEM
-- ========================================
-- Mostra quantas conversões cada página de origem gerou

SELECT 
  event_data->>'origin_page_url' as pagina_origem,
  event_data->>'success_page_url' as pagina_sucesso,
  COUNT(*) as total_conversoes,
  SUM(value) as receita_total,
  AVG(value) as ticket_medio,
  MIN(created_at) as primeira_conversao,
  MAX(created_at) as ultima_conversao
FROM events
WHERE event_type = 'conversion'
  AND event_data->>'origin_page_url' IS NOT NULL
GROUP BY 
  event_data->>'origin_page_url',
  event_data->>'success_page_url'
ORDER BY total_conversoes DESC;

-- ========================================
-- 2. PERFORMANCE POR VARIANTE E PÁGINA (CORRIGIDO)
-- ========================================
-- Mostra performance de cada variante em cada página de origem

SELECT 
  v.name as variante,
  e.event_data->>'origin_page_url' as pagina_origem,
  e.event_data->>'success_page_url' as pagina_sucesso,
  COUNT(*) as conversoes,
  AVG(e.value) as ticket_medio,
  SUM(e.value) as receita_total
FROM events e
JOIN variants v ON e.variant_id = v.id
WHERE e.event_type = 'conversion'
  AND e.event_data->>'origin_page_url' IS NOT NULL
GROUP BY 
  v.name, 
  e.event_data->>'origin_page_url',
  e.event_data->>'success_page_url',
  e.experiment_id
ORDER BY conversoes DESC;

-- ========================================
-- 3. FLUXO DE NAVEGAÇÃO COMPLETO
-- ========================================
-- Mostra o fluxo completo de cada conversão

SELECT 
  visitor_id,
  event_data->>'origin_page_url' as pagina_origem,
  event_data->>'origin_page_title' as titulo_origem,
  event_data->>'success_page_url' as pagina_sucesso,
  event_data->>'success_page_title' as titulo_sucesso,
  event_data->>'referrer' as referrer_original,
  value as valor_conversao,
  created_at as data_conversao,
  event_data->>'user_agent' as user_agent
FROM events
WHERE event_type = 'conversion'
  AND event_data->>'origin_page_url' IS NOT NULL
ORDER BY created_at DESC;

-- ========================================
-- 4. ANÁLISE DE REFERRERS
-- ========================================
-- Mostra de onde vêm os usuários que convertem

SELECT 
  event_data->>'referrer' as referrer,
  event_data->>'origin_page_url' as pagina_origem,
  COUNT(*) as conversoes,
  SUM(value) as receita_total,
  AVG(value) as ticket_medio
FROM events
WHERE event_type = 'conversion'
  AND event_data->>'referrer' IS NOT NULL
  AND event_data->>'referrer' != ''
GROUP BY 
  event_data->>'referrer',
  event_data->>'origin_page_url'
ORDER BY conversoes DESC;

-- ========================================
-- 5. CONVERSÕES POR EXPERIMENTO E PÁGINA
-- ========================================
-- Mostra performance de cada experimento por página de origem

SELECT 
  exp.name as experimento,
  exp.target_url as url_original_experimento,
  exp.conversion_url as url_sucesso_experimento,
  e.event_data->>'origin_page_url' as pagina_origem_real,
  e.event_data->>'success_page_url' as pagina_sucesso_real,
  COUNT(*) as conversoes,
  SUM(e.value) as receita_total,
  AVG(e.value) as ticket_medio
FROM events e
JOIN experiments exp ON e.experiment_id = exp.id
WHERE e.event_type = 'conversion'
  AND e.event_data->>'origin_page_url' IS NOT NULL
GROUP BY 
  exp.name,
  exp.target_url,
  exp.conversion_url,
  e.event_data->>'origin_page_url',
  e.event_data->>'success_page_url'
ORDER BY conversoes DESC;

-- ========================================
-- 6. ANÁLISE TEMPORAL DE CONVERSÕES
-- ========================================
-- Mostra conversões por período e página de origem

SELECT 
  DATE(created_at) as data,
  event_data->>'origin_page_url' as pagina_origem,
  COUNT(*) as conversoes_dia,
  SUM(value) as receita_dia,
  AVG(value) as ticket_medio_dia
FROM events
WHERE event_type = 'conversion'
  AND event_data->>'origin_page_url' IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 
  DATE(created_at),
  event_data->>'origin_page_url'
ORDER BY data DESC, conversoes_dia DESC;

-- ========================================
-- 7. COMPARAÇÃO DE PERFORMANCE POR PÁGINA (CORRIGIDO)
-- ========================================
-- Compara performance entre diferentes páginas de origem

WITH conversoes_por_pagina AS (
  SELECT 
    event_data->>'origin_page_url' as pagina_origem,
    COUNT(*) as total_conversoes,
    SUM(value) as receita_total,
    AVG(value) as ticket_medio
  FROM events
  WHERE event_type = 'conversion'
    AND event_data->>'origin_page_url' IS NOT NULL
  GROUP BY event_data->>'origin_page_url'
),
page_views_por_pagina AS (
  SELECT 
    event_data->>'url' as pagina,
    COUNT(*) as total_page_views
  FROM events
  WHERE event_type = 'page_view'
  GROUP BY event_data->>'url'
)
SELECT 
  c.pagina_origem,
  c.total_conversoes,
  c.receita_total,
  c.ticket_medio,
  COALESCE(p.total_page_views, 0) as total_page_views,
  CASE 
    WHEN p.total_page_views > 0 THEN 
      ROUND((c.total_conversoes * 100.0 / p.total_page_views), 2)
    ELSE 0 
  END as taxa_conversao_percentual
FROM conversoes_por_pagina c
LEFT JOIN page_views_por_pagina p ON c.pagina_origem = p.pagina
ORDER BY c.total_conversoes DESC;

-- ========================================
-- 8. DETALHES DE CONVERSÕES RECENTES
-- ========================================
-- Mostra detalhes das conversões mais recentes

SELECT 
  e.id,
  e.visitor_id,
  exp.name as experimento,
  v.name as variante,
  e.event_data->>'origin_page_url' as pagina_origem,
  e.event_data->>'success_page_url' as pagina_sucesso,
  e.value as valor_conversao,
  e.event_data->>'referrer' as referrer,
  e.created_at as data_conversao,
  e.event_data->>'user_agent' as user_agent
FROM events e
JOIN experiments exp ON e.experiment_id = exp.id
LEFT JOIN variants v ON e.variant_id = v.id
WHERE e.event_type = 'conversion'
  AND e.event_data->>'origin_page_url' IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 20;

-- ========================================
-- 9. VERIFICAÇÃO DE INTEGRIDADE DOS DADOS
-- ========================================
-- Verifica se os dados estão sendo salvos corretamente

SELECT 
  'Total de conversões' as metrica,
  COUNT(*) as valor
FROM events
WHERE event_type = 'conversion'

UNION ALL

SELECT 
  'Conversões com página de origem' as metrica,
  COUNT(*) as valor
FROM events
WHERE event_type = 'conversion'
  AND event_data->>'origin_page_url' IS NOT NULL

UNION ALL

SELECT 
  'Conversões com página de sucesso' as metrica,
  COUNT(*) as valor
FROM events
WHERE event_type = 'conversion'
  AND event_data->>'success_page_url' IS NOT NULL

UNION ALL

SELECT 
  'Conversões com valor' as metrica,
  COUNT(*) as valor
FROM events
WHERE event_type = 'conversion'
  AND value IS NOT NULL
  AND value > 0

UNION ALL

SELECT 
  'Conversões com referrer' as metrica,
  COUNT(*) as valor
FROM events
WHERE event_type = 'conversion'
  AND event_data->>'referrer' IS NOT NULL
  AND event_data->>'referrer' != '';

-- ========================================
-- 10. RESUMO EXECUTIVO
-- ========================================
-- Resumo geral das conversões por página de origem

SELECT 
  event_data->>'origin_page_url' as pagina_origem,
  COUNT(*) as total_conversoes,
  SUM(value) as receita_total,
  AVG(value) as ticket_medio,
  MIN(created_at) as primeira_conversao,
  MAX(created_at) as ultima_conversao,
  COUNT(DISTINCT visitor_id) as usuarios_unicos
FROM events
WHERE event_type = 'conversion'
  AND event_data->>'origin_page_url' IS NOT NULL
GROUP BY event_data->>'origin_page_url'
ORDER BY total_conversoes DESC;
