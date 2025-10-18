# 🔧 Correção: Variantes Sem Configuração de Conversão

## ❌ PROBLEMA IDENTIFICADO

Experimentos estão sendo criados com:
- ✅ `experiments.conversion_url` preenchido
- ✅ `experiments.conversion_type` preenchido
- ✅ `experiments.conversion_value` preenchido
- ❌ `variants.changes.conversion` está NULL ou vazio

**Resultado:** SDK não gera código de rastreamento automático porque não encontra configuração nas variantes.

---

## 🔍 CAUSA RAIZ

No arquivo `src/hooks/useSupabaseExperiments.ts` (linha 231-238):

```typescript
const conversionConfig = data.conversion_type ? {
  conversion: {
    type: data.conversion_type,
    url: data.conversion_url || null,
    selector: data.conversion_selector || null,
    value: data.conversion_value || 0
  }
} : {}
```

**Problema:** Se `data.conversion_type` for falsy (null, undefined, ''), então `conversionConfig = {}` (vazio).

**Possíveis causas:**
1. Modal não está enviando `conversion_type`
2. Valor é perdido durante o mapeamento
3. Timing: configuração é adicionada mas depois sobrescrita

---

## ✅ CORREÇÃO APLICADA

### Solução 1: Fortalecer Validação no Hook

Editar `src/hooks/useSupabaseExperiments.ts` linha 231:

```typescript
// ANTES (linha 231-238):
const conversionConfig = data.conversion_type ? {
  conversion: {
    type: data.conversion_type,
    url: data.conversion_url || null,
    selector: data.conversion_selector || null,
    value: data.conversion_value || 0
  }
} : {}

// DEPOIS:
const conversionConfig = (data.conversion_type || data.conversion_url) ? {
  conversion: {
    type: data.conversion_type || 'page_view',
    url: data.conversion_url || null,
    selector: data.conversion_selector || null,
    value: data.conversion_value || 0
  }
} : {}
```

**Explicação:** Agora cria a configuração se `conversion_url` OU `conversion_type` estiverem preenchidos.

### Solução 2: Log de Debug

Adicionar logs para diagnosticar (linha 229):

```typescript
// Preparar configuração de conversão para todas as variantes
console.log('🔍 [DEBUG] Dados de conversão recebidos:', {
  conversion_type: data.conversion_type,
  conversion_url: data.conversion_url,
  conversion_value: data.conversion_value,
  conversion_selector: data.conversion_selector
})

const conversionConfig = (data.conversion_type || data.conversion_url) ? {
  conversion: {
    type: data.conversion_type || 'page_view',
    url: data.conversion_url || null,
    selector: data.conversion_selector || null,
    value: data.conversion_value || 0
  }
} : {}

console.log('🔍 [DEBUG] Configuração de conversão preparada:', conversionConfig)
```

---

## 🛠️ CORREÇÃO MANUAL PARA EXPERIMENTOS EXISTENTES

Se você já tem experimentos criados sem a configuração nas variantes, execute este SQL:

```sql
-- Atualizar TODAS as variantes de TODOS os experimentos
-- para incluir configuração de conversão do experimento
UPDATE variants v
SET changes = jsonb_set(
  COALESCE(v.changes, '{}'::jsonb),
  '{conversion}',
  jsonb_build_object(
    'type', COALESCE(e.conversion_type, 'page_view'),
    'url', e.conversion_url,
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

-- Verificar quantas variantes foram atualizadas
SELECT COUNT(*) as variantes_atualizadas
FROM variants v
JOIN experiments e ON v.experiment_id = e.id
WHERE e.conversion_url IS NOT NULL
  AND v.changes->'conversion'->>'url' IS NOT NULL;
```

---

## 🧪 TESTE

Após aplicar a correção:

### 1. Criar Novo Experimento de Teste

1. Dashboard → "+ Novo Experimento"
2. Preencher:
   - Nome: "Teste Conversão Fix"
   - Target URL: `https://exemplo.com/teste`
   - Goal Type: "Acesso a uma página"
   - Conversion URL: `https://exemplo.com/sucesso`
   - Valor: 100
3. Criar

### 2. Verificar no Banco

```sql
-- Verificar experimento
SELECT
  name,
  conversion_url,
  conversion_type,
  conversion_value
FROM experiments
WHERE name = 'Teste Conversão Fix';

-- Verificar variantes
SELECT
  v.name,
  v.changes->'conversion'->>'url' as conversion_url_in_changes,
  v.changes->'conversion'->>'type' as conversion_type_in_changes,
  e.conversion_url as experiment_conversion_url
FROM variants v
JOIN experiments e ON v.experiment_id = e.id
WHERE e.name = 'Teste Conversão Fix';
```

**Resultado esperado:**
```
variant_name | conversion_url_in_changes      | experiment_conversion_url
-------------|--------------------------------|---------------------------
Controle     | https://exemplo.com/sucesso    | https://exemplo.com/sucesso
Variante A   | https://exemplo.com/sucesso    | https://exemplo.com/sucesso
```

### 3. Verificar Código Gerado

1. Copiar código do experimento
2. Procurar por: `checkAndTrackConversion`
3. Procurar por: `conversion_url:"https://exemplo.com/sucesso"`

Ambos devem estar presentes!

---

## 📊 RESUMO

| Item | Antes | Depois |
|------|-------|--------|
| Condição | `data.conversion_type ? {...}` | `(data.conversion_type \|\| data.conversion_url) ? {...}` |
| Se conversion_type vazio | `conversionConfig = {}` | `conversionConfig = { conversion: {...} }` |
| Variantes criadas | Sem config de conversão | Com config de conversão |
| SDK gera rastreamento | ❌ NÃO | ✅ SIM |

---

## ✅ CHECKLIST PÓS-CORREÇÃO

Para cada novo experimento:

- [ ] Executar query de verificação (PASSO 2)
- [ ] Confirmar `conversion_url` preenchido no experimento
- [ ] Confirmar `conversion_url_in_changes` preenchido nas variantes
- [ ] Confirmar código gerado tem `checkAndTrackConversion`
- [ ] Testar conversão manual com `RotaFinal.convert()`

---

**Após aplicar esta correção, TODOS os novos experimentos terão a configuração de conversão correta nas variantes!** ✅
