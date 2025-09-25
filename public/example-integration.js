/**
 * EXEMPLO DE INTEGRAÇÃO - ROTA FINAL A/B TESTING
 *
 * Este arquivo mostra como integrar experimentos A/B em qualquer site
 * usando a plataforma Rota Final.
 */

// CONFIGURAÇÃO BÁSICA - NENHUMA CHAVE NECESSÁRIA!
const rotaFinal = new RotaFinal({
  debug: true // Opcional: ativar logs para desenvolvimento
});

// ==================================================
// EXEMPLO 1: TESTE SIMPLES DE BOTÃO
// ==================================================
async function exemploTesteBoton() {
  try {
    // Obter variante do experimento
    const variant = await rotaFinal.getVariant('teste-botao-principal');

    // Aplicar mudanças baseadas na variante
    const button = document.querySelector('#cta-button');

    switch(variant) {
      case 'control':
        // Versão original - sem mudanças
        break;

      case 'variant-a':
        button.textContent = 'Experimente Grátis Agora!';
        button.style.backgroundColor = '#28a745';
        break;

      case 'variant-b':
        button.textContent = 'Comece Sua Jornada';
        button.style.backgroundColor = '#dc3545';
        button.style.fontSize = '18px';
        break;
    }

    // Registrar evento quando usuário clica
    button.addEventListener('click', () => {
      rotaFinal.conversion('button_click', 1);
    });

  } catch (error) {
    console.error('Erro no teste A/B:', error);
    // Em caso de erro, manter versão original
  }
}

// ==================================================
// EXEMPLO 2: TESTE DE HEADLINES/TÍTULOS
// ==================================================
async function exemploTesteHeadline() {
  const variant = await rotaFinal.getVariant('teste-headline-principal');

  const headlines = {
    control: 'Aumente Suas Vendas com Marketing Digital',
    'variant-a': 'Dobre Sua Receita em 90 Dias',
    'variant-b': 'Transforme Visitantes em Clientes Pagantes'
  };

  const headlineElement = document.querySelector('h1.hero-title');
  if (headlineElement && headlines[variant]) {
    headlineElement.textContent = headlines[variant];
  }
}

// ==================================================
// EXEMPLO 3: TESTE DE SPLIT URL (PÁGINAS DIFERENTES)
// ==================================================
async function exemploSplitURL() {
  const variant = await rotaFinal.getVariant('teste-landing-page');

  // Redirecionar para páginas diferentes baseadas na variante
  const urls = {
    control: '/landing-original',
    'variant-a': '/landing-minimalista',
    'variant-b': '/landing-detalhada'
  };

  if (variant !== 'control' && urls[variant]) {
    // Só redireciona se não estivermos já na URL correta
    if (!window.location.pathname.includes(urls[variant])) {
      window.location.href = urls[variant];
      return;
    }
  }

  // Registrar visualização da página
  rotaFinal.conversion('page_view', 1);
}

// ==================================================
// EXEMPLO 4: TESTE COM MÚLTIPLOS ELEMENTOS
// ==================================================
async function exemploTesteCompleto() {
  const variant = await rotaFinal.getVariant('teste-completo-homepage');

  const configurations = {
    control: {
      buttonText: 'Saiba Mais',
      buttonColor: '#007bff',
      headline: 'Solução Completa para Seu Negócio',
      showTestimonials: true
    },
    'variant-a': {
      buttonText: 'Quero Começar Agora!',
      buttonColor: '#28a745',
      headline: 'Revolucione Seu Negócio Hoje',
      showTestimonials: false
    },
    'variant-b': {
      buttonText: 'Experimente Gratuitamente',
      buttonColor: '#ffc107',
      headline: 'A Ferramenta que Você Estava Esperando',
      showTestimonials: true
    }
  };

  const config = configurations[variant] || configurations.control;

  // Aplicar configurações
  document.querySelector('#cta-button').textContent = config.buttonText;
  document.querySelector('#cta-button').style.backgroundColor = config.buttonColor;
  document.querySelector('.hero-headline').textContent = config.headline;

  // Mostrar/esconder depoimentos
  const testimonials = document.querySelector('.testimonials-section');
  if (testimonials) {
    testimonials.style.display = config.showTestimonials ? 'block' : 'none';
  }
}

// ==================================================
// EXEMPLO 5: RASTREAMENTO DE CONVERSÕES AVANÇADO
// ==================================================

// Rastrear formulário de contato
document.querySelector('#contact-form')?.addEventListener('submit', (e) => {
  rotaFinal.conversion('form_submission', 1, {
    form_type: 'contact',
    page: window.location.pathname
  });
});

// Rastrear cliques em links importantes
document.querySelectorAll('.track-click').forEach(element => {
  element.addEventListener('click', () => {
    rotaFinal.conversion('important_click', 1, {
      element: element.textContent,
      url: element.href,
      position: element.getBoundingClientRect()
    });
  });
});

// Rastrear scroll profundidade (engajamento)
let maxScroll = 0;
window.addEventListener('scroll', () => {
  const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

  if (scrollPercent > maxScroll) {
    maxScroll = Math.floor(scrollPercent / 25) * 25; // 0%, 25%, 50%, 75%, 100%

    if ([25, 50, 75, 100].includes(maxScroll)) {
      rotaFinal.conversion('scroll_depth', maxScroll / 100, {
        depth: `${maxScroll}%`
      });
    }
  }
});

// ==================================================
// EXEMPLO 6: ANTI-FLICKER E PERFORMANCE
// ==================================================

// Aplicar CSS anti-flicker antes do carregamento
const antiFlickerCSS = `
  .rf-hide {
    opacity: 0 !important;
    transition: none !important;
  }
  .rf-show {
    opacity: 1 !important;
    transition: opacity 0.3s ease-in-out !important;
  }
`;

// Inserir CSS
const style = document.createElement('style');
style.textContent = antiFlickerCSS;
document.head.appendChild(style);

// Esconder elementos que podem ter flicker
document.querySelectorAll('.experiment-element').forEach(el => {
  el.classList.add('rf-hide');
});

// Função para mostrar elementos após aplicar variante
function showExperimentElements() {
  document.querySelectorAll('.rf-hide').forEach(el => {
    el.classList.remove('rf-hide');
    el.classList.add('rf-show');
  });
}

// ==================================================
// INICIALIZAÇÃO E EXECUÇÃO
// ==================================================

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Executar experimentos em paralelo
    await Promise.all([
      exemploTesteBoton(),
      exemploTesteHeadline(),
      exemploTesteCompleto()
    ]);

    // Mostrar elementos após todos os experimentos aplicados
    showExperimentElements();

    console.log('✅ Todos os experimentos A/B foram aplicados com sucesso');

  } catch (error) {
    console.error('❌ Erro ao aplicar experimentos:', error);
    // Em caso de erro, mostrar versão original
    showExperimentElements();
  }
});

// ==================================================
// UTILITÁRIOS AVANÇADOS
// ==================================================

// Função para criar experimentos condicionais
async function exemploCondicional() {
  // Só executar experimento para visitantes de uma fonte específica
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get('utm_source');

  if (source === 'google-ads') {
    const variant = await rotaFinal.getVariant('teste-apenas-google-ads');
    // ... aplicar variante
  }
}

// Função para testes com base em segmentação
async function exemploSegmentado() {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  if (isMobile) {
    const variant = await rotaFinal.getVariant('teste-mobile');
    // ... aplicar variante específica para mobile
  } else {
    const variant = await rotaFinal.getVariant('teste-desktop');
    // ... aplicar variante específica para desktop
  }
}

// Função para limpar cache em desenvolvimento
function limparCache() {
  localStorage.removeItem('rf_user_id');
  rotaFinal.cache.clear();
  location.reload();
}

// Tornar função disponível globalmente para debug
window.rotaFinal = rotaFinal;
window.limparCacheRotaFinal = limparCache;

console.log('🚀 Rota Final A/B Testing carregado! Use window.rotaFinal para debug.');