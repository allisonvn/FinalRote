# Correção de Dados Reais na Aba Relatórios

## Problema Identificado
Os cards estavam mostrando R$0k de receita e 0.0k visitantes mesmo quando havia conversões e visitantes reais no banco de dados.

## Causa Raiz
A função `getExperimentMetrics()` estava buscando de `variant_stats` que pode estar vazio ou desatualizado. Quando `variant_stats` não tinha dados, a função retornava valores zerados sem fazer fallback para buscar dados reais das tabelas `assignments` e `events`.

## Correção Implementada

### 1. Removida Dependência de `variant_stats`
- A função agora **SEMPRE** busca dados direto de `assignments` e `events`
- Não depende mais de `variant_stats` estar preenchido

### 2. Busca Direta e Cálculo em Tempo Real
```typescript
// Buscar dados direto das tabelas assignments e events
const { data: assignments } = await supabase
  .from('assignments')
  .select('variant_id, visitor_id')
  .eq('experiment_id', exp.id)

const { data: events } = await supabase
  .from('events')
  .select('visitor_id, variant_id, event_type')
  .eq('experiment_id', exp.id)
```

### 3. Cálculo Completo de Métricas
Agora calcula todas as métricas em tempo real:

- **Visitantes**: Conta visitantes únicos de `assignments`
- **Conversões**: Conta eventos tipo `conversion` de `events`
- **Taxa de Conversão**: `(conversões / visitantes) * 100`
- **Uplift**: Compara taxa de variantes vs controle
- **Significância**: Teste Z estatístico

### 4. Logs de Debug
Adicionados logs para facilitar troubleshooting:
```typescript
console.log(`📊 Dados encontrados para ${exp.name}:`, {
  assignments: assignments?.length || 0,
  events: events?.length || 0
})
```

## Resultado

✅ **Todos os números são 100% reais** do Supabase
✅ **Receita Extra** mostra diferença entre variantes e controle
✅ **Visitantes** mostra visitantes únicos reais
✅ **Uplift** e **Significância** calculados com dados reais
✅ **Fallback garantido** - sempre busca dados mesmo se `variant_stats` estiver vazio

## Testando

Agora quando você acessar a aba Relatórios:
1. Se já teve conversões → Receita Extra será > R$0k
2. Se já teve visitantes → Visitantes será > 0.0k
3. Todos os cards mostrarão números reais
4. Botão "Atualizar" recarrega dados frescos
5. Botões Exportar CSV funcionam com dados reais

## Estrutura de Dados Utilizada

### Tabelas Supabase:
- `experiments` - Configurações
- `variants` - Variantes (identifica controle)
- `assignments` - Atribuições visitante→variante
- `events` - Eventos (conversões, etc)

### Fluxo de Cálculo:
```
assignments → Agrupar por variant_id
            → Contar visitantes únicos
            → Separar controle vs variantes

events → Filtrar por event_type='conversion'
       → Contar conversões por variante
       → Calcular taxa de conversão

Cálculos:
- Uplift: ((taxa_variante - taxa_controle) / taxa_controle) * 100
- Significância: Teste Z (pooled sample)
```

## Status
✅ **Build compilado com sucesso**
✅ **Sem erros de linting**
✅ **Dados 100% conectados ao Supabase**

