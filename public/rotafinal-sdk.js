/**
 * RotaFinal SDK - v2.0
 * SDK para integração com a plataforma de experimentos A/B
 * Suporta múltiplas páginas por variante
 */

class RotaFinal {
  constructor(options = {}) {
    this.apiKey = options.apiKey; // Opcional - mantido para compatibilidade
    this.debug = options.debug || false;
    this.baseUrl = options.baseUrl || 'https://rotafinal.com.br';
    this.cache = new Map();
    this.userId = this.getUserId();
    
    // Inicializar captura de UTMs
    this.initUTMCapture();
    
    if (this.debug) {
      console.log('RotaFinal SDK v2.0 initialized:', { userId: this.userId, debug: this.debug });
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
   * Obtém variante de um experimento (ATUALIZADO - v2.0)
   * Agora suporta experimentos por ID e múltiplas páginas
   */
  async getVariant(experimentIdOrKey, options = {}) {
    try {
      // Verificar cache primeiro
      const cacheKey = `${experimentIdOrKey}_${this.userId}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < (options.cacheTime || 300000)) { // 5 min default
          if (this.debug) console.log('RotaFinal: Using cached variant', cached.variant);
          return cached.variant;
        }
      }

      // ✅ NOVO: Usar endpoint correto /api/experiments/[id]/assign
      const response = await fetch(`${this.baseUrl}/api/experiments/${experimentIdOrKey}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RF-Version': '2.0'
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
        if (this.debug) console.error('RotaFinal: HTTP error', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (this.debug) {
        console.log('RotaFinal: Assignment response:', data);
        console.log('RotaFinal: Has multiple pages:', data.variant?.has_multiple_pages);
        console.log('RotaFinal: Final URL:', data.variant?.final_url);
      }
      
      // ✅ NOVO: Estrutura completa da variante com suporte a múltiplas páginas
      const variantData = {
        id: data.variant.id,
        name: data.variant.name,
        description: data.variant.description,
        isControl: data.variant.is_control,
        redirectUrl: data.variant.redirect_url,
        finalUrl: data.variant.final_url, // ✅ URL final selecionada (pode ser diferente se multipage)
        hasMultiplePages: data.variant.has_multiple_pages || false, // ✅ Indica se tem múltiplas páginas
        cssChanges: data.variant.css_changes,
        jsChanges: data.variant.js_changes,
        changes: data.variant.changes,
        assignment: data.assignment, // 'new' ou 'existing'
        algorithm: data.algorithm, // Algoritmo usado
        mabEnabled: data.mab_enabled // Se MAB está ativo
      };
      
      // Cachear resultado
      this.cache.set(cacheKey, {
        variant: variantData,
        timestamp: Date.now()
      });

      if (this.debug) console.log('RotaFinal: Assigned variant', variantData);
      
      return variantData;
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error getting variant', error);
      
      // Retornar controle padrão em caso de erro
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
   * ✅ NOVO: Executa experimento e aplica redirecionamento automaticamente
   * Suporta múltiplas páginas por variante
   */
  async runExperiment(experimentId, options = {}) {
    try {
      const variant = await this.getVariant(experimentId, options);
      
      if (this.debug) {
        console.log('RotaFinal: Running experiment', experimentId);
        console.log('RotaFinal: Variant data:', variant);
      }

      // ✅ Aplicar mudanças visuais se houver
      if (variant.cssChanges && options.applyStyles !== false) {
        this.applyCSSChanges(variant.cssChanges);
      }

      if (variant.jsChanges && options.applyScripts !== false) {
        this.applyJSChanges(variant.jsChanges);
      }

      // ✅ NOVO: Redirecionamento inteligente para múltiplas páginas
      if (options.autoRedirect !== false) {
        const redirectUrl = variant.finalUrl || variant.redirectUrl;
        
        if (redirectUrl && redirectUrl !== window.location.href) {
          // Verificar se não é controle ou se forceRedirect está ativo
          if (!variant.isControl || options.forceRedirect) {
            if (this.debug) {
              console.log('RotaFinal: Redirecting to:', redirectUrl);
              console.log('RotaFinal: Multiple pages:', variant.hasMultiplePages);
            }
            
            // Salvar info do experimento antes de redirecionar
            sessionStorage.setItem('rf_current_experiment', experimentId);
            sessionStorage.setItem('rf_current_variant', variant.id);
            
            // Redirecionar
            window.location.href = redirectUrl;
            return variant; // Retornar antes do redirect
          }
        }
      }

      // ✅ Callback personalizado
      if (options.onVariant) {
        options.onVariant(variant);
      }

      // ✅ Aplicar seletores DOM se fornecidos
      if (options.selectors) {
        this.applyVariant(experimentId, variant.name, options.selectors);
      }

      return variant;
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error running experiment', error);
      return null;
    }
  }

  /**
   * ✅ Aplica mudanças CSS
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
   * ✅ Aplica mudanças JavaScript
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
      // Incluir dados UTM automaticamente
      const utmData = this.getUTMData ? this.getUTMData() : {};
      
      // Incluir experimento atual se houver
      const currentExperiment = sessionStorage.getItem('rf_current_experiment');
      const currentVariant = sessionStorage.getItem('rf_current_variant');
      
      const enrichedProperties = {
        ...properties,
        ...utmData,
        ...(currentExperiment && { experiment_id: currentExperiment }),
        ...(currentVariant && { variant_id: currentVariant })
      };

      const response = await fetch(`${this.baseUrl}/api/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: [{
            event_type: 'custom',
            event_name: eventName,
            visitor_id: this.userId,
            properties: enrichedProperties,
            timestamp: new Date().toISOString()
          }]
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
   * Rastreia evento de conversão
   */
  async conversion(eventName, value = null, properties = {}) {
    try {
      // Incluir dados UTM automaticamente
      const utmData = this.getUTMData ? this.getUTMData() : {};
      
      // Incluir experimento atual se houver
      const currentExperiment = sessionStorage.getItem('rf_current_experiment');
      const currentVariant = sessionStorage.getItem('rf_current_variant');
      
      const enrichedProperties = {
        ...properties,
        ...utmData,
        ...(currentExperiment && { experiment_id: currentExperiment }),
        ...(currentVariant && { variant_id: currentVariant })
      };

      const response = await fetch(`${this.baseUrl}/api/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: [{
            event_type: 'conversion',
            event_name: eventName,
            visitor_id: this.userId,
            value: value,
            properties: enrichedProperties,
            timestamp: new Date().toISOString()
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (this.debug) console.log('RotaFinal: Conversion tracked', { eventName, value, properties: enrichedProperties });
      
      return await response.json();
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error tracking conversion', error);
      return null;
    }
  }

  /**
   * Obtém métricas de um experimento
   */
  async getMetrics(experimentKey) {
    try {
      const params = new URLSearchParams({
        experiment_key: experimentKey
      });
      
      const response = await fetch(`${this.baseUrl}/api/get-metrics?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error getting metrics', error);
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

    // Esconder outras variantes
    Object.keys(selectors).forEach(v => {
      if (v !== variant) {
        const otherElements = document.querySelectorAll(selectors[v]);
        otherElements.forEach(el => {
          el.style.display = 'none';
        });
      }
    });

    if (this.debug) console.log('RotaFinal: Applied variant', { experimentKey, variant, selectors });
  }

  /**
   * Inicializa captura de UTMs
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
        const sanitizedValue = this.sanitizeUTMValue(value, param);
        
        localStorage.setItem(`rf_${param}`, sanitizedValue);
        this.setCookie(param, sanitizedValue, 30);
        
        hasUTMs = true;
        if (this.debug) console.log(`RotaFinal: UTM captured ${param} = ${sanitizedValue}`);
      }
    });

    // Limpar URL se capturou UTMs
    if (hasUTMs && window.history && window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      if (this.debug) console.log('RotaFinal: URL cleaned, UTM parameters preserved');
    }
  }

  /**
   * Sanitiza valor de UTM
   */
  sanitizeUTMValue(value, param) {
    if (!value) return value;
    
    if (['utm_source', 'utm_medium', 'utm_campaign'].includes(param)) {
      return value.trim().replace(/\s+/g, '_');
    }
    
    return value.trim();
  }

  /**
   * Define cookie
   */
  setCookie(name, value, days) {
    if (typeof document === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; Secure; SameSite=Lax`;
  }

  /**
   * Obtém cookie
   */
  getCookie(name) {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  /**
   * Obtém dados UTM salvos
   */
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

  /**
   * API pública para obter parâmetros UTM
   */
  getUTMParams() {
    return this.getUTMData();
  }

  /**
   * API pública para obter parâmetro UTM específico
   */
  getUTMParam(param) {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`rf_${param}`) || this.getCookie(param);
  }

  /**
   * Limpar parâmetros UTM salvos
   */
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

    if (this.debug) console.log('RotaFinal: UTM parameters cleared');
  }
}

// Auto-inicialização se window.rfAntiFlicker estiver disponível
if (typeof window !== 'undefined' && window.rfAntiFlicker) {
  window.rfAntiFlicker.ready();
}

// Exportar para diferentes ambientes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RotaFinal;
} else if (typeof window !== 'undefined') {
  window.RotaFinal = RotaFinal;
}
