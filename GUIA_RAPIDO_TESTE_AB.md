# 🚀 GUIA RÁPIDO - TESTE A/B FUNCIONANDO

## ✅ O QUE FOI CORRIGIDO

Todos os problemas foram resolvidos! Agora o teste A/B funciona **100% automaticamente** em todos os tipos de experimento.

### 🔧 Principais Correções:
1. ✅ **API Key incluída** - Todas as requisições agora funcionam
2. ✅ **Código JavaScript completo** - Sem erros de sintaxe
3. ✅ **Aplicação automática** - CSS, JS e mudanças DOM aplicadas automaticamente
4. ✅ **Debug completo** - Logs detalhados para troubleshooting
5. ✅ **Consistência garantida** - Mesmo usuário sempre vê a mesma variante

---

## 🎯 COMO USAR (3 PASSOS)

### **Passo 1: Gerar Código Novamente**
1. Acesse o dashboard do Rota Final
2. Abra seu experimento
3. Clique para gerar o código novamente
4. **IMPORTANTE:** O código antigo não funcionava - precisa gerar novo!

### **Passo 2: Colar no Site**
```html
<!-- Cole no <head> da sua página -->
<head>
    <!-- Seu código existente -->
    
    <!-- CSS Anti-Flicker (ANTES do script) -->
    <style data-rf-antiflicker>
    html:not([data-rf-ready]){opacity:0!important;visibility:hidden!important}
    html[data-rf-ready]{opacity:1!important;visibility:visible!important}
    </style>
    
    <!-- Código do Experimento -->
    <script>
    !function(){"use strict";var experimentId="...",baseUrl="...",apiKey="..."...
    </script>
</head>
```

### **Passo 3: Testar**
1. Abra seu site em um navegador
2. Abra o Console (F12)
3. Procure por logs `[RotaFinal]`
4. Teste em modo anônimo - deve ver variante diferente

---

## 🧪 TIPOS DE EXPERIMENTO

### **1. Redirecionamento** (Mais Simples)
**Use quando:** Quer testar páginas completamente diferentes

**Como configurar:**
1. Crie variantes no dashboard
2. Configure `redirect_url` em cada variante
3. Cole o código no site original
4. **Pronto!** O redirecionamento é automático

**Exemplo:**
- Controle: Fica na página atual (`/produto`)
- Variante A: Redireciona para `/produto-v2`
- Variante B: Redireciona para `/produto-promo`

**Como funciona:**
```javascript
// Automático! Não precisa fazer nada
if(variant.redirect_url){
    window.location.href=variant.redirect_url
}
```

---

### **2. Elemento** (Mais Poderoso)
**Use quando:** Quer testar mudanças específicas na página (botões, textos, cores)

**Como configurar:**
1. Crie variantes no dashboard
2. Adicione CSS customizado OU JS customizado OU mudanças em elementos
3. Cole o código no site
4. **Pronto!** As mudanças são aplicadas automaticamente

**Exemplo de CSS:**
```css
#cta-button {
    background: #10b981 !important;
    font-size: 24px !important;
    padding: 20px 40px !important;
}
```

**Exemplo de JS:**
```javascript
document.querySelector('#cta-button').textContent = 'Compre Agora - 50% OFF!'
```

**Exemplo de Mudanças em Elementos:**
```json
{
  "elements": [
    {
      "selector": "#hero-title",
      "text": "Oferta Especial - Hoje 70% OFF!"
    },
    {
      "selector": "#cta-button",
      "style": {
        "background": "#ef4444",
        "fontSize": "22px"
      }
    }
  ]
}
```

**Como funciona:**
- **CSS:** Injeta `<style>` no `<head>`
- **JS:** Executa código automaticamente
- **Elementos:** Modifica DOM automaticamente

---

### **3. Split URL**
**Use quando:** Quer testar diferentes versões da mesma página

Similar ao redirecionamento, mas para variações da mesma URL.

---

## 🎨 EXEMPLOS PRÁTICOS

### **Exemplo 1: Testar 2 Títulos Diferentes**

**Tipo:** Element

**Variante Controle:**
```json
{
  "elements": [
    {
      "selector": "h1",
      "text": "Compre Agora"
    }
  ]
}
```

**Variante A:**
```json
{
  "elements": [
    {
      "selector": "h1",
      "text": "Oferta Especial - 50% OFF"
    }
  ]
}
```

**Resultado:** Metade dos visitantes vê cada título.

---

### **Exemplo 2: Testar Cor do Botão**

**Tipo:** Element

**Variante Controle:** (Sem mudanças - botão original)

**Variante A (CSS):**
```css
.btn-primary {
    background: #10b981 !important;
}
```

**Variante B (CSS):**
```css
.btn-primary {
    background: #ef4444 !important;
}
```

**Resultado:** 33% vê cada cor de botão.

---

### **Exemplo 3: Redirecionar para Landing Page**

**Tipo:** Redirect

**Configuração:**
- Controle: Sem redirect (fica na página atual)
- Variante A: `redirect_url: "https://seusite.com/landing-promo"`
- Variante B: `redirect_url: "https://seusite.com/landing-urgencia"`

**Resultado:** 
- 33% vê a página original
- 33% é redirecionado para landing-promo
- 33% é redirecionado para landing-urgencia

---

## 🔍 COMO VERIFICAR SE ESTÁ FUNCIONANDO

### **1. Console do Navegador**
Abra o console (F12) e procure por:

```
[RotaFinal] Initializing experiment
[RotaFinal] API Call
[RotaFinal] API Response
[RotaFinal] Variant assigned: Variante A
[RotaFinal] Applying variant
[RotaFinal] Initialization complete
```

Se vir esses logs, **está funcionando!** ✅

---

### **2. Atributos HTML**
Inspecione o elemento `<html>`:

```html
<html data-rf-ready="true" 
      data-rf-experiment="defb3829-e9bb-..." 
      data-rf-variant="Variante A"
      data-rf-user="rf_abc123...">
```

Se vir esses atributos, **está funcionando!** ✅

---

### **3. LocalStorage**
No console, execute:

```javascript
localStorage.getItem('rf_user_id')
// Deve retornar algo como: "rf_abc123_xyz789"
```

Se retornar um ID, **está funcionando!** ✅

---

### **4. Dashboard**
1. Vá para o dashboard
2. Abra seu experimento
3. Verifique a aba "Analytics"
4. Deve ver visitantes e eventos sendo registrados

Se vir dados, **está funcionando!** ✅

---

## 🐛 PROBLEMAS COMUNS

### ❌ **"Nenhuma variante atribuída"**

**Verificar:**
```javascript
// 1. API key está no código?
console.log(document.scripts[1].textContent.includes('apiKey=""'))
// Se true, está vazio! Gere o código novamente.

// 2. Experimento está rodando?
// Veja no dashboard se status = "running"
```

**Solução:** 
1. Certifique-se que o experimento está com status "running"
2. Gere o código novamente do dashboard
3. Cole o novo código no site

---

### ❌ **"Vejo a mesma variante em todos os navegadores"**

**Isso é normal se:**
- Você está usando o mesmo User ID (mesmo localStorage)
- Você copiou cookies entre navegadores

**Solução para testar variantes diferentes:**
1. Abra em **modo anônimo** (Ctrl+Shift+N)
2. Ou limpe o localStorage: `localStorage.clear()`
3. Ou use navegadores diferentes
4. Cada sessão nova pode ver uma variante diferente

---

### ❌ **"Erro HTTP 401 ou 403"**

**Causa:** API key inválida ou experimento sem permissão

**Solução:**
1. Gere o código novamente (API key pode ter mudado)
2. Verifique se o experimento existe no banco
3. Verifique se o experimento tem `api_key` definido

---

### ❌ **"CSS não está sendo aplicado"**

**Causa:** Experimento não é do tipo "element"

**Solução:**
1. No dashboard, edite o experimento
2. Mude o tipo para "Element"
3. Gere o código novamente

---

### ❌ **"Redirecionamento não funciona"**

**Causa:** Campo `redirect_url` vazio

**Solução:**
1. Edite a variante no dashboard
2. Adicione URL válida em "Redirect URL"
3. Salve e teste novamente

---

## 🧪 USAR PÁGINA DE TESTE

Criamos uma página especial para testar:

```bash
# Abra o arquivo
open test-ab-corrected.html
```

**Recursos da página:**
- ✅ Checklist automático
- ✅ Logs em tempo real
- ✅ Botões de teste (conversão, eventos)
- ✅ Informações da variante
- ✅ Simular novo usuário

**Como usar:**
1. Gere o código do seu experimento
2. Cole no final do arquivo `test-ab-corrected.html`
3. Abra no navegador
4. Veja todos os detalhes e logs

---

## 📊 TRACKING DE CONVERSÕES

### **Conversão Manual**
Cole onde o usuário converte:

```javascript
// Exemplo: Após compra confirmada
window.RotaFinal.convert(100, { 
    product: 'produto-x',
    orderId: '12345'
})
```

### **Conversão por Clique**
Adicione atributo no elemento:

```html
<button data-rf-track="purchase" data-rf-value="100">
    Finalizar Compra
</button>
```

### **Conversão Automática**
Configure no dashboard:
- **Por URL:** Quando usuário acessa `/obrigado`
- **Por Seletor:** Quando clica em `#buy-button`
- **Por Evento:** Quando dispara evento customizado

---

## ✅ CHECKLIST FINAL

Antes de colocar em produção:

- [ ] Experimento com status "running"
- [ ] Múltiplas variantes ativas
- [ ] Traffic percentage soma 100%
- [ ] Código gerado novamente (com correções)
- [ ] Testado em modo anônimo
- [ ] Testado em múltiplos navegadores
- [ ] Console sem erros
- [ ] Dados aparecendo no dashboard
- [ ] Anti-flicker CSS funcionando (sem "flash")

---

## 🎉 PRONTO!

Seu teste A/B está funcionando! 

**Dúvidas?** Abra o console e procure por logs `[RotaFinal]` para debug.

**Problemas?** Consulte `CORRECOES_AB_COMPLETAS.md` para troubleshooting detalhado.

---

**Última atualização:** 02/10/2025

