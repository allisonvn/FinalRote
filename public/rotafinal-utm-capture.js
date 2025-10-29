/**
 * RotaFinal UTM Capture Script v2
 * Compatível com o SDK de experimento RotaFinal
 * 
 * Uso:
 * <script src="/rotafinal-utm-capture.js?api_key=YOUR_KEY"></script>
 */

(function() {
  'use strict';

  try {
    const API_BASE = 'https://rotafinal.com.br';
    const STORAGE_KEY = 'rf_utm_params';
    const EXPIRY_DAYS = 30;
    const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    // Utilitários com tratamento robusto
    const Utils = {
      log(...args) {
        try {
          if (localStorage.getItem('rf_debug')) {
            console.log('[RotaFinal UTM]', ...args);
          }
        } catch (e) {
          // Falha silenciosa
        }
      },
      sanitizeValue(value) {
        try {
          return String(value).substring(0, 256).trim();
        } catch (e) {
          return '';
        }
      }
    };

    // Obter UTMs já capturados pelo SDK do experimento
    const getExperimentUTMs = () => {
      try {
        const utms = {};
        UTM_PARAMS.forEach(param => {
          try {
            const value = localStorage.getItem('rf_' + param);
            if (value) {
              utms[param] = value;
            }
          } catch (e) {
            // Ignorar
          }
        });
        return utms;
      } catch (e) {
        return {};
      }
    };

    // Capturar novos UTMs da URL
    const captureNewUTMs = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const newParams = {};
        let hasNew = false;

        UTM_PARAMS.forEach(param => {
          try {
            const value = urlParams.get(param);
            if (value) {
              const sanitized = Utils.sanitizeValue(value);
              const existing = localStorage.getItem('rf_' + param);
              
              // Só salvar se não existir (first-touch)
              if (!existing) {
                localStorage.setItem('rf_' + param, sanitized);
                newParams[param] = sanitized;
                hasNew = true;
              }
            }
          } catch (e) {
            // Ignorar erro em parâmetro específico
          }
        });

        // Limpar URL se capturou novos parâmetros
        if (hasNew) {
          try {
            if (window.history && window.history.replaceState) {
              const clean = window.location.origin + window.location.pathname + window.location.hash;
              window.history.replaceState({}, document.title, clean);
            }
          } catch (e) {
            // Falha silenciosa
          }
        }

        return newParams;
      } catch (e) {
        return {};
      }
    };

    // Obter todos os UTMs (capturados + novos)
    const getAllUTMs = () => {
      try {
        const all = {};
        UTM_PARAMS.forEach(param => {
          try {
            const value = localStorage.getItem('rf_' + param);
            if (value) {
              all[param] = value;
            }
          } catch (e) {
            // Ignorar
          }
        });
        return all;
      } catch (e) {
        return {};
      }
    };

    // Inicializar captura
    try {
      captureNewUTMs();
      Utils.log('UTM Capture inicializado', getAllUTMs());
    } catch (e) {
      Utils.log('Erro ao inicializar:', e.message);
    }

    // Expor API global
    try {
      window.RotaFinalUTM = {
        getAll: () => {
          try {
            return getAllUTMs();
          } catch (e) {
            return {};
          }
        },
        get: (param) => {
          try {
            return localStorage.getItem('rf_' + param) || null;
          } catch (e) {
            return null;
          }
        },
        send: (eventType, properties = {}) => {
          try {
            const utms = getAllUTMs();
            const enriched = { ...utms, ...properties };
            
            Utils.log('Enviando evento:', eventType, enriched);
            
            return fetch(`${API_BASE}/api/track`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_type: eventType,
                visitor_id: window.location.hostname,
                properties: enriched,
                timestamp: new Date().toISOString()
              })
            }).catch(e => {
              Utils.log('Erro ao enviar:', e.message);
              return null;
            });
          } catch (e) {
            Utils.log('Erro em send:', e.message);
            return null;
          }
        }
      };
    } catch (e) {
      Utils.log('Erro ao expor API:', e.message);
    }

  } catch (e) {
    // Erro crítico - não quebre o site
    try {
      console.error('[RotaFinal UTM] Erro crítico:', e);
    } catch (err) {
      // Falha silenciosa
    }
  }
})();
