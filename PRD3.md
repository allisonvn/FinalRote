# PRD3 - Aba de Eventos: Análise Completa

## Visão Geral

Este documento analisa a aba "Eventos" localizada em `/dashboard/events`, identificando o que funciona, o que não funciona, e o que precisa ser melhorado.

**Data da Análise:** 19/01/2026

---

## 1. O QUE NÃO FUNCIONA (BUGS CRÍTICOS)

### 1.1 Filtros de Device/Browser/Country INOPERANTES

**Localização:** `src/hooks/useEvents.ts:268-280` e `src/components/dashboard/advanced-event-filters.tsx:395-433`

**Problema:** A UI para filtrar por dispositivo, navegador e país existe e está visível para o usuário, mas os filtros **não são aplicados** nas queries do Supabase. O código está comentado:

```typescript
// Note: device_type, browser, os, country, city não existem como colunas diretas
// Eles estão dentro de event_data (JSONB). Filtros removidos até implementar queries JSONB
// if (filters.device) {
//   query = query.ilike('device_type', filters.device)
// }
```

**Impacto:** Usuário pensa que está filtrando por device/browser/country, mas nada acontece.

**Solução Necessária:**
- Implementar queries JSONB com `event_data->>'device_type'`
- OU adicionar colunas indexadas na tabela events

---

### 1.2 Filtros UTM Não Funcionam (Colunas Inexistentes)

**Localização:** `src/hooks/useEvents.ts:282-300`

**Problema:** O código tenta filtrar por `utm_source`, `utm_medium`, `utm_campaign` como se fossem colunas diretas da tabela:

```typescript
if (filters.utmSource) {
  query = query.ilike('utm_source', `%${filters.utmSource}%`)
}
```

Porém, conforme a migration `20240101000000_base_ab_testing_schema.sql:107`, a tabela só tem:

```sql
utm_data JSONB DEFAULT '{}'::jsonb,
```

**Impacto:** Erro silencioso ou resultados vazios ao filtrar por UTM.

**Solução Necessária:**
- Usar queries JSONB: `utm_data->>'utm_source'`
- OU criar colunas diretas + índices para performance

---

### 1.3 Dropdown de Experimentos Filtra Status Errado

**Localização:** `src/app/dashboard/events/page.tsx:73-76`

**Problema:** A query busca experimentos com `status: 'active'`:

```typescript
const { data, error } = await supabase
  .from('experiments')
  .select('id, name')
  .eq('status', 'active')  // ❌ STATUS INVÁLIDO
```

Mas o schema define status como: `'draft', 'running', 'paused', 'completed', 'archived'`

**Impacto:** Dropdown sempre vazio - nenhum experimento aparece para filtrar.

**Solução:** Mudar para `.eq('status', 'running')`

---

### 1.4 Filtro por Project ID Desabilitado

**Localização:** `src/hooks/useEvents.ts:219-228`

**Problema:** O filtro por `project_id` está completamente comentado:

```typescript
// NOTA: Temporariamente comentado para debug - pode estar causando erro vazio {}
// if (projectId) {
//   query = query.eq('project_id', projectId)
// }
```

**Impacto:** Sistema não segrega dados por projeto - usuário pode ver eventos de todos os projetos.

---

### 1.5 Erro Não Exibido para o Usuário

**Localização:** `src/hooks/useEvents.ts:459-472`

**Problema:** Quando ocorre erro na query, o código apenas loga no console:

```typescript
console.error('Failed to fetch events:', { ... })
```

Mas não exibe toast ou mensagem de erro para o usuário. A interface mostra "0 eventos" silenciosamente.

**Impacto:** Usuário não sabe que houve erro - pensa que não há dados.

**Solução:** Adicionar `toast.error()` ou estado de erro visível na UI.

---

## 2. O QUE FUNCIONA PARCIALMENTE

### 2.1 Toggle de Real-time

**Localização:** `src/app/dashboard/events/page.tsx:42` e `src/hooks/useEvents.ts:822-889`

**Status:** O estado existe e é passado para o hook, mas:
- Não há indicação visual de que real-time está ativo
- O toggle não está na UI (apenas no estado)
- A subscription funciona mas não há feedback

**Melhoria:** Adicionar switch visível + indicador de conexão ativa.

---

### 2.2 Sistema de Filtros Avançados

**Status:** Funciona para:
- Busca por texto (event_name, visitor_id)
- Tipo de evento (page_view, click, conversion, custom)
- Range de datas
- Experiment ID (com bug do status)
- Visitor ID específico
- Range de valores (min/max)

**Não funciona para:**
- Device
- Browser
- Country
- UTM Source/Medium/Campaign

---

### 2.3 Análise de UTM

**Localização:** `src/components/dashboard/utm-analysis-table.tsx`

**Status:** O componente processa eventos que **já têm** dados UTM, mas:
- Depende de campos que podem não existir (`event.utm_source`)
- Usa fallback para 'direct'/'none' quando não encontra
- Funciona apenas se o SDK capturou UTMs corretamente

---

## 3. O QUE FUNCIONA CORRETAMENTE

### 3.1 Listagem de Eventos
- Carrega eventos do Supabase
- Paginação com "Load More"
- Ordenação por data decrescente
- Loading state com skeleton

### 3.2 Gráfico de Tendências
- Mostra últimos 14 dias
- Distribuição por tipo de evento (pie chart)
- Cálculo de variação período-a-período
- Seleção de tipo de gráfico (área/linha/barra)

### 3.3 Cards de Estatísticas
- Total de eventos
- Page views
- Cliques
- Conversões
- Visitantes únicos

### 3.4 Filtros Salvos
- Salvar configuração de filtros
- Carregar filtros salvos
- LocalStorage persistente

### 3.5 Design Responsivo
- Layout mobile com cards
- Layout desktop com tabela completa
- Skeleton loaders

---

## 4. O QUE PRECISA SER FEITO

### 4.1 PRIORIDADE CRÍTICA (Bugs que quebram funcionalidade)

| # | Tarefa | Arquivo | Linha |
|---|--------|---------|-------|
| 1 | Corrigir status do experimento de 'active' para 'running' | `page.tsx` | 76 |
| 2 | Implementar filtros JSONB para device/browser/country | `useEvents.ts` | 268-280 |
| 3 | Implementar filtros JSONB para UTMs | `useEvents.ts` | 282-300 |
| 4 | Adicionar feedback de erro para o usuário | `useEvents.ts` | 459+ |
| 5 | Reativar filtro por project_id | `useEvents.ts` | 219-228 |

### 4.2 PRIORIDADE ALTA (Funcionalidade incompleta)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 6 | Adicionar toggle de real-time na UI | Criar switch visível para ativar/desativar |
| 7 | Indicador visual de real-time | Badge/LED pulsando quando conectado |
| 8 | Adicionar colunas UTM na tabela events | Migration para utm_source, utm_medium, utm_campaign |
| 9 | Adicionar índices para campos JSONB | Melhorar performance das queries |
| 10 | Exportar relatório CSV/PDF | Atualmente só tem JSON do evento individual |

### 4.3 PRIORIDADE MÉDIA (Melhorias)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 11 | CPA real em vez de estimado | Remover hardcode de R$0.50/impressão |
| 12 | Integração com custo real de ads | Permitir input de custo por campanha |
| 13 | Comparação entre períodos | Ex: "Esta semana vs semana passada" |
| 14 | Alertas de anomalias | Notificar quedas/picos incomuns |
| 15 | Filtros por horário do dia | "Eventos entre 18h e 22h" |

### 4.4 PRIORIDADE BAIXA (Nice to have)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 16 | Heatmap de horários | Visualização de picos por hora/dia |
| 17 | Funil customizável | Definir etapas do funil |
| 18 | Cohort analysis | Análise de coortes por período |
| 19 | Attribution modeling | Last-click, first-click, linear |
| 20 | Webhooks de alertas | Integrar com Slack/Discord |

---

## 5. INCONSISTÊNCIAS DE SCHEMA

### 5.1 Tabela Events - Campos Esperados vs Existentes

**Schema Atual (migration 20240101000000):**
```sql
CREATE TABLE public.events (
    id UUID PRIMARY KEY,
    project_id UUID,
    experiment_id UUID,
    variant_id UUID,
    visitor_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    properties JSONB DEFAULT '{}',
    value DECIMAL(12,2),
    utm_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ
);
```

**Campos que o código espera mas NÃO existem como colunas:**
- `utm_source` (está dentro de utm_data)
- `utm_medium` (está dentro de utm_data)
- `utm_campaign` (está dentro de utm_data)
- `utm_term` (está dentro de utm_data)
- `utm_content` (está dentro de utm_data)
- `device_type` (está dentro de event_data)
- `browser` (está dentro de event_data)
- `os` (está dentro de event_data)
- `country` (está dentro de event_data)
- `city` (está dentro de event_data)
- `session_id` (está dentro de event_data)
- `referrer` (está dentro de event_data)

### 5.2 Migration Recomendada

```sql
-- Adicionar colunas diretas para campos frequentemente filtrados
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_events_utm_source ON public.events(utm_source);
CREATE INDEX IF NOT EXISTS idx_events_utm_campaign ON public.events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_events_device_type ON public.events(device_type);
CREATE INDEX IF NOT EXISTS idx_events_country ON public.events(country);

-- Índice GIN para queries JSONB (alternativa)
CREATE INDEX IF NOT EXISTS idx_events_event_data_gin ON public.events USING GIN (event_data);
CREATE INDEX IF NOT EXISTS idx_events_utm_data_gin ON public.events USING GIN (utm_data);
```

---

## 6. RESUMO EXECUTIVO

| Categoria | Quantidade |
|-----------|------------|
| Bugs Críticos | 5 |
| Funcionalidades Parciais | 3 |
| Funcionalidades OK | 5 |
| Melhorias Necessárias | 15 |

### Status Geral: **60% Funcional**

A aba de Eventos tem uma UI bem construída e design profissional, mas **vários filtros não funcionam** devido a incompatibilidades entre o código frontend e o schema do banco de dados.

**Ação Imediata Requerida:**
1. Criar migration para adicionar colunas UTM
2. Corrigir filtro de experimentos (active → running)
3. Implementar queries JSONB ou adicionar colunas indexadas
4. Adicionar feedback de erro visual

---

## 7. ARQUIVOS RELEVANTES

| Arquivo | Descrição |
|---------|-----------|
| `src/app/dashboard/events/page.tsx` | Página principal |
| `src/hooks/useEvents.ts` | Hook de dados |
| `src/components/dashboard/advanced-event-filters.tsx` | Componente de filtros |
| `src/components/dashboard/utm-analysis-table.tsx` | Tabela de análise UTM |
| `src/components/dashboard/event-trends-chart.tsx` | Gráficos de tendência |
| `supabase/migrations/20240101000000_base_ab_testing_schema.sql` | Schema da tabela events |

---

*Documento gerado em 19/01/2026 - Análise técnica da aba de Eventos*
