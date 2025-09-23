# Guia Anti-Flicker - Rota Final

## O que é Anti-Flicker?

Anti-flicker é uma técnica que previne o "flash" de conteúdo original antes da aplicação de variantes em testes A/B. Sem anti-flicker, usuários podem ver brevemente o conteúdo original antes dele mudar para a variante do teste, criando uma experiência ruim.

## Como Funciona

1. **Ocultação Preventiva**: Elementos são ocultados antes de carregar
2. **Carregamento de Variante**: SDK carrega a variante do usuário
3. **Aplicação de Mudanças**: Mudanças são aplicadas com elementos ocultos
4. **Revelação Suave**: Elementos são mostrados com transição suave

## Implementação

### 1. Método Inline (Mais Rápido) ⚡

Adicione este script no `<head>` do seu HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  
  <!-- Anti-Flicker Script (DEVE VIR PRIMEIRO) -->
  <script>
  (function() {
    // Anti-flicker Rota Final
    var s = document.createElement('style');
    s.innerHTML = '.rf-hide{opacity:0 !important;visibility:hidden !important;}body.rf-ready .rf-hide{opacity:1 !important;visibility:visible !important;transition:opacity 200ms,visibility 200ms;}';
    document.head.appendChild(s);
    
    window.rfAntiFlicker = {
      hide: function(sel) {
        try {
          var els = document.querySelectorAll(sel);
          for (var i = 0; i < els.length; i++) {
            els[i].classList.add('rf-hide');
            els[i].setAttribute('data-rf-hidden', 'true');
          }
        } catch(e) {}
      },
      ready: function() {
        document.body.classList.add('rf-ready');
        var els = document.querySelectorAll('[data-rf-hidden="true"]');
        for (var i = 0; i < els.length; i++) {
          els[i].classList.remove('rf-hide');
          els[i].removeAttribute('data-rf-hidden');
        }
        clearTimeout(window.rfTimeout);
      }
    };
    
    // Timeout de segurança (3 segundos)
    window.rfTimeout = setTimeout(function() {
      window.rfAntiFlicker.ready();
    }, 3000);
  })();
  </script>
  
  <!-- Ocultar elementos críticos imediatamente -->
  <script>
    rfAntiFlicker.hide('#hero-section');
    rfAntiFlicker.hide('.pricing-card');
  </script>
  
  <title>Meu Site</title>
</head>
<body>
  <!-- Conteúdo -->
</body>
</html>
```

### 2. Método via SDK

```javascript
import { AntiFlicker } from '@rotafinal/sdk'

// Inicializar anti-flicker
const antiFlicker = new AntiFlicker({
  timeout: 3000, // Timeout em ms
  debug: true // Logs no console
})

antiFlicker.init()

// Ocultar elementos antes de carregar variantes
antiFlicker.hide(['#hero-section', '.pricing-card'])

// Após carregar variante e aplicar mudanças
const variant = await rf.getVariant('hero_test')
// ... aplicar mudanças ...
antiFlicker.ready() // Revelar elementos
```

### 3. Método React/Next.js

```jsx
// _app.tsx ou layout.tsx
import { AntiFlickerProvider } from '@/components/AntiFlickerProvider'

export default function App({ Component, pageProps }) {
  return (
    <AntiFlickerProvider 
      apiKey="pk_live_sua_chave"
      timeout={3000}
      debug={process.env.NODE_ENV === 'development'}
    >
      <Component {...pageProps} />
    </AntiFlickerProvider>
  )
}
```

```jsx
// Componente com teste A/B
import { Experiment } from '@/components/AntiFlickerProvider'

export function HeroSection() {
  return (
    <Experiment
      experimentKey="hero_test"
      hideSelectors={['#hero-section']}
      fallback={<div>Carregando...</div>}
    >
      {({ variant, isControl, conversion }) => (
        <section id="hero-section">
          {isControl ? (
            <h1>Título Original</h1>
          ) : (
            <h1>Novo Título Otimizado!</h1>
          )}
          <button onClick={() => conversion('hero_cta_click')}>
            Começar Agora
          </button>
        </section>
      )}
    </Experiment>
  )
}
```

## Estratégias por Tipo de Teste

### 1. Testes de Texto/Copy

```javascript
// Ocultar apenas o texto que mudará
rfAntiFlicker.hide('h1, .hero-subtitle')

// Aplicar variante
const variant = await rf.getVariant('copy_test')
if (variant.variant_key === 'new_copy') {
  document.querySelector('h1').textContent = 'Novo Título!'
  document.querySelector('.hero-subtitle').textContent = 'Nova descrição'
}

// Revelar
rfAntiFlicker.ready()
```

### 2. Testes de Layout

```javascript
// Ocultar seção inteira
rfAntiFlicker.hide('.pricing-section')

// Aplicar variante
const variant = await rf.getVariant('pricing_layout')
if (variant.variant_key === 'grid_layout') {
  document.querySelector('.pricing-section').className = 'pricing-section grid-layout'
}

// Revelar
rfAntiFlicker.ready()
```

### 3. Testes de Elementos (Mostrar/Ocultar)

```javascript
// Ocultar container pai
rfAntiFlicker.hide('.features-container')

// Aplicar variante
const variant = await rf.getVariant('features_test')
if (variant.variant_key === 'reduced_features') {
  // Ocultar algumas features
  document.querySelectorAll('.feature-item:nth-child(n+4)').forEach(el => {
    el.style.display = 'none'
  })
}

// Revelar
rfAntiFlicker.ready()
```

### 4. Testes de Cor/Estilo

```javascript
// Para mudanças de cor, use CSS classes
rfAntiFlicker.hide('.cta-button')

const variant = await rf.getVariant('button_color')
if (variant.variant_key === 'green_button') {
  document.querySelector('.cta-button').classList.add('variant-green')
}

rfAntiFlicker.ready()
```

## CSS Helpers

Adicione estas classes úteis ao seu CSS:

```css
/* Transições suaves para anti-flicker */
.rf-transition {
  transition: all 300ms ease-in-out;
}

/* Prevenir layout shift */
.rf-no-shift {
  min-height: 100px; /* Ajuste conforme necessário */
  position: relative;
}

/* Loading skeleton */
.rf-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: rf-loading 1.5s infinite;
}

@keyframes rf-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Melhores Práticas

### ✅ DO (Fazer)

1. **Oculte apenas o necessário**: Não oculte a página inteira
2. **Use seletores específicos**: IDs são mais rápidos que classes
3. **Defina timeouts adequados**: 2-3 segundos é geralmente suficiente
4. **Teste em conexões lentas**: Use Chrome DevTools Network throttling
5. **Monitore performance**: Use Lighthouse e Web Vitals

### ❌ DON'T (Não Fazer)

1. **Não oculte navigation/header**: Mantém orientação do usuário
2. **Não use timeouts muito longos**: Máximo 4 segundos
3. **Não esqueça o fallback**: Sempre tenha comportamento padrão
4. **Não oculte conteúdo crítico SEO**: Use com moderação

## Debugging

### Chrome DevTools

```javascript
// No console, verificar elementos ocultos
document.querySelectorAll('[data-rf-hidden="true"]')

// Forçar revelação manual
window.rfAntiFlicker?.ready()

// Verificar se anti-flicker está ativo
document.body.classList.contains('rf-ready')
```

### Logs de Debug

```javascript
const antiFlicker = new AntiFlicker({ debug: true })

// Verá logs como:
// [RF Anti-Flicker] Anti-flicker inicializado
// [RF Anti-Flicker] Ocultados 3 elementos com selector: #hero-section
// [RF Anti-Flicker] Anti-flicker pronto, 3 elementos revelados
```

## Performance Tips

### 1. Server-Side Rendering (SSR)

Para Next.js com SSR:

```jsx
// pages/index.tsx ou app/page.tsx
export async function getServerSideProps(context) {
  // Detectar variante no servidor
  const visitorId = context.req.cookies.rf_visitor_id || generateId()
  const variant = await getVariantServer(visitorId, 'hero_test')
  
  return {
    props: {
      variant,
      antiFlickerScript: AntiFlicker.getInlineScript()
    }
  }
}

// No componente
export default function Page({ variant, antiFlickerScript }) {
  return (
    <>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: antiFlickerScript }} />
      </Head>
      {/* Conteúdo já com variante aplicada */}
    </>
  )
}
```

### 2. Edge Rendering

Use Vercel Edge Functions ou Cloudflare Workers:

```javascript
// middleware.ts
export async function middleware(request) {
  const response = NextResponse.next()
  
  // Injetar anti-flicker via Edge
  if (request.nextUrl.pathname === '/') {
    response.headers.set('x-middleware-cache', 'no-cache')
    
    // Adicionar script anti-flicker inline
    const rewriter = new HTMLRewriter()
    rewriter.on('head', {
      element(element) {
        element.prepend(antiFlickerScript, { html: true })
      }
    })
  }
  
  return response
}
```

### 3. Preload Crítico

```html
<!-- Preload do SDK -->
<link rel="preload" href="/rotafinal-sdk.js" as="script">

<!-- Prefetch de variantes comuns -->
<link rel="prefetch" href="/api/variants/hero_test">
```

## Troubleshooting

### Problema: Flash ainda visível

**Soluções:**
- Mova o script anti-flicker para o início do `<head>`
- Reduza o timeout
- Use seletores mais específicos
- Verifique se o CSS está sendo aplicado

### Problema: Elementos não aparecem

**Soluções:**
- Verifique se `rfAntiFlicker.ready()` está sendo chamado
- Aumente o timeout
- Verifique erros no console
- Confirme que os seletores estão corretos

### Problema: Layout shift

**Soluções:**
- Defina `min-height` nos containers
- Use `aspect-ratio` para imagens
- Reserve espaço com skeletons
- Evite mudanças de altura dinâmicas

## Métricas para Monitorar

Use estas métricas para validar sua implementação:

```javascript
// Web Vitals
import { getCLS, getFID, getLCP } from 'web-vitals'

getCLS(console.log) // Cumulative Layout Shift
getFID(console.log) // First Input Delay  
getLCP(console.log) // Largest Contentful Paint

// Custom metrics
performance.mark('rf-variant-loaded')
performance.measure('rf-anti-flicker-duration', 'rf-init', 'rf-variant-loaded')
```

## Conclusão

Anti-flicker bem implementado é essencial para testes A/B profissionais. Seguindo este guia, você garantirá uma experiência suave para seus usuários enquanto maximiza a validade dos seus testes.
