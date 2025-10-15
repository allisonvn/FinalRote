/**
 * 🎯 ROTAFINAL - RASTREADOR AUTOMÁTICO DE CONVERSÕES
 * 
 * Este script detecta automaticamente quando a página de sucesso é acessada
 * e registra a conversão no Supabase, associando à variante correta.
 * 
 * COMO USAR:
 * 
 * 1. Adicione este script na página de sucesso/conversão:
 *    <script src="https://rotafinal.com.br/conversion-tracker.js"></script>
 * 
 * 2. Configure a URL de conversão no experimento
 * 
 * 3. Quando o usuário acessar a página de sucesso, a conversão será
 *    automaticamente registrada no Supabase
 * 
 * O script detecta:
 * - Qual experimento está ativo (via localStorage)
 * - Qual variante foi atribuída ao visitante
 * - Registra a conversão com o valor configurado
 */

(function() {
  'use strict';

  // Configurações
  const CONFIG = {
    apiUrl: 'https://rotafinal.com.br/api/track',
    debug: true
  };

  // Função de log apenas em modo debug
  function log(...args) {
    if (CONFIG.debug) {
      console.log('🎯 [ConversionTracker]', ...args);
    }
  }

  // Função para obter dados do visitante do localStorage
  function getVisitorData() {
    try {
      // Buscar todos os experimentos ativos no localStorage
      const storageKeys = Object.keys(localStorage);
      const experimentKeys = storageKeys.filter(key => key.startsWith('rotafinal_'));
      
      if (experimentKeys.length === 0) {
        log('⚠️ Nenhum experimento ativo encontrado no localStorage');
        return null;
      }

      log('📦 Experimentos encontrados:', experimentKeys);

      // Processar cada experimento
      const experiments = [];
      for (const key of experimentKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.variant && data.experimentId) {
            experiments.push({
              experimentId: data.experimentId,
              variantId: data.variantId,
              variantName: data.variant,
              visitorId: data.visitorId || generateVisitorId(),
              timestamp: data.timestamp
            });
          }
        } catch (e) {
          log('⚠️ Erro ao processar experimento:', key, e);
        }
      }

      if (experiments.length === 0) {
        log('⚠️ Nenhum experimento válido encontrado');
        return null;
      }

      // Retornar o experimento mais recente
      experiments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return experiments[0];
    } catch (error) {
      log('❌ Erro ao obter dados do visitante:', error);
      return null;
    }
  }

  // Função para gerar ID único do visitante
  function generateVisitorId() {
    return 'rf_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Função para registrar conversão
  async function trackConversion(experimentData) {
    try {
      log('📊 Registrando conversão:', experimentData);

      // Verificar se já converteu (evitar duplicatas)
      const conversionKey = `rotafinal_conversion_${experimentData.experimentId}`;
      if (localStorage.getItem(conversionKey)) {
        log('✅ Conversão já registrada anteriormente');
        return;
      }

      // Preparar dados da conversão
      const conversionData = {
        experiment_id: experimentData.experimentId,
        visitor_id: experimentData.visitorId,
        variant_id: experimentData.variantId,
        variant: experimentData.variantName,
        event_type: 'conversion',
        event_name: 'conversion',
        properties: {
          page_url: window.location.href,
          page_title: document.title,
          referrer: document.referrer,
          timestamp: new Date().toISOString()
        },
        value: experimentData.value || 0,
        timestamp: new Date().toISOString()
      };

      log('📤 Enviando conversão para API:', conversionData);

      // Enviar para API
      const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      log('✅ Conversão registrada com sucesso:', result);

      // Marcar como convertido
      localStorage.setItem(conversionKey, JSON.stringify({
        converted_at: new Date().toISOString(),
        experiment_id: experimentData.experimentId,
        variant: experimentData.variantName
      }));

      // Disparar evento customizado
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('rotafinal:conversion', {
          detail: { experimentId: experimentData.experimentId, variant: experimentData.variantName }
        }));
      }

    } catch (error) {
      log('❌ Erro ao registrar conversão:', error);
    }
  }

  // Função principal
  function init() {
    log('🚀 Inicializando rastreador de conversões');

    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Obter dados do visitante
    const visitorData = getVisitorData();
    
    if (!visitorData) {
      log('⚠️ Não foi possível obter dados do visitante');
      return;
    }

    log('👤 Dados do visitante:', visitorData);

    // Registrar conversão
    trackConversion(visitorData);
  }

  // Expor API global
  window.RotaFinalConversion = {
    track: trackConversion,
    getVisitorData: getVisitorData,
    debug: (enabled) => { CONFIG.debug = enabled; }
  };

  // Iniciar
  init();

})();

