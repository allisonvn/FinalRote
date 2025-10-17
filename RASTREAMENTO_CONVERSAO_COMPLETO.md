# 🎯 RASTREAMENTO DE CONVERSÃO - GUIA COMPLETO

## 📋 Visão Geral

O Rota Final rastreia automaticamente conversões quando visitantes acessam a **"Página de Sucesso"** configurada no experimento. Este documento explica como tudo funciona.

---

## 🔄 FLUXO COMPLETO DE RASTREAMENTO

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. VISITANTE ACESSA PÁGINA ORIGINAL                             │
│    • SDK atribui uma variante (A ou B)                          │
│    • Visitante vê a versão da variante                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. USUÁRIO CONVERTE (acessa página de sucesso)                 │
│    • URL: https://seusite.com/obrigado                         │
│    • SDK detecta a conversão                                    │
│    • Variante está armazenada em localStorage                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONVERSÃO ENVIADA PARA API                                   │
│    • POST /api/track                                            │
│    • Payload: experiment_id, variant_id, event_type, value      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. DADOS SALVOS NO SUPABASE                                     │
│    • Tabela: events                                             │
│    • Tipo: conversion                                           │
│    • Valor: R$ 100.00 (configurado)                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. DADOS APARECEM NO DASHBOARD                                  │
│    • Conversões: +1                                             │
│    • Taxa de Conversão: atualizada                              │
│    • Relatórios de Performance                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ COMO CONFIGURAR

### Etapa 1: Criar um Experimento

No dashboard, clique em "Criar Experimento" e preencha:

**Etapa 1 - Setup:**
```
Nome: "Teste Landing Page"
Descrição: "Otimizar conversões da landing page"
URL da Página: "https://seusite.com/landing"
```

**Etapa 2 - Variantes:**
```
Variante Original: https://seusite.com/landing
Variante A:        https://seusite.com/landing-v2
```

**Etapa 3 - Meta:**
```
Como medir o sucesso: "Acesso a uma página" (página_view)
URL da página de sucesso: "https://seusite.com/obrigado" ✅
Valor da Conversão: R$ 100.00
Algoritmo: Thompson Sampling
```

### Etapa 2: Adicionar o SDK na Página Original

Na sua página de teste (`https://seusite.com/landing`), adicione:

```html
<script>
window.rotaFinalConfig = {
  apiKey: "seu-api-key-aqui",
  apiUrl: "https://rotafinal.com.br/api",
  debug: true
};
</script>
<script src="https://rotafinal.com.br/rotafinal-sdk.js"></script>
```

### Etapa 3: Confirmar Página de Sucesso

A página de sucesso (`https://seusite.com/obrigado`) pode estar em qualquer lugar. O SDK automaticamente rastreará:

```javascript
// O SDK detecta:
if (window.location.href.includes('/obrigado')) {
  // Busca variante em localStorage
  const variantData = localStorage.getItem('rotafinal_assignment');
  
  // Envia conversão
  POST /api/track {
    experiment_id: "exp_123",
    variant_id: "var_456",
    event_type: "conversion",
    value: 100.00
  }
}
```

---

## 📊 CONFIGURAÇÃO NO DASHBOARD

### Visão Geral (Overview Tab)

Ao abrir o experimento, você verá:

```
┌─────────────────────────────────────────┐
│ 📊 CONVERSÕES REGISTRADAS               │
├─────────────────────────────────────────┤
│ • Conversões: 15                         │
│ • Taxa: 3.5%                            │
│ • Valor Total: R$ 1.500,00              │
│ • Página de Sucesso: /obrigado ✅       │
└─────────────────────────────────────────┘
```

### URLs & Config Tab

Detalhes completos sobre conversão:

```
┌─────────────────────────────────────────┐
│ 🎯 PÁGINA DE SUCESSO (CONVERSÃO)        │
├─────────────────────────────────────────┤
│ URL de Conversão:                       │
│ https://seusite.com/obrigado            │
│                                         │
│ Tipo de Conversão:                      │
│ Visualização de Página                  │
│                                         │
│ Valor por Conversão:                    │
│ R$ 100.00                               │
│                                         │
│ ℹ️ Quando visitantes acessam a página   │
│ de sucesso, uma conversão será          │
│ registrada automaticamente.             │
└─────────────────────────────────────────┘
```

---

## 🔍 TIPOS DE CONVERSÃO SUPORTADOS

### 1. Visualização de Página (`page_view`)
Rastreia quando o usuário acessa uma página específica.

**Configuração:**
```
Tipo: Visualização de Página
URL: https://seusite.com/obrigado
```

**Como funciona:**
- SDK verifica `window.location.href`
- Se contém `/obrigado`, registra conversão
- Associa à variante em localStorage

### 2. Clique em Elemento (`click`)
Rastreia quando o usuário clica em um botão/link específico.

**Configuração:**
```
Tipo: Clique em Elemento
Seletor: #botao-comprar
```

### 3. Envio de Formulário (`form_submit`)
Rastreia quando o usuário envia um formulário.

**Configuração:**
```
Tipo: Envio de Formulário
Seletor: #form-contato
```

---

## 💾 DADOS SALVOS NO SUPABASE

### Tabela: `experiments`
```sql
{
  id: "exp_abc123",
  name: "Teste Landing Page",
  target_url: "https://seusite.com/landing",
  conversion_url: "https://seusite.com/obrigado",  ← URL de Sucesso
  conversion_type: "page_view",
  conversion_value: 100.00,
  status: "running",
  algorithm: "thompson_sampling"
}
```

### Tabela: `events`
```sql
{
  id: "evt_xyz789",
  experiment_id: "exp_abc123",
  visitor_id: "rf_visitor_123",
  variant_id: "var_456",
  event_type: "conversion",
  event_name: "conversao",
  value: 100.00,
  created_at: "2025-10-17T10:30:00Z",
  properties: {
    page_url: "https://seusite.com/obrigado",
    page_title: "Obrigado!",
    timestamp: "2025-10-17T10:30:00Z"
  }
}
```

---

## 📱 EXEMPLOS PRÁTICOS

### Exemplo 1: E-commerce

```
1. Visitante acessa: https://loja.com/produto
   → SDK atribui: Variante A
   → Vê: Produto com botão "COMPRE AGORA"

2. Visitante clica em "COMPRE AGORA"
   → Vai para: https://loja.com/checkout

3. Visitante completa compra
   → Acessa: https://loja.com/pedido-confirmado

4. SDK detecta conversão
   → Registra: 1 conversão para Variante A
   → Valor: R$ 199.90 (configurado)
```

### Exemplo 2: Newsletter

```
1. Visitante acessa: https://blog.com/landing
   → SDK atribui: Variante B
   → Vê: Formulário newsletter

2. Visitante preenche formulário
   → Clica: "Inscrever-se"

3. Acessa página de confirmação
   → URL: https://blog.com/inscricao-confirmada

4. SDK detecta conversão
   → Registra: 1 conversão para Variante B
   → Valor: R$ 0.00 (se não configurado)
```

---

## 🚀 INTEGRAÇÃO VIA SDK

### Opção 1: Automática (Recomendado)

O SDK detecta automaticamente. Basta adicionar na página de sucesso:

```html
<script>
window.rotaFinalConfig = {
  apiKey: "pk_test_abc123",
  enableAutoPageView: true  ← Detecta automaticamente
};
</script>
<script src="https://rotafinal.com.br/rotafinal-sdk.js"></script>
```

### Opção 2: Manual

Para maior controle, dispare manualmente:

```javascript
// Na página de sucesso
if (window.rotaFinal) {
  window.rotaFinal.conversion('compra', 199.90, {
    product_id: '12345',
    category: 'eletrônicos'
  });
}
```

---

## 📈 VERIFICAR CONVERSÕES NO DASHBOARD

### Indicadores de Conversão Ativa

```
✅ Conversões > 0      → Rastreamento funcionando
✅ Taxa > 0%            → Dados sendo contabilizados
✅ Valor Total > R$ 0   → Valor sendo registrado
✅ URL de Sucesso       → Página configurada corretamente
```

### Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| Conversões zeradas | SDK não instalado | Adicione script na página |
| Conversões zeradas | URL não corresponde | Verifique a página de sucesso |
| Conversões em 0.0% | Sem visitantes | Aguarde tráfego |
| Valor zerado | conversion_value = 0 | Configure valor na Etapa 3 |

---

## 🔐 DADOS SENSÍVEIS

O rastreamento registra:
- ✅ URL da página
- ✅ Timestamp
- ✅ Variante (A ou B)
- ❌ Dados pessoais do usuário (não captura automático)

---

## 📞 SUPORTE

Para dúvidas sobre rastreamento:

1. **Verificar console do browser**
   ```
   F12 → Console → procurar por "Rota Final" ou "[ConversionTracker]"
   ```

2. **Verificar localStorage**
   ```javascript
   localStorage.getItem('rotafinal_assignment')
   localStorage.getItem('rotafinal_conversion_exp_123')
   ```

3. **Teste manual**
   - Acesse a página original
   - Abra DevTools (F12)
   - Procure por logs "Rota Final"
   - Acesse página de sucesso
   - Verifique se conversão foi registrada

---

**Última atualização:** 17/10/2025  
**Status:** ✅ Implementado e Funcionando
