/**
 * RotaFinal UTM Capture Script
 * Captura UTMs da URL e envia com todos os eventos para o Supabase
 * 
 * Uso:
 * <script src="/rotafinal-utm-capture.js?api_key=YOUR_KEY"></script>
 */

(function() {
  'use strict';

  // Extrair API key dos parâmetros do script
  const script = document.currentScript || Array.from(document.scripts).pop();
  const apiKey = new URL(script.src, window.location.origin).searchParams.get('api_key');

  if (!apiKey) {
    console.warn('RotaFinal: API key não encontrada no script');
    return;
  }

  const API_BASE = 'https://rotafinal.com.br';
  const STORAGE_KEY = 'rf_utm_params';
  const EXPIRY_DAYS = 30;

  // Utilitários
  const Utils = {
    log(...args) {
      console.log('[RotaFinal UTC]', ...args);
    },
    warn(...args) {
      console.warn('[RotaFinal UTC]', ...args);
    },
    sanitizeValue(value) {
      return String(value).substring(0, 256).trim();
    }
  };

  // Gerenciador de Storage
  const StorageManager = {
    get() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          // Verificar expiração
          if (data.expires > Date.now()) {
            return data.params;
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        Utils.warn('Erro ao ler storage:', e);
      }
      return {};
    },
    
    set(params) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          params,
          expires: Date.now() + (EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        }));
      } catch (e) {
        Utils.warn('Erro ao salvar storage:', e);
      }
    },

    merge(newParams) {
      const current = this.get();
      const merged = { ...current, ...newParams };
      this.set(merged);
      return merged;
    }
  };

  // Capturador de UTMs
  const UTMCapture = {
    // Parâmetros a capturar
    params: [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'src', 'sck', 'msclkid', 'ttclid'
    ],

    // Capturar da URL
    fromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const captured = {};
      let hasNew = false;

      this.params.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
          captured[param] = Utils.sanitizeValue(value);
          hasNew = true;
        }
      });

      if (hasNew) {
        // Mesclar com parâmetros existentes
        const all = StorageManager.merge(captured);
        Utils.log('UTMs capturados:', all);
        
        // Limpar URL
        if (window.history?.replaceState) {
          const clean = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, clean);
        }
      }

      return captured;
    },

    // Obter todos os UTMs salvos
    getAll() {
      return StorageManager.get();
    },

    // Obter um UTM específico
    get(param) {
      return this.getAll()[param] || null;
    }
  };

  // Inicializar captura
  UTMCapture.fromURL();

  // Expor globalmente
  window.RotaFinalUTM = {
    getAll: () => UTMCapture.getAll(),
    get: (param) => UTMCapture.get(param),
    send: (eventType, properties = {}) => {
      const utms = UTMCapture.getAll();
      const enriched = { ...utms, ...properties };
      
      Utils.log('Enviando evento com UTMs:', enriched);
      
      return fetch(`${API_BASE}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          visitor_id: window.location.hostname,
          properties: enriched,
          timestamp: new Date().toISOString()
        })
      });
    }
  };

  Utils.log('UTM Capture inicializado');
})();
