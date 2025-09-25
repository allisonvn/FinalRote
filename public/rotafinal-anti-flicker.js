/**
 * RotaFinal Anti-Flicker Script
 * Previne flicker durante carregamento de experimentos
 */

(function() {
  'use strict';
  
  // Adicionar estilos anti-flicker
  var style = document.createElement('style');
  style.innerHTML = `
    .rf-hide {
      opacity: 0 !important;
      visibility: hidden !important;
    }
    
    body.rf-ready .rf-hide {
      opacity: 1 !important;
      visibility: visible !important;
      transition: opacity 200ms, visibility 200ms;
    }
    
    .rf-variant {
      display: block !important;
    }
  `;
  document.head.appendChild(style);
  
  // API anti-flicker
  window.rfAntiFlicker = {
    /**
     * Esconde elementos até que o experimento seja carregado
     */
    hide: function(selector) {
      var elements = document.querySelectorAll(selector);
      for (var i = 0; i < elements.length; i++) {
        elements[i].classList.add('rf-hide');
      }
    },
    
    /**
     * Marca que o experimento foi carregado e mostra elementos
     */
    ready: function() {
      document.body.classList.add('rf-ready');
      var elements = document.querySelectorAll('.rf-hide');
      for (var i = 0; i < elements.length; i++) {
        elements[i].classList.remove('rf-hide');
      }
    },
    
    /**
     * Aplica variante a elementos específicos
     */
    applyVariant: function(experimentKey, variant, selectors) {
      // Esconder todas as variantes primeiro
      Object.keys(selectors).forEach(function(v) {
        var elements = document.querySelectorAll(selectors[v]);
        for (var i = 0; i < elements.length; i++) {
          elements[i].style.display = 'none';
        }
      });
      
      // Mostrar variante selecionada
      if (selectors[variant]) {
        var elements = document.querySelectorAll(selectors[variant]);
        for (var i = 0; i < elements.length; i++) {
          elements[i].style.display = 'block';
          elements[i].classList.add('rf-variant', 'rf-' + variant);
        }
      }
    }
  };
  
  // Auto-executar se elementos com data-rf-hide estiverem presentes
  document.addEventListener('DOMContentLoaded', function() {
    var elements = document.querySelectorAll('[data-rf-hide]');
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.add('rf-hide');
    }
  });
})();
