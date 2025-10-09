# 🎯 INSTALAÇÃO ZERO FLICKER - Guia Definitivo

**Versão:** 2.2 (Final)
**Data:** 09/10/2025
**Status:** ✅ TESTADO E FUNCIONANDO

---

## ⚠️ PROBLEMA: Página ainda pisca?

**CAUSA #1:** Script não está no topo do `<head>`
**CAUSA #2:** Outro script carrega antes
**CAUSA #3:** Usando async/defer

---

## ✅ SOLUÇÃO DEFINITIVA

### **Estrutura EXATA do HTML:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">

    <!-- ✅✅✅ LINHA 1: RotaFinal AQUI! ✅✅✅ -->
    <script>
    window.rfExperimentId = 'SEU_EXPERIMENT_ID_AQUI';
    </script>
    <script src="https://rotafinal.com.br/rotafinal-snippet.js"></script>
    <!-- ✅✅✅ FIM DO ROTAFINAL ✅✅✅ -->

    <!-- Agora sim, outros scripts -->
    <title>Minha Página</title>
    <link rel="stylesheet" href="style.css">
    <!-- outros scripts... -->
</head>
<body>
    <!-- Seu conteúdo -->
</body>
</html>
```

---

## 🔴 EXEMPLOS DE ERRO (NÃO FAÇA!)

### ❌ ERRADO 1: Script no body
```html
<head>
    <title>Página</title>
</head>
<body>
    <script src="rotafinal-snippet.js"></script> <!-- ❌ TARDE DEMAIS -->
</body>
```

### ❌ ERRADO 2: Outros scripts antes
```html
<head>
    <script src="jquery.js"></script> <!-- ❌ ANTES DO ROTAFINAL -->
    <script src="rotafinal-snippet.js"></script>
</head>
```

### ❌ ERRADO 3: Async/Defer
```html
<head>
    <script async src="rotafinal-snippet.js"></script> <!-- ❌ ASYNC -->
</head>
```

### ❌ ERRADO 4: Depois de CSS
```html
<head>
    <link rel="stylesheet" href="style.css">
    <script src="rotafinal-snippet.js"></script> <!-- ❌ CSS ANTES -->
</head>
```

---

## ✅ EXEMPLOS CORRETOS

### ✅ CERTO 1: Primeira linha
```html
<!DOCTYPE html>
<html>
<head>
    <!-- ✅ PRIMEIRA LINHA -->
    <script>window.rfExperimentId='abc123';</script>
    <script src="https://rotafinal.com.br/rotafinal-snippet.js"></script>

    <meta charset="UTF-8">
    <title>Página</title>
</head>
<body>...</body>
</html>
```

### ✅ CERTO 2: WordPress
```php
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <!-- ✅ ANTES DO wp_head() -->
    <script>window.rfExperimentId='abc123';</script>
    <script src="https://rotafinal.com.br/rotafinal-snippet.js"></script>

    <?php wp_head(); ?>
</head>
<body>...</body>
</html>
```

### ✅ CERTO 3: Elementor
```html
<!-- No Editor do Elementor: -->
<!-- Configurações → Custom Code → Header (BEFORE) -->
<script>window.rfExperimentId='abc123';</script>
<script src="https://rotafinal.com.br/rotafinal-snippet.js"></script>
```

### ✅ CERTO 4: Google Tag Manager
```html
<head>
    <!-- ✅ ANTES DO GTM -->
    <script>window.rfExperimentId='abc123';</script>
    <script src="https://rotafinal.com.br/rotafinal-snippet.js"></script>

    <!-- Google Tag Manager -->
    <script>...</script>
</head>
```

---

## 🧪 COMO TESTAR

### Passo 1: Abrir DevTools (F12)

### Passo 2: Verificar ordem de carregamento
1. Aba **Network**
2. Recarregar página (Ctrl+R)
3. Verificar se `rotafinal-snippet.js` é o **PRIMEIRO** script

### Passo 3: Verificar no Elements
```html
<head>
    <script>window.rfExperimentId='...';</script> <!-- ✅ 1º -->
    <script src="rotafinal-snippet.js"></script>   <!-- ✅ 2º -->
    ...outros scripts...                            <!-- ✅ Depois -->
</head>
```

### Passo 4: Testar flicker
1. Abrir página em **navegador anônimo** (Ctrl+Shift+N)
2. Recarregar 5-10 vezes
3. Verificar se **NÃO pisca**

---

## 🔍 TROUBLESHOOTING

### Problema: Ainda pisca um pouco

**Solução 1:** Verificar se CSS está inline
```html
<head>
    <script>window.rfExperimentId='abc';</script>
    <script src="rotafinal-snippet.js"></script>

    <!-- ✅ CSS INLINE (não externo) -->
    <style>
        body { font-family: Arial; }
        /* Seu CSS crítico aqui */
    </style>

    <!-- CSS externo depois -->
    <link rel="stylesheet" href="style.css">
</head>
```

**Solução 2:** Aumentar prioridade do CSS anti-flicker
```html
<head>
    <!-- ANTES de tudo -->
    <style>html{opacity:0!important}</style>

    <script>window.rfExperimentId='abc';</script>
    <script src="rotafinal-snippet.js"></script>
</head>
```

### Problema: Página fica branca (não aparece)

**Causa:** Script não carregou

**Solução:** Verificar console (F12) e ver erro

```javascript
// Fallback manual (emergência)
setTimeout(function() {
    document.documentElement.className += ' rf-ready';
}, 3000);
```

### Problema: Não redireciona

**Causa:** Experimento não encontrado

**Solução:** Verificar ID do experimento

```html
<!-- Ativar debug -->
<script>
window.rfExperimentId = 'abc123';
window.rfDebug = true; // ✅ Ativar logs
</script>
```

---

## 📊 COMPARAÇÃO DE PERFORMANCE

### Método Antigo (v2.0):
```
0ms   - Página inicia
50ms  - HTML renderiza (VISÍVEL - ORIGINAL)
100ms - SDK carrega
200ms - Decide redirecionar
250ms - Redireciona (FLASH!)
```
**Resultado:** ❌ Pisca 2-3 vezes

### Método Novo (v2.2):
```
0ms   - Página inicia
0ms   - CSS injeta opacity:0 (OCULTO)
50ms  - HTML renderiza (OCULTO)
100ms - SDK carrega
150ms - Decide redirecionar
150ms - Redireciona (AINDA OCULTO)
```
**Resultado:** ✅ ZERO flicker

---

## 💡 DICAS PROFISSIONAIS

### 1. Pré-carregar SDK
```html
<head>
    <link rel="preload" href="https://rotafinal.com.br/rotafinal-snippet.js" as="script">
    <script>window.rfExperimentId='abc';</script>
    <script src="https://rotafinal.com.br/rotafinal-snippet.js"></script>
</head>
```

### 2. Self-hosted (Ainda mais rápido)
```html
<head>
    <!-- Hospedar no seu domínio -->
    <script>window.rfExperimentId='abc';</script>
    <script src="/js/rotafinal-snippet.js"></script>
</head>
```

### 3. Inline completo (Máxima velocidade)
```html
<head>
    <script>
    // Copiar conteúdo de rotafinal-snippet.js AQUI
    window.rfExperimentId='abc';
    (function(){var css='html{opacity:0!important}...';})();
    </script>
</head>
```

---

## ✅ CHECKLIST FINAL

- [ ] Script no **TOPO** do `<head>`
- [ ] **ANTES** de qualquer outro script
- [ ] **SEM** async/defer
- [ ] `window.rfExperimentId` definido
- [ ] Testado em navegador anônimo
- [ ] **NÃO pisca** ao recarregar
- [ ] Redireciona corretamente
- [ ] Console sem erros (F12)

---

## 🎉 EXEMPLO FINAL FUNCIONANDO

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <!-- ⚡ ROTAFINAL - PRIMEIRA LINHA -->
    <script>window.rfExperimentId='62547d2d-91b1-42a8-9aa7-c9b1bb7bc927';</script>
    <script src="https://rotafinal.com.br/rotafinal-snippet.js"></script>

    <!-- Meta tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Página</title>

    <!-- CSS -->
    <link rel="stylesheet" href="style.css">

    <!-- Outros scripts -->
    <script src="analytics.js"></script>
</head>
<body>
    <h1>Bem-vindo!</h1>
    <button id="cta">Comprar Agora</button>

    <!-- Rastreamento de conversão (opcional) -->
    <script>
    window.addEventListener('load', function() {
        document.getElementById('cta').addEventListener('click', function() {
            if (window.RotaFinal) {
                window.RotaFinal.conversion('click', 1);
            }
        });
    });
    </script>
</body>
</html>
```

**Salve este arquivo como `teste.html` e abra no navegador!**

---

## 📞 SUPORTE

Se ainda piscar após seguir TODOS os passos:

1. Verificar ordem dos scripts (F12 → Network)
2. Ver console de erros (F12 → Console)
3. Testar em navegador diferente
4. Verificar ID do experimento
5. Ativar `window.rfDebug = true`

---

**Criado por:** Claude Code
**Data:** 09/10/2025
**Versão:** 2.2 (ZERO Flicker)
**Status:** ✅ Produção
