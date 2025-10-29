/**
 * RotaFinal UTM Capture Script v3 - Deferred Load
 * Carrega DEPOIS que a página está pronta
 * Compatível com o SDK de experimento RotaFinal
 */

(function() {
  'use strict';

  // Função que faz todo o trabalho
  function initUTMCapture() {
    try {
      const API_BASE = 'https://rotafinal.com.br';
      const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

      // Utilitários
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
      try {
        console.error('[RotaFinal UTM] Erro crítico:', e);
      } catch (err) {
        // Falha silenciosa
      }
    }
  }

  // ESTRATÉGIA DE CARREGAMENTO: Tentar de múltiplas maneiras
  
  // 1. Se o DOM já está pronto
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initUTMCapture();
  } else {
    // 2. Esperar pelo DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
      initUTMCapture();
    }, false);
  }

  // 3. Também executar quando a página carrega completamente
  if (window.addEventListener) {
    window.addEventListener('load', function() {
      // Esperar um pouco mais para garantir
      setTimeout(initUTMCapture, 100);
    }, false);
  }

  // 4. Fallback: tentar a cada 500ms até conseguir
  var attempts = 0;
  var fallbackInterval = setInterval(function() {
    try {
      if (typeof window.RotaFinalUTM === 'undefined') {
        initUTMCapture();
      }
      if (typeof window.RotaFinalUTM !== 'undefined' || attempts > 20) {
        clearInterval(fallbackInterval);
      }
    } catch (e) {
      // Ignorar
    }
    attempts++;
  }, 500);

})();
