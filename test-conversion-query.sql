-- =====================================================
-- SCRIPT DE DIAGNÓSTICO COMPLETO - CONVERSÕES
-- =====================================================
-- Execute este script no Supabase SQL Editor para diagnosticar o problema

-- =====================================================
-- 1. VERIFICAR SE MIGRATION FOI APLICADA
-- =====================================================

SELECT
  '=== VERIFICAÇÃO DE CAMPOS DA TABELA EXPERIMENTS ===' as titulo;

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'experiments'
  AND column_name IN (
    'conversion_url',
    'conversion_type',
    'conversion_value',
    'target_url',
    'duration_days'
  )
ORDER BY column_name;

-- Se retornar 0 linhas, a migration NÃO foi aplicada!
-- Se retornar 5 linhas, a migration FOI aplicada corretamente!

-- =====================================================
-- 2. VERIFICAR ÚLTIMO EXPERIMENTO CRIADO
-- =====================================================

SELECT
  '=== ÚLTIMO EXPERIMENTO CRIADO ===' as titulo;

SELECT
  id,
  name,
  target_url,
  conversion_url,
  conversion_type,
  conversion_value,
  duration_days,
  created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 1;

-- Verificar se conversion_url está NULL ou preenchido

-- =====================================================
-- 3. VERIFICAR TODOS EXPERIMENTOS COM/SEM CONVERSION_URL
-- =====================================================

SELECT
  '=== ESTATÍSTICAS DE EXPERIMENTOS ===' as titulo;

SELECT
  COUNT(*) as total_experimentos,
  COUNT(conversion_url) as com_conversion_url,
  COUNT(*) - COUNT(conversion_url) as sem_conversion_url,
  ROUND(100.0 * COUNT(conversion_url) / NULLIF(COUNT(*), 0), 2) || '%' as percentual_com_conversion
FROM experiments;

-- =====================================================
-- 4. LISTAR EXPERIMENTOS RECENTES COM CAMPOS DE CONVERSÃO
-- =====================================================

SELECT
  '=== EXPERIMENTOS RECENTES (últimos 5) ===' as titulo;

SELECT
  id,
  name,
  CASE
    WHEN conversion_url IS NULL THEN '❌ NULL'
    ELSE '✅ ' || LEFT(conversion_url, 50)
  END as conversion_url_status,
  CASE
    WHEN conversion_type IS NULL THEN '❌ NULL'
    ELSE '✅ ' || conversion_type
  END as conversion_type_status,
  CASE
    WHEN conversion_value IS NULL THEN '❌ NULL'
    ELSE '✅ ' || conversion_value::text
  END as conversion_value_status,
  created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 5. VERIFICAR VARIANTES E SUAS CONFIGURAÇÕES
-- =====================================================

SELECT
  '=== VARIANTES DO ÚLTIMO EXPERIMENTO ===' as titulo;

SELECT
  v.id as variant_id,
  v.name as variant_name,
  v.is_control,
  v.redirect_url,
  -- Extrair configuração de conversão do campo changes (JSONB)
  v.changes->>'conversion' as conversion_config_json,
  v.changes->'conversion'->>'type' as conversion_type_in_changes,
  v.changes->'conversion'->>'url' as conversion_url_in_changes,
  v.changes->'conversion'->>'value' as conversion_value_in_changes,
  e.conversion_url as experiment_conversion_url,
  e.conversion_type as experiment_conversion_type,
  e.conversion_value as experiment_conversion_value
FROM variants v
JOIN experiments e ON v.experiment_id = e.id
WHERE e.id = (
  SELECT id FROM experiments ORDER BY created_at DESC LIMIT 1
)
ORDER BY v.is_control DESC, v.name;

-- =====================================================
-- 6. VERIFICAR EVENTOS DE CONVERSÃO
-- =====================================================

SELECT
  '=== EVENTOS DE CONVERSÃO (últimos 10) ===' as titulo;

SELECT
  id,
  experiment_id,
  event_type,
  properties->>'url' as event_url,
  properties->>'value' as event_value,
  properties->>'variant_id' as variant_id,
  created_at
FROM events
WHERE event_type = 'conversion'
ORDER BY created_at DESC
LIMIT 10;

-- Se retornar 0 linhas, NENHUMA conversão foi registrada ainda

-- =====================================================
-- 7. DIAGNÓSTICO FINAL
-- =====================================================

SELECT
  '=== DIAGNÓSTICO FINAL ===' as titulo;

WITH ultimo_exp AS (
  SELECT
    id,
    name,
    conversion_url,
    conversion_type,
    conversion_value
  FROM experiments
  ORDER BY created_at DESC
  LIMIT 1
),
variantes AS (
  SELECT
    v.experiment_id,
    COUNT(*) as total_variantes,
    COUNT(v.changes->'conversion') as variantes_com_config_conversion
  FROM variants v
  WHERE v.experiment_id = (SELECT id FROM ultimo_exp)
  GROUP BY v.experiment_id
),
eventos AS (
  SELECT
    experiment_id,
    COUNT(*) as total_eventos,
    COUNT(*) FILTER (WHERE event_type = 'conversion') as total_conversoes
  FROM events
  WHERE experiment_id = (SELECT id FROM ultimo_exp)
  GROUP BY experiment_id
)
SELECT
  e.id as experimento_id,
  e.name as experimento_nome,
  CASE
    WHEN e.conversion_url IS NULL THEN '❌ PROBLEMA: conversion_url está NULL'
    ELSE '✅ conversion_url preenchido: ' || e.conversion_url
  END as status_conversion_url,
  CASE
    WHEN e.conversion_type IS NULL THEN '❌ PROBLEMA: conversion_type está NULL'
    ELSE '✅ conversion_type: ' || e.conversion_type
  END as status_conversion_type,
  CASE
    WHEN v.variantes_com_config_conversion > 0 THEN '✅ Variantes têm config de conversão'
    ELSE '❌ PROBLEMA: Variantes SEM config de conversão'
  END as status_variantes,
  CASE
    WHEN ev.total_conversoes > 0 THEN '✅ ' || ev.total_conversoes || ' conversões registradas'
    WHEN ev.total_eventos > 0 THEN '⚠️ ' || ev.total_eventos || ' eventos, mas 0 conversões'
    ELSE '❌ PROBLEMA: Nenhum evento registrado'
  END as status_eventos
FROM ultimo_exp e
LEFT JOIN variantes v ON v.experiment_id = e.id
LEFT JOIN eventos ev ON ev.experiment_id = e.id;

-- =====================================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- =====================================================

/*
CENÁRIO 1: Migration não foi aplicada
  - Query 1 retorna 0 linhas
  - SOLUÇÃO: Executar a migration novamente

CENÁRIO 2: Migration aplicada, mas experimento foi criado ANTES da migration
  - Query 1 retorna 5 linhas
  - Query 2 mostra conversion_url = NULL
  - SOLUÇÃO: Criar um NOVO experimento após a migration

CENÁRIO 3: Migration aplicada, experimento novo, mas conversion_url está NULL
  - Query 1 retorna 5 linhas
  - Query 2 mostra conversion_url = NULL mesmo sendo recente
  - SOLUÇÃO: Verificar se o modal está enviando os dados corretamente

CENÁRIO 4: conversion_url preenchido, mas variantes sem config
  - Query 6 mostra conversion_url_in_changes = NULL
  - SOLUÇÃO: Problema no hook useSupabaseExperiments

CENÁRIO 5: Tudo preenchido, mas sem eventos
  - Query 7 retorna 0 eventos de conversão
  - SOLUÇÃO: Problema no SDK/código gerado ou na página do usuário
*/
