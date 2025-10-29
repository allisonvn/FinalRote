# 🔧 Solução: Problema de Alternância de Páginas

## 📋 Diagnóstico

O código gerado está funcionando corretamente, mas há um **comportamento esperado** que está causando confusão:

### Como Funciona o Sistema Atual

1. **Primeiro visitante (ID: rf_xxx):** 
   - Sistema atribui Variante A com URL `/elementor-595/`
   - Visitante é redirecionado para essa URL
   - Cache é salvo

2. **Mesmo visitante volta:**
   - Sistema verifica cache
   - Visitante sempre vê `/elementor-595/`

3. **Segundo visitante (ID: rf_yyy):**
   - Sistema atribui Variante B com URL `/elementor-695/`
   - Visitante vê `/elementor-695/`

### ❌ Problema

O usuário espera ver AMBAS as páginas alternando, mas o sistema funciona assim:
- Cada visitante vê APENAS UMA página (determinística)
- Para ver as duas páginas, você precisa limpar o cache

---

## ✅ Solução 1: Modificar Comportamento (Recomendado)

Para fazer as páginas alternarem REALMENTE a cada visita, modifique a lógica:

### Modo 1: Random por Sessão
```javascript
// Em vez de salvar a variante no localStorage (persistente),
// salve apenas no sessionStorage (temporário, até fechar o navegador)

// ANTES (comportamento atual):
localStorage.setItem("rf_variant_"+experimentId, JSON.stringify({v:variant,t:Date.now()}))

// DEPOIS (nova variante a cada sessão):
sessionStorage.setItem("rf_variant_"+experimentId, JSON.stringify({v:variant,t:Date.now()}))
```

### Modo 2: Sempre Random
```javascript
// Ignorar cache completamente e sempre buscar nova variante
// Modificar função x() para sempre retornar null
function x() {
  return null; // SEMPRE buscar nova variante
}
```

---

## ✅ Solução 2: Configurar Experimento Corretamente

### Para ter 2 variantes com URLs diferentes:

**Configuração no Dashboard:**

```
Experimento: ffcd8e69-d981-431e-9ba6-d86c395bea26
├─ Variante A (50%): /elementor-595/
└─ Variante B (50%): /elementor-695/
```

**Como Testar:**
1. Abra navegador anônimo → Ver página 1
2. Fechar e abrir novo anônimo → Ver página 2
3. Ou limpar localStorage e recarregar

---

## ✅ Solução 3: Implementar Alternância Real

Se você quer que AMBOS os visitantes alternem entre as páginas aleatoriamente:

### Arquivo: `src/app/api/experiments/[id]/assign/route.ts`

Adicione um parâmetro para controlar o comportamento:

```typescript
// Linha 315-316
// ANTES:
const finalUrl = selectPageForVariant(selectedVariant, visitorId)

// DEPOIS: Adicione lógica de múltiplas páginas
function selectRandomPageForVisitor(
  variant: any,
  visitorId: string
): string {
  // Se variante tem múltiplas páginas configuradas
  if (variant.changes?.multipage && variant.changes?.pages) {
    const pages = variant.changes.pages.filter((p: any) => p.active !== false)
    
    // Seleção random determinística
    const hash = hashCode(visitorId + variant.id)
    const index = hash % pages.length
    return pages[index].url
  }
  
  // Fallback para URL padrão
  return variant.redirect_url || ''
}

// Usar:
const finalUrl = selectRandomPageForVisitor(selectedVariant, visitorId)
```

### Configurar Variantes com Múltiplas Páginas:

```javascript
// Variante com múltiplas páginas
{
  name: "Variante Principal",
  redirect_url: "/elementor-595/", // URL padrão
  changes: {
    multipage: true,
    pages: [
      {
        id: 1,
        url: "/elementor-595/",
        weight: 50, // 50% dos visitantes desta variante
        active: true
      },
      {
        id: 2,
        url: "/elementor-695/",
        weight: 50, // outros 50%
        active: true
      }
    ],
    selection_mode: "random" // ou "weighted", "sequential"
  }
}
```

---

## 🧪 Como Testar Agora (Solução Imediata)

### Método 1: Navegador Anônimo
```bash
# Abra janela anônima 1 → /elementor-595/
# Abra janela anônima 2 → /elementor-695/
```

### Método 2: Limpar Cache
```javascript
// No console do navegador:
localStorage.clear()
sessionStorage.clear()
location.reload()

// Ou usar:
RotaFinal.reload()
```

### Método 3: Simular Visitantes Diferentes
```javascript
// Gerar novo ID de visitante manualmente
localStorage.setItem("rf_user_id", "rf_" + Math.random().toString(36).slice(2,11) + "_" + Date.now().toString(36))
location.reload()
```

---

## 📊 Verificar Status Atual

Execute no console:

```javascript
// Ver variante atual
console.log(RotaFinal.getVariant())

// Ver user ID
console.log(RotaFinal.getUserId())

// Debug mode
RotaFinal.setDebug(true)

// Ver cache
console.log(localStorage.getItem("rf_variant_ffcd8e69-d981-431e-9ba6-d86c395bea26"))
```

---

## 🎯 Próximos Passos

1. **Decidir comportamento desejado:**
   - ❓ Cada visitante vê sempre a mesma página (atual)?
   - ❓ Cada visita alterna entre páginas?
   - ❓ 50% dos visitantes em cada página?

2. **Implementar modificação** conforme Solução 1, 2 ou 3

3. **Testar** com método apropriado

---

## 🐛 Debug

Para debug completo, adicione no início do código gerado:

```javascript
// Ativar debug
localStorage.setItem("rf_debug", "1")

// Reload
location.reload()
```

Console mostrará logs detalhados de cada passo.

