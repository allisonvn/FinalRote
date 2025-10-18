-- =====================================================
-- CORREÇÃO: Adicionar Configuração de Conversão em TODAS as Variantes
-- =====================================================
-- Este script corrige TODOS os experimentos existentes que têm
-- conversion_url configurado mas as variantes não têm a configuração
-- =====================================================

-- PASSO 1: Diagnóstico - Ver quantas variantes precisam ser corrigidas
SELECT
  '=== DIAGNÓSTICO: Variantes que precisam de correção ===' as titulo;

SELECT
  e.id as experiment_id,
  e.name as experiment_name,
  e.conversion_url,
  v.id as variant_id,
  v.name as variant_name,
  CASE
    WHEN v.changes->'conversion' IS NULL THEN '❌ SEM config de conversão'
    WHEN v.changes->'conversion'->>'url' IS NULL THEN '⚠️ Config incompleta'
    ELSE '✅ OK'
  END as status
FROM experiments e
JOIN variants v ON v.experiment_id = e.id
WHERE e.conversion_url IS NOT NULL
ORDER BY e.created_at DESC, v.is_control DESC;

-- PASSO 2: Contar quantas variantes serão atualizadas
SELECT
  '=== TOTAL DE VARIANTES A SEREM CORRIGIDAS ===' as titulo;

SELECT
  COUNT(*) as total_variantes_para_corrigir,
  COUNT(DISTINCT v.experiment_id) as total_experimentos_afetados
FROM variants v
JOIN experiments e ON v.experiment_id = e.id
WHERE e.conversion_url IS NOT NULL
  AND (
    v.changes->'conversion' IS NULL
    OR v.changes->'conversion'->>'url' IS NULL
  );

-- =====================================================
-- PASSO 3: APLICAR CORREÇÃO
-- =====================================================
-- Atualizar TODAS as variantes que:
-- 1. Pertencem a experimentos com conversion_url preenchido
-- 2. NÃO têm configuração de conversão OU têm config incompleta

UPDATE variants v
SET changes = jsonb_set(
  COALESCE(v.changes, '{}'::jsonb),
  '{conversion}',
  jsonb_build_object(
    'type', COALESCE(e.conversion_type, 'page_view'),
    'url', e.conversion_url,
    'selector', NULL,
    'value', COALESCE(e.conversion_value, 0)
  )
)
FROM experiments e
WHERE v.experiment_id = e.id
  AND e.conversion_url IS NOT NULL
  AND (
    v.changes->'conversion' IS NULL
    OR v.changes->'conversion'->>'url' IS NULL
  );

-- =====================================================
-- PASSO 4: VERIFICAÇÃO PÓS-CORREÇÃO
-- =====================================================

SELECT
  '=== VERIFICAÇÃO: Variantes após correção ===' as titulo;

-- Ver todas as variantes de experimentos com conversion_url
SELECT
  e.id as experiment_id,
  e.name as experiment_name,
  e.conversion_url as experiment_conversion_url,
  v.id as variant_id,
  v.name as variant_name,
  v.changes->'conversion'->>'url' as conversion_url_in_changes,
  v.changes->'conversion'->>'type' as conversion_type_in_changes,
  v.changes->'conversion'->>'value' as conversion_value_in_changes,
  CASE
    WHEN v.changes->'conversion'->>'url' = e.conversion_url THEN '✅ OK'
    WHEN v.changes->'conversion'->>'url' IS NULL THEN '❌ AINDA NULL'
    ELSE '⚠️ URL DIFERENTE'
  END as status
FROM experiments e
JOIN variants v ON v.experiment_id = e.id
WHERE e.conversion_url IS NOT NULL
ORDER BY e.created_at DESC, v.is_control DESC;

-- =====================================================
-- PASSO 5: ESTATÍSTICAS FINAIS
-- =====================================================

SELECT
  '=== ESTATÍSTICAS FINAIS ===' as titulo;

SELECT
  COUNT(DISTINCT e.id) as total_experimentos_com_conversion_url,
  COUNT(v.id) as total_variantes,
  COUNT(CASE WHEN v.changes->'conversion'->>'url' IS NOT NULL THEN 1 END) as variantes_com_config,
  COUNT(CASE WHEN v.changes->'conversion'->>'url' IS NULL THEN 1 END) as variantes_sem_config,
  ROUND(
    100.0 * COUNT(CASE WHEN v.changes->'conversion'->>'url' IS NOT NULL THEN 1 END) /
    NULLIF(COUNT(v.id), 0),
    2
  ) || '%' as percentual_com_config
FROM experiments e
JOIN variants v ON v.experiment_id = e.id
WHERE e.conversion_url IS NOT NULL;

-- =====================================================
-- PASSO 6: VALIDAÇÃO FINAL
-- =====================================================

SELECT
  '=== VALIDAÇÃO: Experimentos ainda com problemas ===' as titulo;

-- Listar experimentos que ainda têm variantes sem configuração
SELECT
  e.id,
  e.name,
  e.conversion_url,
  COUNT(v.id) as total_variantes,
  COUNT(CASE WHEN v.changes->'conversion'->>'url' IS NULL THEN 1 END) as variantes_sem_config
FROM experiments e
JOIN variants v ON v.experiment_id = e.id
WHERE e.conversion_url IS NOT NULL
GROUP BY e.id, e.name, e.conversion_url
HAVING COUNT(CASE WHEN v.changes->'conversion'->>'url' IS NULL THEN 1 END) > 0
ORDER BY e.created_at DESC;

-- Se esta query retornar 0 linhas, está tudo OK! ✅

-- =====================================================
-- EXEMPLO DE RESULTADO ESPERADO:
-- =====================================================
/*
ANTES:
experiment_name | conversion_url_in_changes | status
----------------|--------------------------|--------
esmalt          | NULL                     | ❌ SEM config

DEPOIS:
experiment_name | conversion_url_in_changes              | status
----------------|---------------------------------------|--------
esmalt          | https://esmalt.com.br/glow/           | ✅ OK
*/

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
/*
1. Este script é SEGURO e pode ser executado múltiplas vezes
2. Usa jsonb_set que preserva outras configurações em 'changes'
3. Só atualiza variantes que realmente precisam
4. Experimentos SEM conversion_url não são afetados
5. Configurações existentes são preservadas

COMO EXECUTAR:
1. Copie todo este arquivo
2. Cole no Supabase SQL Editor
3. Execute (Run)
4. Aguarde conclusão
5. Verifique o resultado do PASSO 6
6. Se retornar 0 linhas, está tudo OK!
*/
