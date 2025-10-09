# 🧪 TESTE: Criação de Experimento com TODOS os Campos

**Data:** 09/10/2025  
**Objetivo:** Verificar que TODOS os 11 campos do modal são salvos corretamente

---

## 📋 CHECKLIST DE TESTE

### Pré-requisitos
- ✅ Migration `add_duration_days_to_experiments` aplicada
- ✅ Frontend atualizado para enviar `duration_days`
- ✅ API atualizada para receber e salvar `duration_days`

---

## 🧪 TESTE PASSO A PASSO

### 1. Criar Experimento com Todos os Campos Preenchidos

**Passo 1: Abrir Modal**
```
1. Acessar dashboard
2. Clicar em "Novo Experimento"
```

**Passo 2: Etapa 1 - Setup**
```
Campo: Nome
Valor: "Teste Completo Todos Campos"

Campo: Descrição
Valor: "Teste para verificar que todos os 11 campos são salvos"

Campo: URL Alvo
Valor: "https://exemplo.com/teste-completo"

Campo: Tipo de Teste
Valor: "Split URL" (split_url)

Campo: Alocação de Tráfego
Valor: 80%

Campo: Duração do Teste
Valor: 30 dias  ← CAMPO QUE FOI CORRIGIDO

Campo: Algoritmo
Valor: "Thompson Sampling"
```

**Passo 3: Etapa 2 - Variantes**
```
Variante 1 (Controle):
- Nome: "Versão Original"
- Descrição: "Página atual"
- URL: (preenchida automaticamente)

Variante 2:
- Nome: "Nova Versão"
- Descrição: "Página redesenhada"
- URL: "https://exemplo.com/nova-versao"
```

**Passo 4: Etapa 3 - Meta**
```
Campo: Tipo de Conversão
Valor: "Visualização de Página" (page_view)

Campo: URL/Valor de Conversão
Valor: "https://exemplo.com/obrigado"

Campo: Valor da Conversão (opcional)
Valor: 49.99
```

**Passo 5: Criar Experimento**
```
Clicar em "Criar Experimento"
```

---

## ✅ VERIFICAÇÕES

### Verificação 1: Console do Navegador

**Logs esperados:**
```javascript
📋 Creating experiment with ALL FIELDS from modal: {
  name: "Teste Completo Todos Campos",
  project_id: "...",
  description: "Teste para verificar que todos os 11 campos são salvos",
  status: "draft",
  type: "split_url",
  traffic_allocation: 80,
  algorithm: "thompson_sampling",
  target_url: "https://exemplo.com/teste-completo",
  conversion_url: "https://exemplo.com/obrigado",
  conversion_value: 49.99,
  conversion_type: "page_view",
  duration_days: 30  // ✅ DEVE APARECER
}

🔍 Data validation: {
  name_type: "string",
  name_length: 27,
  traffic_allocation_type: "number",
  traffic_allocation_value: 80,
  algorithm_type: "string",
  algorithm_value: "thompson_sampling",
  type: "split_url",
  target_url: "https://exemplo.com/teste-completo",
  conversion_url: "https://exemplo.com/obrigado",
  conversion_value: 49.99,
  conversion_type: "page_view",
  duration_days: 30  // ✅ DEVE APARECER
}

✅ Experiment created: [experiment_id]

📝 Criando variante 0: {
  name: "Versão Original",
  isControl: true,
  finalRedirectUrl: "https://exemplo.com/teste-completo"
}

📝 Criando variante 1: {
  name: "Nova Versão",
  isControl: false,
  finalRedirectUrl: "https://exemplo.com/nova-versao"
}

✅ Custom variants created: 2
```

### Verificação 2: Banco de Dados

**Query para verificar experimento:**
```sql
SELECT 
  id,
  name,
  description,
  type,
  traffic_allocation,
  algorithm,
  target_url,
  conversion_url,
  conversion_value,
  conversion_type,
  duration_days,  -- ✅ CAMPO NOVO
  status,
  created_at
FROM experiments
WHERE name = 'Teste Completo Todos Campos'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
```
id: [uuid]
name: "Teste Completo Todos Campos"
description: "Teste para verificar que todos os 11 campos são salvos"
type: "split_url"
traffic_allocation: 80.00
algorithm: "thompson_sampling"
target_url: "https://exemplo.com/teste-completo"
conversion_url: "https://exemplo.com/obrigado"
conversion_value: 49.99
conversion_type: "page_view"
duration_days: 30  ← ✅ DEVE SER 30
status: "draft"
created_at: [timestamp]
```

**Query para verificar variantes:**
```sql
SELECT 
  e.name as experimento,
  v.name as variante,
  v.is_control,
  v.redirect_url,
  v.description
FROM experiments e
JOIN variants v ON v.experiment_id = e.id
WHERE e.name = 'Teste Completo Todos Campos'
ORDER BY v.is_control DESC;
```

**Resultado esperado:**
```
experimento                    | variante         | is_control | redirect_url                          | description
-------------------------------|------------------|------------|---------------------------------------|-------------------
Teste Completo Todos Campos   | Versão Original  | true       | https://exemplo.com/teste-completo   | Página atual
Teste Completo Todos Campos   | Nova Versão      | false      | https://exemplo.com/nova-versao      | Página redesenhada
```

### Verificação 3: Contagem de Campos

**Query para contar campos não-nulos:**
```sql
SELECT 
  CASE WHEN name IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN description IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN type IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN traffic_allocation IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN algorithm IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN target_url IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN conversion_url IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN conversion_value IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN conversion_type IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN duration_days IS NOT NULL THEN 1 ELSE 0 END AS campos_salvos
FROM experiments
WHERE name = 'Teste Completo Todos Campos';
```

**Resultado esperado:**
```
campos_salvos: 10  
(11 campos do modal - 1 campo variants que é salvo em outra tabela)
```

---

## 🎯 RESULTADO ESPERADO

### ✅ Sucesso Total

**Todos os 11 campos devem estar presentes:**

| # | Campo do Modal | Campo no Banco | Status Esperado |
|---|----------------|----------------|-----------------|
| 1 | name | name | ✅ Salvo |
| 2 | description | description | ✅ Salvo |
| 3 | targetUrl | target_url | ✅ Salvo |
| 4 | testType | type | ✅ Salvo |
| 5 | trafficAllocation | traffic_allocation | ✅ Salvo |
| 6 | variants | tabela variants | ✅ Salvo |
| 7 | goalType | conversion_type | ✅ Salvo |
| 8 | goalValue | conversion_url | ✅ Salvo |
| 9 | conversionValue | conversion_value | ✅ Salvo |
| 10 | algorithm | algorithm | ✅ Salvo |
| 11 | **duration** | **duration_days** | ✅ **Salvo (CORRIGIDO)** |

---

## 🐛 TROUBLESHOOTING

### Problema 1: duration_days não aparece no console

**Sintomas:**
```javascript
🔍 Data validation: {
  // ... outros campos
  duration_days: undefined  // ❌ PROBLEMA
}
```

**Causa:** Frontend não está enviando o campo

**Solução:**
1. Verificar se a correção foi aplicada em `src/app/dashboard/page.tsx` linha 1390
2. Recarregar página (Ctrl+F5)
3. Limpar cache do navegador

### Problema 2: Erro ao criar experimento

**Sintomas:**
```
❌ Error creating experiment: column "duration_days" does not exist
```

**Causa:** Migration não foi aplicada

**Solução:**
```sql
-- Executar migration manualmente
ALTER TABLE experiments
ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 14;
```

### Problema 3: duration_days é NULL no banco

**Sintomas:**
```sql
SELECT duration_days FROM experiments WHERE ...
-- Resultado: NULL
```

**Causa:** Valor não está sendo capturado do formulário

**Solução:**
1. Verificar se o campo está na interface (Etapa 1 do modal)
2. Verificar se o valor está em `formData.duration`
3. Verificar console para ver o valor sendo enviado

---

## 📊 CRITÉRIOS DE SUCESSO

### ✅ Teste Passa Se:

1. ✅ Experimento é criado sem erros
2. ✅ Console mostra `duration_days` no log de validação
3. ✅ Banco de dados tem `duration_days = 30`
4. ✅ Todas as 2 variantes são criadas
5. ✅ Todas as URLs das variantes são salvas

### ❌ Teste Falha Se:

1. ❌ Experimento não é criado
2. ❌ `duration_days` não aparece no console
3. ❌ `duration_days` é NULL ou undefined no banco
4. ❌ Variantes não são criadas
5. ❌ Qualquer outro campo está faltando

---

## 🎉 CONCLUSÃO DO TESTE

Após executar este teste e confirmar que **TODOS os 11 campos** são salvos corretamente:

✅ **Sistema validado como 100% funcional**

✅ **Todos os campos do modal são persistidos**

✅ **Correção de `duration_days` confirmada**

✅ **Pronto para uso em produção**

---

**Executado por:** [Nome]  
**Data de execução:** [Data]  
**Resultado:** [ ] ✅ Passou  [ ] ❌ Falhou  
**Observações:** _______________________________________
