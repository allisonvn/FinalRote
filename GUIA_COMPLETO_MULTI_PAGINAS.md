# 🚀 Guia Completo: Testes A/B com Múltiplas Páginas

**Data:** 09/10/2025  
**Versão SDK:** 2.0  
**Status:** ✅ FUNCIONANDO

---

## ✨ O Que é Novo

O sistema RotaFinal agora suporta **múltiplas páginas por variante** em testes A/B. Isso significa que você pode:

- ✅ Testar **20, 50, 100 ou mais páginas** em uma única variante
- ✅ Distribuir tráfego de forma **inteligente** entre páginas
- ✅ Usar **diferentes modos de seleção** (random, weighted, sequential)
- ✅ Manter **consistência** (mesmo visitante sempre vê a mesma página)
- ✅ Rastrear **conversões** automaticamente

---

## 📋 Como Funciona

### 1. **Criação do Experimento**

Quando você cria um experimento no dashboard, pode configurar múltiplas URLs para cada variante:

```javascript
// No modal de criação:
Variante A:
  ├─ URL 1: https://site.com/pagina-produto-1
  ├─ URL 2: https://site.com/pagina-produto-2
  ├─ URL 3: https://site.com/pagina-produto-3
  └─ ... (quantas você quiser)

Variante B:
  ├─ URL 1: https://site.com/nova-pagina-1
  ├─ URL 2: https://site.com/nova-pagina-2
  └─ ...
```

### 2. **Seleção Inteligente de Página**

O sistema seleciona automaticamente qual página mostrar para cada visitante:

#### **Modo Random** (Padrão)
- Cada visitante vê uma página aleatória da lista
- Distribuição uniforme entre todas as páginas
- Mesmo visitante sempre vê a mesma página (determinístico)

#### **Modo Weighted** (Ponderado)
- Você define pesos para cada página
- Páginas com maior peso são mostradas mais vezes
- Exemplo: Página 1 (peso 10) aparece 2x mais que Página 2 (peso 5)

#### **Modo Sequential** (Sequencial)
- Páginas são distribuídas em sequência
- Boa para testes ordenados

---

## 🎯 Implementação Passo a Passo

### Passo 1: Criar Experimento com Múltiplas Páginas

#### No Dashboard:

1. Acesse: `https://rotafinal.com.br/dashboard`
2. Clique em "Novo Experimento"
3. Preencha informações básicas:
   - Nome: "Teste Produto - 20 páginas"
   - Descrição: "Teste de conversão em 20 páginas de produtos"
   - URL de destino: `https://seu-site.com`

4. **Configure as Variantes:**

**Variante Original (Controle):**
```
URLs:
- https://seu-site.com/produto-1
- https://seu-site.com/produto-2
- https://seu-site.com/produto-3
... (até 20)
```

**Variante A:**
```
URLs:
- https://seu-site.com/novo-produto-1
- https://seu-site.com/novo-produto-2
- https://seu-site.com/novo-produto-3
... (até 20)
```

5. **Configure o Objetivo:**
   - Tipo: Page View
   - URL de conversão: `https://seu-site.com/obrigado`

6. Clique em "Criar Experimento"

### Passo 2: Instalar o SDK

Adicione o script em **TODAS as páginas** do teste:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Sua Página</title>
    
    <!-- ✅ SDK RotaFinal -->
    <script src="https://rotafinal.com.br/rotafinal-sdk.js"></script>
</head>
<body>
    <!-- Seu conteúdo -->
    
    <script>
        // ✅ Inicializar SDK
        const rf = new RotaFinal({
            debug: true // Ative para ver logs no console
        });
        
        // ✅ Executar experimento
        // Substitua pelo ID do seu experimento
        rf.runExperiment('SEU_EXPERIMENT_ID_AQUI');
    </script>
</body>
</html>
```

### Passo 3: Obter o ID do Experimento

1. No dashboard, abra o experimento criado
2. Copie o **ID do experimento** (aparece na URL e nos detalhes)
3. Exemplo: `77e40c26-5e59-49ec-b7f2-2b52349950e3`

### Passo 4: Configurar o SDK nas Páginas

#### Exemplo Completo:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Produto 1 - Seu Site</title>
    
    <!-- SDK RotaFinal -->
    <script src="https://rotafinal.com.br/rotafinal-sdk.js"></script>
</head>
<body>
    <h1>Produto Incrível 1</h1>
    <p>Descrição do produto...</p>
    
    <button id="comprar">Comprar Agora</button>
    
    <script>
        // Inicializar SDK
        const rf = new RotaFinal({
            debug: true
        });
        
        // Executar experimento
        // Substitua pelo ID real do seu experimento
        const experimentId = '77e40c26-5e59-49ec-b7f2-2b52349950e3';
        
        rf.runExperiment(experimentId, {
            // ✅ Redireciona automaticamente para a URL correta
            autoRedirect: true,
            
            // ✅ Callback executado após atribuição
            onVariant: (variant) => {
                console.log('Variante atribuída:', variant.name);
                console.log('URL final:', variant.finalUrl);
                console.log('Tem múltiplas páginas:', variant.hasMultiplePages);
            }
        });
        
        // Rastrear conversão no botão
        document.getElementById('comprar').addEventListener('click', () => {
            rf.conversion('purchase', 99.90, {
                product: 'Produto 1',
                category: 'Eletrônicos'
            });
        });
    </script>
</body>
</html>
```

---

## 🎨 Configurações Avançadas

### 1. Desabilitar Redirecionamento Automático

Se você quiser controlar manualmente o redirecionamento:

```javascript
rf.runExperiment(experimentId, {
    autoRedirect: false,
    onVariant: (variant) => {
        // Você decide se/quando redirecionar
        if (variant.finalUrl && algmaCondicao()) {
            window.location.href = variant.finalUrl;
        }
    }
});
```

### 2. Aplicar Mudanças Visuais Sem Redirecionamento

Para testes visuais (sem trocar de página):

```javascript
rf.runExperiment(experimentId, {
    autoRedirect: false,
    applyStyles: true, // Aplica CSS da variante
    applyScripts: true, // Aplica JS da variante
    onVariant: (variant) => {
        // Variante aplicada, página não mudou
        console.log('Variante aplicada:', variant.name);
    }
});
```

### 3. Forçar Redirecionamento Mesmo para Controle

```javascript
rf.runExperiment(experimentId, {
    autoRedirect: true,
    forceRedirect: true // Redireciona inclusive variante controle
});
```

### 4. Rastrear Eventos Personalizados

```javascript
// Evento simples
rf.track('button_click');

// Evento com propriedades
rf.track('video_play', {
    video_id: '12345',
    duration: 120
});

// Conversão com valor
rf.conversion('purchase', 149.90, {
    product_id: 'PROD-001',
    quantity: 2
});

// Conversão sem valor
rf.conversion('signup');
```

---

## 📊 Como o Sistema Seleciona a Página

### Fluxo Interno:

1. **Visitante acessa a página** com o SDK
2. **SDK faz requisição** para `/api/experiments/[id]/assign`
3. **API verifica** se visitante já tem atribuição:
   - ✅ **Sim:** Retorna variante e página já atribuídas
   - ❌ **Não:** Atribui nova variante e seleciona página
4. **Seleção de página:**
   ```typescript
   // Se variante tem múltiplas páginas
   if (variant.has_multiple_pages) {
       // Seleciona página baseada no modo configurado
       finalUrl = selectPageForVariant(variant, visitorId);
   } else {
       // Usa redirect_url padrão
       finalUrl = variant.redirect_url;
   }
   ```
5. **SDK recebe resposta** com `finalUrl`
6. **SDK redireciona** automaticamente (se `autoRedirect: true`)

### Exemplo de Resposta da API:

```json
{
  "variant": {
    "id": "1b730ceb-00cb-4124-8ff5-472fa6692375",
    "name": "Variante A",
    "is_control": false,
    "redirect_url": "https://site.com/produto-1",
    "final_url": "https://site.com/produto-15", // ← URL selecionada!
    "has_multiple_pages": true, // ← Indica múltiplas páginas
    "css_changes": null,
    "js_changes": null,
    "changes": {
      "multipage": true,
      "total_pages": 20,
      "selection_mode": "weighted",
      "pages": [...]
    }
  },
  "assignment": "new",
  "algorithm": "uniform_hash"
}
```

---

## ✅ Garantias do Sistema

### 1. **Consistência**
- Mesmo visitante **SEMPRE** vê a mesma página
- Baseado em hash determinístico do `visitor_id`
- Funciona mesmo se visitante limpar cookies

### 2. **Performance**
- Cache de 5 minutos por padrão
- Apenas 1 requisição por sessão (na primeira visita)
- Resposta rápida (< 100ms)

### 3. **Confiabilidade**
- Se API falhar, retorna controle padrão
- Não quebra a página do usuário
- Logs detalhados em modo debug

### 4. **Rastreamento Automático**
- UTMs capturados automaticamente
- Experimento/variante linkados a eventos
- Dados enriquecidos em todas conversões

---

## 🔍 Debug e Validação

### Ativar Modo Debug:

```javascript
const rf = new RotaFinal({
    debug: true // ← Ativa logs no console
});
```

### Logs Esperados no Console:

```
RotaFinal SDK v2.0 initialized: {userId: "user_abc123", debug: true}
RotaFinal: Running experiment 77e40c26-5e59-49ec-b7f2-2b52349950e3
RotaFinal: Assignment response: {variant: {...}, assignment: "new"}
RotaFinal: Has multiple pages: true
RotaFinal: Final URL: https://site.com/produto-15
RotaFinal: Redirecting to: https://site.com/produto-15
```

### Verificar Atribuição:

```javascript
// Ver cache local
console.log(rf.cache);

// Ver ID do visitante
console.log(rf.userId);

// Ver experimento atual
console.log(sessionStorage.getItem('rf_current_experiment'));
console.log(sessionStorage.getItem('rf_current_variant'));
```

---

## 📈 Monitoramento de Resultados

### No Dashboard:

1. Acesse: `https://rotafinal.com.br/dashboard`
2. Abra o experimento
3. Veja métricas em tempo real:
   - **Visitantes por variante**
   - **Conversões por variante**
   - **Taxa de conversão**
   - **Receita (se configurado valor)**
   - **Significância estatística**

### Estatísticas por Página:

Atualmente, o sistema rastreia estatísticas agregadas por variante.  
Se você precisa ver estatísticas individuais por página, pode filtrar nos eventos do Supabase.

---

## 🎯 Casos de Uso Reais

### Caso 1: E-commerce com 50 Produtos

```javascript
// Página de produto (produto-1.html até produto-50.html)
const rf = new RotaFinal({ debug: false });

rf.runExperiment('experiment-id', {
    onVariant: (variant) => {
        // Analytics
        gtag('event', 'experiment_view', {
            experiment_id: 'experiment-id',
            variant: variant.name
        });
    }
});

// Botão comprar
document.getElementById('buy').addEventListener('click', () => {
    rf.conversion('purchase', preco);
});
```

### Caso 2: Landing Pages com Variações

```javascript
// 10 landing pages diferentes
const rf = new RotaFinal({ debug: false });

// Redireciona automaticamente
rf.runExperiment('landing-test-id');

// Conversão no formulário
form.addEventListener('submit', (e) => {
    rf.conversion('lead_generated');
});
```

### Caso 3: Blog com Múltiplos Artigos

```javascript
// artigo-1.html até artigo-30.html
const rf = new RotaFinal({ debug: false });

rf.runExperiment('blog-test-id', {
    autoRedirect: false, // Não redirecionar, apenas rastrear
    onVariant: (variant) => {
        console.log('Lendo:', variant.finalUrl);
    }
});

// Conversão: Leitura completa
window.addEventListener('scroll', () => {
    if (chegouNoFinal()) {
        rf.conversion('article_read');
    }
});
```

---

## ⚙️ API Reference

### `new RotaFinal(options)`

Inicializa o SDK.

**Opções:**
```javascript
{
    apiKey: string,        // Opcional
    debug: boolean,        // Default: false
    baseUrl: string        // Default: 'https://rotafinal.com.br'
}
```

### `rf.runExperiment(experimentId, options)`

Executa um experimento.

**Retorna:** `Promise<Variant>`

**Opções:**
```javascript
{
    autoRedirect: boolean,    // Default: true
    forceRedirect: boolean,   // Default: false
    applyStyles: boolean,     // Default: true
    applyScripts: boolean,    // Default: true
    cacheTime: number,        // Default: 300000 (5min)
    onVariant: function,      // Callback
    selectors: object         // Seletores DOM
}
```

### `rf.getVariant(experimentId, options)`

Obtém variante sem executar.

**Retorna:** `Promise<Variant>`

### `rf.track(eventName, properties)`

Rastreia evento personalizado.

**Retorna:** `Promise<object>`

### `rf.conversion(eventName, value, properties)`

Rastreia conversão.

**Retorna:** `Promise<object>`

### `rf.getMetrics(experimentKey)`

Obtém métricas do experimento.

**Retorna:** `Promise<object>`

---

## 🚨 Troubleshooting

### Problema 1: Não redireciona

**Causas:**
- `autoRedirect: false` nas opções
- Variante é controle e não tem URL
- Erro na API (ver console com `debug: true`)

**Solução:**
```javascript
rf.runExperiment(id, {
    autoRedirect: true,
    forceRedirect: true, // Força mesmo para controle
    onVariant: (v) => console.log('Variante:', v)
});
```

### Problema 2: Sempre vê a mesma variante

**Causa:** Cache do navegador ou visitor_id fixo

**Solução:**
```javascript
// Limpar cache local
localStorage.removeItem('rf_user_id');
sessionStorage.clear();

// Ou testar em navegador anônimo
```

### Problema 3: Conversões não aparecem

**Causas:**
- Experimento não está rodando (status != 'running')
- URL de conversão não corresponde
- Erro na API (ver console)

**Solução:**
1. Verificar status do experimento no dashboard
2. Testar conversão com `debug: true`
3. Ver logs da API no Supabase

---

## 📚 Documentação Adicional

- **Guia de Início Rápido:** `QUICK_START_MAB.md`
- **Algoritmos MAB:** `ALGORITMOS_MAB_IMPLEMENTADOS.md`
- **Sistema de UTMs:** `UTM_SYSTEM.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`

---

## ✅ Checklist de Implementação

- [ ] Experimento criado no dashboard
- [ ] Múltiplas URLs configuradas por variante
- [ ] SDK instalado em todas as páginas
- [ ] ID do experimento copiado
- [ ] `runExperiment()` chamado com ID correto
- [ ] Conversões configuradas (cliques, formulários, etc)
- [ ] Testado em modo debug
- [ ] Verificado redirecionamento
- [ ] Verificado rastreamento de eventos
- [ ] Monitoramento ativo no dashboard

---

## 🎉 Pronto!

Seu teste A/B com múltiplas páginas está configurado e funcionando!

**Próximos passos:**
1. Aguardar dados (mínimo 100 visitantes)
2. Monitorar métricas no dashboard
3. Analisar significância estatística
4. Tomar decisão baseada em dados

**Dúvidas?**  
Consulte a documentação ou abra o console com `debug: true`.

---

**Última atualização:** 09/10/2025  
**Versão:** 2.0

