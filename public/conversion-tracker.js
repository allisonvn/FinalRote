/**
 * 🎯 ROTAFINAL - RASTREADOR AUTOMÁTICO DE CONVERSÕES (v2.0)
 * 
 * Este script detecta automaticamente quando a página de sucesso é acessada
 * e registra a conversão no Supabase com o valor configurado.
 * 
 * COMO USAR:
 * 
 * 1. Adicione este script na página de sucesso/conversão:
 *    <script src="https://rotafinal.com.br/conversion-tracker.js"></script>
 * 
 * 2. Configure a URL de conversão no experimento (Etapa 3 do modal)
 * 
 * 3. Quando o usuário acessar a página de sucesso, a conversão será
 *    automaticamente registrada no Supabase com o valor configurado
 * 
 * O script detecta:
 * - Qual experimento está ativo (via localStorage)
 * - Qual variante foi atribuída ao visitante
 * - O valor de conversão configurado no experimento
 * - Registra tudo no Supabase automaticamente
 */

(function() {
  'use strict';

  // Configurações
  const CONFIG = {
    apiUrl: 'https://rotafinal.com.br/api/track',
    batchApiUrl: 'https://rotafinal.com.br/api/track/batch',
    debug: typeof window !== 'undefined' && window.location.hostname === 'localhost',
    maxWaitTime: 5000, // 5 segundos max para enviar
  };

  // Função de log apenas em modo debug
  function log(...args) {
    if (CONFIG.debug) {
      console.log('🎯 [ConversionTracker]', ...args);
    }
  }

  /**
   * Buscar dados de atribuição de variante do localStorage
   */
  function getAssignmentData() {
    try {
      log('🔍 Procurando dados de atribuição no localStorage');
      
      const storageKeys = Object.keys(localStorage);
      
      // Procurar por chaves rotafinal_* (incluindo as novas chaves do SDK inline)
      for (const key of storageKeys) {
        if (key.startsWith('rotafinal_exp_') || key.startsWith('rotafinal_assignment_') || key.startsWith('rf_experiment_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            log('✅ Dados encontrados:', { key, data });
            
            // Se for dados do experimento (rf_experiment_), extrair dados da variante também
            if (key.startsWith('rf_experiment_')) {
              const experimentId = key.replace('rf_experiment_', '');
              const variantKey = `rf_variant_${experimentId}`;
              const variantData = localStorage.getItem(variantKey);
              
              if (variantData) {
                try {
                  const variant = JSON.parse(variantData);
                  return {
                    key,
                    experimentId: experimentId,
                    variantId: variant.v?.id || variant.id,
                    variantName: variant.v?.name || variant.name,
                    visitorId: localStorage.getItem('rf_user_id'),
                    timestamp: variant.t || Date.now()
                  };
                } catch (e) {
                  log('⚠️ Erro ao parsear dados da variante:', variantKey, e);
                }
              }
            } else {
              // Dados diretos de atribuição
              return {
                key,
                experimentId: data.experimentId || data.experiment_id,
                variantId: data.variantId || data.variant_id,
                variantName: data.variant || data.variantName,
                visitorId: data.visitorId || data.visitor_id,
                timestamp: data.timestamp
              };
            }
          } catch (e) {
            log('⚠️ Erro ao parsear dados:', key, e);
          }
        }
      }
      
      log('⚠️ Nenhum experimento ativo encontrado no localStorage');
      return null;
    } catch (error) {
      log('❌ Erro ao buscar dados de atribuição:', error);
      return null;
    }
  }

  /**
   * Buscar dados do experimento da API (para obter o valor de conversão)
   */
  async function getExperimentData(experimentId) {
    try {
      log('📡 Buscando dados do experimento:', experimentId);
      
      const response = await fetch(`https://rotafinal.com.br/api/experiments/${experimentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      log('✅ Dados do experimento obtidos:', result);
      
      return {
        conversionValue: result.experiment?.conversion_value || 0,
        conversionUrl: result.experiment?.conversion_url,
        conversionType: result.experiment?.conversion_type || 'page_view'
      };
    } catch (error) {
      log('⚠️ Erro ao buscar dados do experimento:', error);
      return {
        conversionValue: 0,
        conversionUrl: null,
        conversionType: 'page_view'
      };
    }
  }

  /**
   * Registrar conversão na API
   */
  async function trackConversion(assignmentData, experimentData) {
    try {
      log('📊 Registrando conversão:', {
        experimentId: assignmentData.experimentId,
        variantId: assignmentData.variantId,
        value: experimentData.conversionValue
      });

      // Verificar se já converteu (evitar duplicatas)
      const conversionKey = `rotafinal_conversion_${assignmentData.experimentId}`;
      if (localStorage.getItem(conversionKey)) {
        log('✅ Conversão já registrada anteriormente para este experimento');
        return true; // Retornar sucesso para não tentar novamente
      }

      // ✅ CORREÇÃO: Buscar dados da página de origem do localStorage
      const originPageData = JSON.parse(
        localStorage.getItem(`rotafinal_origin_${assignmentData.experimentId}`) || '{}'
      );

      // Preparar dados da conversão COMPLETOS
      const conversionPayload = {
        experiment_id: assignmentData.experimentId,
        visitor_id: assignmentData.visitorId,
        variant_id: assignmentData.variantId,
        variant: assignmentData.variantName,
        event_type: 'conversion',
        event_name: 'conversion',
        value: experimentData.conversionValue || 0,
        timestamp: new Date().toISOString(),
        properties: {
          // ✅ Página de sucesso (atual)
          success_page_url: window.location.href,
          success_page_title: document.title,
          
          // ✅ Página que originou a conversão (do localStorage)
          origin_page_url: originPageData.url || experimentData.targetUrl,
          origin_page_title: originPageData.title || 'Página de Origem',
          
          // ✅ Dados de navegação
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          
          // ✅ Dados da conversão
          conversion_value: experimentData.conversionValue,
          conversion_type: experimentData.conversionType,
          timestamp: new Date().toISOString(),
          success_page: true,
          
          // ✅ Dados da variante
          variant: assignmentData.variantName,
          variant_id: assignmentData.variantId
        }
      };

      log('📤 Enviando conversão para API:', conversionPayload);

      // Enviar para API
      const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(conversionPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      log('✅ Conversão registrada com sucesso:', result);

      // Marcar como convertido no localStorage
      localStorage.setItem(conversionKey, JSON.stringify({
        converted_at: new Date().toISOString(),
        experiment_id: assignmentData.experimentId,
        variant: assignmentData.variantName,
        value: experimentData.conversionValue
      }));

      // Disparar evento customizado
      if (window.dispatchEvent) {
        const event = new CustomEvent('rotafinal_conversion', {
          detail: {
            experimentId: assignmentData.experimentId,
            variantId: assignmentData.variantId,
            value: experimentData.conversionValue
          }
        });
        window.dispatchEvent(event);
        log('🎉 Evento de conversão disparado');
      }

      return true;
    } catch (error) {
      log('❌ Erro ao registrar conversão:', error);
      return false;
    }
  }

  /**
   * Inicializar rastreamento
   */
  async function init() {
    log('🚀 Iniciando ConversionTracker');
    log('📍 Página atual:', window.location.href);

    // Buscar dados de atribuição
    const assignmentData = getAssignmentData();
    
    if (!assignmentData) {
      log('⚠️ Nenhuma atribuição de variante encontrada. SDK pode não ter sido executado ou visitante não participante.');
      return;
    }

    log('✅ Dados de atribuição encontrados:', assignmentData);

    // Buscar dados do experimento (incluindo valor de conversão)
    const experimentData = await getExperimentData(assignmentData.experimentId);
    
    log('✅ Dados do experimento:', experimentData);

    // Registrar conversão
    const success = await trackConversion(assignmentData, experimentData);
    
    if (success) {
      log('🎊 Conversão rastreada com sucesso!');
    } else {
      log('⚠️ Falha ao rastrear conversão, tentando novamente em 2 segundos...');
      // Tentar novamente uma vez
      setTimeout(async () => {
        await trackConversion(assignmentData, experimentData);
      }, 2000);
    }
  }

  // Esperar DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM já está pronto
    setTimeout(init, 100);
  }

  // Expor métodos globais para testes/debug
  if (typeof window !== 'undefined') {
    window.RotaFinalConversionTracker = {
      debug: () => {
        CONFIG.debug = true;
        log('✅ Debug ativado');
      },
      test: async () => {
        log('🧪 Teste manual iniciado');
        const assignmentData = getAssignmentData();
        if (assignmentData) {
          const experimentData = await getExperimentData(assignmentData.experimentId);
          console.table({ assignmentData, experimentData });
        } else {
          log('❌ Sem dados de atribuição. Teste o SDK primeiro.');
        }
      }
    };
  }
})();

