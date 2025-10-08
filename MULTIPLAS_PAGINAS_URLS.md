# ✅ Suporte para Múltiplas Páginas/URLs em Testes A/B

## 📊 Estrutura Atual do Banco de Dados

### Tabela `variants` - Campos para URLs

| Campo | Tipo | Descrição | Limite |
|-------|------|-----------|--------|
| `redirect_url` | text | URL única de redirecionamento | ✅ **Sem limite de tamanho** |
| `changes` | jsonb | Objeto JSON flexível para alterações | ✅ **Suporta estruturas complexas** |
| `css_changes` | text | Código CSS personalizado | ✅ **Sem limite de tamanho** |
| `js_changes` | text | Código JavaScript personalizado | ✅ **Sem limite de tamanho** |

## 🎯 Cenários de Uso

### Cenário 1: Uma URL por Variante (Teste A/B Simples)

**Exemplo:** Comparar 2 landing pages diferentes

```typescript
// Variante A (Controle)
{
  name: "Página Original",
  redirect_url: "https://site.com/landing-original"
}

// Variante B
{
  name: "Página Nova",
  redirect_url: "https://site.com/landing-nova"
}
```

**✅ Status:** Totalmente suportado

---

### Cenário 2: Múltiplas URLs em uma Variante (Array)

**Exemplo:** Usuário quer testar 20 páginas diferentes na mesma variante

#### ❌ Limitação Atual

A arquitetura atual foi projetada para:
- **1 experimento** = **N variantes**
- **1 variante** = **1 URL principal** (campo `redirect_url`)

O campo `redirect_url` é do tipo `text`, que aceita **apenas uma string**, não um array.

#### ✅ Solução: Usar o Campo `changes` (JSONB)

O campo `changes` é do tipo **JSONB** e pode armazenar estruturas complexas, incluindo arrays!

**Exemplo de como salvar 20 URLs em uma variante:**

```typescript
// Variante com múltiplas URLs
{
  name: "Teste Multipáginas",
  redirect_url: "https://site.com/principal", // URL principal
  changes: {
    pages: [
      { 
        id: 1, 
        url: "https://site.com/pagina-1",
        weight: 5,
        description: "Homepage"
      },
      { 
        id: 2, 
        url: "https://site.com/pagina-2",
        weight: 5,
        description: "Sobre Nós"
      },
      { 
        id: 3, 
        url: "https://site.com/pagina-3",
        weight: 5,
        description: "Produtos"
      },
      // ... até 20 páginas
      { 
        id: 20, 
        url: "https://site.com/pagina-20",
        weight: 5,
        description: "Contato"
      }
    ],
    page_selection_mode: "random", // ou "sequential", "weighted"
    total_pages: 20
  }
}
```

---

## 🔧 Implementação Necessária

### Opção A: Usar Campo `changes` (Recomendado)

**Vantagens:**
- ✅ Não requer alteração no schema do banco
- ✅ Máxima flexibilidade (JSONB aceita qualquer estrutura)
- ✅ Pode armazenar metadados adicionais (pesos, descrições, etc)
- ✅ Suporta queries complexas com JSON operators

**Código de Exemplo:**

```typescript
// API: Criar variante com múltiplas páginas
const { data, error } = await supabase
  .from('variants')
  .insert({
    experiment_id: experimentId,
    name: 'Variante Multipáginas',
    redirect_url: null, // ou URL principal
    changes: {
      multipage: true,
      pages: urls.map((url, index) => ({
        id: index + 1,
        url: url,
        weight: 100 / urls.length, // distribuir igualmente
        active: true
      })),
      selection_algorithm: 'weighted_random'
    }
  })
```

**Query para buscar URLs:**

```sql
-- Buscar todas as URLs de uma variante
SELECT 
  id,
  name,
  redirect_url,
  changes->'pages' as all_pages,
  jsonb_array_length(changes->'pages') as total_urls
FROM variants
WHERE id = 'variant-id';

-- Buscar URL específica por index
SELECT 
  changes->'pages'->0->>'url' as first_url,
  changes->'pages'->5->>'url' as sixth_url
FROM variants
WHERE id = 'variant-id';
```

---

### Opção B: Criar Tabela Separada `variant_pages`

**Estrutura proposta:**

```sql
CREATE TABLE variant_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES variants(id) ON DELETE CASCADE,
  url text NOT NULL,
  order_index int DEFAULT 0,
  weight numeric DEFAULT 1.0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Vantagens:**
- ✅ Normalização de dados
- ✅ Queries mais simples
- ✅ Melhor para grandes volumes (>100 URLs por variante)

**Desvantagens:**
- ❌ Requer migration do banco
- ❌ Mais complexo para queries simples
- ❌ Necessita joins

---

## 💡 Recomendação

### Para até 50 URLs por variante:
**Use o campo `changes` (JSONB)** - É a solução mais rápida e flexível.

### Para mais de 50 URLs por variante:
**Crie a tabela `variant_pages`** - Melhor performance e organização.

---

## 🚀 Implementação Rápida com `changes`

### 1. Atualizar API de criação de variantes

```typescript
// src/app/api/experiments/[id]/variants/route.ts

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const data = await request.json()
  
  // Processar múltiplas URLs se fornecidas
  let changesData = data.changes || {}
  
  if (data.urls && Array.isArray(data.urls) && data.urls.length > 1) {
    changesData = {
      ...changesData,
      multipage: true,
      pages: data.urls.map((url: string, index: number) => ({
        id: index + 1,
        url: url.trim(),
        weight: data.weights?.[index] || (100 / data.urls.length),
        active: true
      })),
      total_pages: data.urls.length,
      selection_mode: data.selection_mode || 'random'
    }
  }
  
  const variantData = {
    experiment_id: params.id,
    name: data.name,
    redirect_url: data.redirect_url || data.urls?.[0] || null,
    changes: changesData,
    // ... outros campos
  }
  
  const { data: variant, error } = await supabase
    .from('variants')
    .insert(variantData)
    .select()
    .single()
    
  return NextResponse.json({ success: true, variant })
}
```

### 2. Atualizar lógica de assignment

```typescript
// src/app/api/experiments/[id]/assign/route.ts

function selectPageForVariant(variant: Variant): string {
  // Se tem múltiplas páginas no changes
  if (variant.changes?.multipage && variant.changes?.pages) {
    const pages = variant.changes.pages
    const mode = variant.changes.selection_mode || 'random'
    
    if (mode === 'random') {
      // Seleção aleatória
      const randomIndex = Math.floor(Math.random() * pages.length)
      return pages[randomIndex].url
    } else if (mode === 'weighted') {
      // Seleção ponderada por peso
      const totalWeight = pages.reduce((sum, p) => sum + p.weight, 0)
      let random = Math.random() * totalWeight
      
      for (const page of pages) {
        random -= page.weight
        if (random <= 0) return page.url
      }
    }
    
    // Fallback: primeira URL
    return pages[0].url
  }
  
  // Comportamento padrão: redirect_url
  return variant.redirect_url || ''
}
```

### 3. Atualizar Frontend

```typescript
// Formulário de criação de variante
const [urls, setUrls] = useState<string[]>([''])

const handleAddUrl = () => {
  setUrls([...urls, ''])
}

const handleRemoveUrl = (index: number) => {
  setUrls(urls.filter((_, i) => i !== index))
}

// Ao submeter
const createVariant = async () => {
  const response = await fetch(`/api/experiments/${experimentId}/variants`, {
    method: 'POST',
    body: JSON.stringify({
      name: variantName,
      urls: urls.filter(url => url.trim()), // apenas URLs preenchidas
      selection_mode: 'random',
      // ... outros campos
    })
  })
}
```

---

## 📝 Exemplo Completo de Dados

```json
{
  "id": "variant-123",
  "experiment_id": "exp-456",
  "name": "Teste 20 Landing Pages",
  "redirect_url": null,
  "changes": {
    "multipage": true,
    "total_pages": 20,
    "selection_mode": "weighted",
    "pages": [
      {
        "id": 1,
        "url": "https://site.com/landing-1",
        "weight": 10,
        "description": "Homepage Principal",
        "active": true
      },
      {
        "id": 2,
        "url": "https://site.com/landing-2",
        "weight": 8,
        "description": "Homepage Alternativa 1",
        "active": true
      },
      // ... 18 páginas adicionais
      {
        "id": 20,
        "url": "https://site.com/landing-20",
        "weight": 2,
        "description": "Teste Experimental",
        "active": false
      }
    ]
  }
}
```

---

## ✅ Resposta Final

**Sim, o sistema PODE suportar 20 páginas (ou mais) em um teste!**

### Como funciona atualmente:
- ✅ **1 URL por variante** via campo `redirect_url`
- ✅ **Múltiplas URLs** podem ser armazenadas no campo `changes` (JSONB)

### O que precisa ser implementado:
1. ✅ Backend: Lógica para processar array de URLs no campo `changes`
2. ✅ Backend: Lógica de seleção de URL (random, weighted, sequential)
3. ✅ Frontend: Interface para adicionar/remover múltiplas URLs
4. ✅ Assignment: Selecionar URL apropriada ao atribuir visitante

### Limitações:
- **JSONB:** Máximo ~100MB por campo (suficiente para milhares de URLs)
- **PostgreSQL:** Sem limite prático para número de URLs
- **Performance:** Até 50 URLs no JSONB = excelente performance

**Recomendação:** Implementar usando campo `changes` (JSONB) - solução mais rápida e flexível! 🚀

