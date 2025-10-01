# Análise do Fluxo Completo - Teste A/B Automático

**Data:** 01/10/2025  
**Status:** 🔴 **PROBLEMA CRÍTICO IDENTIFICADO**

---

## 📋 Pergunta do Usuário

> "Quando um novo experimento for criado, ele será salvo no Supabase? Quando o usuário inserir o código no site dele, vai funcionar o teste a/b? Esse fluxo precisa ser automático, onde o usuário cria o experimento, ele é salvo no supabase o código vem pronto e funcionando para ele, sem a necessidade configuração extra, toda a configuração deve ser feita no modal"

---

## ✅ O Que Está Funcionando

### 1. ✅ Criação e Salvamento do Experimento

**Status:** FUNCIONANDO PERFEITAMENTE

Quando um experimento é criado no dashboard:

```typescript
// src/hooks/useSupabaseExperiments.ts - linha 149
const createExperiment = async (data) => {
  // 1. Insere experimento no Supabase
  const { data: newExp } = await supabase
    .from('experiments')
    .insert({
      name: data.name,
      description: data.description,
      project_id: data.project_id,
      algorithm: 'thompson_sampling',
      traffic_allocation: 100,
      status: 'draft'
    })
    .select()
    .single()

  // 2. Cria variantes padrão automaticamente
  const variants = [
    { name: 'Controle', key: 'control', is_control: true, weight: 50 },
    { name: 'Variante B', key: 'variant_b', is_control: false, weight: 50 }
  ]
  
  await supabase.from('variants').insert(variants)
  
  return newExp // ✅ Experimento criado e salvo
}
```

**Resultado:**
- ✅ Experimento salvo no Supabase (tabela `experiments`)
- ✅ Variantes criadas automaticamente (tabela `variants`)
- ✅ ID único gerado para o experimento
- ✅ Vinculado ao projeto do usuário

---

### 2. ✅ Geração do Código

**Status:** FUNCIONANDO PERFEITAMENTE

O código é gerado automaticamente com todas as funcionalidades:

```javascript
// Código gerado inclui:
- ✅ ID do experimento
- ✅ SDK completo funcional
- ✅ Tracking de eventos
- ✅ CSS anti-flicker
- ✅ Tratamento de erros
- ✅ Fallback para control
```

---

## 🔴 PROBLEMA CRÍTICO IDENTIFICADO

### ❌ O Código Gerado NÃO Está Incluindo o API Key

**Código Atual Gerado:**

```javascript
// src/components/CodeGenerator.tsx - linha 48
init=function(){
  apiCall(baseUrl+"/api/experiments/"+experimentId+"/assign",{
    method:"POST",
    body:JSON.stringify({
      visitor_id:getUserId(),
      user_agent:navigator.userAgent,
      // ... outros dados
    })
  })
  // ❌ FALTANDO: headers com API key!
}
```

**API Endpoint Requer Autenticação:**

```typescript
// src/app/api/experiments/[id]/assign/route.ts - linha 70-74
export async function POST(request, { params }) {
  // Validar API key
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }
  // ...
}
```

**Problema:**
- ❌ O código gerado não inclui o `Authorization` header
- ❌ A requisição para `/api/experiments/[id]/assign` **vai falhar com erro 401**
- ❌ O teste A/B **NÃO vai funcionar** quando inserido no site

---

## 🔍 Análise Detalhada do Fluxo

### Fluxo ESPERADO (Automático):
```
1. Usuário cria experimento ✅
   ↓
2. Experimento é salvo no Supabase ✅
   ↓
3. Código é gerado com API key ❌ (PROBLEMA)
   ↓
4. Usuário copia e cola código ✅
   ↓
5. Código faz requisição para API ❌ (FALHA - sem API key)
   ↓
6. API retorna variante ❌ (FALHA - erro 401)
   ↓
7. Teste A/B funciona ❌ (NÃO FUNCIONA)
```

### Fluxo ATUAL (Com problema):
```
1. Usuário cria experimento ✅
   ↓
2. Experimento é salvo no Supabase ✅
   ↓
3. Código é gerado SEM API key ❌
   ↓
4. Usuário copia e cola código ✅
   ↓
5. Código tenta fazer requisição ⚠️
   ↓
6. API retorna erro 401 (API key required) ❌
   ↓
7. Teste A/B NÃO funciona ❌
```

---

## 🛠️ SOLUÇÕES NECESSÁRIAS

### Solução 1: Incluir API Key no Código Gerado (RECOMENDADO)

**Mudança necessária em `CodeGenerator.tsx`:**

```typescript
// ANTES (sem API key):
const sdkCode = `
!function(){"use strict";
var experimentId="${experimentId}",
    baseUrl="${baseUrl}",
    // ❌ FALTA: apiKey="${apiKey}",
```

**DEPOIS (com API key):**

```typescript
// Buscar API key do projeto
const { data: project } = await supabase
  .from('projects')
  .select('api_key')
  .eq('id', experiment.project_id)
  .single()

const sdkCode = `
!function(){"use strict";
var experimentId="${experimentId}",
    baseUrl="${baseUrl}",
    apiKey="${project.api_key}", // ✅ ADICIONAR API KEY
    
    // Na função apiCall, incluir header
    apiCall=function(url,options){
      var headers={
        "Content-Type":"application/json",
        "Authorization":"Bearer "+apiKey, // ✅ ADICIONAR HEADER
        "X-RF-Version":"2.0.0"
      };
      return fetch(url,Object.assign({headers:headers},options))
        .then(function(response){
          if(!response.ok)throw new Error("HTTP "+response.status);
          return response.json();
        })
    },
```

---

### Solução 2: Criar Endpoint Público (Alternativa)

**Criar endpoint que não requer API key:**

```typescript
// src/app/api/public/experiments/[id]/assign/route.ts
export async function POST(request, { params }) {
  // Não requer API key
  // Validar apenas que experimento está ativo
  
  const experimentId = params.id
  const body = await request.json()
  
  // Buscar experimento diretamente
  const { data: experiment } = await supabase
    .from('experiments')
    .select('*, variants(*)')
    .eq('id', experimentId)
    .eq('status', 'running')
    .single()
  
  // Atribuir variante...
}
```

**Mudar código gerado para usar endpoint público:**
```javascript
apiCall(baseUrl+"/api/public/experiments/"+experimentId+"/assign", ...)
```

---

## 📊 Comparação das Soluções

| Aspecto | Solução 1 (API Key) | Solução 2 (Público) |
|---------|---------------------|---------------------|
| Segurança | ✅ Mais seguro | ⚠️ Menos seguro |
| Complexidade | ⭐⭐ Média | ⭐ Baixa |
| Rate limiting | ✅ Por projeto | ❌ Global |
| Controle de acesso | ✅ Por API key | ❌ Público |
| Mudanças necessárias | Código gerado | Novo endpoint |
| **Recomendação** | ✅ **USAR ESTA** | ⚠️ Backup |

---

## ✅ SOLUÇÃO RECOMENDADA

### Implementar Solução 1: Incluir API Key

**Arquivos a modificar:**

1. **`src/components/CodeGenerator.tsx`**
   - Buscar API key do projeto
   - Incluir no código gerado
   - Adicionar header Authorization

2. **`src/components/dashboard/experiment-details-modal.tsx`**
   - Mesmas mudanças
   - Buscar API key do projeto
   - Incluir no código gerado

3. **`src/components/InstallationGuide.tsx`**
   - Mesmas mudanças
   - Exemplo com API key

---

## 🎯 Resultado Esperado Após Correção

```
1. Usuário cria experimento ✅
   ↓
2. Experimento é salvo no Supabase ✅
   ↓
3. Sistema busca API key do projeto ✅
   ↓
4. Código é gerado COM API key ✅
   ↓
5. Usuário copia e cola código ✅
   ↓
6. Código faz requisição com Authorization header ✅
   ↓
7. API valida API key e retorna variante ✅
   ↓
8. Teste A/B funciona perfeitamente! ✅
```

---

## 📝 Checklist de Correções

### Mudanças Necessárias:
- [ ] Modificar `CodeGenerator.tsx` para buscar API key
- [ ] Modificar `experiment-details-modal.tsx` para buscar API key
- [ ] Modificar `InstallationGuide.tsx` para buscar API key
- [ ] Adicionar `apiKey` no código gerado
- [ ] Adicionar header `Authorization: Bearer ${apiKey}` nas requisições
- [ ] Testar fluxo completo:
  - [ ] Criar experimento
  - [ ] Gerar código
  - [ ] Verificar se API key está no código
  - [ ] Testar código em página HTML
  - [ ] Verificar se atribui variante corretamente
  - [ ] Verificar se tracking funciona

---

## 🚨 IMPACTO DO PROBLEMA ATUAL

**Gravidade:** 🔴 **CRÍTICO**

**Impacto:**
- ❌ Teste A/B NÃO funciona quando código é inserido no site
- ❌ Usuário não consegue usar o sistema
- ❌ Todas as requisições falham com erro 401
- ❌ Experiência do usuário completamente quebrada

**Urgência:** 🔴 **ALTA - Correção Imediata Necessária**

---

## 📌 Resumo

| Componente | Status | Ação Necessária |
|------------|--------|-----------------|
| Criar experimento | ✅ Funciona | Nenhuma |
| Salvar no Supabase | ✅ Funciona | Nenhuma |
| Gerar código | ⚠️ Parcial | **Incluir API key** |
| Código funcionar no site | ❌ **NÃO FUNCIONA** | **Correção crítica** |
| Atribuir variante | ❌ Falha 401 | **Incluir API key** |
| Tracking funcionar | ❌ Falha 401 | **Incluir API key** |

---

**Status Final:** 🔴 **FLUXO NÃO ESTÁ AUTOMÁTICO - CÓDIGO NÃO FUNCIONA SEM API KEY**

**Ação Requerida:** Implementar Solução 1 - Incluir API key no código gerado

---

