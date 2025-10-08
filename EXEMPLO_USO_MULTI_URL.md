# 📘 Guia de Uso: Sistema de Múltiplas URLs

## ✅ O que foi implementado

O sistema agora suporta **múltiplas URLs** por variante em testes A/B. Você pode testar 20, 50 ou quantas páginas quiser!

---

## 🎯 Componentes Implementados

### 1. **Backend - API de Variantes** 
`/src/app/api/experiments/[id]/variants/route.ts`

**Suporta:**
- Array de URLs no campo `urls`
- Pesos personalizados por URL
- Descrições para cada página
- Modos de seleção: random, weighted, sequential

### 2. **Backend - Assignment Logic**
`/src/app/api/experiments/[id]/assign/route.ts`

**Funções adicionadas:**
- `selectPageForVariant()` - Seleciona página específica baseada no modo
- Suporte para 3 modos de seleção
- Hash determinístico (mesmo visitante sempre vê mesma página)

### 3. **Frontend - Componente Visual**
`/src/components/multi-url-manager.tsx`

**Recursos:**
- Interface drag-and-drop para reordenar URLs
- Adicionar/remover URLs dinamicamente
- Configurar pesos por URL
- 3 modos de distribuição
- Validação automática de pesos

---

## 📝 Como Usar

### Exemplo 1: Criar Variante com Múltiplas URLs via API

```typescript
// POST /api/experiments/{experiment_id}/variants

const response = await fetch(`/api/experiments/${experimentId}/variants`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variants: [
      {
        name: 'Teste 20 Landing Pages',
        description: 'Teste com múltiplas páginas',
        is_control: false,
        traffic_percentage: 50,
        urls: [
          'https://site.com/landing-1',
          'https://site.com/landing-2',
          'https://site.com/landing-3',
          // ... até 20 ou mais
          'https://site.com/landing-20'
        ],
        weights: [10, 10, 8, 8, 7, 7, 6, 6, 5, 5, 5, 4, 4, 3, 3, 2, 2, 2, 2, 1], // Total = 100
        page_descriptions: [
          'Homepage Principal',
          'Homepage Alternativa 1',
          'Homepage Alternativa 2',
          // ...
        ],
        selection_mode: 'weighted' // ou 'random', 'sequential'
      }
    ]
  })
})
```

### Exemplo 2: Usar Componente React

```tsx
import { useState } from 'react'
import { MultiUrlManager } from '@/components/multi-url-manager'

export function CreateVariantForm() {
  const [urls, setUrls] = useState([
    { id: 1, url: '', weight: 50, description: 'Página 1', active: true },
    { id: 2, url: '', weight: 50, description: 'Página 2', active: true }
  ])
  const [selectionMode, setSelectionMode] = useState<'random' | 'weighted' | 'sequential'>('random')

  const handleSubmit = async () => {
    const response = await fetch(`/api/experiments/${experimentId}/variants`, {
      method: 'POST',
      body: JSON.stringify({
        variants: [{
          name: 'Minha Variante',
          urls: urls.map(u => u.url),
          weights: urls.map(u => u.weight),
          page_descriptions: urls.map(u => u.description),
          selection_mode: selectionMode
        }]
      })
    })
  }

  return (
    <div>
      <MultiUrlManager
        urls={urls}
        onChange={setUrls}
        selectionMode={selectionMode}
        onSelectionModeChange={setSelectionMode}
      />
      
      <button onClick={handleSubmit}>
        Criar Variante
      </button>
    </div>
  )
}
```

### Exemplo 3: Atribuir Visitante e Obter URL Final

```typescript
// POST /api/experiments/{experiment_id}/assign

const response = await fetch(`/api/experiments/${experimentId}/assign`, {
  method: 'POST',
  body: JSON.stringify({
    visitor_id: 'visitor_123'
  })
})

const data = await response.json()

console.log(data.variant.final_url) // URL específica selecionada
console.log(data.variant.has_multiple_pages) // true se tem múltiplas páginas

// Redirecionar visitante
window.location.href = data.variant.final_url
```

---

## 🎲 Modos de Seleção

### 1. Random (Aleatório)
- Cada visitante recebe uma URL aleatória
- Distribuição uniforme entre todas as URLs ativas
- **Determinístico:** Mesmo visitante sempre vê a mesma URL

```json
{
  "selection_mode": "random"
}
```

### 2. Weighted (Ponderado)
- URLs com maior peso aparecem mais frequentemente
- Útil para dar mais tráfego para páginas específicas
- Pesos devem somar 100%

```json
{
  "selection_mode": "weighted",
  "weights": [40, 30, 20, 10] // Homepage tem 40% do tráfego
}
```

### 3. Sequential (Sequencial)
- Rotação entre as URLs de forma sequencial
- Baseado em hash do visitor_id
- Distribuição uniforme

```json
{
  "selection_mode": "sequential"
}
```

---

## 💾 Estrutura de Dados no Banco

### Tabela `variants` - Campo `changes` (JSONB)

```json
{
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
      "description": "Homepage Alternativa",
      "active": true
    },
    // ... mais 18 páginas
  ]
}
```

---

## 🧪 Testes

### Teste 1: Criar Variante com 5 URLs

```bash
curl -X POST http://localhost:3000/api/experiments/{exp_id}/variants \
  -H "Content-Type: application/json" \
  -d '{
    "variants": [{
      "name": "Teste 5 Páginas",
      "urls": [
        "https://exemplo.com/a",
        "https://exemplo.com/b", 
        "https://exemplo.com/c",
        "https://exemplo.com/d",
        "https://exemplo.com/e"
      ],
      "selection_mode": "random"
    }]
  }'
```

### Teste 2: Verificar Seleção de URL

```bash
curl -X POST http://localhost:3000/api/experiments/{exp_id}/assign \
  -H "Content-Type: application/json" \
  -d '{
    "visitor_id": "test_user_123"
  }'
```

**Resposta esperada:**
```json
{
  "variant": {
    "id": "...",
    "name": "Teste 5 Páginas",
    "redirect_url": "https://exemplo.com/a",
    "final_url": "https://exemplo.com/c",
    "has_multiple_pages": true,
    "changes": {
      "multipage": true,
      "pages": [...]
    }
  },
  "assignment": "new"
}
```

### Teste 3: Verificar Consistência (Mesmo Visitante = Mesma URL)

```bash
# Chamar 5 vezes com mesmo visitor_id
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/experiments/{exp_id}/assign \
    -H "Content-Type: application/json" \
    -d '{"visitor_id": "test_user_123"}'
done

# Deve retornar sempre a mesma final_url
```

---

## 📊 Query SQL para Verificar URLs

```sql
-- Ver todas as URLs de uma variante
SELECT 
  v.id,
  v.name,
  v.redirect_url,
  v.changes->'multipage' as is_multipage,
  v.changes->'total_pages' as total_pages,
  v.changes->'selection_mode' as mode,
  jsonb_pretty(v.changes->'pages') as all_pages
FROM variants v
WHERE experiment_id = 'exp-id';

-- Extrair URLs individualmente
SELECT 
  v.name,
  p.value->>'url' as url,
  p.value->>'weight' as weight,
  p.value->>'description' as description
FROM variants v,
  jsonb_array_elements(v.changes->'pages') as p
WHERE v.experiment_id = 'exp-id';
```

---

## ✅ Checklist de Validação

- [x] API aceita array de URLs
- [x] URLs são salvas no campo `changes` (JSONB)
- [x] Função `selectPageForVariant()` implementada
- [x] 3 modos de seleção funcionando (random, weighted, sequential)
- [x] Hash determinístico (consistência por visitante)
- [x] Componente React criado
- [x] Validação de pesos (deve somar 100%)
- [x] Suporte para ativar/desativar páginas individualmente

---

## 🎯 Próximos Passos

1. **Integrar componente no formulário de criação de experimentos**
   - Adicionar `<MultiUrlManager>` no wizard de criação
   - Atualizar lógica de submit para enviar URLs

2. **Adicionar analytics por página**
   - Registrar qual URL foi exibida no evento
   - Dashboard mostrando performance por URL

3. **Testes automatizados**
   - Testes unitários para `selectPageForVariant()`
   - Testes de integração para API

---

## 🐛 Troubleshooting

### Problema: Pesos não somam 100%
**Solução:** Usar botão "Distribuir Igualmente" ou ajustar manualmente

### Problema: final_url sempre retorna a mesma
**Verificar:** 
- Se `changes.multipage` está como `true`
- Se array `pages` tem mais de uma URL
- Se páginas estão marcadas como `active: true`

### Problema: Visitor vê URLs diferentes a cada visita
**Causa:** Visitor_id está mudando
**Solução:** Garantir que visitor_id é persistente (cookie/localStorage)

---

## 📚 Referências

- Arquivo de implementação: `MULTIPLAS_PAGINAS_URLS.md`
- Componente React: `src/components/multi-url-manager.tsx`
- API Backend: `src/app/api/experiments/[id]/variants/route.ts`
- Assignment Logic: `src/app/api/experiments/[id]/assign/route.ts`

