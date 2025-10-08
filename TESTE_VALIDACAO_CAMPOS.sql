-- =====================================
-- TESTE DE VALIDAÇÃO DOS CAMPOS
-- =====================================
-- Este script verifica se todos os campos dos experimentos estão sendo salvos corretamente

-- 1. Verificar estrutura da tabela experiments
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN is_nullable = 'NO' THEN '✅ Obrigatório'
    ELSE '⚪ Opcional'
  END as tipo
FROM information_schema.columns 
WHERE table_name = 'experiments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar experimentos recentes com TODOS os campos
SELECT 
  id,
  name,
  description,
  type,
  status,
  algorithm,
  traffic_allocation,
  target_url,
  conversion_url,
  conversion_value,
  conversion_type,
  started_at,
  ended_at,
  user_id,
  created_at,
  updated_at
FROM experiments
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar quais campos estão NULL em experimentos recentes
SELECT 
  id,
  name,
  CASE WHEN description IS NULL THEN '❌ NULL' ELSE '✅ OK' END as description,
  CASE WHEN algorithm IS NULL THEN '❌ NULL' ELSE '✅ OK (' || algorithm || ')' END as algorithm,
  CASE WHEN traffic_allocation IS NULL THEN '❌ NULL' ELSE '✅ OK (' || traffic_allocation::text || ')' END as traffic_allocation,
  CASE WHEN target_url IS NULL THEN '⚠️ NULL (opcional)' ELSE '✅ OK' END as target_url,
  CASE WHEN conversion_url IS NULL THEN '⚠️ NULL (opcional)' ELSE '✅ OK' END as conversion_url,
  CASE WHEN conversion_value IS NULL THEN '❌ NULL' ELSE '✅ OK (' || conversion_value::text || ')' END as conversion_value,
  CASE WHEN conversion_type IS NULL THEN '❌ NULL' ELSE '✅ OK (' || conversion_type || ')' END as conversion_type,
  CASE WHEN started_at IS NULL THEN '⚠️ NULL (normal se draft)' ELSE '✅ OK' END as started_at,
  CASE WHEN ended_at IS NULL THEN '⚠️ NULL (normal se running)' ELSE '✅ OK' END as ended_at,
  status,
  created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 10;

-- 4. Estatísticas de preenchimento dos campos (% de NULL)
SELECT 
  COUNT(*) as total_experimentos,
  COUNT(description) as com_descricao,
  COUNT(algorithm) as com_algorithm,
  COUNT(target_url) as com_target_url,
  COUNT(conversion_url) as com_conversion_url,
  COUNT(conversion_value) as com_conversion_value,
  COUNT(conversion_type) as com_conversion_type,
  COUNT(started_at) as com_started_at,
  COUNT(ended_at) as com_ended_at,
  ROUND(100.0 * COUNT(algorithm) / COUNT(*), 2) || '%' as percent_algorithm,
  ROUND(100.0 * COUNT(target_url) / COUNT(*), 2) || '%' as percent_target_url,
  ROUND(100.0 * COUNT(conversion_url) / COUNT(*), 2) || '%' as percent_conversion_url
FROM experiments;

-- 5. Verificar experimentos com campos obrigatórios faltando (não deveria retornar nada)
SELECT 
  id,
  name,
  'ERRO: algorithm é obrigatório mas está NULL' as problema
FROM experiments
WHERE algorithm IS NULL
UNION ALL
SELECT 
  id,
  name,
  'ERRO: conversion_type deveria ter default' as problema
FROM experiments
WHERE conversion_type IS NULL
UNION ALL
SELECT 
  id,
  name,
  'ERRO: conversion_value deveria ter default' as problema
FROM experiments
WHERE conversion_value IS NULL;

-- 6. Verificar lógica de started_at e ended_at
SELECT 
  id,
  name,
  status,
  started_at,
  ended_at,
  CASE 
    WHEN status = 'running' AND started_at IS NULL THEN '⚠️ ATENÇÃO: status=running mas started_at está NULL'
    WHEN status IN ('paused', 'completed') AND ended_at IS NULL THEN '⚠️ ATENÇÃO: status pausado/completo mas ended_at está NULL'
    WHEN status = 'draft' AND started_at IS NOT NULL THEN '⚠️ ATENÇÃO: status=draft mas started_at está preenchido'
    ELSE '✅ OK'
  END as validacao_timestamps,
  created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar valores padrão
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE type = 'redirect') as tipo_redirect,
  COUNT(*) FILTER (WHERE algorithm = 'uniform') as algorithm_uniform,
  COUNT(*) FILTER (WHERE algorithm = 'thompson_sampling') as algorithm_thompson,
  COUNT(*) FILTER (WHERE status = 'draft') as status_draft,
  COUNT(*) FILTER (WHERE conversion_type = 'page_view') as conversion_page_view
FROM experiments;

