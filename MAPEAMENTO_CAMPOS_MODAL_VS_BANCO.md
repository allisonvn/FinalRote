# 📊 MAPEAMENTO COMPLETO: Modal vs Banco de Dados

**Data:** 09/10/2025  
**Status:** 🔍 EM ANÁLISE

---

## 🎯 OBJETIVO

Rastrear TODOS os campos do modal "Criar Experimento A/B" (`PremiumExperimentModal`) e garantir que TODOS sejam salvos corretamente no Supabase.

---

## 📋 CAMPOS DO MODAL `PremiumExperimentModal`

### Interface `ExperimentFormData`
```typescript
interface ExperimentFormData {
  name: string                    // ✅ Sendo salvo
  description: string             // ✅ Sendo salvo
  targetUrl: string              // ✅ Sendo salvo como target_url
  testType: 'split_url' | 'visual'  // ✅ Sendo salvo como type (convertido)
  trafficAllocation: number      // ✅ Sendo salvo como traffic_allocation
  variants: Array<{              // ✅ Salvos na tabela variants
    name: string
    description: string
    url: string
    isControl: boolean
  }>
  goalType: 'page_view' | 'click' | 'form_submit'  // ✅ Sendo salvo como conversion_type
  goalValue: string              // ✅ Sendo salvo como conversion_url
  conversionValue?: number       // ✅ Sendo salvo como conversion_value
  duration: number               // ❌ NÃO ESTÁ SENDO SALVO
  algorithm: 'uniform' | 'thompson_sampling' | 'ucb1' | 'epsilon_greedy'  // ✅ Sendo salvo
}
```

### Valores Iniciais (INITIAL_FORM_DATA)
```typescript
{
  name: '',
  description: '',
  targetUrl: '',
  testType: 'split_url',
  trafficAllocation: 100,
  variants: [
    { name: 'Original', description: 'Versão atual', url: '', isControl: true },
    { name: 'Variante A', description: 'Nova versão', url: '', isControl: false }
  ],
  goalType: 'page_view',
  goalValue: '',
  conversionValue: undefined,
  duration: 14,              // ❌ CAMPO NÃO ESTÁ SENDO SALVO
  algorithm: 'thompson_sampling'
}
```

---

## 🗄️ ESTRUTURA DA TABELA `experiments` NO SUPABASE

```sql
CREATE TABLE experiments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL,
  name                  text NOT NULL,
  description           text,
  type                  experiment_type NOT NULL DEFAULT 'redirect',
  traffic_allocation    numeric DEFAULT 100.00,
  status                experiment_status DEFAULT 'draft',
  user_id               uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  started_at            timestamptz,
  ended_at              timestamptz,
  api_key               text DEFAULT ('exp_' || encode(gen_random_bytes(16), 'hex')),
  algorithm             text NOT NULL DEFAULT 'uniform',
  target_url            text,
  conversion_url        text,
  conversion_value      numeric DEFAULT 0.00,
  conversion_type       text DEFAULT 'page_view'
  
  -- ❌ NÃO EXISTE: duration ou duration_days
);
```

---

## ✅ MAPEAMENTO COMPLETO: Modal → Banco

| Campo do Modal | Tipo no Modal | Campo no Banco | Tipo no Banco | Status |
|----------------|---------------|----------------|---------------|---------|
| `name` | string | `name` | text | ✅ Salvo |
| `description` | string | `description` | text | ✅ Salvo |
| `targetUrl` | string | `target_url` | text | ✅ Salvo |
| `testType` | 'split_url' \| 'visual' | `type` | experiment_type | ✅ Salvo (convertido) |
| `trafficAllocation` | number | `traffic_allocation` | numeric | ✅ Salvo |
| `variants` | Array | tabela `variants` | - | ✅ Salvos separadamente |
| `goalType` | 'page_view' \| 'click' \| 'form_submit' | `conversion_type` | text | ✅ Salvo |
| `goalValue` | string | `conversion_url` | text | ✅ Salvo |
| `conversionValue` | number | `conversion_value` | numeric | ✅ Salvo |
| **`duration`** | **number** | **❌ NÃO EXISTE** | **-** | **❌ NÃO SALVO** |
| `algorithm` | string | `algorithm` | text | ✅ Salvo |

---

## ❌ PROBLEMA IDENTIFICADO: Campo `duration`

### O que é o campo `duration`?

**No modal:** Define por quanto tempo o experimento deve rodar (em dias).

**Valor padrão:** 14 dias

**Onde aparece no UI:**
- Etapa 1 do modal (Setup)
- Select com opções: 7, 14, 21, 30, 60, 90 dias
- Label: "Duração do Teste"

### Por que não está sendo salvo?

**Não existe campo correspondente na tabela `experiments`** para armazenar a duração planejada do experimento.

### Onde deveria ser usado?

1. **Cálculo automático de `ended_at`:**
   ```javascript
   ended_at = started_at + (duration * 1 day)
   ```

2. **Alertas no dashboard:**
   - "Seu experimento termina em X dias"
   - "Experimento ultrapassou o tempo planejado"

3. **Auto-pausa:**
   - Pausar experimento automaticamente após duration dias

---

## 🔧 SOLUÇÕES POSSÍVEIS

### Opção 1: Adicionar campo `duration_days`
```sql
ALTER TABLE experiments
ADD COLUMN duration_days integer DEFAULT 14;
```

**Vantagens:**
- ✅ Simples e direto
- ✅ Fácil de consultar
- ✅ Permite cálculos automáticos

**Desvantagens:**
- ❌ Requer migração do banco
- ❌ Precisa atualizar RLS policies se existirem

### Opção 2: Calcular da diferença `started_at` e `ended_at`
```javascript
// Ao iniciar experimento
ended_at = new Date(started_at.getTime() + (duration * 24 * 60 * 60 * 1000))
```

**Vantagens:**
- ✅ Não requer novo campo
- ✅ Usa campos existentes

**Desvantagens:**
- ❌ Perde a informação da duração planejada original
- ❌ Se o experimento for pausado/retomado, a lógica fica complexa
- ❌ Não permite mostrar "duração planejada" para experimentos draft

### Opção 3: Usar campo JSON (mab_config ou metadata)

Verificar se existe algum campo JSON onde guardar configurações extras:
```sql
-- Verificar se existe campo JSON
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'experiments' 
  AND data_type IN ('json', 'jsonb');
```

---

## 📝 CÓDIGO ATUAL DE SALVAMENTO

### Arquivo: `src/app/dashboard/page.tsx` (linhas 1377-1390)

```javascript
const experimentData = {
  name: String(formData.name || '').trim(),
  project_id: String(projectId),
  description: formData.description || null,
  status: 'draft' as const,
  type: formData.testType === 'split_url' ? 'split_url' : 'element',
  traffic_allocation: safeTrafficAllocation(formData.trafficAllocation, 100),
  algorithm: formData.algorithm || 'thompson_sampling',
  target_url: formData.targetUrl || null,
  conversion_url: formData.goalValue || null,
  conversion_value: formData.conversionValue || 0,
  conversion_type: formData.goalType || 'page_view'
  // ❌ duration: formData.duration  <- FALTANDO!
}
```

---

## ✅ RECOMENDAÇÃO

### Solução Recomendada: **Opção 1 - Adicionar campo `duration_days`**

**Por quê:**
1. ✅ Mantém a informação original do planejamento
2. ✅ Permite features futuras (alertas, auto-pausa)
3. ✅ Simples de implementar e manter
4. ✅ Explícito e fácil de entender

### Implementação:

#### 1. Criar Migration
```sql
-- Migration: add_duration_days_to_experiments
ALTER TABLE experiments
ADD COLUMN duration_days integer DEFAULT 14;

COMMENT ON COLUMN experiments.duration_days IS 'Duração planejada do experimento em dias';
```

#### 2. Atualizar Código de Salvamento
```javascript
// src/app/dashboard/page.tsx
const experimentData = {
  name: String(formData.name || '').trim(),
  project_id: String(projectId),
  description: formData.description || null,
  status: 'draft' as const,
  type: formData.testType === 'split_url' ? 'split_url' : 'element',
  traffic_allocation: safeTrafficAllocation(formData.trafficAllocation, 100),
  algorithm: formData.algorithm || 'thompson_sampling',
  target_url: formData.targetUrl || null,
  conversion_url: formData.goalValue || null,
  conversion_value: formData.conversionValue || 0,
  conversion_type: formData.goalType || 'page_view',
  duration_days: formData.duration || 14  // ✅ ADICIONAR
}
```

#### 3. Atualizar API
```javascript
// src/app/api/experiments/route.ts
body: JSON.stringify({
  name: experimentData.name,
  project_id: experimentData.project_id,
  description: experimentData.description,
  type: experimentData.type,
  traffic_allocation: experimentData.traffic_allocation,
  algorithm: experimentData.algorithm,
  target_url: experimentData.target_url,
  conversion_url: experimentData.conversion_url,
  conversion_value: experimentData.conversion_value,
  conversion_type: experimentData.conversion_type,
  duration_days: experimentData.duration_days,  // ✅ ADICIONAR
  status: experimentData.status
})
```

#### 4. Atualizar Modal de Detalhes
```typescript
// src/components/dashboard/experiment-details-modal.tsx
// Exibir duração planejada na visão geral
<div className="stat-card">
  <Clock className="w-5 h-5" />
  <span className="label">Duração Planejada</span>
  <span className="value">{experiment.duration_days || 14} dias</span>
</div>
```

---

## 🧪 TESTES NECESSÁRIOS

Após implementar a correção:

### 1. Teste de Criação
```
1. Criar experimento
2. Selecionar duração: 30 dias
3. Salvar experimento
4. Verificar no banco:
   SELECT id, name, duration_days 
   FROM experiments 
   WHERE name = 'Teste Duration';
   → duration_days deve ser 30
```

### 2. Teste de Exibição
```
1. Abrir experimento criado
2. Verificar modal de detalhes
3. Confirmar que mostra "30 dias"
```

### 3. Teste de Valores Default
```
1. Criar experimento sem alterar duração
2. Verificar no banco:
   → duration_days deve ser 14 (valor padrão)
```

---

## 📊 RESUMO

### Campos que ESTÃO sendo salvos: 10/11
✅ name  
✅ description  
✅ targetUrl → target_url  
✅ testType → type  
✅ trafficAllocation → traffic_allocation  
✅ variants → tabela variants  
✅ goalType → conversion_type  
✅ goalValue → conversion_url  
✅ conversionValue → conversion_value  
✅ algorithm  

### Campos que NÃO estão sendo salvos: 1/11
❌ **duration** - Não existe campo correspondente no banco

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar migration para adicionar campo `duration_days`
2. ✅ Atualizar código de salvamento
3. ✅ Atualizar API endpoint
4. ✅ Atualizar modal de detalhes
5. ✅ Testar criação de experimento
6. ✅ Verificar que duration é salvo
7. ✅ Documentar mudança

---

**Status:** Aguardando aprovação para criar migration e implementar correção

