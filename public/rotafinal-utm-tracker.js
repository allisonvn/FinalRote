/**
 * RotaFinal UTM Tracker
 * Script avançado para captura e persistência de UTMs e parâmetros de tracking
 * Integrado com o sistema RotaFinal
 */

(function() {
    'use strict';

    // Configuração
    const CONFIG = {
        // Parâmetros para capturar
        trackingParams: [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'src', 'sck', 'msclkid', 'ttclid'
        ],
        
        // Domínios de checkout para propagação de UTMs
        checkoutDomains: [
            'pay.hotmart.com', 'payment.ticto.app', 'sun.eduzz.com', 
            'pay.kiwify.com.br', 'checkout.stripe.com', 'api.pagar.me',
            'pagseguro.com.br', 'sandbox.pagseguro.com.br', 'mercadopago.com.br'
        ],
        
        // Configurações de cookies
        cookieConfig: {
            expires: 30, // dias
            path: '/',
            secure: true,
            sameSite: 'Lax'
        },
        
        // Configurações de debug
        debug: false,
        
        // Configuração RotaFinal
        rotaFinal: {
            enabled: true,
            sessionTracking: true,
            autoPageView: true
        }
    };

    // Utilitários
    const Utils = {
        // Log debug
        log(...args) {
            if (CONFIG.debug) {
                console.log('[RotaFinal UTM]', ...args);
            }
        },

        // Sanitizar valor (remover espaços, converter para lowercase em alguns casos)
        sanitizeValue(value, param) {
            if (!value) return value;
            
            // Para UTM source, medium, campaign - manter case original mas limpar espaços
            if (['utm_source', 'utm_medium', 'utm_campaign'].includes(param)) {
                return value.trim().replace(/\s+/g, '_');
            }
            
            // Para outros parâmetros, manter valor original
            return value.trim();
        },

        // Gerar ID único do visitante
        generateVisitorId() {
            return 'visitor_' + Math.random().toString(36).substr(2, 12) + '_' + Date.now();
        },

        // Gerar ID da sessão
        generateSessionId() {
            return 'session_' + Math.random().toString(36).substr(2, 10) + '_' + Date.now();
        },

        // Detectar dispositivo
        getDeviceType() {
            const ua = navigator.userAgent;
            if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
            if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
            return 'desktop';
        },

        // Detectar browser
        getBrowserInfo() {
            const ua = navigator.userAgent;
            let browser = 'unknown';
            let version = 'unknown';

            if (ua.indexOf('Chrome') > -1) {
                browser = 'Chrome';
                version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown';
            } else if (ua.indexOf('Firefox') > -1) {
                browser = 'Firefox';
                version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'unknown';
            } else if (ua.indexOf('Safari') > -1) {
                browser = 'Safari';
                version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'unknown';
            } else if (ua.indexOf('Edge') > -1) {
                browser = 'Edge';
                version = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'unknown';
            }

            return { browser, version };
        },

        // Detectar OS
        getOSInfo() {
            const ua = navigator.userAgent;
            let os = 'unknown';
            let version = 'unknown';

            if (ua.indexOf('Windows NT') > -1) {
                os = 'Windows';
                version = ua.match(/Windows NT ([0-9.]+)/)?.[1] || 'unknown';
            } else if (ua.indexOf('Mac OS X') > -1) {
                os = 'macOS';
                version = ua.match(/Mac OS X ([0-9_.]+)/)?.[1]?.replace(/_/g, '.') || 'unknown';
            } else if (ua.indexOf('Linux') > -1) {
                os = 'Linux';
            } else if (/Android/.test(ua)) {
                os = 'Android';
                version = ua.match(/Android ([0-9.]+)/)?.[1] || 'unknown';
            } else if (/iPhone|iPad|iPod/.test(ua)) {
                os = 'iOS';
                version = ua.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || 'unknown';
            }

            return { os, version };
        }
    };

    // Gerenciador de cookies
    const CookieManager = {
        set(name, value, days = CONFIG.cookieConfig.expires) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            
            const secure = CONFIG.cookieConfig.secure ? '; Secure' : '';
            const sameSite = CONFIG.cookieConfig.sameSite ? '; SameSite=' + CONFIG.cookieConfig.sameSite : '';
            
            document.cookie = `${name}=${value || ""}${expires}; path=${CONFIG.cookieConfig.path}${secure}${sameSite}`;
        },

        get(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(";").shift();
            return null;
        },

        delete(name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${CONFIG.cookieConfig.path};`;
        }
    };

    // Gerenciador de localStorage
    const StorageManager = {
        set(key, value) {
            if (typeof Storage !== "undefined") {
                try {
                    localStorage.setItem(key, value);
                } catch (e) {
                    Utils.log('Erro ao salvar no localStorage:', e);
                }
            }
        },

        get(key) {
            if (typeof Storage !== "undefined") {
                try {
                    return localStorage.getItem(key);
                } catch (e) {
                    Utils.log('Erro ao ler do localStorage:', e);
                    return null;
                }
            }
            return null;
        },

        delete(key) {
            if (typeof Storage !== "undefined") {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    Utils.log('Erro ao deletar do localStorage:', e);
                }
            }
        }
    };

    // Capturador de UTMs
    const UTMCapture = {
        // Capturar e persistir parâmetros da URL
        captureFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const capturedParams = {};
            let hasNewParams = false;

            CONFIG.trackingParams.forEach(param => {
                const value = urlParams.get(param);
                if (value) {
                    const sanitizedValue = Utils.sanitizeValue(value, param);
                    capturedParams[param] = sanitizedValue;
                    
                    // Salvar em cookie e localStorage
                    CookieManager.set(param, sanitizedValue);
                    StorageManager.set(`rf_${param}`, sanitizedValue);
                    
                    hasNewParams = true;
                    Utils.log(`Captured ${param}:`, sanitizedValue);
                }
            });

            // Limpar URL se capturou parâmetros
            if (hasNewParams && window.history && window.history.replaceState) {
                const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);
                Utils.log('URL cleaned, parameters preserved in storage');
            }

            return capturedParams;
        },

        // Obter todos os parâmetros salvos
        getSavedParams() {
            const params = {};
            
            CONFIG.trackingParams.forEach(param => {
                // Priorizar localStorage, fallback para cookie
                const value = StorageManager.get(`rf_${param}`) || CookieManager.get(param);
                if (value) {
                    params[param] = value;
                }
            });

            return params;
        },

        // Limpar parâmetros salvos
        clearSavedParams() {
            CONFIG.trackingParams.forEach(param => {
                CookieManager.delete(param);
                StorageManager.delete(`rf_${param}`);
            });
            Utils.log('All UTM parameters cleared');
        }
    };

    // Integração com formulários
    const FormIntegration = {
        // Preencher campos hidden em formulários
        populateHiddenFields() {
            const params = UTMCapture.getSavedParams();
            
            document.querySelectorAll('form').forEach(form => {
                CONFIG.trackingParams.forEach(param => {
                    if (params[param]) {
                        let hiddenField = form.querySelector(`input[name="${param}"]`);
                        
                        // Criar campo hidden se não existir
                        if (!hiddenField) {
                            hiddenField = document.createElement('input');
                            hiddenField.type = 'hidden';
                            hiddenField.name = param;
                            form.appendChild(hiddenField);
                        }

                        hiddenField.value = params[param];
                    }
                });
            });

            Utils.log('Hidden fields populated in forms');
        },

        // Adicionar parâmetros aos dados do formulário no submit
        attachFormSubmitListener() {
            document.addEventListener('submit', (e) => {
                const form = e.target;
                const params = UTMCapture.getSavedParams();
                
                // Adicionar campos hidden se não existirem
                CONFIG.trackingParams.forEach(param => {
                    if (params[param] && !form.querySelector(`input[name="${param}"]`)) {
                        const hiddenField = document.createElement('input');
                        hiddenField.type = 'hidden';
                        hiddenField.name = param;
                        hiddenField.value = params[param];
                        form.appendChild(hiddenField);
                    }
                });

                Utils.log('Form submit with UTM parameters:', params);
            });
        }
    };

    // Integração com links
    const LinkIntegration = {
        // Anexar parâmetros aos links de checkout
        attachParamsToCheckoutLinks() {
            const params = UTMCapture.getSavedParams();
            
            document.querySelectorAll('a[href]').forEach(link => {
                try {
                    const url = new URL(link.href);
                    
                    // Verificar se é um domínio de checkout
                    if (CONFIG.checkoutDomains.some(domain => url.hostname.includes(domain))) {
                        const urlParams = new URLSearchParams(url.search);
                        
                        // Adicionar parâmetros UTM
                        Object.keys(params).forEach(key => {
                            if (params[key]) {
                                urlParams.set(key, params[key]);
                            }
                        });
                        
                        // Atualizar href do link
                        link.href = `${url.origin}${url.pathname}?${urlParams.toString()}${url.hash}`;
                        
                        Utils.log('UTM parameters attached to checkout link:', link.href);
                    }
                } catch (e) {
                    // URL inválida, ignorar
                }
            });
        },

        // Observer para novos links adicionados dinamicamente
        observeNewLinks() {
            if (typeof MutationObserver !== 'undefined') {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // Element node
                                // Verificar se o próprio node é um link
                                if (node.tagName === 'A' && node.href) {
                                    this.attachParamsToSingleLink(node);
                                }
                                
                                // Verificar links filhos
                                const links = node.querySelectorAll ? node.querySelectorAll('a[href]') : [];
                                links.forEach(link => this.attachParamsToSingleLink(link));
                            }
                        });
                    });
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                Utils.log('MutationObserver attached for dynamic links');
            }
        },

        // Anexar parâmetros a um link específico
        attachParamsToSingleLink(link) {
            const params = UTMCapture.getSavedParams();
            
            try {
                const url = new URL(link.href);
                
                if (CONFIG.checkoutDomains.some(domain => url.hostname.includes(domain))) {
                    const urlParams = new URLSearchParams(url.search);
                    
                    Object.keys(params).forEach(key => {
                        if (params[key]) {
                            urlParams.set(key, params[key]);
                        }
                    });
                    
                    link.href = `${url.origin}${url.pathname}?${urlParams.toString()}${url.hash}`;
                }
            } catch (e) {
                // URL inválida, ignorar
            }
        }
    };

    // Integração com RotaFinal
    const RotaFinalIntegration = {
        // Criar sessão no RotaFinal
        createSession() {
            if (!CONFIG.rotaFinal.enabled || !CONFIG.rotaFinal.sessionTracking) return;

            const visitorId = StorageManager.get('rf_visitor_id') || Utils.generateVisitorId();
            const sessionId = Utils.generateSessionId();
            const params = UTMCapture.getSavedParams();
            const browserInfo = Utils.getBrowserInfo();
            const osInfo = Utils.getOSInfo();

            // Salvar visitor ID
            StorageManager.set('rf_visitor_id', visitorId);
            CookieManager.set('rf_visitor_id', visitorId);

            // Dados da sessão
            const sessionData = {
                visitor_id: visitorId,
                session_id: sessionId,
                page_url: window.location.href,
                page_title: document.title,
                referrer: document.referrer,
                user_agent: navigator.userAgent,
                device_type: Utils.getDeviceType(),
                browser_name: browserInfo.browser,
                browser_version: browserInfo.version,
                os_name: osInfo.os,
                os_version: osInfo.version,
                screen_resolution: `${screen.width}x${screen.height}`,
                timestamp: new Date().toISOString(),
                ...params // Incluir todos os parâmetros UTM
            };

            // Enviar dados para RotaFinal (se SDK estiver disponível)
            if (typeof window.RotaFinal !== 'undefined') {
                // Integrar com SDK existente
                Utils.log('Integrating with RotaFinal SDK');
            }

            // Salvar dados da sessão localmente
            StorageManager.set('rf_session_data', JSON.stringify(sessionData));

            Utils.log('RotaFinal session created:', sessionData);
            return sessionData;
        },

        // Rastrear page view com UTMs
        trackPageView() {
            if (!CONFIG.rotaFinal.enabled || !CONFIG.rotaFinal.autoPageView) return;

            const sessionData = this.createSession();
            
            // Se RotaFinal SDK estiver disponível, usar ele
            if (typeof window.RotaFinal !== 'undefined') {
                // Integração direta com SDK
                Utils.log('Page view tracked via RotaFinal SDK');
            }

            Utils.log('Page view tracked with UTM data');
        }
    };

    // Inicializador principal
    const UTMTracker = {
        initialized: false,

        init() {
            if (this.initialized) return;

            Utils.log('Initializing RotaFinal UTM Tracker...');

            // Capturar parâmetros da URL
            const capturedParams = UTMCapture.captureFromURL();

            // Inicializar integrações
            this.setupIntegrations();

            // Integração com RotaFinal
            RotaFinalIntegration.trackPageView();

            this.initialized = true;
            Utils.log('RotaFinal UTM Tracker initialized successfully');

            // Disparar evento customizado
            if (typeof window.CustomEvent !== 'undefined') {
                window.dispatchEvent(new CustomEvent('rotafinalUTMTrackerReady', {
                    detail: { capturedParams, savedParams: UTMCapture.getSavedParams() }
                }));
            }
        },

        setupIntegrations() {
            // Aguardar DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.runIntegrations();
                });
            } else {
                this.runIntegrations();
            }
        },

        runIntegrations() {
            // Integração com formulários
            FormIntegration.populateHiddenFields();
            FormIntegration.attachFormSubmitListener();

            // Integração com links
            LinkIntegration.attachParamsToCheckoutLinks();
            LinkIntegration.observeNewLinks();

            Utils.log('All integrations initialized');
        }
    };

    // API pública
    window.RotaFinalUTM = {
        // Obter parâmetros salvos
        getParams: () => UTMCapture.getSavedParams(),
        
        // Obter parâmetro específico
        getParam: (param) => StorageManager.get(`rf_${param}`) || CookieManager.get(param),
        
        // Limpar todos os parâmetros
        clear: () => UTMCapture.clearSavedParams(),
        
        // Forçar re-captura
        recapture: () => UTMCapture.captureFromURL(),
        
        // Atualizar links
        updateLinks: () => LinkIntegration.attachParamsToCheckoutLinks(),
        
        // Atualizar formulários
        updateForms: () => FormIntegration.populateHiddenFields(),
        
        // Configurar debug
        setDebug: (enabled) => { CONFIG.debug = enabled; },
        
        // Obter dados da sessão
        getSessionData: () => {
            const data = StorageManager.get('rf_session_data');
            return data ? JSON.parse(data) : null;
        },

        // Configuração
        config: CONFIG
    };

    // Auto-inicialização
    UTMTracker.init();

    Utils.log('RotaFinal UTM Tracker loaded and ready');

})();
