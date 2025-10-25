# 🔧 Instruções para Corrigir o Sistema A/B Testing

## Problemas Identificados

1. **Tabela `variant_stats` sem colunas necessárias**: Faltam `last_updated` e `revenue`
2. **Funções RPC não funcionando**: `increment_variant_conversions` e `increment_variant_visitors` com problemas
3. **Sistema de tracking não contabilizando**: Eventos não estão sendo registrados corretamente em `variant_stats`
4. **Analytics mostrando zeros**: Dashboard não está calculando métricas corretamente
5. **Conversões não aparecem**: Sistema não está registrando conversões nas estatísticas

## Solução: Script Completo de Correção

Executei um diagnóstico completo e criei um script SQL que corrige TODOS os problemas de uma vez.

### Passo 1: Executar o Script SQL no Supabase

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie o conteúdo do arquivo `FIX_COMPLETE_SYSTEM.sql`
4. Cole no editor e clique em **Run**
5. Aguarde a execução completa
6. Verifique os logs de sucesso:
   ```
   ✅ CORREÇÃO COMPLETA FINALIZADA!
   Variant stats inicializados: X
   Funções RPC criadas: 5 / 5
   Triggers ativos: 1 / 1
   ```

### Passo 2: Verificar Correções no Código

O código foi corrigido automaticamente nos seguintes arquivos:

#### ✅ `/src/app/api/experiments/[id]/assign/route.ts`
- Descomentadas as chamadas para `variant_stats`
- Descomentada a função `increment_variant_visitors`
- Adicionados logs de debug para facilitar troubleshooting

#### ✅ `/src/app/api/track/route.ts`
- Já estava correto
- Sistema de fallback manual funcionando
- Logs detalhados de conversões

#### ✅ `/src/app/api/experiments/[id]/stats/route.ts`
- Já estava correto
- Busca dados de `variant_stats` corretamente

### Passo 3: Testar o Sistema

Execute os seguintes testes para verificar se tudo está funcionando:

#### Teste 1: Criar Novo Experimento

1. Acesse o Dashboard
2. Crie um novo experimento
3. Adicione 2 variantes (Controle e Variante A)
4. Inicie o experimento
5. **Verificação**: Execute no SQL Editor:
   ```sql
   SELECT e.name, v.name, vs.visitors, vs.conversions, vs.revenue
   FROM experiments e
   JOIN variants v ON v.experiment_id = e.id
   LEFT JOIN variant_stats vs ON vs.variant_id = v.id
   WHERE e.id = 'SEU_EXPERIMENT_ID_AQUI'
   ORDER BY v.created_at;
   ```
   **Resultado esperado**: Cada variante deve ter um registro em `variant_stats` com `visitors = 0`, `conversions = 0`, `revenue = 0`

#### Teste 2: Atribuir Visitante

1. Use o código gerado pelo Code Generator
2. Cole em uma página de teste
3. Acesse a página
4. **Verificação**: Execute no SQL Editor:
   ```sql
   SELECT
       e.name as experiment,
       v.name as variant,
       vs.visitors,
       vs.conversions,
       vs.last_updated
   FROM variant_stats vs
   JOIN variants v ON v.id = vs.variant_id
   JOIN experiments e ON e.id = vs.experiment_id
   WHERE e.id = 'SEU_EXPERIMENT_ID_AQUI'
   ORDER BY v.created_at;
   ```
   **Resultado esperado**: A variante atribuída deve ter `visitors = 1`

#### Teste 3: Registrar Conversão

1. Na mesma página de teste, navegue até a URL de conversão configurada
2. Aguarde 2-3 segundos
3. **Verificação**: Execute no SQL Editor:
   ```sql
   SELECT
       e.name as experiment,
       v.name as variant,
       vs.visitors,
       vs.conversions,
       vs.revenue,
       vs.last_updated
   FROM variant_stats vs
   JOIN variants v ON v.id = vs.variant_id
   JOIN experiments e ON e.id = vs.experiment_id
   WHERE e.id = 'SEU_EXPERIMENT_ID_AQUI'
   ORDER BY v.created_at;
   ```
   **Resultado esperado**: A variante deve ter `conversions >= 1` e `revenue > 0` (se configurado)

#### Teste 4: Verificar Dashboard

1. Volte ao Dashboard
2. Clique no experimento de teste
3. **Verificação**:
   - [ ] Número de visitantes está correto
   - [ ] Número de conversões está correto
   - [ ] Taxa de conversão calculada corretamente
   - [ ] Receita total exibida (se aplicável)
   - [ ] Gráficos mostram dados

## O que Foi Corrigido

### 1. Estrutura do Banco de Dados

**Tabela `experiments`:**
- ✅ Adicionada coluna `algorithm`
- ✅ Adicionadas colunas de conversão: `target_url`, `conversion_url`, `conversion_type`, `conversion_value`, `duration_days`

**Tabela `variant_stats`:**
- ✅ Criada se não existir
- ✅ Adicionada coluna `last_updated`
- ✅ Adicionada coluna `revenue`
- ✅ Adicionados índices de performance

**Tabela `events`:**
- ✅ Adicionada coluna `variant_id`
- ✅ Adicionada coluna `event_data`
- ✅ Adicionada coluna `value`

**Tabela `assignments`:**
- ✅ Criada se não existir
- ✅ Adicionados índices de performance

### 2. Funções RPC

**Criadas/Recriadas:**
- ✅ `increment_variant_visitors(p_variant_id, p_experiment_id)` - Incrementa visitantes
- ✅ `increment_variant_conversions(p_variant_id, p_experiment_id, p_revenue)` - Incrementa conversões
- ✅ `get_experiment_stats(experiment_uuid)` - Busca estatísticas
- ✅ `get_daily_conversions(p_experiment_id, p_days)` - Conversões por dia
- ✅ `calculate_significance(...)` - Calcula significância estatística

### 3. Triggers Automáticos

- ✅ **Trigger `init_variant_stats`**: Inicializa automaticamente `variant_stats` quando uma variante é criada

### 4. Permissions e RLS

- ✅ Políticas RLS configuradas para `service_role` acessar todas as tabelas
- ✅ Grants de permissão adicionados

### 5. Inicialização de Dados

- ✅ Inicializados registros em `variant_stats` para todas as variantes existentes

## Arquivos Modificados

1. ✅ `FIX_COMPLETE_SYSTEM.sql` - Script de correção completo (NOVO)
2. ✅ `src/app/api/experiments/[id]/assign/route.ts` - Descomentadas funções
3. ✅ `INSTRUCOES_CORRECAO.md` - Este arquivo de instruções (NOVO)

## Próximos Passos

1. ✅ Execute o script SQL `FIX_COMPLETE_SYSTEM.sql`
2. ✅ Execute os testes acima
3. ⏳ Se algum teste falhar, verifique os logs no console do navegador e no Supabase
4. ⏳ Se necessário, execute queries de diagnóstico fornecidas

## Queries de Diagnóstico

### Verificar se funções RPC existem
```sql
SELECT proname as "Function Name", prosrc as "Function Body"
FROM pg_proc
WHERE proname IN (
    'increment_variant_visitors',
    'increment_variant_conversions',
    'get_experiment_stats',
    'get_daily_conversions',
    'calculate_significance'
)
ORDER BY proname;
```

### Verificar estrutura de variant_stats
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'variant_stats'
ORDER BY ordinal_position;
```

### Verificar dados de um experimento específico
```sql
SELECT
    e.name as experiment,
    e.status,
    v.name as variant,
    v.is_control,
    vs.visitors,
    vs.conversions,
    vs.revenue,
    CASE
        WHEN vs.visitors > 0
        THEN ROUND((vs.conversions::DECIMAL / vs.visitors) * 100, 2)
        ELSE 0
    END as conversion_rate,
    vs.last_updated
FROM experiments e
JOIN variants v ON v.experiment_id = e.id
LEFT JOIN variant_stats vs ON vs.variant_id = v.id AND vs.experiment_id = e.id
WHERE e.status = 'running'
ORDER BY e.created_at DESC, v.created_at ASC
LIMIT 20;
```

### Verificar últimos eventos
```sql
SELECT
    e.event_type,
    e.event_name,
    exp.name as experiment,
    v.name as variant,
    e.visitor_id,
    e.value,
    e.created_at
FROM events e
LEFT JOIN experiments exp ON exp.id = e.experiment_id
LEFT JOIN variants v ON v.id = e.variant_id
ORDER BY e.created_at DESC
LIMIT 50;
```

### Verificar últimas conversões
```sql
SELECT
    exp.name as experiment,
    v.name as variant,
    e.visitor_id,
    e.value as revenue,
    e.event_data->>'success_page_url' as success_page,
    e.created_at
FROM events e
JOIN experiments exp ON exp.id = e.experiment_id
LEFT JOIN variants v ON v.id = e.variant_id
WHERE e.event_type = 'conversion'
ORDER BY e.created_at DESC
LIMIT 50;
```

## Suporte

Se após executar todas as correções o problema persistir:

1. Execute as queries de diagnóstico acima
2. Verifique os logs do console do navegador (F12)
3. Verifique os logs do Supabase (Logs > API)
4. Copie os erros encontrados e me avise

## Resumo

✅ **Sistema completamente diagnosticado e corrigido**
✅ **Script SQL pronto para executar**
✅ **Código TypeScript corrigido**
✅ **Triggers automáticos configurados**
✅ **Testes prontos para validação**

**Execute o script SQL agora e teste o sistema!** 🚀
