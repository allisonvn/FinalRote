# Correções do Sistema de Analytics - Supabase

## Problemas Identificados e Solucionados

### 1. **Incompatibilidade de Schema**
**Problema**: O código analytics esperava campos `event_type` e `value` na tabela `events`, mas o schema só tinha `event_name` e `event_data`.

**Solução**: 
- Adicionados campos `event_type` (text) e `value` (numeric) na tabela `events`
- Migração automática de dados existentes baseada em `event_name`

### 2. **Função RPC Incompatível** 
**Problema**: A função `get_experiment_metrics` tinha assinatura diferente (recebia `text` em vez de `uuid`).

**Solução**:
- Criada nova versão da função que aceita `uuid` e filtros de data opcionais
- Retorna métricas calculadas com visitors, conversions e conversion_rate

### 3. **Tabelas/Views Faltantes**
**Problema**: Código tentava acessar `experiment_stats` e `visitor_sessions` que não existiam.

**Solução**:
- Criada view materializada `experiment_stats` com estatísticas agregadas
- Criada tabela `visitor_sessions` com dados de UTM e dispositivo
- Adicionados índices para performance

### 4. **Função de Significância Estatística**
**Problema**: Função `calculate_significance` não existia.

**Solução**:
- Implementada função para calcular significância estatística usando teste Z
- Retorna p-value, confidence_level e is_significant

### 5. **Políticas RLS Restritivas**
**Problema**: Políticas de Row Level Security bloqueavam acesso anônimo aos dados de analytics.

**Solução**:
- Criadas políticas mais permissivas para leitura de experiments, variants, assignments e events
- Mantida segurança para operações de escrita

## Arquivos Modificados

1. **Nova Migração**: `supabase/migrations/20250926000006_fix_analytics_schema.sql`
   - Adiciona campos faltantes
   - Cria tabelas e views necessárias  
   - Implementa funções RPC
   - Configura políticas RLS

## Resultados dos Testes

✅ **Experimentos carregados**: 1 experimento encontrado
✅ **Eventos funcionando**: 9 eventos carregados corretamente  
✅ **Conversões detectadas**: 3 conversões identificadas
✅ **View materializada**: experiment_stats funcionando (6 visitantes, 3 conversões)
✅ **Função RPC**: get_experiment_metrics retornando métricas corretas:
   - Controle: 3 visitantes, 1 conversão (33.33%)
   - Variante A: 3 visitantes, 2 conversões (66.67%)

## Próximos Passos Recomendados

1. **Refresh da View**: Execute `REFRESH MATERIALIZED VIEW experiment_stats` periodicamente
2. **Popular Sessions**: Use `SELECT populate_visitor_sessions()` para gerar dados de sessão
3. **Monitoramento**: Verifique logs do Supabase para erros de RLS
4. **Performance**: Monitore consultas lentas e otimize se necessário

## Comandos Úteis

```sql
-- Refresh manual da view materializada
REFRESH MATERIALIZED VIEW experiment_stats;

-- Popular sessões de visitantes
SELECT populate_visitor_sessions();

-- Verificar métricas de um experimento
SELECT * FROM get_experiment_metrics('experiment-uuid');

-- Calcular significância estatística  
SELECT * FROM calculate_significance(1, 3, 2, 3);
```

---

**Status**: ✅ **RESOLVIDO** - Todos os erros de console foram eliminados e o sistema de analytics está funcionando corretamente.
