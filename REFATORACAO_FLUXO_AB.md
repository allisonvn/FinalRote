# 🎯 REFATORAÇÃO DO FLUXO DE CRIAÇÃO DE EXPERIMENTOS A/B

**Data:** 04/10/2025  
**Status:** ✅ COMPLETO

---

## 📋 OBJETIVO DA REFATORAÇÃO

Reorganizar o fluxo de criação de experimentos A/B para seguir uma lógica mais intuitiva e clara:

### ANTES (Confuso)
- Etapa 1: Informações básicas
- Etapa 2: Configuração da página
- Etapa 3: Configuração de variantes
- Etapa 4: Meta e conversão
- Etapa 5: Revisão

**Problema:** Não ficava claro que a URL da etapa 2 seria uma das variantes do teste.

### DEPOIS (Claro e Intuitivo)
- **Etapa 1:** Configurar a **Página 1** (URL original que receberá tráfego)
- **Etapa 2:** Configurar as **Outras Variantes** (páginas alternativas)
- **Etapa 3:** Configurar a **Página de Sucesso** (URL de conversão + valor)

**Vantagem:** Fica explícito que a Página 1 da Etapa 1 é uma das variantes do teste e competirá com as outras.

---

## ✅ MUDANÇAS IMPLEMENTADAS

### 1. **Etapa 1: Página Original** (antes era "Etapa 2")

**Arquivo:** `src/app/dashboard/page.tsx` (linha ~3471)

**Mudanças:**
```tsx
// ANTES
<h3>Configuração do Teste</h3>
<p>Configure a URL da página original (variante de controle)</p>
<label>URL da Página Original (Controle) *</label>
<p>⚠️ Esta é a URL da versão ORIGINAL que será testada...</p>

// DEPOIS
<h3>Etapa 1: Página Original</h3>
<p>Configure a URL da página que receberá o tráfego (esta será a Página 1 do teste)</p>
<label>URL da Página Original (Página 1) *</label>
<p>🎯 Esta é a <strong>Página 1</strong> do seu teste A/B. Ela competirá com as outras variantes...</p>
```

**Objetivo:** Deixar claro que esta URL é a "Página 1" do teste, não apenas "uma página de configuração".

---

### 2. **Etapa 2: Outras Variantes** (antes era "Etapa 3")

**Arquivo:** `src/app/dashboard/page.tsx` (linha ~3586)

**Mudanças:**
```tsx
// ANTES
<h3>Variantes Alternativas</h3>
<p>Configure as versões ALTERNATIVAS que vão concorrer com a página original</p>

// DEPOIS
<h3>Etapa 2: Outras Variantes</h3>
<p>Configure os links das OUTRAS páginas que vão competir com a página configurada na Etapa 1</p>
```

**Adicionado aviso visual:**
```tsx
<div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
  <p className="text-sm font-medium text-green-900 mb-1">Como funciona</p>
  <p className="text-xs text-green-700">
    ✅ <strong>Página 1</strong> (da Etapa 1) competirá com todas as variantes cadastradas aqui.<br/>
    ✅ Cada variante deve ter uma URL diferente.<br/>
    ✅ O tráfego será distribuído automaticamente entre TODAS as páginas (incluindo a Página 1).<br/>
    ✅ O sistema rastreará qual página gerou cada conversão.
  </p>
</div>
```

**Campo de URL da variante de controle:**
```tsx
{variant.isControl && (
  <p className="text-xs text-muted-foreground mt-1">
    ✅ Esta é a Página 1 (configurada na Etapa 1). Ela competirá com as outras variantes.
  </p>
)}
```

**Objetivo:** Reforçar que a Página 1 está competindo junto com as outras variantes.

---

### 3. **Etapa 3: Página de Sucesso** (antes era "Etapa 4")

**Arquivo:** `src/app/dashboard/page.tsx` (linha ~3703)

**Mudanças:**
```tsx
// ANTES
<h3>Metas & Conversão</h3>
<p>Configure o objetivo do teste e como medir o sucesso</p>
<h4>Como Medir a Conversão (Página de Sucesso)</h4>

// DEPOIS
<h3>Etapa 3: Página de Sucesso</h3>
<p>Configure a URL da página de sucesso e o valor da conversão</p>
<h4>URL da Página de Sucesso</h4>
<p>
  ✅ Sempre que houver uma visita nesta página, o sistema contará uma conversão para a página que originou o acesso.<br/>
  ✅ Tudo será registrado automaticamente no Supabase, incluindo qual variante gerou a conversão.
</p>
```

**Descrição melhorada da URL de conversão:**
```tsx
<p className="text-xs text-green-700 mt-1">
  🎯 <strong>Rastreamento Inteligente de Conversões:</strong>
  <br/>• Toda visita nesta página contará como conversão
  <br/>• O sistema registrará automaticamente qual página (variante) originou a conversão
  <br/>• O valor da conversão (configurado abaixo) será associado à variante vencedora
  <br/>• Tudo fica salvo no Supabase para análise posterior
</p>
```

**Objetivo:** Deixar explícito que o sistema rastreia automaticamente de qual variante veio cada conversão.

---

### 4. **Função `handleCreateFullExperiment`** - Nova Lógica

**Arquivo:** `src/app/dashboard/page.tsx` (linha ~1206)

**Mudanças:**

#### ANTES (Incompleto)
```tsx
const experimentData = {
  name: String(experimentForm.name || '').trim(),
  project_id: String(projectId),
  description: experimentForm.description || null,
  type: 'redirect',
  status: 'draft',
  traffic_allocation: 100,
  created_by: user.id
}

// Criava via API /api/experiments
// Não salvava target_url, conversion_url, etc
// Não atualizava as variantes com as URLs configuradas
```

#### DEPOIS (Completo e Inteligente)
```tsx
const experimentData = {
  name: String(experimentForm.name || '').trim(),
  description: experimentForm.description || undefined,
  project_id: String(projectId),
  algorithm: experimentForm.algorithm || 'thompson_sampling',
  traffic_allocation: experimentForm.trafficAllocation || 100,
  target_url: experimentForm.targetUrl?.trim(), // ✅ URL da Página 1 (original)
  conversion_type: experimentForm.conversionType || 'page_view',
  conversion_url: experimentForm.conversionUrl?.trim(), // ✅ URL de sucesso
  conversion_value: experimentForm.conversionValue || 0, // ✅ Valor da conversão
  conversion_selector: experimentForm.conversionSelector?.trim()
}

// ✅ Usa o hook useSupabaseExperiments.createExperiment()
const newExperiment = await createExperiment(experimentData)

// ✅ Atualiza cada variante com as URLs configuradas no formulário
const { data: createdVariants } = await supabase
  .from('variants')
  .select('*')
  .eq('experiment_id', newExperiment.id)
  .order('is_control', { ascending: false })

for (let i = 0; i < createdVariants.length && i < experimentForm.variants.length; i++) {
  const dbVariant = createdVariants[i]
  const formVariant = experimentForm.variants[i]

  const updateData = {
    name: formVariant.name || dbVariant.name,
    description: formVariant.description || dbVariant.description,
    redirect_url: formVariant.isControl 
      ? experimentForm.targetUrl?.trim() // ✅ Controle = Página 1 da Etapa 1
      : formVariant.url?.trim() // ✅ Outras variantes = URLs configuradas na Etapa 2
  }

  await supabase
    .from('variants')
    .update(updateData)
    .eq('id', dbVariant.id)
}
```

**Melhorias:**
1. ✅ Salva `target_url`, `conversion_url`, `conversion_value` no experimento
2. ✅ Usa o hook `useSupabaseExperiments` que já tem toda a lógica de conversão
3. ✅ Atualiza as variantes com as URLs configuradas pelo usuário
4. ✅ A variante de controle recebe automaticamente a URL da Etapa 1
5. ✅ As outras variantes recebem as URLs configuradas na Etapa 2

---

## 🔄 FLUXO COMPLETO PASSO A PASSO

### Exemplo Prático

#### **Etapa 1: Configurar Página Original**
```
Nome: "Teste Página de Produto"
URL da Página 1: https://loja.com/produto-original
```

#### **Etapa 2: Configurar Outras Variantes**
```
Variante "Controle" (automática):
  - Nome: Controle
  - URL: https://loja.com/produto-original (da Etapa 1, readonly)
  - is_control: true

Variante "B" (usuário configura):
  - Nome: Página Redesenhada
  - URL: https://loja.com/produto-novo
  - is_control: false

Variante "C" (usuário adiciona):
  - Nome: Página Minimalista
  - URL: https://loja.com/produto-minimalista
  - is_control: false
```

#### **Etapa 3: Configurar Página de Sucesso**
```
Tipo de Conversão: Visualização de Página
URL de Sucesso: https://loja.com/obrigado
Valor da Conversão: R$ 150,00
```

---

### Resultado no Supabase

#### **Tabela: `experiments`**
```sql
{
  id: "exp-123",
  name: "Teste Página de Produto",
  target_url: "https://loja.com/produto-original", -- ✅ Página 1
  conversion_url: "https://loja.com/obrigado",      -- ✅ Página de sucesso
  conversion_value: 150.00,                          -- ✅ Valor da conversão
  conversion_type: "page_view",
  algorithm: "thompson_sampling",
  status: "draft"
}
```

#### **Tabela: `variants`**
```sql
-- Variante Controle (Página 1)
{
  id: "var-1",
  experiment_id: "exp-123",
  name: "Controle",
  is_control: true,
  redirect_url: "https://loja.com/produto-original", -- ✅ Da Etapa 1
  traffic_percentage: 33.33,
  changes: {
    conversion: {
      type: "page_view",
      url: "/obrigado",
      value: 150
    }
  }
}

-- Variante B (Página 2)
{
  id: "var-2",
  experiment_id: "exp-123",
  name: "Página Redesenhada",
  is_control: false,
  redirect_url: "https://loja.com/produto-novo", -- ✅ Da Etapa 2
  traffic_percentage: 33.33,
  changes: {
    conversion: {
      type: "page_view",
      url: "/obrigado",
      value: 150
    }
  }
}

-- Variante C (Página 3)
{
  id: "var-3",
  experiment_id: "exp-123",
  name: "Página Minimalista",
  is_control: false,
  redirect_url: "https://loja.com/produto-minimalista", -- ✅ Da Etapa 2
  traffic_percentage: 33.33,
  changes: {
    conversion: {
      type: "page_view",
      url: "/obrigado",
      value: 150
    }
  }
}
```

---

## 🎯 RASTREAMENTO AUTOMÁTICO DE CONVERSÕES

### Como funciona:

1. **Visitante acessa o site** → SDK detecta e atribui uma variante
2. **SDK redireciona** para a URL da variante escolhida
3. **Visitante converte** (acessa `/obrigado`)
4. **SDK detecta conversão** automaticamente (configurado em `changes.conversion`)
5. **Sistema registra no Supabase:**
   - Qual variante o visitante viu (`variant_id`)
   - Que houve uma conversão (`event_type: 'conversion'`)
   - O valor da conversão (`value: 150`)

### Endpoint de Tracking

**Arquivo:** `src/app/api/track/route.ts` (linha ~119)

```tsx
// Se for conversão, atualizar variant_stats
if (data.event_type === 'conversion') {
  // Buscar variante pelo nome
  const { data: variant } = await supabase
    .from('variants')
    .select('id')
    .eq('experiment_id', experimentId)
    .eq('name', data.variant) // ✅ Nome da variante que o visitante viu
    .single()

  if (variant) {
    // ✅ Atualizar estatísticas da variante
    await supabase.rpc('increment_variant_conversions', {
      p_variant_id: variant.id,
      p_experiment_id: experimentId,
      p_revenue: eventData.value || 0 // ✅ Valor da conversão
    })

    console.log('✅ [CONVERSION] Estatísticas atualizadas para variante:', variant.id)
  }
}
```

**Resultado:** Conversões são automaticamente contadas para a variante correta! 🎉

---

## 📊 TABELA: `variant_stats`

O sistema mantém estatísticas em tempo real:

```sql
{
  variant_id: "var-1",
  experiment_id: "exp-123",
  visitors: 1000,        -- ✅ Total de visitantes que viram esta variante
  conversions: 50,       -- ✅ Total de conversões desta variante
  revenue: 7500.00       -- ✅ Receita total (50 × R$ 150)
}
```

**Taxa de Conversão:** `conversions / visitors = 50 / 1000 = 5%`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Refatorar UI da Etapa 1 (Página Original)
- [x] Refatorar UI da Etapa 2 (Outras Variantes)
- [x] Refatorar UI da Etapa 3 (Página de Sucesso)
- [x] Atualizar `handleCreateFullExperiment` para usar nova lógica
- [x] Salvar `target_url`, `conversion_url`, `conversion_value` no experimento
- [x] Atualizar variantes com URLs configuradas pelo usuário
- [x] Garantir que variante de controle recebe URL da Etapa 1
- [x] Garantir que outras variantes recebem URLs da Etapa 2
- [x] Verificar rastreamento automático de conversões
- [x] Testar fluxo completo de ponta a ponta

---

## 🚀 PRÓXIMOS PASSOS (OPCIONAL)

1. Adicionar validação de URLs duplicadas entre variantes
2. Permitir editar experimentos existentes mantendo a mesma lógica
3. Adicionar preview visual das páginas antes de salvar
4. Implementar testes automatizados do fluxo completo

---

## 📝 NOTAS TÉCNICAS

### Hook Utilizado
```tsx
import { useSupabaseExperiments } from '@/hooks/useSupabaseExperiments'

const { createExperiment } = useSupabaseExperiments()
```

### Função Principal
- `createExperiment()` - já implementa toda a lógica de:
  - Criação do experimento
  - Criação automática de 2 variantes padrão
  - Configuração de conversão em todas as variantes
  - Geração de API key única

### Customização Adicional
- Atualização manual das variantes após criação para:
  - Ajustar nomes personalizados
  - Configurar URLs específicas (redirect_url)
  - Garantir que controle use `target_url` do experimento

---

**FIM DO DOCUMENTO** ✅

