# 🎯 Fluxo Completo de Eventos e Jornada do Usuário

**Data:** 03/11/2025
**Status:** ✅ Documentação Completa

---

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Como os Eventos São Criados](#como-os-eventos-são-criados)
3. [Tipos de Eventos](#tipos-de-eventos)
4. [Jornada do Usuário](#jornada-do-usuário)
5. [Detecção de Conversões](#detecção-de-conversões)
6. [Estrutura dos Dados](#estrutura-dos-dados)
7. [Analytics e Identificação](#analytics-e-identificação)

---

## 🎯 Visão Geral

O sistema Rota Final rastreia a jornada completa do usuário através de **eventos**. Cada interação gera um evento que é armazenado no banco de dados e usado para calcular métricas e otimizar experimentos.

### Fluxo Simplificado:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Site do   │ ──────> │  SDK Rota   │ ──────> │  API /track │ ──────> │  PostgreSQL │
│   Cliente   │         │    Final    │         │             │         │  (Supabase) │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
     User                   JavaScript              Next.js API             Database
   Interaction              (Frontend)               (Backend)              (Storage)
```

---

## 🛠️ Como os Eventos São Criados

### 1. **SDK Instalado no Site do Cliente**

Quando você cria um experimento, o sistema gera um código JavaScript que é inserido no site do cliente:

**Localização:** `src/components/OptimizedCodeGenerator.tsx`

#### Código Gerado (Simplificado):

```html
<!-- Inserido no site do cliente antes do </body> -->
<script>
(function() {
  // SDK Rota Final v3.0.2
  var experimentId = "ffcd8e69-d981-431e-9ba6-d86c395bea26";
  var apiUrl = "https://rotafinal.com.br";
  var apiKey = "rf_xxxxxxxxxxxxx";
  var visitorId = getVisitorId(); // ID único persistente

  // 1️⃣ ATRIBUIR VARIANTE (Sincronamente)
  var variant = assignVariant(experimentId, visitorId);

  // 2️⃣ APLICAR MUDANÇAS (Redirect ou Element)
  if (variant.redirect_url) {
    window.location.replace(variant.redirect_url);
  } else if (variant.css_changes) {
    applyCSS(variant.css_changes);
  }

  // 3️⃣ CAPTURAR UTMs
  captureUTMs(); // utm_source, utm_medium, utm_campaign, etc.

  // 4️⃣ RASTREAR PAGE_VIEW
  trackEvent({
    event_type: 'page_view',
    experiment_id: experimentId,
    variant_id: variant.id,
    visitor_id: visitorId,
    properties: {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      utm_source: localStorage.getItem('rf_utm_source'),
      utm_medium: localStorage.getItem('rf_utm_medium'),
      utm_campaign: localStorage.getItem('rf_utm_campaign'),
      // ... outros dados
    }
  });

  // 5️⃣ CONFIGURAR RASTREAMENTO DE CONVERSÃO
  setupConversionTracking({
    url: '/obrigado',        // Detectar por URL
    selector: '.btn-comprar', // Ou por clique em elemento
    event: 'purchase'         // Ou por evento customizado
  });
})();
</script>
```

---

### 2. **SDK Envia Evento para API**

O SDK faz uma requisição POST para a API:

**Endpoint:** `POST /api/track`
**Arquivo:** `src/app/api/track/route.ts`

#### Request Exemplo:

```json
{
  "experiment_id": "ffcd8e69-d981-431e-9ba6-d86c395bea26",
  "variant_id": "9dacb4a7-8c55-40a5-8cbe-a79a88c44791",
  "visitor_id": "rf_d7rlckqay_mh9j8wxm",
  "event_type": "page_view",
  "properties": {
    "url": "https://esmalt.com.br/elementor-595/",
    "title": "Elementor #595",
    "referrer": "https://google.com",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "black_friday_2024",
    "utm_term": "teste ab",
    "utm_content": "banner_principal",
    "device_type": "desktop",
    "browser": "Chrome",
    "os": "macOS",
    "viewport": { "width": 1920, "height": 1080 }
  },
  "timestamp": "2025-11-03T15:30:00.000Z"
}
```

---

### 3. **API Processa e Salva no Banco**

A API `src/app/api/track/route.ts` processa o evento:

```typescript
export async function POST(request: NextRequest) {
  const data = await request.json()

  // ✅ VALIDAR dados obrigatórios
  if (!data.experiment_id || !data.visitor_id || !data.event_type) {
    return error('Campos obrigatórios faltando')
  }

  // ✅ EXTRAIR UTMs das properties
  const utmParams = {
    utm_source: data.properties?.utm_source,
    utm_medium: data.properties?.utm_medium,
    utm_campaign: data.properties?.utm_campaign,
    utm_term: data.properties?.utm_term,
    utm_content: data.properties?.utm_content
  }

  // ✅ PREPARAR dados do evento
  const eventData = {
    experiment_id: data.experiment_id,
    variant_id: data.variant_id,
    visitor_id: data.visitor_id,
    event_name: data.event_type, // 'page_view', 'click', 'conversion'
    event_type: data.event_type,
    event_data: {
      url: data.url,
      title: data.properties?.title,
      referrer: data.properties?.referrer,
      viewport: data.properties?.viewport,
      // ... todos os dados da properties
      ...data.properties
    },
    utm_data: utmParams, // JSONB com UTMs
    value: data.value, // Valor monetário (para conversões)
    created_at: data.timestamp || new Date().toISOString()
  }

  // ✅ INSERIR no banco de dados
  await supabase.from('events').insert(eventData)

  // ✅ SE FOR CONVERSÃO: atualizar variant_stats
  if (data.event_type === 'conversion') {
    await supabase.rpc('increment_variant_conversions', {
      p_variant_id: data.variant_id,
      p_experiment_id: data.experiment_id,
      p_revenue: data.value || 0
    })
  }

  // ✅ CRIAR/ATUALIZAR sessão do visitante
  await supabase.from('visitor_sessions').upsert({
    visitor_id: data.visitor_id,
    utm_source: utmParams.utm_source,
    utm_medium: utmParams.utm_medium,
    utm_campaign: utmParams.utm_campaign,
    device_type: data.properties?.device_type,
    browser: data.properties?.browser,
    // ...
  })

  return success({ message: 'Evento registrado' })
}
```

---

### 4. **Dados Armazenados no PostgreSQL**

O evento é salvo na tabela `events`:

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id),
  variant_id UUID REFERENCES variants(id),
  visitor_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'page_view', 'click', 'conversion', 'custom', 'assignment'
  event_data JSONB DEFAULT '{}'::jsonb,
  utm_data JSONB DEFAULT '{}'::jsonb,
  value DECIMAL(10,2),  -- Valor monetário
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemplo de Registro:**

| id | experiment_id | variant_id | visitor_id | event_type | event_data | utm_data | value | created_at |
|----|---------------|------------|------------|------------|------------|----------|-------|------------|
| uuid | ffcd8e69... | 9dacb4a7... | rf_d7rlck... | page_view | {"url": "...", "title": "..."} | {"utm_source": "google", "utm_medium": "cpc"} | null | 2025-11-03 15:30:00 |

---

## 🎭 Tipos de Eventos

O sistema identifica eventos através do campo `event_type`:

### 1. **assignment**
- **Quando:** Usuário recebe uma variante do experimento
- **Criado por:** SDK ao atribuir variante
- **Usado para:** Rastrear quantos visitantes únicos entraram no experimento

```javascript
{
  event_type: 'assignment',
  event_name: 'variant_assigned',
  event_data: {
    variant_name: 'Variante B',
    is_control: false,
    timestamp: '2025-11-03T15:30:00.000Z'
  }
}
```

---

### 2. **page_view**
- **Quando:** Usuário visualiza uma página
- **Criado por:** SDK automaticamente em cada pageview
- **Usado para:** Calcular impressões, bounce rate, tempo no site

```javascript
{
  event_type: 'page_view',
  event_name: 'page_view',
  event_data: {
    url: 'https://exemplo.com/produto',
    title: 'Produto X - Loja',
    path: '/produto',
    referrer: 'https://google.com',
    variant: 'Variante B'
  },
  utm_data: {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'black_friday'
  }
}
```

---

### 3. **click**
- **Quando:** Usuário clica em elemento rastreado
- **Criado por:** SDK através de `addEventListener`
- **Usado para:** Calcular CTR (Click-Through Rate)

```javascript
{
  event_type: 'click',
  event_name: 'button_click',
  event_data: {
    selector: '.btn-comprar',
    element: 'button',
    text: 'Comprar Agora',
    position: 'hero_section'
  }
}
```

---

### 4. **conversion** ⭐ (MAIS IMPORTANTE)
- **Quando:** Usuário completa objetivo do experimento
- **Criado por:** SDK ao detectar conversão
- **Usado para:** Calcular conversion rate, receita, ROI

#### 3 Formas de Detectar Conversão:

##### A) **Por URL (Página de Sucesso)**

```javascript
// Configuração no experimento:
{
  conversion_url: '/obrigado',
  conversion_value: 99.90
}

// SDK detecta automaticamente quando usuário chega em /obrigado
// e envia:
{
  event_type: 'conversion',
  event_name: 'purchase_completed',
  event_data: {
    success_page_url: 'https://exemplo.com/obrigado',
    origin_page_url: 'https://exemplo.com/checkout',
    conversion_url: '/obrigado'
  },
  value: 99.90  // ✅ Valor da conversão
}
```

##### B) **Por Seletor CSS (Clique em Botão)**

```javascript
// Configuração no experimento:
{
  conversion_selector: '.btn-finalizar-compra',
  conversion_value: 149.90
}

// SDK adiciona listener e detecta clique:
document.addEventListener('click', function(e) {
  if (e.target.matches('.btn-finalizar-compra')) {
    trackEvent({
      event_type: 'conversion',
      event_name: 'checkout_completed',
      event_data: {
        selector: '.btn-finalizar-compra',
        element: 'button',
        text: e.target.textContent
      },
      value: 149.90
    })
  }
})
```

##### C) **Por Evento Customizado**

```javascript
// Configuração no experimento:
{
  conversion_event: 'purchase',
  conversion_value: 199.90
}

// SDK escuta evento custom:
document.addEventListener('purchase', function(e) {
  trackEvent({
    event_type: 'conversion',
    event_name: 'custom_purchase',
    event_data: {
      event: 'purchase',
      details: e.detail
    },
    value: 199.90
  })
})

// Desenvolvedor dispara manualmente:
document.dispatchEvent(new CustomEvent('purchase', {
  detail: { orderId: '12345', value: 199.90 }
}))
```

---

### 5. **custom**
- **Quando:** Evento personalizado definido pelo desenvolvedor
- **Criado por:** Chamada manual via API exposta
- **Usado para:** Rastrear ações específicas do negócio

```javascript
// API exposta pelo SDK:
window.RotaFinalUTM.send('video_watched', {
  video_id: 'intro_produto',
  duration_watched: 120,
  completion_rate: 0.8
})

// Gera evento:
{
  event_type: 'custom',
  event_name: 'video_watched',
  event_data: {
    video_id: 'intro_produto',
    duration_watched: 120,
    completion_rate: 0.8
  }
}
```

---

## 🚶 Jornada do Usuário

A jornada completa é mapeada através da sequência de eventos:

### Exemplo de Jornada Completa:

```
1️⃣ ENTRADA NO EXPERIMENTO
   ┌─────────────────────────────────────────────────┐
   │ Event: assignment                               │
   │ Time: 15:30:00                                  │
   │ Data: Visitor atribuído à "Variante B"          │
   │ UTM: google / cpc / black_friday_2024           │
   └─────────────────────────────────────────────────┘
             ↓

2️⃣ VISUALIZAÇÃO DA PÁGINA
   ┌─────────────────────────────────────────────────┐
   │ Event: page_view                                │
   │ Time: 15:30:01                                  │
   │ Data: /produto                                  │
   │ Referrer: google.com                            │
   │ Device: desktop                                 │
   └─────────────────────────────────────────────────┘
             ↓

3️⃣ INTERAÇÃO (Clique)
   ┌─────────────────────────────────────────────────┐
   │ Event: click                                    │
   │ Time: 15:30:45                                  │
   │ Data: Clicou em "Adicionar ao Carrinho"        │
   │ Elemento: .btn-add-cart                         │
   └─────────────────────────────────────────────────┘
             ↓

4️⃣ NAVEGAÇÃO (Outro Page View)
   ┌─────────────────────────────────────────────────┐
   │ Event: page_view                                │
   │ Time: 15:30:46                                  │
   │ Data: /checkout                                 │
   └─────────────────────────────────────────────────┘
             ↓

5️⃣ CONVERSÃO 🎯
   ┌─────────────────────────────────────────────────┐
   │ Event: conversion                               │
   │ Time: 15:32:10                                  │
   │ Data: /obrigado                                 │
   │ Value: R$ 149,90                                │
   │ Origin: /checkout                               │
   └─────────────────────────────────────────────────┘
```

### Tempo na Jornada:
- **Entrada → Conversão:** 2 minutos e 10 segundos
- **Total de Interações:** 5 eventos
- **Páginas Visitadas:** 3 (/produto, /checkout, /obrigado)

---

## 🎯 Detecção de Conversões

### Como o Sistema Identifica uma Conversão?

#### 1. **Configuração no Experimento**

Ao criar o experimento, você define **como** detectar conversões:

**Interface:**
```typescript
interface ConversionConfig {
  type: 'url' | 'selector' | 'event'
  url?: string           // Ex: '/obrigado'
  selector?: string      // Ex: '.btn-comprar'
  event?: string         // Ex: 'purchase'
  value?: number         // Ex: 99.90
}
```

---

#### 2. **SDK Monitora Automaticamente**

O SDK gerado inclui código de monitoramento:

##### Para URL:
```javascript
setupConversionTracking: function() {
  var conversionUrl = "/obrigado";
  var currentPath = window.location.pathname;
  var currentUrl = window.location.href;

  // Verifica se está na página de conversão
  if (currentPath === conversionUrl || currentUrl.includes(conversionUrl)) {
    tracking.track('conversion', {
      url: currentUrl,
      conversion_url: conversionUrl,
      value: 99.90
    });
  }
}
```

##### Para Seletor CSS:
```javascript
setupConversionTracking: function() {
  var selector = ".btn-comprar";

  document.addEventListener('click', function(e) {
    var target = e.target.closest(selector);
    if (target) {
      tracking.track('conversion', {
        selector: selector,
        element: target.tagName.toLowerCase(),
        text: target.textContent.trim(),
        value: 99.90
      });
    }
  }, true);
}
```

##### Para Evento Customizado:
```javascript
setupConversionTracking: function() {
  var eventName = "purchase";

  document.addEventListener(eventName, function(e) {
    tracking.track('conversion', {
      event: eventName,
      details: e.detail,
      value: 99.90
    });
  }, true);
}
```

---

#### 3. **Backend Processa Conversão**

Quando um evento `conversion` chega na API (`/api/track`):

```typescript
// Se for conversão, atualizar variant_stats
if (data.event_type === 'conversion') {
  console.log('📊 [CONVERSION] Registrando conversão', {
    experiment: experimentId,
    visitor: data.visitor_id,
    variant_name: data.variant,
    value: eventData.value
  })

  // ✅ INCREMENTAR contador de conversões da variante
  await supabase.rpc('increment_variant_conversions', {
    p_variant_id: data.variant_id,
    p_experiment_id: experimentId,
    p_revenue: eventData.value || 0
  })

  // Resultado: variant_stats atualizado
  // - conversions: +1
  // - revenue: +99.90
  // - conversion_rate recalculado automaticamente
}
```

---

#### 4. **Atualização de Estatísticas**

A função PostgreSQL `increment_variant_conversions` atualiza:

```sql
CREATE OR REPLACE FUNCTION increment_variant_conversions(
  p_variant_id UUID,
  p_experiment_id UUID,
  p_revenue DECIMAL DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO variant_stats (
    experiment_id,
    variant_id,
    visitors,      -- Mantém o atual
    conversions,   -- +1
    revenue,       -- +p_revenue
    last_updated
  )
  VALUES (
    p_experiment_id,
    p_variant_id,
    0,
    1,
    p_revenue,
    NOW()
  )
  ON CONFLICT (experiment_id, variant_id)
  DO UPDATE SET
    conversions = variant_stats.conversions + 1,
    revenue = variant_stats.revenue + p_revenue,
    last_updated = NOW();
END;
$$;
```

---

## 📊 Estrutura dos Dados

### Tabela: `events`

Armazena TODOS os eventos:

```sql
events
├── id: UUID (Primary Key)
├── experiment_id: UUID → experiments(id)
├── variant_id: UUID → variants(id)
├── visitor_id: TEXT (Identificador único persistente)
├── event_name: TEXT ('page_view', 'button_click', etc.)
├── event_type: TEXT ('page_view', 'click', 'conversion', 'custom', 'assignment')
├── event_data: JSONB (Todos os dados do evento)
│   ├── url: 'https://...'
│   ├── title: 'Página Produto'
│   ├── referrer: 'https://google.com'
│   ├── viewport: { width: 1920, height: 1080 }
│   ├── variant: 'Variante B'
│   ├── device_type: 'desktop'
│   ├── browser: 'Chrome'
│   └── ... (qualquer dado adicional)
├── utm_data: JSONB (Parâmetros UTM)
│   ├── utm_source: 'google'
│   ├── utm_medium: 'cpc'
│   ├── utm_campaign: 'black_friday'
│   ├── utm_term: 'teste ab'
│   └── utm_content: 'banner_principal'
├── value: DECIMAL(10,2) (Valor monetário para conversões)
└── created_at: TIMESTAMPTZ (Data/hora do evento)
```

---

### Tabela: `variant_stats`

Armazena estatísticas agregadas:

```sql
variant_stats
├── id: UUID (Primary Key)
├── experiment_id: UUID
├── variant_id: UUID
├── visitors: INTEGER (Visitantes únicos)
├── conversions: INTEGER (Total de conversões)
├── revenue: DECIMAL(12,2) (Receita total)
└── last_updated: TIMESTAMPTZ

UNIQUE (experiment_id, variant_id)
```

**Exemplo:**

| experiment_id | variant_id | visitors | conversions | revenue | last_updated |
|---------------|------------|----------|-------------|---------|-------------|
| ffcd8e69... | 9dacb4a7... (Control) | 1,234 | 89 | 8,910.10 | 2025-11-03 |
| ffcd8e69... | a2bc3d4e... (Variante B) | 1,189 | 127 | 12,703.00 | 2025-11-03 |

**Conversion Rate:** Variante B = 127/1,189 = **10.68%** vs Control = 89/1,234 = **7.21%**

---

## 📈 Analytics e Identificação

### Como os Eventos São Identificados no Dashboard?

#### 1. **Por `event_type`**

A aba "Eventos" filtra por tipo:

```typescript
// Filtrar todos os page_views
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('event_type', 'page_view')

// Filtrar conversões
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('event_type', 'conversion')
```

---

#### 2. **Por Experimento**

```typescript
// Eventos de um experimento específico
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('experiment_id', 'ffcd8e69-...')
```

---

#### 3. **Por Visitor (Jornada Individual)**

```typescript
// Todos os eventos de um visitante (jornada completa)
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('visitor_id', 'rf_d7rlckqay_mh9j8wxm')
  .order('created_at', { ascending: true })

// Resultado: Sequência cronológica de eventos
// [assignment → page_view → click → page_view → conversion]
```

---

#### 4. **Por UTM (Análise de Campanhas)**

```typescript
// Eventos de uma campanha específica
const { data } = await supabase
  .from('events')
  .select('*')
  .eq("utm_data->>'utm_campaign'", 'black_friday_2024')
```

---

#### 5. **Por Período**

```typescript
// Eventos das últimas 24 horas
const { data } = await supabase
  .from('events')
  .select('*')
  .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
  .order('created_at', { ascending: false })
```

---

## 🎨 Visualizações no Dashboard

### 1. **Tabela de Eventos** (`src/app/dashboard/events/page.tsx`)

Mostra lista cronológica de eventos com:
- Tipo do evento (badge colorido)
- Visitor ID
- Variante associada
- Dados do evento (url, título)
- UTM parameters
- Timestamp

---

### 2. **Análise UTM** (`src/components/dashboard/utm-analysis-table.tsx`)

Agrupa eventos por campanha UTM e calcula:

```sql
SELECT
  COALESCE(utm_data->>'utm_source', 'Direct') as source,
  COALESCE(utm_data->>'utm_medium', 'None') as medium,
  COALESCE(utm_data->>'utm_campaign', 'No Campaign') as campaign,

  COUNT(DISTINCT visitor_id) as visitors,
  COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
  COUNT(*) FILTER (WHERE event_type = 'click') as clicks,
  COUNT(*) FILTER (WHERE event_type = 'conversion') as conversions,
  SUM(value) FILTER (WHERE event_type = 'conversion') as revenue,

  -- CTR = (clicks / page_views) * 100
  ROUND((COUNT(*) FILTER (WHERE event_type = 'click')::numeric /
         NULLIF(COUNT(*) FILTER (WHERE event_type = 'page_view'), 0) * 100), 2) as ctr,

  -- Conversion Rate = (conversions / visitors) * 100
  ROUND((COUNT(*) FILTER (WHERE event_type = 'conversion')::numeric /
         NULLIF(COUNT(DISTINCT visitor_id), 0) * 100), 2) as conversion_rate,

  -- CPA = revenue / conversions
  ROUND((SUM(value) FILTER (WHERE event_type = 'conversion') /
         NULLIF(COUNT(*) FILTER (WHERE event_type = 'conversion'), 0)), 2) as avg_order_value

FROM events
WHERE experiment_id = 'ffcd8e69-...'
GROUP BY source, medium, campaign
ORDER BY revenue DESC NULLS LAST;
```

---

### 3. **Gráfico de Tendências** (`src/components/dashboard/event-trends-chart.tsx`)

Agrupa eventos por dia:

```sql
SELECT
  DATE_TRUNC('day', created_at) as date,
  event_type,
  COUNT(*) as count
FROM events
WHERE experiment_id = 'ffcd8e69-...'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY date, event_type
ORDER BY date ASC;
```

---

### 4. **Análise de Jornada** (`src/components/dashboard/event-path-analysis.tsx`)

Sequência mais comum de eventos:

```sql
WITH visitor_journeys AS (
  SELECT
    visitor_id,
    ARRAY_AGG(event_type ORDER BY created_at) as journey
  FROM events
  WHERE experiment_id = 'ffcd8e69-...'
  GROUP BY visitor_id
)
SELECT
  journey,
  COUNT(*) as frequency,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM visitor_journeys) * 100, 2) as percentage
FROM visitor_journeys
GROUP BY journey
ORDER BY frequency DESC
LIMIT 10;
```

**Resultado Exemplo:**

| Journey | Frequency | Percentage |
|---------|-----------|------------|
| [assignment, page_view, conversion] | 127 | 10.68% |
| [assignment, page_view, click, page_view, conversion] | 89 | 7.49% |
| [assignment, page_view] | 856 | 72.03% |

---

## 🔍 Resumo: Como Tudo Se Conecta

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRIAÇÃO DO EXPERIMENTO                       │
│  • Define tipo de conversão (URL, Seletor, Evento)              │
│  • Configura variantes (Redirect URLs, CSS, JS)                 │
│  • Gera código SDK otimizado                                     │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  SDK INSTALADO NO SITE                           │
│  1. Atribui variante ao visitor                                 │
│  2. Captura UTMs e persiste no localStorage                     │
│  3. Aplica mudanças (redirect ou CSS/JS)                        │
│  4. Rastreia page_views automaticamente                         │
│  5. Detecta conversões (URL, clique, evento custom)             │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     API /track RECEBE                            │
│  • Valida dados                                                  │
│  • Extrai UTMs para utm_data JSONB                              │
│  • Insere evento na tabela events                               │
│  • Se conversão: atualiza variant_stats                         │
│  • Cria/atualiza visitor_session                                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                 BANCO DE DADOS (PostgreSQL)                      │
│  • events: Armazena cada interação                              │
│  • variant_stats: Estatísticas agregadas em tempo real          │
│  • visitor_sessions: Dados de sessão com UTMs                   │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                 DASHBOARD DE ANALYTICS                           │
│  • Lista de eventos em tempo real                               │
│  • Análise UTM (campanhas, ROI, CPA)                            │
│  • Gráficos de tendências                                       │
│  • Análise de jornada (sequência de eventos)                    │
│  • Métricas de conversão por variante                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Compreensão

- [x] **Eventos são criados** pelo SDK JavaScript instalado no site do cliente
- [x] **event_type** identifica o tipo: `assignment`, `page_view`, `click`, `conversion`, `custom`
- [x] **Conversões** são detectadas automaticamente por URL, seletor CSS ou evento customizado
- [x] **Jornada** é mapeada pela sequência cronológica de eventos do mesmo visitor_id
- [x] **UTMs** são capturados no primeiro acesso e persistidos em todos os eventos
- [x] **Analytics** agrega eventos para calcular métricas (CTR, conversion rate, ROI, etc.)
- [x] **API /track** processa e armazena eventos no PostgreSQL
- [x] **event_data** (JSONB) armazena todos os dados flexíveis do evento
- [x] **utm_data** (JSONB) armazena parâmetros UTM separadamente

---

**Documento criado por:** Claude Code
**Data:** 03/11/2025
**Versão:** 1.0
**Status:** ✅ Completo

**Próximo Passo:** Ver exemplos práticos em `EXEMPLOS_PRATICOS_EVENTOS.md`
