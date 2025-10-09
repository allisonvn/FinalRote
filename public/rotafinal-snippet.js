/**
 * RotaFinal Anti-Flicker Snippet
 * COPIE ESTE CÓDIGO E COLE NO <HEAD> ANTES DE TUDO!
 * Versão: 2.2
 */

// PARTE 1: Anti-Flicker CSS (INLINE - Executa imediatamente)
(function() {
  var css = 'html{opacity:0!important}html.rf-ready{opacity:1!important;transition:opacity .15s ease-in}';
  var style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  (document.head || document.getElementsByTagName('head')[0]).appendChild(style);

  // Timeout de segurança: mostrar após 3s
  setTimeout(function() {
    document.documentElement.className += ' rf-ready';
  }, 3000);
})();

// PARTE 2: Carregar SDK e executar experimento
(function() {
  var experimentId = window.rfExperimentId; // Definido pelo usuário

  if (!experimentId) {
    console.error('RotaFinal: experimentId não definido! Defina window.rfExperimentId antes do snippet.');
    document.documentElement.className += ' rf-ready';
    return;
  }

  // Carregar SDK
  var script = document.createElement('script');
  script.src = 'https://rotafinal.com.br/rotafinal-sdk.js';
  script.onload = function() {
    try {
      var rf = new RotaFinal({ debug: false });

      // Executar experimento IMEDIATAMENTE
      rf.runExperiment(experimentId, {
        onVariant: function(variant) {
          // SDK já mostrou a página em runExperiment
          console.log('RotaFinal: Variant loaded', variant.name);
        }
      });
    } catch (error) {
      console.error('RotaFinal: Error', error);
      document.documentElement.className += ' rf-ready';
    }
  };

  script.onerror = function() {
    console.error('RotaFinal: Failed to load SDK');
    document.documentElement.className += ' rf-ready';
  };

  (document.head || document.getElementsByTagName('head')[0]).appendChild(script);
})();
