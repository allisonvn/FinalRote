/**
 * RotaFinal SDK
 * SDK para integração com a plataforma de experimentos A/B
 */

class RotaFinal {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.debug = options.debug || false;
    this.baseUrl = options.baseUrl || 'https://xtexltigzzayfrscvzaa.supabase.co';
    this.cache = new Map();
    this.userId = this.getUserId();
    
    if (this.debug) {
      console.log('RotaFinal SDK initialized:', { apiKey: this.apiKey, userId: this.userId });
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

      const response = await fetch(`${this.baseUrl}/functions/v1/assign-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          experiment_key: experimentKey,
          user_id: this.userId,
          user_attributes: options.userAttributes || {},
          context: options.context || {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cachear resultado
      this.cache.set(cacheKey, {
        variant: data.variant,
        timestamp: Date.now()
      });

      if (this.debug) console.log('RotaFinal: Assigned variant', data);
      
      return data.variant;
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error getting variant', error);
      return options.defaultVariant || 'control';
    }
  }

  /**
   * Rastreia evento de conversão
   */
  async conversion(eventName, value = null, properties = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/functions/v1/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          event_name: eventName,
          user_id: this.userId,
          value: value,
          properties: properties,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (this.debug) console.log('RotaFinal: Event tracked', { eventName, value, properties });
      
      return await response.json();
    } catch (error) {
      if (this.debug) console.error('RotaFinal: Error tracking event', error);
    }
  }

  /**
   * Obtém métricas de um experimento
   */
  async getMetrics(experimentKey) {
    try {
      const response = await fetch(`${this.baseUrl}/functions/v1/get-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          experiment_key: experimentKey
        })
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
