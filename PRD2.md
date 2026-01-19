# PRD2 - Correções Dashboard: Experimentos e Relatórios

## Visão Geral

Este documento detalha todas as correções necessárias nas abas "Experimentos" e "Relatórios" do dashboard para garantir que os dados exibidos sejam reais e que todas as funcionalidades operem corretamente.

---

## PARTE 1: Aba "Experimentos"

### Arquivos Envolvidos

| Arquivo | Função |
|---------|--------|
| `src/app/dashboard/experiments/professional-page.tsx` | Página principal de experimentos |
| `src/components/dashboard/experiment-details-modal.tsx` | Modal de detalhes do experimento |
| `src/lib/experiment-metrics.ts` | Funções de cálculo de métricas |
| `src/lib/statistics.ts` | Funções estatísticas (existente, não utilizado) |

---

### Correção 1.1: Remover Dados Mock do Modal de Eventos

**Arquivo:** `src/components/dashboard/experiment-details-modal.tsx`
**Linhas:** 232-261

**Problema:** Quando a busca de eventos falha, o sistema exibe dados fake.

**Código Atual:**
```javascript
} catch (error) {
  // Fallback para dados mock
  setEvents([
    { id: '1', event_type: 'page_view', event_name: 'landing_view', ... },
    { id: '2', event_type: 'click', event_name: 'cta_click', ... },
    { id: '3', event_type: 'conversion', event_name: 'purchase', ... }
  ])
}
```

**Solução:**
```javascript
} catch (error) {
  console.error('Erro ao buscar eventos:', error)
  setEvents([])
  // Mostrar mensagem ao usuário informando que não há dados disponíveis
}
```

---

### Correção 1.2: Calcular Melhoria Comparando Variantes Reais

**Arquivo:** `src/app/dashboard/experiments/professional-page.tsx`
**Linhas:** 97, 133

**Problema:** O cálculo de "improvement" usa baseline fixo de 3%.

**Código Atual:**
```javascript
const baseline = 3.0 // Valor hardcoded
const improvement = conversionRate > 0 ? ((conversionRate - baseline) / baseline) * 100 : 0
```

**Solução:**
- Buscar a taxa de conversão do **controle** do experimento
- Calcular improvement comparando **variante vs controle**

```javascript
// Buscar taxa do controle
const controlVariant = variants.find(v => v.is_control)
const controlRate = controlVariant ? calculateConversionRate(controlVariant) : 0

// Calcular improvement real
const improvement = controlRate > 0
  ? ((variantConversionRate - controlRate) / controlRate) * 100
  : 0
```

**Arquivo adicional:** `src/lib/experiment-metrics.ts` (linhas 35-36, 92-93)
Aplicar mesma correção.

---

### Correção 1.3: Usar Cálculo Estatístico Real de Confiança

**Arquivo:** `src/app/dashboard/experiments/professional-page.tsx`
**Linhas:** 105-106

**Problema:** Confiança retorna valores arbitrários (95% ou 75%).

**Código Atual:**
```javascript
confidence: conversionRate > baseline ? 95 : 75
```

**Solução:** Usar a biblioteca `@/lib/statistics.ts` existente:

```javascript
import { analyzeExperiment } from '@/lib/statistics'

// Dentro da função de cálculo:
const analysis = analyzeExperiment(
  controlVisitors,
  controlConversions,
  variantVisitors,
  variantConversions,
  0.95 // nível de confiança desejado
)

const confidence = analysis.significance
const isSignificant = analysis.isSignificant
```

**Arquivo adicional:** `src/lib/experiment-metrics.ts` (linhas 115-133)
Substituir `calculateConfidence()` para usar `@/lib/statistics.ts`.

---

### Correção 1.4: Usar Receita Real dos Eventos

**Arquivo:** `src/lib/experiment-metrics.ts`
**Linhas:** 32-33, 85-86

**Problema:** Receita calculada com valor fixo de R$150.

**Código Atual:**
```javascript
const avgOrderValue = 150 // R$ por conversão (hardcoded)
const revenue = totalConversions * avgOrderValue
```

**Solução:**
```javascript
// Buscar valor real dos eventos de conversão
const { data: conversionEvents } = await supabase
  .from('events')
  .select('value')
  .eq('experiment_id', experimentId)
  .eq('event_type', 'conversion')

const revenue = conversionEvents?.reduce((sum, e) => sum + (e.value || 0), 0) || 0
```

---

### Correção 1.5: Implementar Handlers dos Botões de Ação no Modal

**Arquivo:** `src/components/dashboard/experiment-details-modal.tsx`
**Linhas:** 1336-1370

**Problema:** Botões "Iniciar", "Pausar" e "Finalizar" não têm funcionalidade.

**Solução:** Adicionar handlers que chamam a API existente:

```javascript
const handleStartExperiment = async () => {
  const response = await fetch(`/api/experiments/${experiment.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'running' })
  })
  if (response.ok) {
    onClose()
    // Refresh data
  }
}

const handlePauseExperiment = async () => {
  // Similar, com status: 'paused'
}

const handleCompleteExperiment = async () => {
  // Similar, com status: 'completed'
}
```

---

### Correção 1.6: Remover Descrição Default Fake

**Arquivo:** `src/app/dashboard/experiments/professional-page.tsx`
**Linha:** 872

**Problema:** Mostra texto genérico como se fosse descrição real.

**Código Atual:**
```javascript
{experiment.description || 'Experimento A/B para otimização de conversões em tempo real.'}
```

**Solução:**
```javascript
{experiment.description || 'Sem descrição'}
```

---

## PARTE 2: Aba "Relatórios" (Analytics)

### Arquivos Envolvidos

| Arquivo | Função |
|---------|--------|
| `src/components/dashboard/charts-section.tsx` | Componente principal de relatórios |
| `src/lib/analytics.ts` | Funções de busca de dados analíticos |
| `src/lib/statistics.ts` | Funções estatísticas (existente, não utilizado) |

---

### Correção 2.1: Calcular Badge de Lift Dinamicamente

**Arquivo:** `src/components/dashboard/charts-section.tsx`
**Linhas:** 500-502

**Problema:** Valor "+31.5% lift" está hardcoded.

**Código Atual:**
```javascript
<Badge className="...">
  <ArrowUp className="h-5 w-5 mr-2" />
  +31.5% lift
</Badge>
```

**Solução:**
```javascript
// Calcular lift médio dos dados reais
const avgLift = filteredMetrics.length > 0
  ? filteredMetrics.reduce((acc, exp) => acc + (exp.improvement || 0), 0) / filteredMetrics.length
  : 0

<Badge className="...">
  {avgLift >= 0 ? <ArrowUp /> : <ArrowDown />}
  {avgLift >= 0 ? '+' : ''}{avgLift.toFixed(1)}% lift
</Badge>
```

---

### Correção 2.2: Implementar Comparação Real com Período Anterior

**Arquivo:** `src/components/dashboard/charts-section.tsx`
**Linhas:** 230-246

**Problema:** Comparações usam multiplicadores arbitrários (0.85, 0.92, 0.88).

**Código Atual:**
```javascript
const previousPeriodImprovement = ... * 0.85
const estimatedPreviousVisitors = totalVisitors * 0.92
const estimatedPreviousRevenue = totalRevenueExtra * 0.88
```

**Solução:**

1. Criar função em `src/lib/analytics.ts`:
```javascript
export async function getPreviousPeriodMetrics(
  range: '7d' | '30d' | '90d',
  experimentId?: string
) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const endDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

  // Buscar dados do período anterior
  // ...
}
```

2. Usar no componente para comparação real.

---

### Correção 2.3: Remover Boost Artificial nas Taxas de Variantes

**Arquivo:** `src/lib/analytics.ts`
**Linhas:** 652-654

**Problema:** Taxas de variantes têm boost hardcoded (20% e 35%).

**Código Atual:**
```javascript
variant_a_rate: ... * 1200 / 10,  // 20% boost
variant_b_rate: ... * 1350 / 10,  // 35% boost
```

**Solução:**
```javascript
variant_a_rate: variantAVisitors > 0
  ? Math.round((stats.variantARate / variantAVisitors) * 1000) / 10
  : 0,
variant_b_rate: variantBVisitors > 0
  ? Math.round((stats.variantBRate / variantBVisitors) * 1000) / 10
  : 0,
```

---

### Correção 2.4: Remover ou Sinalizar Dados Mock de Campanhas

**Arquivo:** `src/lib/analytics.ts`
**Linhas:** 740-800

**Problema:** Retorna dados fake quando não há sessões reais.

**Opção A - Remover mock:**
```javascript
if (!sessions || sessions.length === 0) {
  return []
}
```

**Opção B - Sinalizar claramente:**
```javascript
if (!sessions || sessions.length === 0) {
  return [{
    ...mockData,
    _isDemo: true  // Flag para UI exibir como "dados de demonstração"
  }]
}
```

---

### Correção 2.5: Remover ou Sinalizar Dados Mock de Audiências

**Arquivo:** `src/lib/analytics.ts`
**Linhas:** 931-984

**Problema:** Retorna segmentos fake quando não há sessões reais.

**Solução:** Mesma abordagem da correção 2.4.

---

### Correção 2.6: Remover Valores Hardcoded nas Métricas

**Arquivo:** `src/lib/analytics.ts`
**Linhas:** 177-180

**Problema:** Valores fixos para receita, duração de sessão e bounce rate.

**Código Atual:**
```javascript
totalRevenue: totalConversions * 50,
avgSessionDuration: 240,
bounceRate: 45
```

**Solução:**
```javascript
// Buscar receita real
const { data: revenueData } = await supabase
  .from('events')
  .select('value')
  .eq('event_type', 'conversion')
  .gte('created_at', sinceDate)

const totalRevenue = revenueData?.reduce((sum, e) => sum + (e.value || 0), 0) || 0

// Buscar duração média de sessões
const { data: sessions } = await supabase
  .from('visitor_sessions')
  .select('started_at, ended_at')
  .gte('started_at', sinceDate)

const avgSessionDuration = calculateAvgDuration(sessions)

// Calcular bounce rate real
const bounceRate = calculateBounceRate(sessions)
```

---

### Correção 2.7: Implementar Funcionalidade do Botão "Aplicar"

**Arquivo:** `src/components/dashboard/charts-section.tsx`
**Linhas:** 349-352

**Problema:** Botão "Aplicar" não tem função (filtros já atualizam via onChange).

**Solução A - Remover botão:**
O botão é desnecessário pois os filtros já atualizam automaticamente.

**Solução B - Adicionar refresh manual:**
```javascript
<Button
  size="sm"
  onClick={() => setRefreshTrigger(prev => prev + 1)}
>
  <RefreshCw className="w-5 h-5 mr-2" />
  Atualizar
</Button>
```

---

### Correção 2.8: Implementar Busca Funcional na Tabela

**Arquivo:** `src/components/dashboard/charts-section.tsx`
**Linhas:** 675-679, 703

**Problema:** Input de busca não filtra a tabela.

**Solução:**
```javascript
// Filtrar métricas baseado na busca
const displayedMetrics = experimentMetrics.filter(exp =>
  filterSearch === '' ||
  exp.name.toLowerCase().includes(filterSearch.toLowerCase())
)

// Na tabela, usar displayedMetrics ao invés de experimentMetrics
{displayedMetrics.map((exp, index) => (
  // ...
))}
```

---

### Correção 2.9: Implementar ou Remover Botão "Filtrar"

**Arquivo:** `src/components/dashboard/charts-section.tsx`
**Linhas:** 681-684

**Problema:** Botão "Filtrar" não tem funcionalidade.

**Solução:** Remover o botão ou implementar modal de filtros avançados.

---

### Correção 2.10: Usar Funções RPC do Banco de Dados

**Arquivo:** `src/lib/analytics.ts`

**Problema:** Não utiliza funções RPC otimizadas existentes no banco.

**Funções disponíveis no Supabase:**
- `get_experiment_stats(experiment_id)` - Estatísticas agregadas
- `get_experiment_stats_simple(experiment_id)` - Estatísticas em JSON
- `get_experiment_metrics(experiment_id)` - Métricas completas

**Solução:** Adicionar função que usa RPC:
```javascript
export async function getExperimentStatsFromRPC(experimentId?: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .rpc('get_experiment_stats', {
      p_experiment_id: experimentId || null
    })

  if (error) {
    console.error('Erro RPC:', error)
    return []
  }

  return data
}
```

---

### Correção 2.11: Usar Biblioteca de Estatísticas Existente

**Arquivo:** `src/lib/analytics.ts`
**Linhas:** 294-307 (cálculo de significância)

**Problema:** Cálculo de significância simplificado, não usa biblioteca existente.

**Solução:**
```javascript
import { analyzeExperiment } from './statistics'

// Substituir cálculo manual por:
const analysis = analyzeExperiment(
  controlVisitors,
  controlConversions,
  variantVisitors,
  variantConversions
)

return {
  ...
  significance: analysis.significance,
  pValue: analysis.pValue,
  isSignificant: analysis.isSignificant
}
```

---

## PARTE 3: Verificações de Infraestrutura

### 3.1: Verificar se Tabela `visitor_sessions` Existe e Está Populada

**Ação:** Verificar no Supabase se a tabela existe e tem dados.

**Arquivo de migração:** `supabase/migrations/20260117000000_add_visitor_sessions_fields.sql`

**Se não existir ou estiver vazia:**
- Funções de device breakdown não funcionarão
- Dados de campanhas UTM serão mock
- Segmentos de audiência serão mock

---

### 3.2: Verificar se Tabela `variant_stats` Está Sendo Populada

**Ação:** Verificar se as Edge Functions estão atualizando `variant_stats`.

**Arquivos relacionados:**
- `supabase/functions/assign-variant/index.ts`
- `supabase/functions/track-event/index.ts`

---

## Resumo de Prioridades

### Alta Prioridade (Dados Incorretos)
1. [1.2] Cálculo de melhoria com baseline real
2. [1.3] Cálculo de confiança estatística real
3. [2.3] Remover boost artificial nas variantes
4. [2.6] Remover valores hardcoded

### Média Prioridade (Funcionalidades Quebradas)
5. [1.5] Botões de ação no modal
6. [2.8] Busca funcional na tabela
7. [2.1] Badge de lift dinâmico
8. [2.2] Comparação com período anterior

### Baixa Prioridade (Melhorias)
9. [1.1] Remover mock de eventos
10. [2.4] Remover/sinalizar mock de campanhas
11. [2.5] Remover/sinalizar mock de audiências
12. [2.7] Botão Aplicar
13. [2.9] Botão Filtrar
14. [2.10] Usar funções RPC
15. [2.11] Usar biblioteca de estatísticas

---

## Arquivos a Modificar (Resumo)

| Arquivo | Correções |
|---------|-----------|
| `src/app/dashboard/experiments/professional-page.tsx` | 1.2, 1.3, 1.6 |
| `src/components/dashboard/experiment-details-modal.tsx` | 1.1, 1.5 |
| `src/lib/experiment-metrics.ts` | 1.2, 1.3, 1.4 |
| `src/components/dashboard/charts-section.tsx` | 2.1, 2.2, 2.7, 2.8, 2.9 |
| `src/lib/analytics.ts` | 2.3, 2.4, 2.5, 2.6, 2.10, 2.11 |

---

## Dependências Entre Correções

```
[1.3] Confiança real ──depends on──> @/lib/statistics.ts (existente)
[2.11] Usar statistics ──depends on──> @/lib/statistics.ts (existente)
[2.10] Usar RPC ──depends on──> Migrações aplicadas no Supabase
[2.2] Período anterior ──depends on──> Nova função em analytics.ts
[2.4, 2.5] Dados mock ──depends on──> visitor_sessions populada
```
