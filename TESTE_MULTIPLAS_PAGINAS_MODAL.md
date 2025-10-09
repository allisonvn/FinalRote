# ✅ Teste de Múltiplas Páginas no Modal de Experimento

**Data:** 09/10/2025
**Status:** ✅ IMPLEMENTADO - AGUARDANDO TESTE

---

## 🎯 O QUE FOI IMPLEMENTADO

### 1. **Interface TypeScript Atualizada**

```typescript
interface PageConfig {
  id: number
  url: string
  weight: number
  description: string
  active: boolean
}

interface ExperimentFormData {
  // ... campos existentes
  variants: Array<{
    name: string
    description: string
    url: string
    isControl: boolean
    multipage: boolean              // ← NOVO
    pages: PageConfig[]             // ← NOVO
    selectionMode: 'random' | 'weighted' | 'sequential'  // ← NOVO
  }>
}
```

### 2. **UI Adicionada no Modal (Step 2 - Variantes)**

Para cada variante não-controle em modo `split_url`, agora há:

✅ **Toggle "Múltiplas Páginas"**
- Permite ativar/desativar modo multipáginas
- Visual com switch moderno (azul quando ativo)

✅ **Seleção de Modo**
- Aleatório
- Ponderado (com pesos)
- Sequencial

✅ **Lista de Páginas Configuráveis**
- Adicionar/remover páginas dinamicamente
- Cada página tem:
  - URL (obrigatório)
  - Peso (para modo ponderado)
  - Descrição (opcional)

✅ **Botão "Adicionar Página"**
- Permite adicionar quantas páginas quiser
- Sem limitação de quantidade

### 3. **Funções de Gerenciamento**

```typescript
toggleMultipage(variantIndex)      // Ativa/desativa multipáginas
addPage(variantIndex)              // Adiciona nova página
removePage(variantIndex, pageId)   // Remove página
updatePage(variantIndex, pageId, field, value) // Atualiza campo
updateVariantField(variantIndex, field, value) // Atualiza modo de seleção
```

### 4. **Salvamento no Banco de Dados**

O campo `changes` da tabela `variants` agora é populado corretamente:

```json
{
  "multipage": true,
  "total_pages": 5,
  "selection_mode": "weighted",
  "pages": [
    {
      "id": 1,
      "url": "https://seusite.com/pagina-1",
      "weight": 20,
      "description": "Produto Premium",
      "active": true
    },
    {
      "id": 2,
      "url": "https://seusite.com/pagina-2",
      "weight": 15,
      "description": "Produto Intermediário",
      "active": true
    }
    // ... mais páginas
  ]
}
```

**Para variantes de página única (modo tradicional):**
```json
{} // campo changes vazio
```

---

## 🧪 COMO TESTAR

### Passo 1: Acessar Dashboard

```bash
# Iniciar servidor
npm run dev

# Acessar
http://localhost:3000/dashboard
```

### Passo 2: Criar Experimento com Múltiplas Páginas

1. Clique em **"Criar Experimento A/B"**

2. **Step 1 - Setup:**
   - Nome: "Teste E-commerce 10 Produtos"
   - URL: https://seusite.com
   - Tipo: **Dividir URLs** ← IMPORTANTE
   - Tráfego: 100%
   - Duração: 14 dias

3. **Step 2 - Variantes:**

   **Variante Original (Controle):**
   - Configuração automática

   **Variante A:**
   - Nome: "Landing Pages Variação 1"
   - Descrição: "Teste de 10 páginas diferentes"
   - ✅ **Ativar toggle "Múltiplas Páginas"**

   - **Modo de Seleção:** Ponderado

   - **Adicionar páginas:**
     - Página 1: https://seusite.com/produto-1 (peso: 20)
     - Página 2: https://seusite.com/produto-2 (peso: 15)
     - Página 3: https://seusite.com/produto-3 (peso: 10)
     - Página 4: https://seusite.com/produto-4 (peso: 10)
     - Página 5: https://seusite.com/produto-5 (peso: 10)

   **Variante B (opcional):**
   - Nome: "Landing Pages Variação 2"
   - ✅ **Ativar "Múltiplas Páginas"**
   - Modo: Aleatório
   - Adicionar 5 páginas diferentes

4. **Step 3 - Meta:**
   - Objetivo: Acesso a uma página
   - URL sucesso: https://seusite.com/obrigado
   - Algoritmo: Thompson Sampling

5. **Clicar em "Criar Experimento"**

### Passo 3: Validar no Supabase

```sql
-- Ver experimento criado
SELECT * FROM experiments
WHERE name = 'Teste E-commerce 10 Produtos';

-- Ver variantes com campo changes
SELECT
  id,
  name,
  redirect_url,
  changes
FROM variants
WHERE experiment_id = 'ID_DO_EXPERIMENTO';

-- Verificar estrutura do campo changes
SELECT
  name,
  changes->>'multipage' as multipage,
  changes->>'total_pages' as total_pages,
  changes->>'selection_mode' as selection_mode,
  jsonb_array_length(changes->'pages') as pages_count
FROM variants
WHERE experiment_id = 'ID_DO_EXPERIMENTO';
```

### Passo 4: Testar com SDK

```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste SDK Multipáginas</title>
    <script src="https://rotafinal.com.br/rotafinal-sdk.js"></script>
</head>
<body>
    <h1>Teste de Múltiplas Páginas</h1>

    <script>
        const rf = new RotaFinal({
            debug: true
        });

        // Executar experimento
        rf.runExperiment('ID_DO_EXPERIMENTO', {
            onVariant: (variant) => {
                console.log('✅ Variante:', variant.name);
                console.log('🎯 Final URL:', variant.finalUrl);
                console.log('📄 Múltiplas páginas:', variant.hasMultiplePages);

                if (variant.hasMultiplePages) {
                    console.log('📊 Modo de seleção:', variant.changes?.selection_mode);
                    console.log('🔢 Total de páginas:', variant.changes?.total_pages);
                }
            }
        });
    </script>
</body>
</html>
```

**Console esperado:**
```
RotaFinal SDK v2.0 initialized
RotaFinal: Running experiment ID_DO_EXPERIMENTO
RotaFinal: Assignment response: {...}
RotaFinal: Has multiple pages: true
RotaFinal: Final URL: https://seusite.com/produto-3
RotaFinal: Redirecting to: https://seusite.com/produto-3

✅ Variante: Landing Pages Variação 1
🎯 Final URL: https://seusite.com/produto-3
📄 Múltiplas páginas: true
📊 Modo de seleção: weighted
🔢 Total de páginas: 5
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Interface Modal
- [ ] Toggle "Múltiplas Páginas" aparece para variantes não-controle
- [ ] Toggle funciona (ativa/desativa modo multipáginas)
- [ ] Seletor de modo de seleção funciona (random/weighted/sequential)
- [ ] Campo de peso aparece apenas no modo "ponderado"
- [ ] Botão "Adicionar Página" funciona
- [ ] Botão de remover página funciona (exceto última página)
- [ ] Formulário valida URLs vazias
- [ ] Visual está consistente com resto do modal

### Salvamento
- [ ] Experimento é criado sem erros
- [ ] Variantes são criadas no banco
- [ ] Campo `changes` é populado corretamente para multipáginas
- [ ] Campo `changes` é `{}` para página única
- [ ] Estrutura JSON está correta (multipage, total_pages, selection_mode, pages)
- [ ] Páginas contêm todos os campos (id, url, weight, description, active)

### Integração SDK
- [ ] SDK recebe campo `finalUrl` correto
- [ ] SDK detecta `hasMultiplePages = true`
- [ ] SDK redireciona para URL selecionada
- [ ] Mesmo visitante sempre vê mesma página (consistência)
- [ ] Diferentes visitantes veem páginas diferentes

### Algoritmo de Seleção
- [ ] Modo Random: distribuição aleatória
- [ ] Modo Weighted: respeita pesos configurados
- [ ] Modo Sequential: baseado em hash determinístico

---

## 🐛 POSSÍVEIS ERROS E SOLUÇÕES

### Erro: "URL obrigatória para teste Split URL"

**Causa:** Variante não-controle sem URL e sem multipáginas ativado

**Solução:**
- Ou configure uma URL única no campo principal
- Ou ative "Múltiplas Páginas" e adicione URLs

### Erro: Campo changes não está sendo salvo

**Causa:** Validação do JSON no Supabase

**Solução:**
- Verificar se estrutura JSON está correta
- Verificar tipos de dados (id = number, weight = number)

### Erro: SDK não recebe finalUrl

**Causa:** API `/api/experiments/[id]/assign` não está selecionando página

**Solução:**
- Verificar se função `selectPageForVariant()` existe na API
- Verificar logs da API em modo debug

---

## 📊 ESTRUTURA COMPLETA

### Fluxo de Dados:

```
MODAL
  ↓
  variant.multipage = true
  variant.pages = [{id, url, weight, description}, ...]
  variant.selectionMode = 'weighted'
  ↓
DASHBOARD handleCreateModernExperiment()
  ↓
  changes = {
    multipage: true,
    total_pages: 5,
    selection_mode: 'weighted',
    pages: [...]
  }
  ↓
SUPABASE variants.changes (JSONB)
  ↓
API /api/experiments/[id]/assign
  ↓
  selectPageForVariant(variant, visitorId)
  ↓
  finalUrl = página selecionada
  ↓
SDK recebe response
  ↓
  rf.runExperiment() → redireciona
```

---

## 🎉 RESULTADO ESPERADO

Após implementação completa, o sistema deve:

✅ Permitir criar experimentos com múltiplas páginas via modal
✅ Salvar configuração corretamente no Supabase
✅ API selecionar página dinamicamente por visitante
✅ SDK redirecionar para página correta
✅ Manter consistência (mesmo visitante = mesma página)
✅ Suportar 3 modos de seleção (random, weighted, sequential)
✅ Funcionar com algoritmos MAB (Thompson, UCB1, etc)

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Testar criação de experimento no dashboard
2. ✅ Validar estrutura no banco de dados
3. ✅ Testar SDK com experimento multipáginas
4. ✅ Validar consistência de atribuição
5. ✅ Testar com dados reais em produção

---

**Implementado por:** Claude Code
**Data:** 09/10/2025
**Versão:** 1.0
