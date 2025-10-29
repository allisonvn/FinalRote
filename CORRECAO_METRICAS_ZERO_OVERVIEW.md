# 🔧 Correção: Métricas Zeradas na Overview

## Problema Identificado

A aba "Overview" (Métricas Principais) está mostrando valores zerados (0) mesmo quando há dados reais no Supabase.

## Causa Raiz

O componente `OverviewRedesigned` está buscando dados da tabela `variant_stats`:

```typescript
const { data: allStats } = await supabase
  .from('variant_stats')
  .select('visitors, conversions, revenue, last_updated')
```

Essa tabela pode estar:
- Vazia
- Desatualizada
- Não populada corretamente

## Solução

Refatorar para buscar dados diretamente de `assignments` e `events`, assim como foi feito na aba Relatórios.

### Mudanças Necessárias em `overview-redesigned.tsx`:

```typescript
// Substituir essa parte:
const { data: allStats } = await supabase
  .from('variant_stats')
  .select('visitors, conversions, revenue, last_updated')

// Por:
const { data: currentAssignments } = await supabase
  .from('assignments')
  .select('visitor_id, created_at')
  .gte('created_at', currentStart.toISOString())

const { data: currentEvents } = await supabase
  .from('events')
  .select('visitor_id, event_type, value, created_at')
  .gte('created_atdry currentStart.toISOString())

// Calcular visitantes únicos:
const currentVisitors = new Set(currentAssignments?.map(a => a.visitor_id) || []).size

// Calcular conversões:
const currentConversionsCount = currentEvents?.filter(e => e.event_type === 'conversion').length || 0

// Calcular receita:
const currentRevenue = currentEvents?.filter(e => e.event_type === 'conversion').reduce((sum, e) => sum + (e.value || 0), 0) || 0
```

## Cards Afetados

1. **Receita Total** - Mostra R$ 0,00
2. **Conversões** - Mostra 0
3. **Taxa de Conversão** - Mostra 0%
4. **Visitantes** - Mostra 0

## Status

- ❌ Problema identificado
- ⏳ Aguardando correção
- 📝 Solução documentada

## Como Aplicar a Correção

1. Abrir `src/components/dashboard/overview-redesigned.tsx`
2. Localizar função `loadStats()` (linha ~79)
3. Substituir busca de `variant_stats` por busca direta de `assignments` e `events`
4. Testar abrindo a aba Overview

