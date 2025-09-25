/**
 * Sistema Anti-Flicker para Rota Final
 * Previne o "flash" de conteúdo durante testes A/B
 */

export interface AntiFlickerConfig {
  timeout?: number // Timeout em ms (padrão: 3000)
  className?: string // Classe CSS para ocultar (padrão: 'rf-hide')
  bodyClass?: string // Classe adicionada ao body quando pronto (padrão: 'rf-ready')
  debug?: boolean
}

export class AntiFlicker {
  private config: Required<AntiFlickerConfig>
  private styleElement?: HTMLStyleElement
  private timeoutId?: number
  private initialized = false

  constructor(config: AntiFlickerConfig = {}) {
    this.config = {
      timeout: config.timeout || 3000,
      className: config.className || 'rf-hide',
      bodyClass: config.bodyClass || 'rf-ready',
      debug: config.debug || false
    }
  }

  /**
   * Inicializa o sistema anti-flicker
   * Deve ser chamado o mais cedo possível (idealmente inline no <head>)
   */
  init(): void {
    if (this.initialized || typeof document === 'undefined') return

    // Criar e injetar CSS crítico
    this.injectCriticalCSS()

    // Configurar timeout de segurança
    this.timeoutId = window.setTimeout(() => {
      this.log('Timeout atingido, mostrando conteúdo')
      this.ready()
    }, this.config.timeout)

    this.initialized = true
    this.log('Anti-flicker inicializado')
  }

  /**
   * Oculta elementos específicos
   */
  hide(selectors: string | string[]): void {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors]
    
    selectorList.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          el.classList.add(this.config.className)
          el.setAttribute('data-rf-hidden', 'true')
        })
        this.log(`Ocultados ${elements.length} elementos com selector: ${selector}`)
      } catch (error) {
        this.error('Erro ao ocultar elementos:', error)
      }
    })
  }

  /**
   * Mostra elementos e marca como pronto
   */
  ready(): void {
    // Cancelar timeout se ainda estiver ativo
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    // Adicionar classe ao body
    if (document.body) {
      document.body.classList.add(this.config.bodyClass)
    }

    // Mostrar todos os elementos ocultos
    const hiddenElements = document.querySelectorAll(`[data-rf-hidden="true"]`)
    hiddenElements.forEach(el => {
      el.classList.remove(this.config.className)
      el.removeAttribute('data-rf-hidden')
    })

    // Remover estilo crítico após transição
    setTimeout(() => {
      this.removeCriticalCSS()
    }, 500)

    this.log(`Anti-flicker pronto, ${hiddenElements.length} elementos revelados`)

    // Disparar evento customizado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rf:ready', {
        detail: { timestamp: Date.now() }
      }))
    }
  }

  /**
   * Injeta CSS crítico para anti-flicker
   */
  private injectCriticalCSS(): void {
    if (typeof document === 'undefined') return

    const css = `
      .${this.config.className} {
        opacity: 0 !important;
        visibility: hidden !important;
      }
      
      body.${this.config.bodyClass} .${this.config.className} {
        opacity: 1 !important;
        visibility: visible !important;
        transition: opacity 200ms ease-in-out, visibility 200ms ease-in-out !important;
      }
      
      /* Prevenir layout shift */
      .${this.config.className}:not(img):not(video):not(iframe) {
        min-height: 1px !important;
      }
    `

    this.styleElement = document.createElement('style')
    this.styleElement.setAttribute('data-rf-antiflicker', 'true')
    this.styleElement.textContent = css

    // Inserir no início do head para maior prioridade
    const head = document.head || document.getElementsByTagName('head')[0]
    if (head.firstChild) {
      head.insertBefore(this.styleElement, head.firstChild)
    } else {
      head.appendChild(this.styleElement)
    }
  }

  /**
   * Remove CSS crítico (cleanup)
   */
  private removeCriticalCSS(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement)
      this.styleElement = undefined
    }
  }

  /**
   * Snippet inline para <head> (mais rápido que carregar SDK)
   */
  static getInlineScript(config: AntiFlickerConfig = {}): string {
    const timeout = config.timeout || 3000
    const className = config.className || 'rf-hide'
    const bodyClass = config.bodyClass || 'rf-ready'

    return `
(function() {
  // Anti-flicker Rota Final
  var s = document.createElement('style');
  s.innerHTML = '.${className}{opacity:0 !important;visibility:hidden !important;}body.${bodyClass} .${className}{opacity:1 !important;visibility:visible !important;transition:opacity 200ms,visibility 200ms;}';
  document.head.appendChild(s);
  
  window.rfAntiFlicker = {
    hide: function(sel) {
      try {
        var els = document.querySelectorAll(sel);
        for (var i = 0; i < els.length; i++) {
          els[i].classList.add('${className}');
          els[i].setAttribute('data-rf-hidden', 'true');
        }
      } catch(e) {}
    },
    ready: function() {
      document.body.classList.add('${bodyClass}');
      var els = document.querySelectorAll('[data-rf-hidden="true"]');
      for (var i = 0; i < els.length; i++) {
        els[i].classList.remove('${className}');
        els[i].removeAttribute('data-rf-hidden');
      }
      clearTimeout(window.rfTimeout);
    }
  };
  
  // Timeout de segurança
  window.rfTimeout = setTimeout(function() {
    window.rfAntiFlicker.ready();
  }, ${timeout});
})();`
  }

  /**
   * Helpers de logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[RF Anti-Flicker]', ...args)
    }
  }

  private error(...args: any[]): void {
    console.error('[RF Anti-Flicker]', ...args)
  }

  /**
   * Destrutor
   */
  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    this.removeCriticalCSS()
    this.initialized = false
  }
}

// Singleton global para facilitar uso
let globalInstance: AntiFlicker | null = null

export function getAntiFlicker(config?: AntiFlickerConfig): AntiFlicker {
  if (!globalInstance) {
    globalInstance = new AntiFlicker(config)
  }
  return globalInstance
}

// Helpers para uso direto
export function hideElements(selectors: string | string[]): void {
  getAntiFlicker().hide(selectors)
}

export function showElements(): void {
  getAntiFlicker().ready()
}

// Auto-inicializar se script inline foi usado
if (typeof window !== 'undefined' && (window as any).rfAntiFlicker) {
  // Já foi inicializado via script inline
  console.log('[RF Anti-Flicker] Detectado script inline, usando implementação existente')
}
