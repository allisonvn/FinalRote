# 🧪 Teste - Cards do Dashboard com Estatísticas

## ✅ O Que Foi Corrigido

### Problema
Os cards no dashboard mostravam valores **hardcoded** (fixos):
- Visitantes: 1.2k (sempre)
- Taxa Conv.: 3.4% (sempre)
- Uplift: +12% (sempre)

### Solução Implementada

1. **Componente `experiment-card.tsx`**:
   - ✅ Adicionados campos `total_visitors`, `total_conversions`, `conversion_rate` na interface
   - ✅ Valores dinâmicos vindos do banco de dados
   - ✅ Formatação brasileira de números (1.234 ao invés de 1234)

2. **Hook `useSupabaseExperiments.ts`**:
   - ✅ Busca estatísticas de `variant_stats` para cada experimento
   - ✅ Agrega totais (soma de todas as variantes)
   - ✅ Calcula taxa de conversão automaticamente
   - ✅ Retorna 0 se não houver dados (ao invés de valores vazios)

---

## 🧪 Como Testar

### Passo 1: Verificar Dados no Banco

Execute no Supabase SQL Editor:

```sql
-- Ver estatísticas de todos os experimentos
SELECT
    e.id,
    e.name,
    e.status,
    SUM(vs.visitors) as total_visitors,
    SUM(vs.conversions) as total_conversions,
    SUM(vs.revenue) as total_revenue,
    CASE
        WHEN SUM(vs.visitors) > 0
        THEN ROUND((SUM(vs.conversions)::DECIMAL / SUM(vs.visitors)) * 100, 2)
        ELSE 0
    END as conversion_rate
FROM experiments e
LEFT JOIN variant_stats vs ON vs.experiment_id = e.id
GROUP BY e.id, e.name, e.status
ORDER BY e.created_at DESC;
```

**Anote os valores** para comparar com o dashboard.

### Passo 2: Abrir o Dashboard

1. Acesse `http://localhost:3000/dashboard` (ou sua URL)
2. Aguarde carregar os experimentos
3. Abra o Console do navegador (F12) para ver logs

**Logs esperados**:
```
✅ Buscando variant_stats para experiment-id-123
✅ Stats encontradas: { visitors: 10, conversions: 2, revenue: 200 }
```

### Passo 3: Verificar Cards

Para cada experimento no dashboard, verifique se os cards mostram:

#### ✅ Card com Dados
- **Visitantes**: Número exato da query SQL (ex: 10)
- **Conversões**: Número exato da query SQL (ex: 2)
- **Taxa Conv.**: Calculada corretamente (ex: 20.00%)

#### ✅ Card sem Dados (experimento novo)
- **Visitantes**: 0
- **Conversões**: 0
- **Taxa Conv.**: 0%

### Passo 4: Teste Dinâmico - Adicionar Dados

Execute no Supabase SQL Editor:

```sql
-- 1. Escolher um experimento
SELECT id, name FROM experiments LIMIT 1;

-- 2. Escolher uma variante desse experimento
SELECT id, name FROM variants WHERE experiment_id = 'SEU_EXPERIMENT_ID' LIMIT 1;

-- 3. Incrementar visitantes manualmente
SELECT increment_variant_visitors(
    'SEU_VARIANT_ID'::uuid,
    'SEU_EXPERIMENT_ID'::uuid
);

-- 4. Incrementar conversões manualmente
SELECT increment_variant_conversions(
    'SEU_VARIANT_ID'::uuid,
    'SEU_EXPERIMENT_ID'::uuid,
    100.00
);

-- 5. Verificar se foi atualizado
SELECT * FROM variant_stats
WHERE experiment_id = 'SEU_EXPERIMENT_ID';
```

### Passo 5: Refresh Dashboard

1. Volte para o dashboard
2. Clique no botão de refresh (se houver) ou recarregue a página (F5)
3. Verifique se os números **mudaram** no card

**Resultado esperado**:
- ✅ Visitantes aumentou em +1
- ✅ Conversões aumentou em +1
- ✅ Taxa de conversão recalculada

---

## 📊 Exemplos de Validação

### Exemplo 1: Experimento com 10 visitantes e 2 conversões

**SQL Result**:
```
name              | total_visitors | total_conversions | conversion_rate
------------------|----------------|-------------------|----------------
Teste Homepage    |      10        |         2         |     20.00
```

**Card Dashboard deve mostrar**:
```
👥 Visitantes      📈 Conversões      📊 Taxa Conv.
    10                  2                20.00%
```

### Exemplo 2: Experimento novo (sem dados)

**SQL Result**:
```
name              | total_visitors | total_conversions | conversion_rate
------------------|----------------|-------------------|----------------
Novo Experimento  |       0        |         0         |      0.00
```

**Card Dashboard deve mostrar**:
```
👥 Visitantes      📈 Conversões      📊 Taxa Conv.
    0                   0                 0%
```

### Exemplo 3: Experimento com múltiplas variantes

**SQL Result**:
```
-- Variante 1: 50 visitantes, 5 conversões
-- Variante 2: 50 visitantes, 8 conversões
-- Total: 100 visitantes, 13 conversões = 13% taxa
```

**Card Dashboard deve mostrar**:
```
👥 Visitantes      📈 Conversões      📊 Taxa Conv.
    100                 13                13.00%
```

---

## ❌ Troubleshooting

### Problema: Cards mostram sempre 0

**Possíveis causas**:

1. **variant_stats vazio**
   ```sql
   -- Verificar se há dados
   SELECT COUNT(*) FROM variant_stats;
   ```
   - Se retornar 0, execute o script `FIX_COMPLETE_SYSTEM.sql` novamente

2. **RLS bloqueando leitura**
   ```sql
   -- Verificar políticas RLS
   SELECT * FROM pg_policies WHERE tablename = 'variant_stats';
   ```
   - Deve ter política permitindo SELECT para authenticated

3. **Hook não está executando**
   - Abra Console (F12)
   - Procure por erros de `variant_stats`
   - Verifique se há erro de permissão

### Problema: Números não batem com SQL

**Solução**:
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Verifique se está vendo o experimento correto
3. Execute a query SQL com o `experiment_id` específico:
   ```sql
   SELECT * FROM variant_stats WHERE experiment_id = 'ID_DO_CARD';
   ```

### Problema: Taxa de conversão errada

**Verificação**:
```sql
-- Calcular manualmente
SELECT
    SUM(visitors) as visitors,
    SUM(conversions) as conversions,
    (SUM(conversions)::DECIMAL / SUM(visitors)) * 100 as rate
FROM variant_stats
WHERE experiment_id = 'SEU_EXPERIMENT_ID';
```

---

## 🎯 Checklist Final

Execute esta checklist completa:

- [ ] **Banco de dados**
  - [ ] Tabela `variant_stats` existe
  - [ ] Há registros em `variant_stats` (pelo menos 1)
  - [ ] Query SQL retorna números corretos

- [ ] **Dashboard**
  - [ ] Cards carregam sem erro
  - [ ] Visitantes aparecem (não 0 se há dados)
  - [ ] Conversões aparecem (não 0 se há dados)
  - [ ] Taxa de conversão calculada corretamente
  - [ ] Experimentos sem dados mostram 0

- [ ] **Console do navegador**
  - [ ] Sem erros de `variant_stats`
  - [ ] Logs de "Stats encontradas" aparecem
  - [ ] Sem erro de RLS ou permissão

- [ ] **Teste dinâmico**
  - [ ] Incrementar visitante → número aumenta no card
  - [ ] Incrementar conversão → número aumenta no card
  - [ ] Taxa recalculada automaticamente

---

## ✅ Sucesso!

Se todos os itens acima passaram, **os cards estão funcionando perfeitamente!**

Os cards agora:
- ✅ Mostram dados reais de `variant_stats`
- ✅ Atualizam dinamicamente quando dados mudam
- ✅ Calculam taxa de conversão corretamente
- ✅ Agregam dados de múltiplas variantes
- ✅ Formatam números em português brasileiro

---

## 📝 Arquivos Modificados

1. ✅ `src/components/dashboard/experiment-card.tsx`
   - Adicionados campos de estatísticas na interface
   - Valores dinâmicos ao invés de hardcoded

2. ✅ `src/hooks/useSupabaseExperiments.ts`
   - Busca estatísticas de `variant_stats`
   - Agrega totais por experimento
   - Adiciona campos `total_visitors`, `total_conversions`, `conversion_rate`

3. ✅ `TESTE_CARDS_DASHBOARD.md` - Este guia de teste

---

**Execute os testes e confirme se os cards estão mostrando as estatísticas!** 📊
