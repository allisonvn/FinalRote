# 📊 Análise Completa: Como as Conversões são Contabilizadas

**Data:** 17/10/2025  
**Status:** ✅ ANÁLISE COMPLETA DO SISTEMA

---

## 🎯 RESUMO EXECUTIVO

O sistema Rota Final contabiliza conversões **automaticamente** toda vez que um usuário acessa a **URL da página de sucesso** cadastrada no modal "Criar Experimento A/B" (Etapa 3 - Meta).

### Características Principais:
- ✅ **Contabilização automática**: Toda vez que a URL de sucesso é acessada
- ✅ **Associação à variante**: Identifica qual variante originou a conversão
- ✅ **Valor de conversão**: Registra o valor configurado no experimento
- ✅ **Anti-duplicação**: Cada usuário converte apenas 1x por experimento
- ✅ **Persistência**: Dados salvos na tabela `events` e agregados em `variant_stats`

---

## 📝 CONFIGURAÇÃO NO MODAL

### Etapa 3: Meta de Conversão

Quando o usuário cria um experimento no modal, ele configura:

```typescript
// Campos configurados na Etapa 3 do Modal
{
  conversion_type: 'page_view',              // Tipo de conversão
  conversion_url: 'https://site.com/sucesso', // ✅ URL da página de sucesso
  conversion_value: 150.00                   // ✅ Valor da conversão (R$)
}
```

**Arquivo:** `src/app/dashboard/page.tsx` (linha ~1244-1254)

```typescript
const experimentData = {
  name: String(experimentForm.name || '').trim(),
  description: experimentForm.description || undefined,
  project_id: String(projectId),
  algorithm: experimentForm.algorithm || 'thompson_sampling',
  traffic_allocation: experimentForm.trafficAllocation || 100,
  target_url: experimentForm.targetUrl?.trim(), // URL da página original
  conversion_type: experimentForm.conversionType || 'page_view',
  conversion_url: experimentForm.conversionUrl?.trim(), // ✅ URL DE SUCESSO
  conversion_value: experimentForm.conversionValue || 0, // ✅ VALOR DA CONVERSÃO
  conversion_selector: experimentForm.conversionSelector?.trim()
}
```

Esses dados são salvos diretamente na tabela `experiments` do Supabase.

**Arquivo:** `src/hooks/useSupabaseExperiments.ts` (linha ~214-218)

```typescript
.insert({
  // ... outros campos
  target_url: data.target_url?.trim() || null,
  conversion_url: data.conversion_url?.trim() || null,  // ✅ Salvo no banco
  conversion_value: data.conversion_value || 0,          // ✅ Salvo no banco
  conversion_type: data.conversion_type || 'page_view'
})
```

---

## 🔄 FLUXO COMPLETO DE RASTREAMENTO

### 1️⃣ Usuário Acessa Página Original

```javascript
// SDK Rota Final (rotafinal-sdk.js)
// Atribui uma variante ao visitante

localStorage.setItem('rotafinal_exp_abc123', JSON.stringify({
  experimentId: 'abc-123',
  variantId: 'var-456',
  variantName: 'Variante A',
  visitorId: 'rf_xyz_789',
  timestamp: Date.now()
}))
```

**O que acontece:**
- SDK identifica o experimento
- Busca variante do servidor (usando Thompson Sampling ou outro algoritmo MAB)
- Armazena dados no `localStorage`
- Redireciona o usuário para a URL da variante (se configurado)

---

### 2️⃣ Usuário Acessa Página de Sucesso

Quando o usuário chega na **URL de sucesso** (cadastrada na Etapa 3), o rastreamento acontece de **2 formas**:

#### **Forma A: Script Automático** (Recomendado) ✅

Adicionar na página de sucesso:

```html
<!-- Página: https://site.com/sucesso -->
<!DOCTYPE html>
<html>
<head>
  <title>Obrigado!</title>
  
  <!-- ✅ Script automático de conversão -->
  <script src="https://rotafinal.com.br/conversion-tracker.js"></script>
</head>
<body>
  <h1>Obrigado pela sua compra!</h1>
</body>
</html>
```

**O que o script faz automaticamente:**

**Arquivo:** `public/conversion-tracker.js`

```javascript
// 1. Busca dados do localStorage
const assignmentData = {
  experimentId: 'abc-123',
  variantId: 'var-456',
  variantName: 'Variante A',
  visitorId: 'rf_xyz_789'
}

// 2. Busca valor de conversão do experimento
const experimentData = await fetch('/api/experiments/abc-123')
// Retorna: { conversion_value: 150.00, conversion_url: '...' }

// 3. Prepara payload da conversão
const conversionPayload = {
  experiment_id: 'abc-123',
  visitor_id: 'rf_xyz_789',
  variant_id: 'var-456',          // ✅ Identifica a variante que originou
  variant: 'Variante A',
  event_type: 'conversion',
  value: 150.00,                  // ✅ Valor configurado no experimento
  url: window.location.href,
  timestamp: new Date().toISOString(),
  properties: {
    page_url: window.location.href,
    page_title: document.title,
    referrer: document.referrer,
    success_page: true            // ✅ Marca como página de sucesso
  }
}

// 4. Envia para API
await fetch('https://rotafinal.com.br/api/track', {
  method: 'POST',
  body: JSON.stringify(conversionPayload)
})

// 5. Marca como convertido (anti-duplicação)
localStorage.setItem('rotafinal_conversion_abc-123', {
  converted_at: new Date().toISOString(),
  variant: 'Variante A',
  value: 150.00
})
```

**Linhas importantes:**
- Linha 45-77: `getAssignmentData()` - Busca dados do experimento no localStorage
- Linha 82-113: `getExperimentData()` - Busca valor de conversão da API
- Linha 118-198: `trackConversion()` - Envia conversão para API
- Linha 127-131: **Anti-duplicação** - Verifica se já converteu

---

#### **Forma B: SDK Manual** (Opcional)

Se preferir controle manual:

```javascript
// Na página de sucesso
window.RotaFinal.conversion('purchase', 150.00, {
  product_id: '123',
  product_name: 'Produto X'
})
```

**Arquivo:** `public/rotafinal-sdk.js` (linha 377-417)

---

### 3️⃣ API Processa a Conversão

**Arquivo:** `src/app/api/track/route.ts` (linha 12-253)

```typescript
export async function POST(request: NextRequest) {
  const data = await request.json()
  
  // 1. Validar dados
  const experimentId = data.experiment_id
  const visitorId = data.visitor_id
  const variantId = data.variant_id  // ✅ ID da variante que originou
  
  // 2. Inserir evento na tabela events
  await supabase
    .from('events')
    .insert({
      experiment_id: experimentId,
      visitor_id: visitorId,
      variant_id: variantId,      // ✅ Associa conversão à variante
      event_type: 'conversion',
      event_name: 'conversion',
      value: data.value || 0,     // ✅ Valor da conversão
      properties: data.properties,
      url: data.url,
      created_at: data.timestamp || new Date().toISOString()
    })
  
  // 3. Se for conversão, atualizar estatísticas
  if (data.event_type === 'conversion') {
    // Buscar variant_id se não fornecido
    if (!variantId && data.variant) {
      const { data: variant } = await supabase
        .from('variants')
        .select('id')
        .eq('experiment_id', experimentId)
        .eq('name', data.variant)
        .single()
      
      variantId = variant.id
    }
    
    // ✅ ATUALIZAR ESTATÍSTICAS DA VARIANTE
    await supabase.rpc('increment_variant_conversions', {
      p_variant_id: variantId,
      p_experiment_id: experimentId,
      p_revenue: data.value || 0
    })
  }
}
```

**Linhas importantes:**
- Linha 91-118: Insere evento na tabela `events`
- Linha 121-164: Se for conversão, atualiza estatísticas da variante
- Linha 131-146: Fallback para buscar `variant_id` pelo nome (compatibilidade)
- Linha 150-154: **Chama RPC para incrementar conversões**

---

### 4️⃣ Banco de Dados Contabiliza

**Arquivo:** `supabase/migrations/20250102000000_add_mab_algorithms.sql` (linha 52-67)

```sql
-- Função RPC que incrementa conversões
CREATE OR REPLACE FUNCTION increment_variant_conversions(
    p_variant_id UUID,
    p_experiment_id UUID,
    p_revenue DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    -- Inserir ou atualizar estatísticas
    INSERT INTO variant_stats (
        experiment_id, 
        variant_id, 
        visitors, 
        conversions, 
        revenue
    )
    VALUES (
        p_experiment_id, 
        p_variant_id, 
        0,              -- Não incrementa visitors aqui
        1,              -- ✅ +1 conversão
        p_revenue       -- ✅ +R$ valor
    )
    ON CONFLICT (experiment_id, variant_id)
    DO UPDATE SET
        conversions = variant_stats.conversions + 1,    -- ✅ Incrementa conversões
        revenue = variant_stats.revenue + p_revenue,   -- ✅ Soma receita
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**O que acontece:**
- ✅ **Conversões**: +1 para a variante específica
- ✅ **Receita**: +R$ valor configurado
- ✅ **Timestamp**: Atualiza `last_updated`

**Exemplo de dados na tabela `variant_stats`:**

```sql
SELECT * FROM variant_stats WHERE experiment_id = 'abc-123';

-- Resultado:
experiment_id | variant_id | visitors | conversions | revenue  | last_updated
--------------|------------|----------|-------------|----------|------------------
abc-123       | var-456    | 1000     | 50          | 7500.00  | 2025-10-17 14:30
abc-123       | var-789    | 1020     | 62          | 9300.00  | 2025-10-17 14:32
```

**Cálculos automáticos:**
- **Taxa de Conversão**: `conversions / visitors = 50 / 1000 = 5%`
- **Ticket Médio**: `revenue / conversions = 7500 / 50 = R$ 150,00`

---

### 5️⃣ Dashboard Exibe os Dados

Os dados aparecem em tempo real no dashboard:

```typescript
// Card de Conversões
{
  total_conversions: 112,           // Soma de todas as variantes
  conversion_rate: 5.45,            // Taxa média
  total_revenue: 16800.00,          // Receita total
  average_ticket: 150.00            // Ticket médio
}

// Por Variante
{
  variant_a: {
    conversions: 50,
    revenue: 7500.00,
    conversion_rate: 5.00
  },
  variant_b: {
    conversions: 62,
    revenue: 9300.00,
    conversion_rate: 6.08  // ✅ Melhor performance!
  }
}
```

---

## 🔍 IMPORTANTE: Contabilização por Variante de Origem

### ✅ Como Funciona Corretamente

**O sistema identifica automaticamente qual variante originou a conversão:**

1. **Quando o usuário acessa a página original:**
   - SDK atribui variante (A ou B)
   - Salva `variant_id` no `localStorage`
   - Usuário vê a versão da variante

2. **Quando o usuário acessa a página de sucesso:**
   - Script busca `variant_id` do `localStorage`
   - Envia conversão **associada à variante que o usuário viu**
   - **NÃO importa qual URL está acessando agora** (página de sucesso)
   - **O que importa é qual variante o usuário viu na página original**

### 📊 Exemplo Prático

```
┌─────────────────────────────────────────────────────────────┐
│ USUÁRIO 1                                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Acessa: https://site.com/landing                         │
│    SDK atribui: Variante A                                  │
│    localStorage: variant_id = 'var-456' (Variante A)        │
│                                                              │
│ 2. Redireciona para: https://site.com/landing-a             │
│    (URL da Variante A)                                      │
│                                                              │
│ 3. Usuário clica em "Comprar"                               │
│                                                              │
│ 4. Acessa: https://site.com/obrigado                        │
│    (URL de sucesso - MESMA para todas as variantes)         │
│                                                              │
│ 5. Script detecta:                                          │
│    - localStorage: variant_id = 'var-456' (Variante A)      │
│    - Envia conversão com variant_id = 'var-456'             │
│                                                              │
│ 6. Resultado: ✅ Conversão contabilizada na Variante A      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ USUÁRIO 2                                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Acessa: https://site.com/landing                         │
│    SDK atribui: Variante B                                  │
│    localStorage: variant_id = 'var-789' (Variante B)        │
│                                                              │
│ 2. Redireciona para: https://site.com/landing-b             │
│    (URL da Variante B)                                      │
│                                                              │
│ 3. Usuário clica em "Comprar"                               │
│                                                              │
│ 4. Acessa: https://site.com/obrigado                        │
│    (URL de sucesso - MESMA para todas as variantes)         │
│                                                              │
│ 5. Script detecta:                                          │
│    - localStorage: variant_id = 'var-789' (Variante B)      │
│    - Envia conversão com variant_id = 'var-789'             │
│                                                              │
│ 6. Resultado: ✅ Conversão contabilizada na Variante B      │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Resumo

**A conversão é SEMPRE contabilizada na variante que o usuário VIU, não na URL que ele está acessando.**

- ✅ **Variante A** recebe conversões de usuários que viram a Variante A
- ✅ **Variante B** recebe conversões de usuários que viram a Variante B
- ✅ **Mesmo que ambos acessem a mesma URL de sucesso**

---

## 🚫 Anti-Duplicação

O sistema evita conversões duplicadas:

**Arquivo:** `public/conversion-tracker.js` (linha 126-131)

```javascript
// Verificar se já converteu
const conversionKey = `rotafinal_conversion_${experimentId}`;
if (localStorage.getItem(conversionKey)) {
  log('✅ Conversão já registrada anteriormente');
  return true; // Não envia novamente
}
```

**Comportamento:**
- ✅ Primeira visita à página de sucesso: **Conversão registrada**
- ⚠️ Segunda visita à página de sucesso: **Conversão ignorada**
- ✅ Cada usuário converte **apenas 1 vez por experimento**

---

## 📊 TABELAS NO BANCO DE DADOS

### 1. Tabela `events`
**Armazena TODOS os eventos (pageviews, conversões, etc)**

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  experiment_id UUID,
  visitor_id TEXT,
  variant_id UUID,           -- ✅ ID da variante que originou
  event_type TEXT,           -- 'conversion', 'pageview', etc
  event_name TEXT,
  value DECIMAL(12,2),       -- ✅ Valor da conversão
  properties JSONB,
  url TEXT,
  created_at TIMESTAMP
)
```

**Exemplo de conversão:**
```sql
INSERT INTO events VALUES (
  'evt-123',
  'abc-123',                 -- experiment_id
  'rf_xyz_789',              -- visitor_id
  'var-456',                 -- ✅ variant_id (Variante A)
  'conversion',              -- event_type
  'conversion',              -- event_name
  150.00,                    -- ✅ value
  '{"success_page": true}',  -- properties
  'https://site.com/sucesso',-- url
  '2025-10-17 14:30:00'      -- created_at
)
```

---

### 2. Tabela `variant_stats`
**Armazena estatísticas AGREGADAS por variante**

```sql
CREATE TABLE variant_stats (
  id UUID PRIMARY KEY,
  experiment_id UUID,
  variant_id UUID,
  visitors INTEGER,          -- Total de visitantes
  conversions INTEGER,       -- ✅ Total de conversões
  revenue DECIMAL(12,2),     -- ✅ Receita total
  last_updated TIMESTAMP,
  UNIQUE(experiment_id, variant_id)
)
```

**Exemplo:**
```sql
-- Variante A
{
  experiment_id: 'abc-123',
  variant_id: 'var-456',
  visitors: 1000,
  conversions: 50,          -- ✅ 50 pessoas converteram
  revenue: 7500.00,         -- ✅ 50 × R$ 150,00
  last_updated: '2025-10-17 14:30:00'
}

-- Variante B
{
  experiment_id: 'abc-123',
  variant_id: 'var-789',
  visitors: 1020,
  conversions: 62,          -- ✅ 62 pessoas converteram
  revenue: 9300.00,         -- ✅ 62 × R$ 150,00
  last_updated: '2025-10-17 14:32:00'
}
```

---

## ✅ VERIFICAÇÃO DO FUNCIONAMENTO

### 1. Testar Conversão Manualmente

```bash
# 1. Abrir navegador em modo incógnito
# 2. Abrir DevTools (F12) → Console

# 3. Acessar página original
# https://site.com/landing

# 4. Verificar localStorage
console.table(
  Object.keys(localStorage)
    .filter(k => k.startsWith('rotafinal'))
    .map(k => ({ key: k, value: localStorage.getItem(k) }))
)

# Deve mostrar:
# rotafinal_exp_abc123: {"experimentId":"abc-123","variantId":"var-456",...}

# 5. Acessar página de sucesso
# https://site.com/obrigado

# 6. Ver logs no console (se debug ativo)
# 🎯 [ConversionTracker] Iniciando ConversionTracker
# ✅ [ConversionTracker] Dados de atribuição encontrados
# 📡 [ConversionTracker] Buscando dados do experimento
# 📊 [ConversionTracker] Registrando conversão
# ✅ [ConversionTracker] Conversão registrada com sucesso!
```

---

### 2. Verificar no Supabase

```sql
-- Ver eventos de conversão
SELECT 
  e.created_at,
  e.experiment_id,
  v.name as variant_name,
  e.visitor_id,
  e.value,
  e.url
FROM events e
JOIN variants v ON e.variant_id = v.id
WHERE e.event_type = 'conversion'
ORDER BY e.created_at DESC
LIMIT 10;

-- Ver estatísticas agregadas
SELECT 
  v.name as variant_name,
  vs.visitors,
  vs.conversions,
  vs.revenue,
  ROUND((vs.conversions::DECIMAL / vs.visitors) * 100, 2) as conversion_rate
FROM variant_stats vs
JOIN variants v ON vs.variant_id = v.id
WHERE vs.experiment_id = 'abc-123';
```

---

### 3. Verificar no Dashboard

1. Acessar: https://rotafinal.com.br/dashboard
2. Abrir experimento
3. Ver cards de estatísticas:
   - **Conversões**: Deve mostrar +1
   - **Receita**: Deve mostrar +R$ 150,00
   - **Taxa de Conversão**: Deve recalcular

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### Para o Usuário Configurar

- [ ] **Etapa 1**: Definir URL da página original
- [ ] **Etapa 2**: Definir URLs das variantes (Variante A, B, etc)
- [ ] **Etapa 3**: ✅ **Definir URL da página de sucesso**
- [ ] **Etapa 3**: ✅ **Definir valor da conversão (R$)**
- [ ] **Salvar experimento**

### Para Rastrear Conversões

- [ ] Adicionar script na **página de sucesso**:
  ```html
  <script src="https://rotafinal.com.br/conversion-tracker.js"></script>
  ```

### Para Validar

- [ ] Testar em modo incógnito
- [ ] Verificar localStorage após acessar página original
- [ ] Acessar página de sucesso
- [ ] Verificar logs no DevTools
- [ ] Confirmar conversão no Dashboard

---

## 🔧 PROBLEMAS COMUNS

### ❌ Conversão não está sendo registrada

**Possíveis causas:**

1. **Script não foi adicionado à página de sucesso**
   - ✅ Solução: Adicionar `<script src="...conversion-tracker.js"></script>`

2. **localStorage foi limpo**
   - ✅ Solução: Usuário precisa acessar página original primeiro

3. **URL de sucesso incorreta**
   - ✅ Solução: Verificar se a URL configurada no experimento bate com a URL real

4. **CORS bloqueado**
   - ✅ Solução: Verificar se o domínio está permitido na API

5. **Já converteu anteriormente**
   - ✅ Solução: Testar em modo incógnito ou limpar localStorage

---

### ❌ Conversão está indo para variante errada

**Possíveis causas:**

1. **localStorage corrompido**
   - ✅ Solução: Limpar localStorage e testar novamente

2. **Múltiplos experimentos ativos**
   - ✅ Solução: Verificar qual experimento está sendo rastreado

3. **variant_id não está sendo enviado**
   - ✅ Solução: Atualizar para versão mais recente do SDK

---

## 📚 ARQUIVOS RELACIONADOS

### Frontend
- `src/app/dashboard/page.tsx` - Modal de criação de experimentos
- `src/components/dashboard/premium-experiment-modal.tsx` - Interface do modal
- `src/hooks/useSupabaseExperiments.ts` - Hook para criar experimentos

### Rastreamento
- `public/conversion-tracker.js` - Script automático de conversão
- `public/rotafinal-sdk.js` - SDK principal

### Backend
- `src/app/api/track/route.ts` - Endpoint para receber eventos
- `src/app/api/experiments/[id]/route.ts` - API para buscar dados do experimento

### Banco de Dados
- `supabase/migrations/20250102000000_add_mab_algorithms.sql` - Funções RPC
- Tabela: `experiments` - Armazena configuração do experimento
- Tabela: `events` - Armazena todos os eventos
- Tabela: `variant_stats` - Estatísticas agregadas

---

## ✅ CONCLUSÃO

### Como as Conversões São Contabilizadas:

1. ✅ **Cadastro**: URL de sucesso e valor configurados no modal (Etapa 3)
2. ✅ **Detecção**: Script automático detecta quando usuário acessa URL de sucesso
3. ✅ **Identificação**: Sistema identifica qual variante o usuário viu (via localStorage)
4. ✅ **Registro**: Conversão é enviada para API com `variant_id` correto
5. ✅ **Contabilização**: Banco incrementa conversões e receita da variante específica
6. ✅ **Visualização**: Dashboard exibe dados em tempo real

### Principais Vantagens:

- 🚀 **Automático**: Basta adicionar 1 linha de código na página de sucesso
- 🎯 **Preciso**: Conversão é atribuída à variante correta
- 💰 **Valores**: Registra valor de conversão configurado
- 🚫 **Anti-duplicação**: Cada usuário converte apenas 1x
- 📊 **Tempo real**: Dados aparecem instantaneamente no dashboard

---

**Documento gerado em:** 17/10/2025  
**Versão do sistema:** v2.0  
**Última atualização:** Outubro 2025

