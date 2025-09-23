# Rota Final SDK - Guia de Uso

## Instalação

### NPM/Yarn
```bash
npm install @rotafinal/sdk
# ou
yarn add @rotafinal/sdk
```

### CDN
```html
<script src="https://cdn.rotafinal.com/sdk/v1/rotafinal.min.js"></script>
```

## Inicialização

### JavaScript/TypeScript
```javascript
import RotaFinal from '@rotafinal/sdk'

const rf = new RotaFinal({
  apiKey: 'pk_live_sua_chave_aqui',
  debug: true, // Ativar logs no console
  enableAutoPageView: true, // Rastrear page views automaticamente
  enableAutoClickTracking: true // Rastrear cliques automaticamente
})
```

### HTML (CDN)
```html
<script>
  window.rf = new RotaFinal({
    apiKey: 'pk_live_sua_chave_aqui'
  })
</script>
```

## Uso Básico

### 1. Obter Variante de um Experimento

```javascript
// Obter variante para o usuário atual
const variant = await rf.getVariant('experimento_homepage')

if (variant) {
  console.log('Variante:', variant.variant_key) // 'control' ou 'variant_b'
  
  // Aplicar lógica baseada na variante
  if (variant.variant_key === 'variant_b') {
    // Mostrar nova versão
    document.getElementById('hero-title').textContent = 'Novo Título!'
  }
}
```

### 2. Rastrear Conversões

```javascript
// Conversão simples
rf.conversion('compra_realizada')

// Conversão com valor
rf.conversion('compra_realizada', 99.90)

// Conversão com propriedades adicionais
rf.conversion('compra_realizada', 99.90, {
  produto: 'Plano Premium',
  metodo_pagamento: 'cartao_credito'
})
```

### 3. Rastrear Eventos Customizados

```javascript
// Evento simples
rf.track('click', 'botao_cta_clicado')

// Evento com propriedades
rf.track('form_submit', 'formulario_lead', {
  campos_preenchidos: 5,
  tempo_preenchimento: 45
})

// Evento com valor
rf.track('video', 'video_assistido', {
  video_id: '12345',
  duracao: 120
}, 120) // valor em segundos
```

### 4. Identificar Usuário (Opcional)

```javascript
// Após login/cadastro
rf.identify('user_12345', {
  nome: 'João Silva',
  email: 'joao@example.com',
  plano: 'premium'
})
```

## Exemplos Avançados

### Teste A/B em React

```jsx
import { useState, useEffect } from 'react'
import rf from './rotafinal' // Instância do SDK

function HeroSection() {
  const [variant, setVariant] = useState(null)
  
  useEffect(() => {
    async function loadVariant() {
      const v = await rf.getVariant('hero_test')
      setVariant(v)
    }
    loadVariant()
  }, [])
  
  const handleClick = () => {
    rf.conversion('hero_cta_clicked')
    // ... resto da lógica
  }
  
  if (!variant) return <div>Carregando...</div>
  
  return (
    <div>
      {variant.variant_key === 'control' ? (
        <h1>Título Original</h1>
      ) : (
        <h1>Novo Título Otimizado!</h1>
      )}
      <button onClick={handleClick}>
        Começar Agora
      </button>
    </div>
  )
}
```

### Teste A/B em Vue.js

```vue
<template>
  <div>
    <h1 v-if="variant === 'control'">Título Original</h1>
    <h1 v-else>Novo Título Otimizado!</h1>
    <button @click="handleConversion">Começar</button>
  </div>
</template>

<script>
import rf from './rotafinal'

export default {
  data() {
    return {
      variant: null
    }
  },
  async mounted() {
    const result = await rf.getVariant('hero_test')
    this.variant = result?.variant_key
  },
  methods: {
    handleConversion() {
      rf.conversion('hero_cta_clicked')
    }
  }
}
</script>
```

### Teste de Preço

```javascript
const variant = await rf.getVariant('teste_preco')

// Configuração pode vir do servidor
const precos = {
  control: 49.90,
  preco_alto: 69.90,
  preco_baixo: 39.90
}

const precoFinal = precos[variant.variant_key] || precos.control

// Mostrar preço
document.getElementById('preco').textContent = `R$ ${precoFinal}`

// Rastrear conversão com valor correto
document.getElementById('comprar').addEventListener('click', () => {
  rf.conversion('compra', precoFinal, {
    variante_preco: variant.variant_key
  })
})
```

### Métricas em Tempo Real

```javascript
// Obter métricas de um experimento
const metrics = await rf.getMetrics('hero_test')

if (metrics) {
  console.log('Total de visitantes:', metrics.summary.total_visitors)
  console.log('Taxa de conversão geral:', metrics.summary.overall_conversion_rate)
  
  // Métricas por variante
  metrics.variants.forEach(v => {
    console.log(`${v.variant_name}: ${v.conversion_rate}% (${v.conversions}/${v.visitors})`)
    
    if (v.significance) {
      console.log(`Confiança: ${v.significance.confidence_level}%`)
      console.log(`Lift: ${v.significance.lift}%`)
    }
  })
}
```

## Configurações Avançadas

### Configuração Completa

```javascript
const rf = new RotaFinal({
  // Obrigatório
  apiKey: 'pk_live_sua_chave',
  
  // Opcional
  apiUrl: 'https://api.custom.com/v1', // URL customizada
  debug: true, // Logs no console
  enableAutoPageView: true, // Auto-rastrear page views
  enableAutoClickTracking: true, // Auto-rastrear cliques
  cookieDomain: '.meusite.com', // Cookie cross-subdomain
  cookieExpiry: 365, // Dias de validade do cookie
  flushInterval: 5000, // Intervalo de envio em ms
  maxBatchSize: 50 // Tamanho máximo do batch
})
```

### Anti-Flicker

Para evitar "flicker" em testes visuais, adicione este snippet no `<head>`:

```html
<style>
  .rf-hide { opacity: 0 !important; }
</style>
<script>
  // Anti-flicker snippet
  (function() {
    var style = document.createElement('style');
    style.innerHTML = '.rf-hide { opacity: 0 !important; }';
    document.head.appendChild(style);
    
    window.rfReady = function() {
      document.body.classList.add('rf-ready');
      var hidden = document.querySelectorAll('.rf-hide');
      hidden.forEach(function(el) {
        el.classList.remove('rf-hide');
      });
    };
    
    // Timeout de segurança
    setTimeout(window.rfReady, 3000);
  })();
</script>
```

Use com:

```javascript
// Esconder elementos até carregar variante
document.getElementById('hero').classList.add('rf-hide')

// Após obter variante
const variant = await rf.getVariant('hero_test')
// Aplicar mudanças...
window.rfReady() // Mostrar elementos
```

## Boas Práticas

1. **Inicialize cedo**: Coloque o SDK no `<head>` ou início do app
2. **Cache de variantes**: O SDK cacheia automaticamente as atribuições
3. **Batch de eventos**: Eventos são enviados em lote para performance
4. **Fallback**: Sempre tenha um comportamento padrão se o SDK falhar
5. **Não bloquear**: Use async/await mas não bloqueie a renderização

## Debugging

### Ativar logs

```javascript
const rf = new RotaFinal({
  apiKey: 'pk_live_...',
  debug: true
})
```

### Verificar eventos

```javascript
// Ver fila de eventos pendentes
console.log(rf.eventQueue)

// Forçar envio
await rf.flush()
```

### Resetar visitante

```javascript
// Criar novo visitor ID (útil para testes)
rf.reset()
```

## Suporte

- Documentação: https://docs.rotafinal.com
- Email: suporte@rotafinal.com
- GitHub: https://github.com/rotafinal/sdk-js
