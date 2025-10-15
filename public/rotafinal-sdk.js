/**
 * RotaFinal SDK - v2.1 - ANTI-FLICKER
 * SDK para integração com a plataforma de experimentos A/B
 * Suporta múltiplas páginas por variante + Sistema anti-flicker
 */

// ========================================
// PARTE 1: ANTI-FLICKER (SÍNCRONO)
// DEVE SER EXECUTADO ANTES DO SDK
// ========================================
(function() {
  'use strict';

  // Injetar CSS anti-flicker IMEDIATAMENTE
  const style = document.createElement('style');
  style.id = 'rf-anti-flicker';
  style.textContent = `
    /* Anti-flicker: oculta body até SDK estar pronto */
    body.rf-loading {
      opacity: 0 !important;
      transition: none !important;
    }

    /* Quando SDK estiver pronto, mostra com transição suave */
    body.rf-ready {
      opacity: 1 !important;
      transition: opacity 0.2s ease-in !important;
    }

    /* Fallback: após 3 segundos mostra mesmo se SDK falhar */
    body.rf-timeout {
      opacity: 1 !important;
    }
  `;

  // Injetar CSS no HEAD o mais cedo possível
  const head = document.head || document.getElementsByTagName('head')[0];
  head.insertBefore(style, head.firstChild);

  // Aplicar classe no body IMEDIATAMENTE
  if (document.body) {
    document.body.classList.add('rf-loading');
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.classList.add('rf-loading');
    });
  }

  // Timeout de segurança: mostrar página após 3 segundos mesmo se SDK falhar
  setTimeout(function() {
    if (document.body && document.body.classList.contains('rf-loading')) {
      document.body.classList.remove('rf-loading');
      document.body.classList.add('rf-timeout');
      console.warn('RotaFinal: Anti-flicker timeout reached, showing page');
    }
  }, 3000);

  // API para o SDK marcar como pronto
  window.rfAntiFlicker = {
    ready: function() {
      if (document.body) {
        document.body.classList.remove('rf-loading');
        document.body.classList.add('rf-ready');
      }
    },
    hide: function() {
      if (document.body) {
        document.body.classList.add('rf-loading');
        document.body.classList.remove('rf-ready');
      }
    }
  };
})();

// ========================================
// PARTE 2: SDK PRINCIPAL
// ========================================

class RotaFinal {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.debug = options.debug || false;
    this.baseUrl = options.baseUrl || 'https://rotafinal.com.br';
    this.cache = new Map();
    this.userId = this.getUserId();
    this.antiFlickerTimeout = options.antiFlickerTimeout || 3000;

    // Inicializar captura de UTMs
    this.initUTMCapture();

    if (this.debug) {
      console.log('RotaFinal SDK v2.1 initialized:', { userId: this.userId, debug: this.debug });
    }
  }

  /**
   * Gera ou recupera ID único do usuário
   */
  getUserId() {
    let userId = localStorage.getItem('rf_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('rf_user_id', userId);
    }
    return userId;
  }

  /**
   * Obtém variante de um experimento
   */
  async getVariant(experimentIdOrKey, options = {}) {
    try {
      // Verificar cache primeiro
      const cacheKey = `${experimentIdOrKey}_${this.userId}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < (options.cacheTime || 300000)) {
          if (this.debug) console.log('RotaFinal: Using cached variant', cached.variant);
          return cached.variant;
        }
      }

      const response = await fetch(`${this.baseUrl}/api/experiments/${experimentIdOrKey}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RF-Version': '2.1'
        },
        body: JSON.stringify({
          visitor_id: this.userId,
          user_agent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (this.debug) {
        console.log('RotaFinal: Assignment response:', data);
      }

      const variantData = {
        id: data.variant.id,
        name: data.variant.name,
        description: data.variant.description,
        isControl: data.variant.is_control,
        redirectUrl: data.variant.redirect_url,
        finalUrl: data.variant.final_url,
        hasMultiplePages: data.variant.has_multiple_pages || false,
        cssChanges: data.variant.css_changes,
        jsChanges: data.variant.js_changes,
        changes: data.variant.changes,
        assignment: data.assignment,
        algorithm: data.algorithm,
        mabEnabled: data.mab_enabled
      };

      // Cachear resultado
      this.cache.set(cacheKey, {
        variant: variantData,
        timestamp: Date.now()
      });

      return variantData;
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error loading variant', error);

      // Retornar controle em caso de erro
      return {
        name: options.defaultVariant || 'control',
        isControl: true,
        redirectUrl: null,
        finalUrl: null,
        hasMultiplePages: false,
        error: true
      };
    }
  }

  /**
   * Executa experimento com anti-flicker
   */
  async runExperiment(experimentId, options = {}) {
    try {
      // Verificar se já foi redirecionado (evitar loop)
      const redirectKey = `rf_redirected_${experimentId}`;
      const wasRedirected = sessionStorage.getItem(redirectKey);

      if (wasRedirected === 'true') {
        if (this.debug) console.log('RotaFinal: Already redirected, showing page');
        window.rfAntiFlicker.ready();
        return null;
      }

      if (this.debug) {
        console.log('RotaFinal: Running experiment', experimentId);
      }

      const variant = await this.getVariant(experimentId, options);

      if (this.debug) {
        console.log('RotaFinal: Variant assigned:', variant.name);
      }

      // Aplicar mudanças visuais se houver
      if (variant.cssChanges && options.applyStyles !== false) {
        this.applyCSSChanges(variant.cssChanges);
      }

      if (variant.jsChanges && options.applyScripts !== false) {
        this.applyJSChanges(variant.jsChanges);
      }

      // Verificar se precisa redirecionar
      if (options.autoRedirect !== false) {
        const redirectUrl = variant.finalUrl || variant.redirectUrl;
        const currentUrl = window.location.href.split('?')[0].split('#')[0];
        const targetUrl = redirectUrl ? redirectUrl.split('?')[0].split('#')[0] : null;

        if (redirectUrl && targetUrl !== currentUrl) {
          // Verificar se não é controle ou se forceRedirect está ativo
          if (!variant.isControl || options.forceRedirect) {
            if (this.debug) {
              console.log('RotaFinal: Redirecting to:', redirectUrl);
              console.log('RotaFinal: From:', currentUrl);
            }

            // Salvar info do experimento e marcar como redirecionado
            sessionStorage.setItem('rf_current_experiment', experimentId);
            sessionStorage.setItem('rf_current_variant', variant.id);
            sessionStorage.setItem('rf_current_variant_name', variant.name); // ✅ CORREÇÃO: Salvar nome também
            sessionStorage.setItem(redirectKey, 'true');

            // Redirecionar IMEDIATAMENTE (sem mostrar página)
            window.location.replace(redirectUrl);

            // Retornar para evitar executar resto do código
            return variant;
          }
        }
      }

      // Se chegou aqui, não vai redirecionar - mostrar página
      window.rfAntiFlicker.ready();

      // Callback personalizado
      if (options.onVariant) {
        options.onVariant(variant);
      }

      // Aplicar seletores DOM se fornecidos
      if (options.selectors) {
        this.applyVariant(experimentId, variant.name, options.selectors);
      }

      return variant;
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error running experiment', error);

      // Em caso de erro, mostrar página
      window.rfAntiFlicker.ready();
      return null;
    }
  }

  /**
   * Aplica mudanças CSS
   */
  applyCSSChanges(css) {
    if (!css) return;

    const style = document.createElement('style');
    style.setAttribute('data-rf-styles', 'true');
    style.textContent = css;
    document.head.appendChild(style);

    if (this.debug) console.log('RotaFinal: CSS changes applied');
  }

  /**
   * Aplica mudanças JavaScript
   */
  applyJSChanges(js) {
    if (!js) return;

    try {
      const script = document.createElement('script');
      script.setAttribute('data-rf-script', 'true');
      script.textContent = js;
      document.body.appendChild(script);

      if (this.debug) console.log('RotaFinal: JS changes applied');
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error applying JS changes', error);
    }
  }

  /**
   * Rastreia evento personalizado
   */
  async track(eventName, properties = {}) {
    try {
      const utmData = this.getUTMData ? this.getUTMData() : {};
      const currentExperiment = sessionStorage.getItem('rf_current_experiment');
      const currentVariant = sessionStorage.getItem('rf_current_variant');
      const currentVariantName = sessionStorage.getItem('rf_current_variant_name');

      const enrichedProperties = {
        ...properties,
        ...utmData,
        ...(currentExperiment && { experiment_id: currentExperiment }),
        ...(currentVariant && { variant_id: currentVariant }),
        ...(currentVariantName && { variant: currentVariantName })
      };

      const response = await fetch(`${this.baseUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experiment_id: currentExperiment,
          visitor_id: this.userId,
          variant_id: currentVariant, // ✅ CORREÇÃO: Enviar variant_id
          event_type: 'custom',
          properties: enrichedProperties,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (this.debug) console.log('RotaFinal: Event tracked', { eventName, properties: enrichedProperties });

      return await response.json();
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error tracking event', error);
      return null;
    }
  }

  /**
   * Rastreia conversão
   */
  async conversion(eventName, value = null, properties = {}) {
    try {
      const utmData = this.getUTMData ? this.getUTMData() : {};
      const currentExperiment = sessionStorage.getItem('rf_current_experiment');
      const currentVariant = sessionStorage.getItem('rf_current_variant');
      const currentVariantName = sessionStorage.getItem('rf_current_variant_name');

      const enrichedProperties = {
        ...properties,
        ...utmData
      };

      const response = await fetch(`${this.baseUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experiment_id: currentExperiment,
          visitor_id: this.userId,
          variant_id: currentVariant, // ✅ CORREÇÃO: Enviar variant_id
          variant: currentVariantName, // Fallback para compatibilidade
          event_type: 'conversion',
          value: value,
          properties: enrichedProperties,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (this.debug) console.log('RotaFinal: Conversion tracked', { eventName, value, variant_id: currentVariant });

      return await response.json();
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error tracking conversion', error);
      return null;
    }
  }

  /**
   * Aplica variante a elementos DOM
   */
  applyVariant(experimentKey, variant, selectors = {}) {
    const elements = document.querySelectorAll(selectors[variant] || selectors.control);
    elements.forEach(el => {
      el.style.display = 'block';
      el.classList.add('rf-variant', `rf-${variant}`);
    });

    Object.keys(selectors).forEach(v => {
      if (v !== variant) {
        const otherElements = document.querySelectorAll(selectors[v]);
        otherElements.forEach(el => {
          el.style.display = 'none';
        });
      }
    });

    if (this.debug) console.log('RotaFinal: Applied variant', { experimentKey, variant });
  }

  /**
   * Inicializa captura de UTMs com first-touch attribution
   * ✅ CORREÇÃO: Só salva UTM se não existir (preserva primeira origem)
   */
  initUTMCapture() {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'src', 'sck', 'msclkid', 'ttclid'
    ];

    let hasUTMs = false;

    utmParams.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        const existingValue = localStorage.getItem(`rf_${param}`) || this.getCookie(param);
        
        // ✅ CORREÇÃO: Só salva se não existir (first-touch attribution)
        if (!existingValue) {
          const sanitizedValue = this.sanitizeUTMValue(value, param);
          localStorage.setItem(`rf_${param}`, sanitizedValue);
          this.setCookie(param, sanitizedValue, 30);
          hasUTMs = true;
          
          if (this.debug) {
            console.log('RotaFinal: Salvando primeira origem UTM:', param, sanitizedValue);
          }
        } else if (this.debug) {
          console.log('RotaFinal: Preservando origem original:', param, existingValue);
        }
      }
    });

    if (hasUTMs && window.history && window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  sanitizeUTMValue(value, param) {
    if (!value) return value;
    if (['utm_source', 'utm_medium', 'utm_campaign'].includes(param)) {
      return value.trim().replace(/\s+/g, '_');
    }
    return value.trim();
  }

  setCookie(name, value, days) {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; Secure; SameSite=Lax`;
  }

  getCookie(name) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  getUTMData() {
    if (typeof window === 'undefined') return {};
    const utmData = {};
    const utmParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'src', 'sck', 'msclkid', 'ttclid'
    ];

    utmParams.forEach(param => {
      const value = localStorage.getItem(`rf_${param}`) || this.getCookie(param);
      if (value) {
        utmData[param] = value;
      }
    });

    return utmData;
  }

  getUTMParams() {
    return this.getUTMData();
  }

  getUTMParam(param) {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`rf_${param}`) || this.getCookie(param);
  }

  clearUTMParams() {
    if (typeof window === 'undefined') return;
    const utmParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'src', 'sck', 'msclkid', 'ttclid'
    ];

    utmParams.forEach(param => {
      localStorage.removeItem(`rf_${param}`);
      if (typeof document !== 'undefined') {
        document.cookie = `${param}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RotaFinal;
} else if (typeof window !== 'undefined') {
  window.RotaFinal = RotaFinal;
}
