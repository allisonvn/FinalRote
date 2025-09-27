/**
 * RotaFinal SDK
 * SDK para integração com a plataforma de experimentos A/B
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
      console.log('RotaFinal SDK initialized:', { userId: this.userId, debug: this.debug });
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
  async getVariant(experimentKey, options = {}) {
    try {
      // Verificar cache primeiro
      const cacheKey = `${experimentKey}_${this.userId}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < (options.cacheTime || 300000)) { // 5 min default
          if (this.debug) console.log('RotaFinal: Using cached variant', cached.variant);
          return cached.variant;
        }
      }

      const response = await fetch(`${this.baseUrl}/api/assign-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experiment_key: experimentKey,
          visitor_id: this.userId,
          context: options.context || {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Verificar se a resposta tem a estrutura esperada
      const variant = data.variant || data.variant_name || data.variant_key || 'control';
      
      // Cachear resultado
      this.cache.set(cacheKey, {
        variant: variant,
        timestamp: Date.now()
      });

      if (this.debug) console.log('RotaFinal: Assigned variant', data);
      
      return variant;
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error getting variant', error);
      return options.defaultVariant || 'control';
    }
  }

  /**
   * Rastreia evento personalizado
   */
  async track(eventName, properties = {}) {
    try {
      // Incluir dados UTM automaticamente
      const utmData = this.getUTMData ? this.getUTMData() : {};
      const enrichedProperties = {
        ...properties,
        ...utmData
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
      const enrichedProperties = {
        ...properties,
        ...utmData
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

      if (this.debug) console.log('RotaFinal: Event tracked', { eventName, value, properties: enrichedProperties });
      
      return await response.json();
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error tracking event', error);
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
   * Executa experimento completo
   */
  async runExperiment(experimentKey, options = {}) {
    const variant = await this.getVariant(experimentKey, options);
    
    if (options.selectors) {
      this.applyVariant(experimentKey, variant, options.selectors);
    }

    if (options.onVariant) {
      options.onVariant(variant);
    }

    return variant;
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
