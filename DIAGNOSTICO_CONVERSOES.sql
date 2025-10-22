-- ================================================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA DE CONVERSÕES
-- ================================================================
-- Execute este script no SQL Editor do Supabase para verificar
-- se o sistema de conversões está configurado corretamente.
-- ================================================================

-- ================================================================
-- ETAPA 1: Verificar se os campos de conversão existem
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT 'ETAPA 1' AS step, 'Verificando campos na tabela experiments' AS description;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";

SELECT
  column_name AS "Campo",
  data_type AS "Tipo",
  COALESCE(column_default, 'NULL') AS "Valor Padrão",
  CASE
    WHEN column_name IN ('target_url', 'conversion_url', 'conversion_type', 'conversion_value', 'duration_days')
    THEN '✅ OK'
    ELSE '❌ CAMPO INESPERADO'
  END AS "Status"
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name IN (
    'target_url',
    'conversion_url',
    'conversion_type',
    'conversion_value',
    'duration_days'
  )
ORDER BY column_name;

-- Verificar se TODOS os 5 campos existem
SELECT
  CASE
    WHEN COUNT(*) = 5 THEN '✅ SUCESSO: Todos os 5 campos de conversão existem!'
    ELSE '❌ ERRO: Apenas ' || COUNT(*) || ' de 5 campos encontrados. Execute a migration!'
  END AS "Resultado da Verificação"
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name IN (
    'target_url',
    'conversion_url',
    'conversion_type',
    'conversion_value',
    'duration_days'
  );

-- ================================================================
-- ETAPA 2: Verificar índices criados
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT 'ETAPA 2' AS step, 'Verificando índices de performance' AS description;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";

SELECT
  indexname AS "Nome do Índice",
  indexdef AS "Definição",
  CASE
    WHEN indexname IN ('idx_experiments_conversion_url', 'idx_experiments_target_url')
    THEN '✅ OK'
    ELSE '⚠️ ÍNDICE INESPERADO'
  END AS "Status"
FROM pg_indexes
WHERE tablename = 'experiments'
  AND indexname LIKE 'idx_experiments_%url';

-- ================================================================
-- ETAPA 3: Listar experimentos recentes com dados de conversão
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT 'ETAPA 3' AS step, 'Experimentos recentes (últimos 10)' AS description;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";

SELECT
  id AS "ID",
  name AS "Nome",
  status AS "Status",
  CASE
    WHEN target_url IS NOT NULL THEN '✅ ' || target_url
    ELSE '❌ NULL'
  END AS "URL Alvo",
  CASE
    WHEN conversion_url IS NOT NULL THEN '✅ ' || conversion_url
    ELSE '⚠️ NULL (conversão não configurada)'
  END AS "URL de Conversão",
  conversion_type AS "Tipo",
  COALESCE(conversion_value::text, '0') AS "Valor",
  duration_days AS "Duração",
  created_at::date AS "Criado em"
FROM experiments
ORDER BY created_at DESC
LIMIT 10;

-- ================================================================
-- ETAPA 4: Estatísticas de configuração de conversões
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT 'ETAPA 4' AS step, 'Estatísticas de conversões configuradas' AS description;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";

SELECT
  COUNT(*) AS "Total de Experimentos",
  COUNT(CASE WHEN conversion_url IS NOT NULL THEN 1 END) AS "Com Conversão Configurada",
  COUNT(CASE WHEN conversion_url IS NULL THEN 1 END) AS "Sem Conversão",
  ROUND(
    COUNT(CASE WHEN conversion_url IS NOT NULL THEN 1 END)::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS "% Configurado"
FROM experiments;

-- ================================================================
-- ETAPA 5: Verificar eventos de conversão registrados
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT 'ETAPA 5' AS step, 'Eventos de conversão registrados (últimos 20)' AS description;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";

SELECT
  e.event_type AS "Tipo",
  e.visitor_id AS "Visitante",
  v.name AS "Variante",
  exp.name AS "Experimento",
  e.event_data->>'url' AS "URL",
  COALESCE(e.value::text, '0') AS "Valor",
  e.created_at::timestamp AS "Data/Hora"
FROM events e
LEFT JOIN variants v ON e.variant_id = v.id
LEFT JOIN experiments exp ON e.experiment_id = exp.id
WHERE e.event_type = 'conversion'
ORDER BY e.created_at DESC
LIMIT 20;

-- Se não houver resultados, mostrar mensagem
SELECT
  CASE
    WHEN COUNT(*) = 0
    THEN '⚠️ NENHUMA CONVERSÃO REGISTRADA AINDA. Configure um experimento e teste!'
    ELSE '✅ ' || COUNT(*) || ' conversões registradas no total'
  END AS "Status de Conversões"
FROM events
WHERE event_type = 'conversion';

-- ================================================================
-- ETAPA 6: Diagnóstico de problemas comuns
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT 'ETAPA 6' AS step, 'Diagnóstico de problemas comuns' AS description;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";

-- Problema 1: Experimentos sem conversion_url
SELECT
  'PROBLEMA' AS tipo,
  'Experimentos sem URL de conversão' AS descricao,
  COUNT(*) AS quantidade,
  CASE
    WHEN COUNT(*) > 0
    THEN '⚠️ Configure conversion_url nos experimentos'
    ELSE '✅ Todos experimentos têm conversão configurada'
  END AS solucao
FROM experiments
WHERE conversion_url IS NULL
GROUP BY tipo, descricao;

-- Problema 2: Experimentos com conversion_url mas sem variantes
SELECT
  'PROBLEMA' AS tipo,
  'Experimentos com conversão mas sem variantes' AS descricao,
  COUNT(DISTINCT e.id) AS quantidade,
  CASE
    WHEN COUNT(DISTINCT e.id) > 0
    THEN '⚠️ Crie variantes para estes experimentos'
    ELSE '✅ Todos experimentos têm variantes'
  END AS solucao
FROM experiments e
LEFT JOIN variants v ON e.id = v.experiment_id
WHERE e.conversion_url IS NOT NULL
  AND v.id IS NULL
GROUP BY tipo, descricao;

-- Problema 3: Experimentos running sem conversion_url
SELECT
  'PROBLEMA' AS tipo,
  'Experimentos RODANDO sem conversão configurada' AS descricao,
  COUNT(*) AS quantidade,
  CASE
    WHEN COUNT(*) > 0
    THEN '⚠️ Configure conversion_url ou pause estes experimentos'
    ELSE '✅ Todos experimentos ativos têm conversão'
  END AS solucao
FROM experiments
WHERE status = 'running'
  AND conversion_url IS NULL
GROUP BY tipo, descricao;

-- ================================================================
-- ETAPA 7: Recomendações finais
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT 'ETAPA 7' AS step, 'Recomendações e próximos passos' AS description;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";

SELECT
  'RECOMENDAÇÃO' AS tipo,
  recomendacao AS descricao,
  prioridade AS prioridade
FROM (
  SELECT
    1 AS ordem,
    'Se campos de conversão NÃO existem: Execute a migration 20251018000000_add_conversion_fields.sql' AS recomendacao,
    'CRÍTICO' AS prioridade
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiments' AND column_name = 'conversion_url'
  )

  UNION ALL

  SELECT
    2 AS ordem,
    'Se experimentos sem conversion_url: Configure conversão ao criar novos experimentos' AS recomendacao,
    'ALTA' AS prioridade
  WHERE EXISTS (
    SELECT 1 FROM experiments WHERE conversion_url IS NULL
  )

  UNION ALL

  SELECT
    3 AS ordem,
    'Se nenhuma conversão registrada: Teste o fluxo completo em ambiente de desenvolvimento' AS recomendacao,
    'MÉDIA' AS prioridade
  WHERE NOT EXISTS (
    SELECT 1 FROM events WHERE event_type = 'conversion'
  )

  UNION ALL

  SELECT
    4 AS ordem,
    'Monitore a tabela events regularmente para verificar conversões' AS recomendacao,
    'BAIXA' AS prioridade
) AS recomendacoes
ORDER BY ordem;

-- ================================================================
-- RESUMO FINAL
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT 'RESUMO' AS step, 'Status geral do sistema de conversões' AS description;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";

WITH diagnostico AS (
  SELECT
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_name = 'experiments'
     AND column_name IN ('conversion_url', 'conversion_type', 'conversion_value', 'target_url', 'duration_days')
    ) AS campos_existentes,

    (SELECT COUNT(*) FROM experiments) AS total_experimentos,

    (SELECT COUNT(*) FROM experiments WHERE conversion_url IS NOT NULL) AS experimentos_com_conversao,

    (SELECT COUNT(*) FROM events WHERE event_type = 'conversion') AS total_conversoes
)
SELECT
  CASE
    WHEN campos_existentes = 5 THEN '✅ CAMPOS OK'
    ELSE '❌ FALTAM ' || (5 - campos_existentes) || ' CAMPOS'
  END AS "Status da Migration",

  total_experimentos AS "Total de Experimentos",

  experimentos_com_conversao AS "Com Conversão Configurada",

  total_conversoes AS "Conversões Registradas",

  CASE
    WHEN campos_existentes = 5 AND experimentos_com_conversao > 0 AND total_conversoes > 0
    THEN '✅ SISTEMA FUNCIONANDO PERFEITAMENTE'
    WHEN campos_existentes = 5 AND experimentos_com_conversao > 0
    THEN '⚠️ SISTEMA CONFIGURADO - AGUARDANDO PRIMEIRAS CONVERSÕES'
    WHEN campos_existentes = 5
    THEN '⚠️ MIGRATION OK - CONFIGURE CONVERSÕES NOS EXPERIMENTOS'
    ELSE '❌ APLICAR MIGRATION URGENTE'
  END AS "Status Geral"
FROM diagnostico;

-- ================================================================
-- FIM DO DIAGNÓSTICO
-- ================================================================

SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
SELECT '' AS mensagem;
SELECT '📋 DIAGNÓSTICO CONCLUÍDO!' AS mensagem;
SELECT '' AS mensagem;
SELECT '📚 Para mais informações, consulte: GUIA_ATIVAR_CONVERSOES.md' AS mensagem;
SELECT '' AS mensagem;
SELECT '=' AS separator, '=' AS "===", '=' AS "===", '=' AS "===", '=' AS "===";
