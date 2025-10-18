-- =====================================================
-- DIAGNÓSTICO DO EXPERIMENTO "esmalt"
-- =====================================================
-- ID: 152cab7b-c83b-4420-b1f4-75c911152230
-- =====================================================

-- PASSO 1: Verificar dados do experimento
SELECT
  '=== EXPERIMENTO esmalt ===' as verificacao;

SELECT
  id,
  name,
  conversion_url,
  conversion_type,
  conversion_value,
  status,
  created_at
FROM experiments
WHERE id = '152cab7b-c83b-4420-b1f4-75c911152230';

-- RESULTADO ESPERADO:
-- conversion_url: "https://esmalt.com.br/glow/"
-- conversion_type: "page_view"
-- conversion_value: 100.00

-- =====================================================
-- PASSO 2: Verificar variantes do experimento
-- =====================================================

SELECT
  '=== VARIANTES do esmalt ===' as verificacao;

SELECT
  id,
  name,
  is_control,
  redirect_url,
  changes->'conversion'->>'url' as conversion_url_in_changes,
  changes->'conversion'->>'type' as conversion_type_in_changes,
  changes->'conversion'->>'value' as conversion_value_in_changes,
  changes::text as all_changes_json
FROM variants
WHERE experiment_id = '152cab7b-c83b-4420-b1f4-75c911152230'
ORDER BY is_control DESC;

-- RESULTADO ESPERADO:
-- AMBAS as variantes devem ter:
-- conversion_url_in_changes: "https://esmalt.com.br/glow/"
-- conversion_type_in_changes: "page_view"
-- conversion_value_in_changes: "100"

-- =====================================================
-- PASSO 3: Testar chamada da API (simular)
-- =====================================================

-- Esta query simula o que a API faz ao buscar o experimento:
SELECT
  id,
  name,
  status,
  traffic_allocation,
  type,
  project_id,
  algorithm,
  conversion_url,  -- ✅ Isso é retornado para o SDK
  conversion_value, -- ✅ Isso é retornado para o SDK
  conversion_type   -- ✅ Isso é retornado para o SDK
FROM experiments
WHERE id = '152cab7b-c83b-4420-b1f4-75c911152230';

-- Se conversion_url estiver NULL aqui, a API vai retornar NULL pro SDK!

-- =====================================================
-- PASSO 4: Verificar se já tem eventos
-- =====================================================

SELECT
  '=== EVENTOS do esmalt ===' as verificacao;

SELECT
  id,
  event_type,
  event_name,
  event_data,
  created_at
FROM events
WHERE experiment_id = '152cab7b-c83b-4420-b1f4-75c911152230'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- CORREÇÃO: Se conversion_url estiver NULL
-- =====================================================

-- Descomente e execute se necessário:

/*
UPDATE experiments
SET
  conversion_url = 'https://esmalt.com.br/glow/',
  conversion_type = 'page_view',
  conversion_value = 100.00
WHERE id = '152cab7b-c83b-4420-b1f4-75c911152230';

-- Atualizar variantes também:
UPDATE variants v
SET changes = jsonb_set(
  COALESCE(v.changes, '{}'::jsonb),
  '{conversion}',
  jsonb_build_object(
    'type', 'page_view',
    'url', 'https://esmalt.com.br/glow/',
    'value', 100
  )
)
WHERE experiment_id = '152cab7b-c83b-4420-b1f4-75c911152230';
*/

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT
  '=== RESUMO DIAGNÓSTICO ===' as titulo;

WITH exp AS (
  SELECT
    conversion_url,
    conversion_type,
    conversion_value
  FROM experiments
  WHERE id = '152cab7b-c83b-4420-b1f4-75c911152230'
),
vars AS (
  SELECT
    COUNT(*) as total_variantes,
    COUNT(CASE WHEN changes->'conversion'->>'url' IS NOT NULL THEN 1 END) as variantes_com_config
  FROM variants
  WHERE experiment_id = '152cab7b-c83b-4420-b1f4-75c911152230'
)
SELECT
  CASE
    WHEN exp.conversion_url IS NULL THEN '❌ PROBLEMA: conversion_url está NULL no experimento'
    ELSE '✅ conversion_url: ' || exp.conversion_url
  END as status_experiment,
  CASE
    WHEN vars.variantes_com_config = vars.total_variantes THEN '✅ Todas as ' || vars.total_variantes || ' variantes têm config'
    ELSE '❌ PROBLEMA: Apenas ' || vars.variantes_com_config || ' de ' || vars.total_variantes || ' variantes têm config'
  END as status_variantes
FROM exp, vars;
