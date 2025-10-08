# Correção: Todos os Campos dos Experimentos Salvos no Supabase

## ✅ Problema Identificado

Ao verificar a tabela `experiments` no Supabase, foi identificado que **NÃO** todos os campos estavam sendo salvos pelas APIs de criação de experimentos.

## 📊 Campos da Tabela `experiments`

### Campos Obrigatórios (NOT NULL)
- ✅ `id` - uuid (auto-gerado)
- ✅ `project_id` - uuid
- ✅ `name` - text
- ✅ `type` - experiment_type (default: 'redirect')
- ✅ `algorithm` - text (default: 'uniform') **[CORRIGIDO]**
- ✅ `created_at` - timestamp (auto-gerado)
- ✅ `updated_at` - timestamp (auto-gerado)

### Campos Opcionais (NULLABLE)
- ✅ `description` - text
- ✅ `traffic_allocation` - numeric (default: 100.00)
- ✅ `status` - experiment_status (default: 'draft')
- ✅ `user_id` - uuid
- ✅ `started_at` - timestamp **[CORRIGIDO - lógica automática]**
- ✅ `ended_at` - timestamp **[CORRIGIDO - lógica automática]**
- ✅ `api_key` - text (auto-gerado)
- ✅ `target_url` - text **[CORRIGIDO]**
- ✅ `conversion_url` - text **[CORRIGIDO]**
- ✅ `conversion_value` - numeric (default: 0.00) **[CORRIGIDO]**
- ✅ `conversion_type` - text (default: 'page_view') **[CORRIGIDO]**

## 🔧 Correções Aplicadas

### 1. `/src/app/api/experiments/route.ts` (POST)

**Antes:** Campos faltando na inserção
```typescript
const insertData = {
  name: experimentData.name,
  project_id: experimentData.project_id,
  description: experimentData.description,
  type: experimentData.type,
  traffic_allocation: safeTrafficValue,
  status: experimentData.status,
  user_id: experimentData.user_id
  // ❌ Faltavam: algorithm, target_url, conversion_url, conversion_value, conversion_type
}
```

**Depois:** Todos os campos incluídos
```typescript
const insertData = {
  name: experimentData.name,
  project_id: experimentData.project_id,
  description: experimentData.description,
  type: experimentData.type,
  traffic_allocation: safeTrafficValue,
  status: experimentData.status,
  user_id: experimentData.user_id,
  algorithm: experimentData.algorithm,
  target_url: experimentData.target_url,
  conversion_url: experimentData.conversion_url,
  conversion_value: experimentData.conversion_value,
  conversion_type: experimentData.conversion_type
}
```

### 2. `/src/app/api/experiments/create-direct/route.ts` (POST)

**Antes:** Inserção em duas etapas (insert + update) com campos faltando
```typescript
const { data: experimentResult } = await userClient
  .from('experiments')
  .insert({
    name: experimentName,
    project_id: projectId,
    description: description
  })
  // ❌ Depois precisava fazer UPDATE para adicionar outros campos
```

**Depois:** Inserção única com todos os campos
```typescript
const { data: experimentResult } = await userClient
  .from('experiments')
  .insert({
    name: experimentName,
    project_id: projectId,
    description: description,
    type: experimentType,
    status: status,
    traffic_allocation: trafficAllocation,
    user_id: userId,
    algorithm: algorithm,
    target_url: targetUrl,
    conversion_url: conversionUrl,
    conversion_value: conversionValue,
    conversion_type: conversionType
  })
```

### 3. `/src/app/api/experiments/[id]/route.ts` (PATCH)

**Adicionada lógica automática para `started_at` e `ended_at`:**

```typescript
// Preparar dados de atualização com lógica de started_at e ended_at
const updateData: any = { ...data }

// Se está mudando o status para 'running' e o experimento não estava rodando
if (data.status === 'running' && experiment.status !== 'running') {
  updateData.started_at = new Date().toISOString()
}

// Se está pausando ou completando um experimento que estava rodando
if ((data.status === 'paused' || data.status === 'completed') && experiment.status === 'running') {
  updateData.ended_at = new Date().toISOString()
}

// Sempre atualizar updated_at
updateData.updated_at = new Date().toISOString()
```

### 4. `/src/app/api/experiments/[id]/status/route.ts` (PATCH)

**Já tinha a lógica correta** para `started_at` e `ended_at` - Nenhuma alteração necessária.

## 📝 Validação no Frontend

O arquivo `/src/app/dashboard/page.tsx` já estava enviando todos os campos corretos:

```typescript
const experimentData = {
  name: String(experimentForm.name || '').trim(),
  description: experimentForm.description || undefined,
  project_id: String(projectId),
  algorithm: experimentForm.algorithm || 'thompson_sampling',
  traffic_allocation: experimentForm.trafficAllocation || 100,
  target_url: experimentForm.targetUrl?.trim(),
  conversion_type: experimentForm.conversionType || 'page_view',
  conversion_url: experimentForm.conversionUrl?.trim(),
  conversion_value: experimentForm.conversionValue || 0,
  conversion_selector: experimentForm.conversionSelector?.trim()
}
```

## ✅ Status Final

Agora **TODOS** os campos da tabela `experiments` estão sendo salvos corretamente:

1. ✅ Campos básicos: `name`, `description`, `project_id`, `user_id`
2. ✅ Configuração do teste: `type`, `status`, `traffic_allocation`, `algorithm`
3. ✅ URLs: `target_url`, `conversion_url`
4. ✅ Métricas: `conversion_value`, `conversion_type`
5. ✅ Timestamps automáticos: `started_at` (quando status → 'running'), `ended_at` (quando status → 'paused'/'completed')
6. ✅ Campos auto-gerados: `id`, `api_key`, `created_at`, `updated_at`

## 🧪 Como Testar

1. **Criar novo experimento:**
   ```bash
   # Acessar o dashboard e criar um experimento com todos os campos preenchidos
   ```

2. **Verificar no Supabase:**
   ```sql
   SELECT 
     id, name, algorithm, target_url, conversion_url, 
     conversion_value, conversion_type, started_at, ended_at
   FROM experiments
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Mudar status para 'running':**
   - Verificar que `started_at` é preenchido automaticamente

4. **Mudar status para 'paused' ou 'completed':**
   - Verificar que `ended_at` é preenchido automaticamente

## 📚 Arquivos Modificados

- ✅ `src/app/api/experiments/route.ts`
- ✅ `src/app/api/experiments/create-direct/route.ts`
- ✅ `src/app/api/experiments/[id]/route.ts`

## 🎯 Resultado

Todos os experimentos agora são salvos **por inteiro** no Supabase, incluindo todos os campos configurados pelo usuário e campos de controle automáticos.

