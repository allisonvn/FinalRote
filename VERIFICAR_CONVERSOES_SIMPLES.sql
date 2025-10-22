-- ================================================================
-- DIAGNÓSTICO SIMPLIFICADO - CONVERSÕES
-- Execute cada query INDIVIDUALMENTE no SQL Editor do Supabase
-- ================================================================

-- ================================================================
-- QUERY 1: Verificar se campos de conversão existem
-- ================================================================
-- Cole e execute esta query primeiro:

SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name IN ('conversion_url', 'conversion_type', 'conversion_value', 'target_url', 'duration_days')
ORDER BY column_name;

-- RESULTADO ESPERADO: 5 linhas
-- Se retornar 0 linhas = MIGRATION NÃO FOI APLICADA
-- Se retornar 5 linhas = MIGRATION FOI APLICADA ✅


-- ================================================================
-- QUERY 2: Ver experimentos recentes com dados de conversão
-- ================================================================
-- Cole e execute esta query depois:

SELECT
  id,
  name,
  status,
  target_url,
  conversion_url,
  conversion_type,
  conversion_value,
  created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 5;

-- RESULTADO ESPERADO:
-- Se colunas conversion_url, conversion_type, etc não aparecerem = MIGRATION NÃO APLICADA
-- Se conversion_url estiver NULL = Experimento criado antes da migration ou sem conversão configurada


-- ================================================================
-- QUERY 3: Contar experimentos com conversão configurada
-- ================================================================

SELECT
  COUNT(*) as total_experimentos,
  COUNT(conversion_url) as com_conversao_configurada,
  COUNT(*) - COUNT(conversion_url) as sem_conversao
FROM experiments;


-- ================================================================
-- QUERY 4: Ver eventos de conversão (se houver)
-- ================================================================

SELECT
  e.event_type,
  e.visitor_id,
  e.value,
  e.created_at,
  exp.name as experimento_nome
FROM events e
LEFT JOIN experiments exp ON e.experiment_id = exp.id
WHERE e.event_type = 'conversion'
ORDER BY e.created_at DESC
LIMIT 10;

-- Se retornar 0 linhas = Nenhuma conversão foi rastreada ainda


-- ================================================================
-- QUERY 5: Verificar estrutura completa da tabela experiments
-- ================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'experiments'
ORDER BY ordinal_position;

-- Esta query mostra TODAS as colunas da tabela experiments
-- Procure por: conversion_url, conversion_type, conversion_value, target_url, duration_days
