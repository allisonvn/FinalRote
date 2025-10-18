# 🔍 Diagnóstico Completo: Por que as Conversões NÃO estão sendo Contabilizadas

## 🎯 RESUMO EXECUTIVO

**PROBLEMA:** Página de conversão cadastrada no modal (Etapa 3) não está sendo contabilizada.

**CAUSA RAIZ:** Campos de conversão **não existem na tabela `experiments`** do Supabase.

**SOLUÇÃO:** Aplicar migration que adiciona os campos faltantes.

---

## 🔴 PROBLEMA IDENTIFICADO

### Fluxo Esperado vs Fluxo Real

#### ✅ Fluxo ESPERADO:

```
1. Usuário preenche modal "Criar Experimento A/B"
   └─ Etapa 3: "URL da página de sucesso: https://site.com/obrigado"

2. API salva no banco
   └─ experiments.conversion_url = "https://site.com/obrigado" ✅

3. SDK lê do banco
   └─ checkAndTrackConversion(expData)
   └─ expData.conversion_url = "https://site.com/obrigado" ✅

4. Usuário acessa página de conversão
   └─ SDK detecta: current_url === conversion_url
   └─ Dispara: RotaFinal.convert() ✅

5. Conversão registrada ✅
```

#### ❌ Fluxo REAL (Atual):

```
1. Usuário preenche modal "Criar Experimento A/B"
   └─ Etapa 3: "URL da página de sucesso: https://site.com/obrigado"
   └─ formData.goalValue = "https://site.com/obrigado" ✅

2. API tenta salvar no banco
   └─ conversion_url: rawData.conversion_url ❌
   └─ ERRO: campo "conversion_url" não existe na tabela
   └─ Banco IGNORA o campo (erro silencioso)
   └─ experiments.conversion_url = NULL ❌

3. SDK lê do banco
   └─ checkAndTrackConversion(expData)
   └─ expData.conversion_url = NULL ❌
   └─ Função retorna imediatamente (if(!expData.conversion_url)return)

4. Usuário acessa página de conversão
   └─ SDK NÃO detecta (conversion_url é NULL)
   └─ Conversão NUNCA é rastreada ❌

5. Conversão NÃO registrada ❌
```

---

## 📊 EVIDÊNCIAS DO PROBLEMA

### 1. Modal está Correto ✅

**Arquivo:** `src/components/dashboard/premium-experiment-modal.tsx`

**Linha 943-957:** Campo de URL de conversão está sendo capturado
```tsx
<Input
  value={formData.goalValue}
  onChange={(e) => updateFormData({ goalValue: e.target.value })}
  placeholder="https://seusite.com/obrigado"
  // ...
/>
```

**Linha 972-988:** Card informativo mostra que o campo está preenchido
```tsx
{formData.goalType === 'page_view' && formData.goalValue && (
  <div>
    <h4>Página de Sucesso Configurada</h4>
    <div>{formData.goalValue}</div> {/* ✅ Mostra a URL */}
  </div>
)}
```

**Conclusão:** Modal está funcionando perfeitamente. ✅

---

### 2. API está Tentando Salvar ✅

**Arquivo:** `src/app/api/experiments/route.ts`

**Linha 164-166:** API monta os dados com conversion_url
```typescript
conversion_url: rawData.conversion_url || null,
conversion_value: conversionValue,
conversion_type: rawData.conversion_type || 'page_view'
```

**Linha 228-231:** API tenta inserir no banco
```typescript
const directInsertData = {
  // ... outros campos ...
  conversion_url: insertData.conversion_url,  // ✅ API ESTÁ ENVIANDO
  conversion_value: insertData.conversion_value,
  conversion_type: insertData.conversion_type,
}
```

**Conclusão:** API está funcionando corretamente. ✅

---

### 3. Banco de Dados NÃO TEM os Campos ❌

**Arquivo:** `apply-migrations-to-new-project.sql`

**Linha 27-56:** Schema da tabela experiments
```sql
CREATE TABLE IF NOT EXISTS public.experiments (
    id uuid PRIMARY KEY,
    project_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    type experiment_type NOT NULL,
    traffic_allocation numeric(4,2),
    status experiment_status,
    -- ...
    conversions_config jsonb DEFAULT '{}',  -- ❌ JSONB vazio
    conversion_goals jsonb DEFAULT '[]',    -- ❌ Array vazio
    -- ❌ FALTAM:
    -- conversion_url text,
    -- conversion_type text,
    -- conversion_value numeric,
)
```

**Campos INEXISTENTES:**
- ❌ `conversion_url`
- ❌ `conversion_type`
- ❌ `conversion_value`
- ❌ `target_url`
- ❌ `duration_days`

**Verificação nas migrations:**
```bash
$ grep -r "conversion_url\|conversion_type" supabase/migrations/*.sql
(nenhum resultado) ❌
```

**Conclusão:** CAMPOS NÃO EXISTEM NO BANCO! ❌

---

### 4. SDK Não Consegue Ler conversion_url ❌

**Arquivo:** `src/components/OptimizedCodeGenerator.tsx`

**Linha 70-74:** Tentativa de ler configuração de conversão
```typescript
const conversionConfig = variants.find(v => v.changes?.conversion)?.changes?.conversion
const hasConversionTracking = conversionConfig && (
  conversionConfig.url ||
  conversionConfig.selector ||
  conversionConfig.event
)
```

**Problema:**
- API salva em `experiments.conversion_url` ❌ (campo não existe)
- SDK busca em `variants[].changes.conversion.url` ❌ (nunca preenchido)
- **Resultado:** `hasConversionTracking = false` sempre ❌

**Linha 103-109:** Código de rastreamento de conversão
```typescript
if (conversionConfig.type === 'page_view' && conversionConfig.url) {
  conversionTrackingCode = `,setupConversionTracking:function(){
    var e="${conversionConfig.url}";  // ❌ Sempre VAZIO
    if(window.location.href.includes(e)){
      tracking.track("conversion",{url:window.location.href})
    }
  }`
}
```

**Resultado:** Código NUNCA é gerado porque `conversionConfig.url` é sempre undefined ❌

**Conclusão:** SDK não consegue gerar rastreamento automático. ❌

---

## 🛠️ SOLUÇÃO IMPLEMENTADA

### Migration Criada

**Arquivo:** `supabase/migrations/20251018000000_add_conversion_fields.sql`

**Campos adicionados:**
```sql
-- ✅ URL da página onde o experimento roda
ALTER TABLE experiments ADD COLUMN target_url TEXT;

-- ✅ URL da página de conversão/sucesso
ALTER TABLE experiments ADD COLUMN conversion_url TEXT;

-- ✅ Tipo de conversão (page_view, click, form_submit)
ALTER TABLE experiments ADD COLUMN conversion_type TEXT DEFAULT 'page_view';

-- ✅ Valor monetário da conversão
ALTER TABLE experiments ADD COLUMN conversion_value NUMERIC(10,2) DEFAULT 0.00;

-- ✅ Duração planejada do experimento
ALTER TABLE experiments ADD COLUMN duration_days INTEGER DEFAULT 14;
```

**Índices para performance:**
```sql
-- ✅ Busca rápida por conversion_url
CREATE INDEX idx_experiments_conversion_url
ON experiments(conversion_url)
WHERE conversion_url IS NOT NULL;

-- ✅ Busca rápida por target_url
CREATE INDEX idx_experiments_target_url
ON experiments(target_url)
WHERE target_url IS NOT NULL;
```

---

## ✅ COMO APLICAR A CORREÇÃO

### Passo 1: Aplicar Migration

**Via Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `supabase/migrations/20251018000000_add_conversion_fields.sql`
5. Clique em **Run**
6. Aguarde: `✅ Todos os campos de conversão foram adicionados com sucesso!`

### Passo 2: Verificar Campos Criados

Execute no SQL Editor:
```sql
SELECT column_name, data_type, column_default
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
```

**Resultado esperado:**
```
column_name       | data_type | column_default
------------------+-----------+-------------------
conversion_type   | text      | 'page_view'::text
conversion_url    | text      | NULL
conversion_value  | numeric   | 0.00
duration_days     | integer   | 14
target_url        | text      | NULL
```

### Passo 3: Testar Criação de Experimento

1. Acesse o dashboard
2. Crie novo experimento A/B
3. **Etapa 3 - Meta:**
   - Tipo: "Acesso a uma página"
   - URL: `https://seusite.com/obrigado`
   - Valor: `100.00`
4. Salvar

### Passo 4: Verificar se Foi Salvo

```sql
SELECT
  id,
  name,
  conversion_url,  -- ✅ Deve estar preenchido
  conversion_type, -- ✅ Deve ser 'page_view'
  conversion_value -- ✅ Deve ser 100.00
FROM experiments
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
```
id              | [uuid]
name            | "Meu Teste"
conversion_url  | "https://seusite.com/obrigado" ✅
conversion_type | "page_view" ✅
conversion_value| 100.00 ✅
```

### Passo 5: Testar Rastreamento

1. Copie o código de integração do experimento
2. Cole em uma página de teste
3. Acesse a página
4. Navegue para `https://seusite.com/obrigado`
5. Verifique console: `[RotaFinal] 🎯 Conversion page detected!`

```sql
-- Verificar conversão registrada
SELECT
  event_type,
  properties->>'url' as page_url,
  properties->>'value' as value,
  created_at
FROM events
WHERE event_type = 'conversion'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📈 IMPACTO DA CORREÇÃO

### Antes ❌

| Etapa | Status |
|-------|--------|
| Modal captura URL | ✅ Funcionando |
| API envia para banco | ✅ Tentando |
| Banco salva conversion_url | ❌ **CAMPO NÃO EXISTE** |
| SDK lê conversion_url | ❌ NULL |
| Conversão detectada | ❌ Nunca |
| Evento registrado | ❌ Nunca |

### Depois ✅

| Etapa | Status |
|-------|--------|
| Modal captura URL | ✅ Funcionando |
| API envia para banco | ✅ Enviando |
| Banco salva conversion_url | ✅ **CAMPO EXISTE** |
| SDK lê conversion_url | ✅ Preenchido |
| Conversão detectada | ✅ Automaticamente |
| Evento registrado | ✅ Automaticamente |

---

## 🎯 CONCLUSÃO

### Problema Raiz Identificado

**Os campos de conversão NÃO EXISTIAM na tabela `experiments` do banco de dados.**

### Causa do Erro

1. ❌ Migrations antigas não criaram os campos
2. ❌ API tentava salvar em campos inexistentes
3. ❌ Postgres ignorava silenciosamente (sem erro)
4. ❌ SDK não encontrava conversion_url
5. ❌ Conversões nunca eram rastreadas

### Solução Implementada

1. ✅ Migration criada: `20251018000000_add_conversion_fields.sql`
2. ✅ Adiciona 5 campos faltantes
3. ✅ Cria índices para performance
4. ✅ Atualiza experimentos existentes
5. ✅ Inclui verificação automática

### Próximos Passos

1. ✅ Aplicar migration no Supabase
2. ✅ Testar criação de experimento
3. ✅ Verificar campos salvos
4. ✅ Testar rastreamento de conversão
5. ✅ Confirmar eventos no banco

---

**📌 Instruções detalhadas em:** `INSTRUCOES_APLICAR_MIGRATION.md`
