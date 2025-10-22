# 🧪 TESTE RÁPIDO - Sistema de Conversões

## 🎯 Objetivo

Este guia permite testar o sistema de conversões **sem precisar do SQL Editor**, usando apenas o navegador.

---

## 📋 PASSO 1: Verificar Campos no Banco (Via API)

### Teste 1A: Criar experimento de teste

1. Abra o dashboard do RotaFinal
2. Abra o **DevTools** do navegador (F12)
3. Vá na aba **Console**
4. Execute este código:

```javascript
// Criar experimento de teste
fetch('/api/experiments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'TESTE CONVERSÃO ' + Date.now(),
    type: 'split_url',
    target_url: 'https://exemplo.com/produto',
    conversion_url: 'https://exemplo.com/obrigado',
    conversion_type: 'page_view',
    conversion_value: 100,
    traffic_allocation: 100,
    algorithm: 'uniform',
    duration_days: 14
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Resposta da API:', data);
  if (data.experiment) {
    console.log('📊 Experimento criado:', {
      id: data.experiment.id,
      name: data.experiment.name,
      conversion_url: data.experiment.conversion_url,
      conversion_type: data.experiment.conversion_type,
      conversion_value: data.experiment.conversion_value
    });

    if (data.experiment.conversion_url) {
      console.log('✅ SUCESSO: conversion_url foi salvo!');
    } else {
      console.log('❌ ERRO: conversion_url está NULL - MIGRATION NÃO FOI APLICADA');
    }
  }
})
.catch(err => console.error('❌ Erro:', err));
```

### 📊 Resultados Esperados:

**✅ SE MIGRATION FOI APLICADA:**
```javascript
{
  id: "uuid-do-experimento",
  name: "TESTE CONVERSÃO 1234567890",
  conversion_url: "https://exemplo.com/obrigado",  // ✅ PREENCHIDO
  conversion_type: "page_view",
  conversion_value: 100
}
```

**❌ SE MIGRATION NÃO FOI APLICADA:**
```javascript
{
  id: "uuid-do-experimento",
  name: "TESTE CONVERSÃO 1234567890",
  conversion_url: undefined,  // ❌ NULL ou undefined
  // conversion_type não aparece
  // conversion_value não aparece
}
```

---

## 📋 PASSO 2: Verificar API /assign

Execute no console do navegador:

```javascript
// Substitua EXPERIMENT_ID pelo ID do experimento criado acima
const EXPERIMENT_ID = 'cole-o-id-aqui';

fetch(`/api/experiments/${EXPERIMENT_ID}/assign`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    visitor_id: 'teste_' + Date.now(),
    user_agent: navigator.userAgent,
    url: window.location.href
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Resposta /assign:', data);

  if (data.experiment) {
    console.log('📊 Dados de conversão:', {
      conversion_url: data.experiment.conversion_url,
      conversion_type: data.experiment.conversion_type,
      conversion_value: data.experiment.conversion_value
    });

    if (data.experiment.conversion_url) {
      console.log('✅ SUCESSO: SDK receberá conversion_url!');
    } else {
      console.log('❌ ERRO: SDK não receberá conversion_url - conversões NÃO funcionarão');
    }
  }
})
.catch(err => console.error('❌ Erro:', err));
```

---

## 📋 PASSO 3: Testar Rastreamento de Conversão

### Teste 3A: Simular detecção de conversão

Execute no console:

```javascript
// Simular o que o SDK faz quando detecta conversão
const conversionUrl = 'https://exemplo.com/obrigado';
const currentUrl = window.location.href;

console.log('🔍 Teste de detecção de conversão:');
console.log('URL de conversão:', conversionUrl);
console.log('URL atual:', currentUrl);

// Testar matching
const currentPath = window.location.pathname;
const conversionPath = new URL(conversionUrl).pathname;

const isConversion =
  currentPath === conversionPath ||
  currentUrl.includes(conversionPath) ||
  currentPath.includes(conversionPath);

if (isConversion) {
  console.log('✅ CONVERSÃO SERIA DETECTADA!');
} else {
  console.log('⚠️ Conversão não seria detectada na URL atual');
  console.log('💡 Navegue para:', conversionUrl);
}
```

---

## 🔧 DIAGNÓSTICO COMPLETO

Execute este script completo no console:

```javascript
async function diagnosticarConversoes() {
  console.log('🔍 ========================================');
  console.log('🔍 DIAGNÓSTICO COMPLETO - CONVERSÕES');
  console.log('🔍 ========================================\n');

  // TESTE 1: Criar experimento
  console.log('📝 TESTE 1: Criando experimento de teste...');
  let experimentId;

  try {
    const response = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: 'DIAGNÓSTICO ' + Date.now(),
        type: 'split_url',
        target_url: 'https://exemplo.com/produto',
        conversion_url: 'https://exemplo.com/obrigado',
        conversion_type: 'page_view',
        conversion_value: 99.99,
        traffic_allocation: 100,
        algorithm: 'uniform',
        duration_days: 14
      })
    });

    const data = await response.json();

    if (data.experiment) {
      experimentId = data.experiment.id;
      console.log('✅ Experimento criado:', experimentId);
      console.log('');
      console.log('📊 Campos de conversão retornados:');
      console.log('   conversion_url:', data.experiment.conversion_url);
      console.log('   conversion_type:', data.experiment.conversion_type);
      console.log('   conversion_value:', data.experiment.conversion_value);
      console.log('   target_url:', data.experiment.target_url);
      console.log('   duration_days:', data.experiment.duration_days);
      console.log('');

      if (data.experiment.conversion_url) {
        console.log('✅ TESTE 1 PASSOU: conversion_url foi salvo!');
      } else {
        console.log('❌ TESTE 1 FALHOU: conversion_url está NULL');
        console.log('🚨 AÇÃO NECESSÁRIA: Aplicar migration no Supabase');
        console.log('📖 Consulte: APLICAR_MIGRATION_AGORA.md');
        return;
      }
    } else {
      console.log('❌ Erro ao criar experimento:', data);
      return;
    }
  } catch (err) {
    console.error('❌ Erro no teste 1:', err);
    return;
  }

  console.log('\n');

  // TESTE 2: Verificar API /assign
  console.log('📝 TESTE 2: Verificando API /assign...');

  try {
    const response = await fetch(`/api/experiments/${experimentId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: 'diagnostico_' + Date.now(),
        user_agent: navigator.userAgent,
        url: window.location.href
      })
    });

    const data = await response.json();

    console.log('✅ Resposta /assign recebida');
    console.log('');
    console.log('📊 Objeto experiment retornado:');
    console.log('   conversion_url:', data.experiment?.conversion_url);
    console.log('   conversion_type:', data.experiment?.conversion_type);
    console.log('   conversion_value:', data.experiment?.conversion_value);
    console.log('');

    if (data.experiment?.conversion_url) {
      console.log('✅ TESTE 2 PASSOU: API retorna conversion_url!');
    } else {
      console.log('❌ TESTE 2 FALHOU: API não retorna conversion_url');
      return;
    }
  } catch (err) {
    console.error('❌ Erro no teste 2:', err);
    return;
  }

  console.log('\n');
  console.log('🎉 ========================================');
  console.log('🎉 TODOS OS TESTES PASSARAM!');
  console.log('🎉 ========================================');
  console.log('');
  console.log('✅ Sistema de conversões está FUNCIONANDO');
  console.log('✅ Migration foi aplicada corretamente');
  console.log('✅ API retorna dados de conversão');
  console.log('✅ SDK poderá rastrear conversões automaticamente');
  console.log('');
  console.log('📝 Próximo passo: Testar em página real com código do experimento');
}

// Executar diagnóstico
diagnosticarConversoes();
```

---

## 📊 INTERPRETAÇÃO DOS RESULTADOS

### ✅ Cenário 1: Todos os testes passaram

```
✅ TESTE 1 PASSOU: conversion_url foi salvo!
✅ TESTE 2 PASSOU: API retorna conversion_url!
🎉 TODOS OS TESTES PASSARAM!
```

**Significado:** Migration foi aplicada corretamente. Sistema funcionando!

**Próximo passo:** Criar experimento real e testar rastreamento

---

### ❌ Cenário 2: TESTE 1 falhou

```
❌ TESTE 1 FALHOU: conversion_url está NULL
🚨 AÇÃO NECESSÁRIA: Aplicar migration no Supabase
```

**Significado:** Campos não existem no banco

**Solução:** Seguir guia `APLICAR_MIGRATION_AGORA.md`

---

### ❌ Cenário 3: TESTE 1 passou mas TESTE 2 falhou

```
✅ TESTE 1 PASSOU: conversion_url foi salvo!
❌ TESTE 2 FALHOU: API não retorna conversion_url
```

**Significado:** Bug na API /assign

**Solução:** Verificar se API está buscando os campos corretos (linha 46 do `/api/experiments/[id]/assign/route.ts`)

---

## 🔍 QUERIES SQL ALTERNATIVAS

Se você tiver acesso ao SQL Editor, execute estas queries uma por uma:

### Query 1: Verificar campos

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name LIKE '%conversion%'
ORDER BY column_name;
```

### Query 2: Ver último experimento

```sql
SELECT
  id,
  name,
  conversion_url,
  conversion_type,
  conversion_value
FROM experiments
ORDER BY created_at DESC
LIMIT 1;
```

### Query 3: Verificar eventos de conversão

```sql
SELECT COUNT(*)
FROM events
WHERE event_type = 'conversion';
```

---

## 📞 SUPORTE

Se os testes indicarem que a migration foi aplicada mas conversões ainda não funcionam:

1. Verifique logs do navegador (Console)
2. Ative debug: `localStorage.setItem('rf_debug', '1')` e recarregue
3. Verifique Network tab se API /assign está retornando `experiment.conversion_url`
4. Compartilhe os resultados do diagnóstico completo

---

**Última atualização:** 2025-10-22
