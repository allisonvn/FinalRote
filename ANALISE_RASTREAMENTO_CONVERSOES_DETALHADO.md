# 📊 Análise Detalhada: Rastreamento de Conversões

**Data:** 17/10/2025  
**Status:** ⚠️ **PROBLEMA IDENTIFICADO - NECESSITA CORREÇÃO**

---

## 🎯 PROBLEMA IDENTIFICADO

O sistema **NÃO está registrando corretamente** todos os detalhes das conversões, especificamente:

### ❌ O que está FALTANDO:

1. **Página de Origem da Conversão** - Não está sendo rastreada
2. **URL da Página que Gerou a Conversão** - Não está sendo salva
3. **Referrer da Conversão** - Não está sendo capturado
4. **Dados de Navegação** - Não está sendo registrado o fluxo completo

### ✅ O que está FUNCIONANDO:

1. **Valor da Conversão** - ✅ Sendo registrado (R$ 100,00)
2. **Variante que Originou** - ✅ Sendo identificada via localStorage
3. **Timestamp** - ✅ Sendo registrado
4. **Experimento ID** - ✅ Sendo associado

---

## 🔍 ANÁLISE TÉCNICA

### Dados Atuais no Banco:

```sql
-- Experimento configurado:
{
  "name": "Esmalt",
  "target_url": "https://esmalt.com.br/elementor-595/",  -- Página original
  "conversion_url": "https://esmalt.com.br/glow/",       -- Página de sucesso
  "conversion_value": "100.00"                           -- Valor da conversão
}

-- Eventos registrados:
[
  {
    "event_type": "page_view",
    "event_data": {
      "url": "https://esmalt.com.br/elementor-595/",     -- ✅ Página original
      "variant": "Variante A",
      "variant_id": "1c90c888-c85f-4e5d-ba0f-d0a3543a5590"
    }
  },
  {
    "event_type": "assignment",
    "event_data": {
      "url": "https://esmalt.com.br/elementor-595/",     -- ✅ Página original
      "referrer": "",
      "variant_name": "Variante A"
    }
  }
]

-- Conversões registradas:
[] -- ❌ NENHUMA CONVERSÃO REGISTRADA!
```

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. **Nenhuma Conversão Registrada**
- O sistema não está registrando conversões na tabela `events`
- Apenas `page_view` e `assignment` estão sendo registrados
- Conversões deveriam aparecer com `event_type = 'conversion'`

### 2. **Falta Rastreamento da Página de Origem**
- O `conversion-tracker.js` só captura a URL atual (página de sucesso)
- Não captura qual página o usuário estava antes de converter
- Não salva o `referrer` da conversão

### 3. **Estrutura de Dados Incompleta**
- A tabela `events` não tem coluna `url` (erro 42703)
- Os dados de URL estão sendo salvos em `event_data` (JSONB)
- Falta estrutura para rastrear o fluxo completo

---

## 🔧 SOLUÇÃO PROPOSTA

### 1. **Corrigir o Conversion Tracker**

**Arquivo:** `public/conversion-tracker.js`

```javascript
// ANTES (atual - incompleto)
const conversionPayload = {
  experiment_id: assignmentData.experimentId,
  visitor_id: assignmentData.visitorId,
  variant_id: assignmentData.variantId,
  variant: assignmentData.variantName,
  event_type: 'conversion',
  event_name: 'conversion',
  value: experimentData.conversionValue || 0,
  url: window.location.href,  // ❌ Só a página atual
  timestamp: new Date().toISOString(),
  properties: {
    page_url: window.location.href,  // ❌ Só a página atual
    page_title: document.title,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
    success_page: true
  }
};

// DEPOIS (corrigido - completo)
const conversionPayload = {
  experiment_id: assignmentData.experimentId,
  visitor_id: assignmentData.visitorId,
  variant_id: assignmentData.variantId,
  variant: assignmentData.variantName,
  event_type: 'conversion',
  event_name: 'conversion',
  value: experimentData.conversionValue || 0,
  timestamp: new Date().toISOString(),
  properties: {
    // ✅ Página de sucesso (atual)
    success_page_url: window.location.href,
    success_page_title: document.title,
    
    // ✅ Página que originou a conversão (do localStorage)
    origin_page_url: assignmentData.originPageUrl || experimentData.targetUrl,
    origin_page_title: assignmentData.originPageTitle,
    
    // ✅ Dados de navegação
    referrer: document.referrer,
    user_agent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    
    // ✅ Dados da conversão
    conversion_value: experimentData.conversionValue,
    conversion_type: experimentData.conversionType,
    timestamp: new Date().toISOString(),
    success_page: true
  }
};
```

### 2. **Melhorar o SDK para Rastrear Página de Origem**

**Arquivo:** `public/rotafinal-sdk.js`

```javascript
// Adicionar rastreamento da página de origem
async runExperiment(experimentId, options = {}) {
  // ... código existente ...
  
  // ✅ NOVO: Salvar dados da página de origem
  const originPageData = {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    timestamp: new Date().toISOString()
  };
  
  // Salvar no localStorage para usar na conversão
  localStorage.setItem(`rotafinal_origin_${experimentId}`, JSON.stringify(originPageData));
  
  // ... resto do código ...
}
```

### 3. **Atualizar API para Salvar Dados Completos**

**Arquivo:** `src/app/api/track/route.ts`

```typescript
// Melhorar o processamento dos dados de conversão
const eventData = {
  experiment_id: experimentId,
  visitor_id: data.visitor_id,
  variant_id: data.variant_id || null,
  event_type: data.event_type,
  event_name: data.event_type,
  event_data: {
    // ✅ Dados da variante
    variant: data.variant,
    variant_id: data.variant_id,
    
    // ✅ Dados da página de sucesso
    success_page_url: data.properties?.success_page_url,
    success_page_title: data.properties?.success_page_title,
    
    // ✅ Dados da página de origem
    origin_page_url: data.properties?.origin_page_url,
    origin_page_title: data.properties?.origin_page_title,
    
    // ✅ Dados de navegação
    referrer: data.properties?.referrer,
    user_agent: data.properties?.user_agent,
    viewport: data.properties?.viewport,
    
    // ✅ Dados da conversão
    conversion_value: data.properties?.conversion_value,
    conversion_type: data.properties?.conversion_type,
    success_page: data.properties?.success_page,
    
    // ✅ Dados originais
    ...data.properties
  },
  value: data.value || (data.properties?.value ? parseFloat(data.properties.value) : null),
  created_at: data.timestamp || new Date().toISOString()
}
```

---

## 📊 ESTRUTURA DE DADOS PROPOSTA

### Evento de Conversão Completo:

```json
{
  "id": "uuid",
  "experiment_id": "1ad6419e-37a4-40b1-bb8e-5d7f206f74ac",
  "variant_id": "83256ca0-be29-432d-863f-58ba023aff7b",
  "visitor_id": "rf_xyz_789",
  "event_type": "conversion",
  "event_name": "conversion",
  "value": 100.00,
  "event_data": {
    "variant": "Variante A",
    "variant_id": "83256ca0-be29-432d-863f-58ba023aff7b",
    
    // Página de sucesso (atual)
    "success_page_url": "https://esmalt.com.br/glow/",
    "success_page_title": "Obrigado pela sua compra!",
    
    // Página que originou a conversão
    "origin_page_url": "https://esmalt.com.br/elementor-595/",
    "origin_page_title": "Elementor #595 - Esmalt",
    
    // Dados de navegação
    "referrer": "https://google.com/search?q=esmalt",
    "user_agent": "Mozilla/5.0...",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    
    // Dados da conversão
    "conversion_value": 100.00,
    "conversion_type": "page_view",
    "success_page": true,
    "timestamp": "2025-10-17T20:30:00.000Z"
  },
  "created_at": "2025-10-17T20:30:00.000Z"
}
```

---

## 🎯 FLUXO CORRETO PROPOSTO

### 1. **Usuário Acessa Página Original**
```javascript
// SDK salva dados da página de origem
localStorage.setItem('rotafinal_origin_exp123', JSON.stringify({
  url: 'https://esmalt.com.br/elementor-595/',
  title: 'Elementor #595 - Esmalt',
  referrer: 'https://google.com',
  timestamp: '2025-10-17T20:25:00.000Z'
}));
```

### 2. **Usuário Vai para Página de Sucesso**
```javascript
// Conversion tracker busca dados da página de origem
const originData = JSON.parse(localStorage.getItem('rotafinal_origin_exp123'));

// Envia conversão com dados completos
const conversionPayload = {
  // ... dados da conversão ...
  properties: {
    success_page_url: 'https://esmalt.com.br/glow/',      // Página atual
    origin_page_url: originData.url,                      // Página que originou
    origin_page_title: originData.title,                  // Título da página origem
    referrer: originData.referrer,                        // Referrer original
    // ... outros dados ...
  }
};
```

### 3. **Banco Registra Dados Completos**
```sql
-- Tabela events recebe dados completos
INSERT INTO events (
  experiment_id,
  variant_id,
  visitor_id,
  event_type,
  value,
  event_data  -- JSONB com todos os dados
) VALUES (
  '1ad6419e-37a4-40b1-bb8e-5d7f206f74ac',
  '83256ca0-be29-432d-863f-58ba023aff7b',
  'rf_xyz_789',
  'conversion',
  100.00,
  '{"success_page_url":"https://esmalt.com.br/glow/","origin_page_url":"https://esmalt.com.br/elementor-595/",...}'
);
```

---

## 📈 QUERIES PARA ANÁLISE

### 1. **Conversões por Página de Origem**
```sql
SELECT 
  event_data->>'origin_page_url' as pagina_origem,
  event_data->>'success_page_url' as pagina_sucesso,
  COUNT(*) as total_conversoes,
  SUM(value) as receita_total
FROM events
WHERE event_type = 'conversion'
GROUP BY 
  event_data->>'origin_page_url',
  event_data->>'success_page_url'
ORDER BY total_conversoes DESC;
```

### 2. **Performance por Variante e Página**
```sql
SELECT 
  v.name as variante,
  e.event_data->>'origin_page_url' as pagina_origem,
  COUNT(*) as conversoes,
  AVG(e.value) as ticket_medio,
  SUM(e.value) as receita_total
FROM events e
JOIN variants v ON e.variant_id = v.id
WHERE e.event_type = 'conversion'
GROUP BY v.name, e.event_data->>'origin_page_url'
ORDER BY conversoes DESC;
```

### 3. **Fluxo de Navegação**
```sql
SELECT 
  visitor_id,
  event_data->>'origin_page_url' as pagina_origem,
  event_data->>'success_page_url' as pagina_sucesso,
  event_data->>'referrer' as referrer,
  value as valor_conversao,
  created_at
FROM events
WHERE event_type = 'conversion'
ORDER BY created_at DESC;
```

---

## ✅ IMPLEMENTAÇÃO RECOMENDADA

### Prioridade 1: **Corrigir Conversion Tracker**
1. Atualizar `conversion-tracker.js` para capturar página de origem
2. Melhorar estrutura de dados enviada para API
3. Testar com dados reais

### Prioridade 2: **Melhorar SDK**
1. Adicionar rastreamento de página de origem no `rotafinal-sdk.js`
2. Salvar dados no localStorage para uso posterior
3. Garantir que dados sejam preservados entre páginas

### Prioridade 3: **Atualizar API**
1. Melhorar processamento de dados na API `/api/track`
2. Estruturar melhor os dados em `event_data`
3. Adicionar validações

### Prioridade 4: **Criar Relatórios**
1. Queries para análise de conversões por página de origem
2. Dashboard com métricas detalhadas
3. Relatórios de fluxo de navegação

---

## 🎯 RESULTADO ESPERADO

Após implementar as correções:

✅ **Página de Origem** - Registrada corretamente  
✅ **Valor da Conversão** - Mantido (R$ 100,00)  
✅ **Variante que Originou** - Mantido (via localStorage)  
✅ **Dados de Navegação** - Capturados (referrer, viewport, etc.)  
✅ **Fluxo Completo** - Rastreado do início ao fim  
✅ **Relatórios Detalhados** - Possíveis de gerar  

---

**Documento criado em:** 17/10/2025  
**Status:** ⚠️ **NECESSITA IMPLEMENTAÇÃO**  
**Prioridade:** 🔴 **ALTA**

