-- =====================================================
-- CORREÇÃO RÁPIDA - Experimento "esmalt"
-- =====================================================
-- Execute este script INTEIRO no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Ver estado atual
SELECT
  '=== ESTADO ATUAL DO EXPERIMENTO esmalt ===' as titulo,
  conversion_url,
  conversion_type,
  conversion_value
FROM experiments
WHERE id = '152cab7b-c83b-4420-b1f4-75c911152230';

-- Se conversion_url estiver NULL, continue para PASSO 2
-- Se estiver preenchido, pule para PASSO 3

-- =====================================================
-- PASSO 2: CORRIGIR O EXPERIMENTO
-- =====================================================

UPDATE experiments
SET
  conversion_url = 'https://esmalt.com.br/glow/',
  conversion_type = 'page_view',
  conversion_value = 100.00
WHERE id = '152cab7b-c83b-4420-b1f4-75c911152230';

-- Verificar se atualizou:
SELECT
  '=== EXPERIMENTO ATUALIZADO ===' as titulo,
  conversion_url,
  conversion_type,
  conversion_value
FROM experiments
WHERE id = '152cab7b-c83b-4420-b1f4-75c911152230';

-- =====================================================
-- PASSO 3: CORRIGIR AS VARIANTES
-- =====================================================

UPDATE variants
SET changes = jsonb_set(
  COALESCE(changes, '{}'::jsonb),
  '{conversion}',
  jsonb_build_object(
    'type', 'page_view',
    'url', 'https://esmalt.com.br/glow/',
    'value', 100
  )
)
WHERE experiment_id = '152cab7b-c83b-4420-b1f4-75c911152230';

-- Verificar variantes:
SELECT
  '=== VARIANTES ATUALIZADAS ===' as titulo,
  name,
  is_control,
  changes->'conversion'->>'url' as conversion_url,
  changes->'conversion'->>'type' as conversion_type,
  changes->'conversion'->>'value' as conversion_value
FROM variants
WHERE experiment_id = '152cab7b-c83b-4420-b1f4-75c911152230'
ORDER BY is_control DESC;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Ambas as variantes devem mostrar:
-- conversion_url: https://esmalt.com.br/glow/
-- conversion_type: page_view
-- conversion_value: 100

-- =====================================================
-- ✅ PRONTO! Agora faça isso:
-- =====================================================
-- 1. Vá na sua página de teste
-- 2. Abra o Console (F12)
-- 3. Execute: localStorage.clear()
-- 4. Execute: sessionStorage.clear()
-- 5. Recarregue a página (Ctrl+R)
-- 6. Acesse a página: https://esmalt.com.br/glow/
-- 7. Veja no console: [RotaFinal] 🎯 Conversion page detected!
