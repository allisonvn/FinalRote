# 🎯 Guia: Como Ativar o Sistema de Conversões

## 📋 Resumo Executivo

As conversões configuradas no modal "Criar Experimento A/B" (Etapa 3) **não estão funcionando** porque os campos necessários **não existem no banco de dados** Supabase.

### ✅ O que JÁ funciona:
- ✅ Modal captura URL de conversão corretamente
- ✅ API salva dados de conversão
- ✅ SDK detecta e rastreia conversões automaticamente
- ✅ Migration SQL está pronta

### ❌ O que NÃO funciona:
- ❌ Campos `conversion_url`, `conversion_type`, `conversion_value` não existem na tabela `experiments`
- ❌ Migration não foi aplicada no Supabase

---

## 🚀 SOLUÇÃO RÁPIDA (3 passos)

### Passo 1: Aplicar Migration no Supabase

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **"New Query"**
5. Cole o conteúdo do arquivo: `supabase/migrations/20251018000000_add_conversion_fields.sql`
6. Clique em **"Run"**
7. Aguarde a mensagem: `✅ Todos os campos de conversão foram adicionados com sucesso!`

### Passo 2: Verificar se os Campos Foram Criados

Execute esta query no **SQL Editor**:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name IN (
    'target_url',
    'conversion_url',
    'conversion_type',
    'conversion_value',
    'duration_days'
  )
ORDER BY column_name;
```

**Resultado esperado:**

| column_name       | data_type | column_default      |
|-------------------|-----------|---------------------|
| conversion_type   | text      | 'page_view'::text   |
| conversion_url    | text      | NULL                |
| conversion_value  | numeric   | 0.00                |
| duration_days     | integer   | 14                  |
| target_url        | text      | NULL                |

✅ Se você vê esses 5 campos, a migration foi aplicada com sucesso!

### Passo 3: Testar Conversão

1. Crie um novo experimento A/B no dashboard
2. Na **Etapa 3 - Meta**, configure:
   - **Tipo:** "Acesso a uma página"
   - **URL da página de sucesso:** `https://seusite.com/obrigado`
   - **Valor da Conversão:** `100.00` (opcional)
3. Clique em **"Criar Experimento"**
4. Verifique se foi salvo corretamente:

```sql
SELECT
  id,
  name,
  conversion_url,  -- ✅ Deve estar preenchido
  conversion_type, -- ✅ Deve ser 'page_view'
  conversion_value -- ✅ Deve ser 100.00
FROM experiments
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**

| id    | name           | conversion_url              | conversion_type | conversion_value |
|-------|----------------|-----------------------------|-----------------|------------------|
| uuid  | Meu Teste      | https://seusite.com/obrigado| page_view       | 100.00           |

---

## 🔍 DIAGNÓSTICO DETALHADO

### Fluxo Completo do Sistema de Conversões

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. MODAL PREMIUM (Etapa 3)                                      │
│    Usuário preenche: "URL da página de sucesso"                 │
│    Campo interno: formData.goalValue                            │
│    ✅ FUNCIONA                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. DASHBOARD (src/app/dashboard/page.tsx:1387)                  │
│    Mapeia: formData.goalValue → experimentData.conversion_url   │
│    ✅ FUNCIONA                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. API POST /api/experiments (route.ts:164)                     │
│    Recebe: rawData.conversion_url                               │
│    Salva no banco: experiments.conversion_url                   │
│    ❌ FALHA: Campo não existe na tabela                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. BANCO DE DADOS                                                │
│    Ignora campo inexistente (sem erro)                          │
│    Resultado: conversion_url = NULL                             │
│    ❌ PROBLEMA PRINCIPAL                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API GET /api/experiments/[id]/assign (route.ts:46)           │
│    Busca: SELECT conversion_url FROM experiments                │
│    Retorna: experiment.conversion_url = NULL                    │
│    ❌ VALOR NULL                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. SDK GERADO (OptimizedCodeGenerator.tsx:116)                  │
│    Função: checkAndTrackConversion(expData)                     │
│    Verifica: if (!expData.conversion_url) return                │
│    Retorna imediatamente porque conversion_url é NULL           │
│    ❌ CONVERSÃO NUNCA É DETECTADA                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 CONTEÚDO DA MIGRATION

**Arquivo:** `supabase/migrations/20251018000000_add_conversion_fields.sql`

A migration adiciona os seguintes campos à tabela `experiments`:

1. **`target_url`** (TEXT) - URL da página onde o experimento roda
2. **`conversion_url`** (TEXT) - URL da página de conversão/sucesso
3. **`conversion_type`** (TEXT) - Tipo de conversão: `page_view`, `click`, `form_submit`
4. **`conversion_value`** (NUMERIC) - Valor monetário da conversão (R$)
5. **`duration_days`** (INTEGER) - Duração planejada do experimento

Também cria índices para performance:
- `idx_experiments_conversion_url` - Busca rápida por URL de conversão
- `idx_experiments_target_url` - Busca rápida por URL alvo

---

## 🧪 TESTE COMPLETO

### 1. Criar Experimento de Teste

```javascript
// No dashboard, criar experimento com:
{
  name: "Teste de Conversão",
  targetUrl: "https://meusite.com/produto",
  goalType: "page_view",
  goalValue: "https://meusite.com/obrigado",
  conversionValue: 100
}
```

### 2. Verificar no Banco

```sql
SELECT
  id,
  name,
  target_url,
  conversion_url,
  conversion_type,
  conversion_value
FROM experiments
WHERE name = 'Teste de Conversão';
```

### 3. Testar SDK

Copie o código de integração gerado e cole em uma página HTML de teste:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Teste de Conversão</title>
</head>
<body>
  <h1>Página de Produto</h1>

  <!-- Cole o código do experimento aqui -->
  <script>
    // Código gerado pelo dashboard
  </script>

  <a href="/obrigado">Comprar Agora</a>
</body>
</html>
```

### 4. Ativar Debug

No console do navegador:

```javascript
RotaFinal.setDebug(true)
```

### 5. Navegar para Página de Conversão

Acesse: `https://meusite.com/obrigado`

**Logs esperados:**

```
[RotaFinal v3.0.1-auto-conversion] 🎯 Conversion page detected! {
  currentPath: "/obrigado",
  conversionPath: "/obrigado",
  value: 100
}
[RotaFinal v3.0.1-auto-conversion] Track conversion {
  event_type: "conversion",
  value: 100,
  auto: true
}
```

### 6. Verificar no Banco

```sql
SELECT
  event_type,
  event_data->>'url' as page_url,
  value,
  created_at
FROM events
WHERE event_type = 'conversion'
ORDER BY created_at DESC
LIMIT 5;
```

---

## ⚠️ TROUBLESHOOTING

### Problema: Migration falha com erro "column already exists"

**Solução:** A migration já foi aplicada anteriormente. Ignore o erro.

### Problema: Ainda não detecta conversão após aplicar migration

**Checklist:**

1. ✅ Criar NOVO experimento (experimentos antigos não têm conversion_url)
2. ✅ Verificar que conversion_url foi salvo no banco
3. ✅ Gerar NOVO código de integração (código antigo não tem a URL)
4. ✅ Limpar cache do navegador (F5 ou Ctrl+Shift+R)
5. ✅ Ativar debug: `RotaFinal.setDebug(true)`

### Problema: Conversion_url está NULL mesmo após criar experimento

**Possíveis causas:**

1. Migration não foi aplicada
2. Cache do Supabase não foi atualizado
3. RLS (Row Level Security) bloqueando acesso

**Solução:**

```sql
-- Verificar se campo existe
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name = 'conversion_url';

-- Se retornar vazio, aplicar migration novamente
```

---

## 📚 ARQUIVOS IMPORTANTES

1. **Migration:** `/supabase/migrations/20251018000000_add_conversion_fields.sql`
2. **Modal:** `/src/components/dashboard/premium-experiment-modal.tsx` (linha 938-968)
3. **Dashboard:** `/src/app/dashboard/page.tsx` (linha 1387)
4. **API Create:** `/src/app/api/experiments/route.ts` (linha 164, 228)
5. **API Assign:** `/src/app/api/experiments/[id]/assign/route.ts` (linha 46, 108, 314)
6. **SDK:** `/src/components/OptimizedCodeGenerator.tsx` (linha 116)

---

## ✅ CHECKLIST FINAL

Antes de considerar o problema resolvido, verifique:

- [ ] Migration aplicada no Supabase
- [ ] Campos criados na tabela `experiments`
- [ ] Novo experimento criado com conversion_url preenchida
- [ ] Código de integração gerado inclui `checkAndTrackConversion`
- [ ] Teste em página real mostra logs de conversão
- [ ] Evento salvo na tabela `events` com `event_type = 'conversion'`

---

## 🎓 COMO FUNCIONA O TRACKING AUTOMÁTICO

O SDK gerado possui uma função `checkAndTrackConversion` que:

1. **Lê** `experiment.conversion_url` do cache (retornado pela API /assign)
2. **Compara** com `window.location.href` e `window.location.pathname`
3. **Detecta** quando o usuário acessa a página de conversão
4. **Dispara** automaticamente `RotaFinal.convert()` com o valor configurado
5. **Marca** a conversão como rastreada em `sessionStorage` (evita duplicação)

**Código interno:**

```javascript
checkAndTrackConversion=function(expData){
  if(!expData||!expData.conversion_url)return; // ⬅️ Se NULL, não faz nada

  var conversionUrl=expData.conversion_url;
  var currentPath=window.location.pathname;

  // Compara paths
  if(currentPath===conversionPath||currentFullUrl.indexOf(conversionPath)!==-1){
    // ✅ Conversão detectada!
    RotaFinal.convert(expData.conversion_value, {auto:true});
  }
}
```

---

## 📞 SUPORTE

Se o problema persistir após seguir este guia:

1. Verifique os logs do navegador (Console > Network > API calls)
2. Verifique os logs do Supabase (Dashboard > Logs)
3. Execute queries SQL diretamente no SQL Editor
4. Documente o erro e compartilhe screenshots

---

**Última atualização:** 2025-10-22
**Versão do SDK:** 3.0.1-auto-conversion
