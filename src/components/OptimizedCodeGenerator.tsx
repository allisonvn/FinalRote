import React, { useState } from 'react'
import { Copy, Check, AlertTriangle, Zap, Target, Brain, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface Variant {
  id: string
  name: string
  redirect_url?: string
  css_changes?: string
  js_changes?: string
  changes?: any
  is_control?: boolean
}

interface OptimizedCodeGeneratorProps {
  experimentName: string
  experimentId: string
  experimentType: 'redirect' | 'element' | 'split_url' | 'mab'
  variants: Variant[]
  baseUrl?: string
  apiKey: string
  algorithm?: string
  conversionValue?: number
  conversionConfig?: {
    type?: string
    url?: string
    selector?: string
    event?: string
    value?: number
  } | null
}

export default function OptimizedCodeGenerator({
  experimentName,
  experimentId,
  experimentType,
  variants = [],
  baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rotafinal.com.br',
  apiKey,
  algorithm = 'thompson_sampling',
  conversionValue = 0,
  conversionConfig = null
}: OptimizedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  // ✅ CORREÇÃO: Mover antiFlickerTimeout para escopo do componente
  const antiFlickerTimeout = experimentType === 'redirect' || experimentType === 'split_url' ? 120 : 200

  /**
   * Gera o código completo otimizado
   */
  const generateOptimizedCode = () => {
    // Buscar configuração de conversão (primeiro do experimento, depois das variantes)
    const experimentConversionConfig = conversionConfig
    const variantConversionConfig = variants.find(v => v.changes?.conversion)?.changes?.conversion
    const finalConversionConfig = experimentConversionConfig || variantConversionConfig
    const hasConversionTracking = finalConversionConfig && (finalConversionConfig.url || finalConversionConfig.selector || finalConversionConfig.event)

    // ✅ NOVO: Extrair todas as URLs do experimento (de todas as variantes)
    const experimentUrls = variants
      .map(v => v.redirect_url)
      .filter(Boolean)
      .map(url => {
        try {
          const urlObj = new URL(url as string, baseUrl)
          return urlObj.pathname
        } catch {
          return url
        }
      })

    // Versão do SDK
    const sdkVersion = '3.0.1-auto-conversion'
    
    // Código de aplicação de mudanças (CSS/JS)
    let applyChangesCode = ''
    if (experimentType === 'element') {
      const cssChanges = variants
        .filter(v => v.css_changes)
        .map(v => `if(variant.name==="${v.name}"){var s=document.createElement("style");s.textContent=\`${v.css_changes}\`;document.head.appendChild(s)}`)
        .join('')
      
      const jsChanges = variants
        .filter(v => v.js_changes)
        .map(v => `if(variant.name==="${v.name}"){try{eval(\`${v.js_changes}\`)}catch(e){console.error("RotaFinal: JS error",e)}}`)
        .join('')
      
      applyChangesCode = cssChanges + jsChanges
    }

    // Código de rastreamento de conversões
    let conversionTrackingCode = ''
    if (hasConversionTracking) {
      if (finalConversionConfig.url) {
        conversionTrackingCode = `,setupConversionTracking:function(){var e="${finalConversionConfig.url}";var t=window.location.pathname,r=window.location.href.split("?")[0].split("#")[0],n="";try{var o=new URL(e,window.location.origin);n=o.pathname}catch(_){n=e.split("?")[0].split("#")[0]}var a=t===n||r.indexOf(n)!==-1||t.indexOf(n)!==-1||r===e||r.indexOf(e)!==-1;if(a){tracking.track("conversion",{url:r,conversion_url:e,value:${finalConversionConfig.value || conversionValue}})}}`
      } else if (finalConversionConfig.selector) {
        conversionTrackingCode = `,setupConversionTracking:function(){var e="${finalConversionConfig.selector}";document.addEventListener("click",function(t){var n=t.target.closest(e);if(n){tracking.track("conversion",{selector:e,element:n.tagName.toLowerCase(),text:(n.textContent||"").trim().substr(0,100),value:${finalConversionConfig.value || conversionValue}})}},true)}`
      } else if (finalConversionConfig.event) {
        conversionTrackingCode = `,setupConversionTracking:function(){var e="${finalConversionConfig.event}";document.addEventListener(e,function(t){tracking.track("conversion",{event:e,value:${finalConversionConfig.value || conversionValue}})},true)}`
      }
    }

    // ✅ CORREÇÃO: Para redirect/split_url, fazer redirect IMEDIATAMENTE antes de renderizar qualquer coisa
    const isRedirectExperiment = experimentType === 'redirect' || experimentType === 'split_url'

    // SDK Principal Inline Minificado - VERSÃO OTIMIZADA E COMPLETA
    const inlineSDK = `!function(){"use strict";var e="${experimentId}",t="${baseUrl}",r="${apiKey}",n="${sdkVersion}",o=${debugMode ? 'true' : 'false'},a=${antiFlickerTimeout},i="rf_variant_"+e,s="rf_experiment_"+e,l="rotafinal_exp_"+e,c="rf_queue_"+e,u=18e5,d="rf_redirected_"+e,f="rf_conversion_tracked_"+e,p=${JSON.stringify(experimentUrls)},g=function(e,t){if(o||localStorage.getItem("rf_debug")){try{console.log("[RotaFinal v"+n+"]",e,t||"")}catch(_){}}},h=function(){try{var e="__t";localStorage.setItem(e,"1");localStorage.removeItem(e);return true}catch(_){return false}},m=function(e){try{return localStorage.getItem(e)}catch(_){return null}},v=function(e,t){try{localStorage.setItem(e,t)}catch(_){}},w=function(){if(!p||p.length===0)return true;var e=window.location.pathname;for(var t=0;t<p.length;t++){var r=p[t];if(e===r||e.startsWith(r)||e.includes(r))return true}return false},x=function(){if(!h())return null;try{var e=m(i);if(!e)return null;var t=JSON.parse(e);if(Date.now()-t.t>u)return null;return t.v||null}catch(_){return null}},y=function(){if(!h())return null;try{var e=m(s);if(!e)return null;var t=JSON.parse(e);if(Date.now()-t.t>u)return null;return t.e||null}catch(_){return null}},z=function(e){if(!h())return;v(s,JSON.stringify({e:e,t:Date.now()}))},A=function(e,t){if(!h())return;var r={experimentId:e,experiment_id:e,variantId:t.id,variant_id:t.id,variantName:t.name,variant:t.name,visitorId:B(),visitor_id:B(),timestamp:Date.now()};v(l,JSON.stringify(r));g("💾 Assignment data saved",r);var n={url:window.location.href,title:document.title,timestamp:Date.now()};v("rotafinal_origin_"+e,JSON.stringify(n));g("💾 Origin page data saved",n)},C=function(e){if(!e)return false;var t=window.location.href.split("?")[0].split("#")[0],r=e.split("?")[0].split("#")[0];if(r===t)return false;g("⚡ REDIRECT",e);try{sessionStorage.setItem(d,"1")}catch(_){}window.location.replace(e);return true},B=function(){var e="rf_user_id",t=h()?m(e):null;if(!t){t="rf_"+Math.random().toString(36).slice(2,11)+"_"+Date.now().toString(36);if(h())v(e,t)}return t},D=function(){return{visitor_id:B(),user_agent:navigator.userAgent||"",url:location.href,referrer:document.referrer,timestamp:new Date().toISOString(),viewport:{width:window.innerWidth,height:window.innerHeight}}},E=function(e){if(!e||!e.conversion_url)return;try{if(sessionStorage.getItem(f)==="1"){g("Conversion already tracked");return}}catch(_){}var t=e.conversion_url,r=window.location.pathname,n=window.location.href.split("?")[0].split("#")[0],o="";try{var a=new URL(t,window.location.origin);o=a.pathname}catch(_){o=t.split("?")[0].split("#")[0]}var i=r===o||n.indexOf(o)!==-1||r.indexOf(o)!==-1||n===t||n.indexOf(t)!==-1;if(i){g("🎯 Conversion page detected!",{currentPath:r,conversionPath:o,currentFullUrl:n,conversionUrl:t,value:e.conversion_value});try{sessionStorage.setItem(f,"1")}catch(_){}var c=parseFloat(e.conversion_value)||0;window.RotaFinal.convert(c,{auto:true,url:n,conversion_url:t})}else{g("⚠️ Not on conversion page",{currentPath:r,conversionPath:o,currentFullUrl:n,conversionUrl:t})}};(function(){if(!w())return;try{if(sessionStorage.getItem(d)==="1"){return}}catch(_){}var e=x();if(e){g("📦 Using cached variant",e);var t=e.final_url||e.redirect_url;if(t&&!e.is_control){g("⚡ Cached variant redirect",t);C(t);return}}g("⚡ First visit - fetching variant");var r=new XMLHttpRequest();r.open("POST",t+"/api/experiments/"+e+"/assign",false);r.setRequestHeader("Content-Type","application/json");r.setRequestHeader("Authorization","Bearer "+r);r.setRequestHeader("X-RF-Version",n);try{r.send(JSON.stringify(D()));if(r.status===200){var a=JSON.parse(r.responseText);if(a.variant){g("✅ Variant received",a.variant);v(i,JSON.stringify({v:a.variant,t:Date.now()}));if(a.experiment){z(a.experiment);A(e,a.variant)}var o=a.variant.final_url||a.variant.redirect_url;if(o&&!a.variant.is_control){g("⚡ First visit redirect",o);C(o)}}else{g("⚠️ No variant in response",a)}}else{g("⚠️ API returned status",r.status)}}catch(e){g("Sync assign error",e)}}());var F=function(){try{return navigator.userAgent||""}catch(_){return""}},G=function(){return new Date().toISOString()},H=function(e,t,r){r=r||3;var n=new AbortController(),o=setTimeout(function(){n.abort()},5000),a={"Content-Type":"application/json","Authorization":"Bearer "+r,"X-RF-Version":n},i=Object.assign({headers:a,signal:n.signal},t||{});return fetch(e,i).then(function(e){clearTimeout(o);if(!e.ok)throw new Error("HTTP "+e.status);return e.json()}).catch(function(e){clearTimeout(o);if(r<=1)throw e;var t=Math.min(600,100*Math.pow(2,3-r))+Math.random()*120;return new Promise(function(e){setTimeout(e,t)}).then(function(){return H(e,t,r-1)})})},I=function(){var e=F().toLowerCase();return/bot|crawler|spider|crawling|archiver|scraper|slurp|wget|curl|httpunit|preview|prerender|headless/i.test(e)},J=function(e){if(!h())return;v(i,JSON.stringify({v:e,t:Date.now()}))},K={cachedVariant:null,applyVariant:function(e){if(!e)return;this.cachedVariant=e;document.documentElement.setAttribute("data-rf-experiment",e);document.documentElement.setAttribute("data-rf-variant",e.name||"control");document.documentElement.setAttribute("data-rf-user",B());${applyChangesCode}}},L=null,M=function(){if(K.cachedVariant)return Promise.resolve({variant:K.cachedVariant});if(L)return L;var e=x();if(e){K.cachedVariant=e;return Promise.resolve({variant:e})}try{if(sessionStorage.getItem(d)==="1"){return Promise.resolve({variant:{name:"redirected",skip:true}})}}catch(_){}L=H(t+"/api/experiments/"+e+"/assign",{method:"POST",body:JSON.stringify(D())}).then(function(e){if(e&&e.variant){K.cachedVariant=e.variant;J(e.variant);if(e.experiment){z(e.experiment);A(experimentId,e.variant)}}return e}).catch(function(e){g("Assign error",e);return{variant:{name:"control",is_control:true,error:true}}}).finally(function(){L=null});return L},N={eventQueue:[],_clickBuffer:[],_clickTimer:null,baseEvent:function(e,t){return{experiment_id:experimentId,visitor_id:B(),variant_id:K.cachedVariant&&K.cachedVariant.id||null,variant:K.cachedVariant&&K.cachedVariant.name||null,event_type:e,properties:t||{},timestamp:G(),url:location.href,referrer:document.referrer,user_agent:F()}},track:function(e,t){var r=this.baseEvent(e,t);g("Track",e,r);return H(t+"/api/track",{method:"POST",body:JSON.stringify(r)}).catch(function(e){N.enqueue(r)})},trackBufferedClick:function(e,t){this._clickBuffer.push(this.baseEvent(e,t));if(this._clickTimer)return;this._clickTimer=setTimeout(function(){N._clickTimer=null;N.flushClicks()},150)},flushClicks:function(){var e=N._clickBuffer.splice(0);if(!e.length)return;H(t+"/api/track/batch",{method:"POST",body:JSON.stringify({events:e})}).catch(function(){N.eventQueue.push.apply(N.eventQueue,e);O()})},setupClickTracking:function(){document.addEventListener("click",function(e){var t=e.target&&e.target.closest&&e.target.closest("[data-rf-track]");if(!t)return;var r=t.getAttribute("data-rf-track")||"click",n={};Array.prototype.forEach.call(t.attributes,function(e){if(e.name.indexOf("data-rf-")===0&&e.name!=="data-rf-track"){n[e.name.replace("data-rf-","")]=e.value}});var o={element:t.tagName.toLowerCase(),text:(t.textContent||"").trim().slice(0,100)};Object.assign(o,n);N.trackBufferedClick(r,o)},true)},trackPageview:function(){this.track("page_view",{title:document.title,path:location.pathname,search:location.search})},enqueue:function(e){N.eventQueue.push(e);O()},flushQueue:function(){if(!N.eventQueue.length)return;var e=N.eventQueue.splice(0);O();H(t+"/api/track/batch",{method":"POST",body:JSON.stringify({events:e})}).catch(function(){N.eventQueue.unshift.apply(N.eventQueue,e);O()})}${conversionTrackingCode}},O=function(){if(!h())return;try{v(c,JSON.stringify(N.eventQueue))}catch(_){}},P=function(){if(!h())return[];try{return JSON.parse(m(c)||"[]")}catch(_){return[]}};N.eventQueue=P();var Q=N.eventQueue.push.bind(N.eventQueue);N.eventQueue.push=function(){var e=Q.apply(N.eventQueue,arguments);O();return e};function R(){if(!N.eventQueue.length)return;var e=JSON.stringify({events:N.eventQueue});if(navigator.sendBeacon){var t=navigator.sendBeacon(t+"/api/track/batch",new Blob([e],{type":"application/json"}));if(t){N.eventQueue=[];O();return}}N.flushQueue()}document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")R()});window.addEventListener("beforeunload",R);function S(){document.body.setAttribute("data-rf-ready","true");var e=document.querySelector("style[data-rf-antiflicker]");if(e)setTimeout(function(){try{e.remove()}catch(_){}},80);g("Page visible")}function T(e){return window.requestIdleCallback?requestIdleCallback(e,{timeout:500}):setTimeout(e,50)}function U(){if(!w()){S();return}if(I()){S();return}g("Init");var e=setTimeout(S,a);M().then(function(t){clearTimeout(e);if(t&&t.variant&&!t.variant.skip){K.cachedVariant=t.variant;if(t.experiment){z(t.experiment);A(experimentId,t.variant);E(t.experiment)}K.applyVariant(t.variant);N.trackPageview();${hasConversionTracking ? 'T(function(){N.setupConversionTracking()});' : ''}S()}else{S()}}).catch(function(e){clearTimeout(e);S()});T(function(){N.setupClickTracking();var e=y();if(e){E(e)}})}window.RotaFinal={track:function(e,t){return N.track(e,t)},convert:function(e,t){return N.track("conversion",Object.assign({value:e||${conversionValue}},t))},getVariant:function(){return K.cachedVariant},getUserId:B,reload:function(){K.cachedVariant=null;v(i,"");v(s,"");v(l,"");try{sessionStorage.removeItem(d);sessionStorage.removeItem(f)}catch(_){}location.reload()},setDebug:function(e){e?localStorage.setItem("rf_debug","1"):localStorage.removeItem("rf_debug");o=e;location.reload()}};if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",U)}else{U()}}();`

    // CSS Anti-Flicker otimizado
    const antiFlickerCSS = `<style data-rf-antiflicker>
body:not([data-rf-ready]){opacity:0;visibility:hidden}
body[data-rf-ready]{opacity:1;visibility:visible;transition:opacity .1s ease-out}
</style>`

    // Preconnect para otimização
    const preconnectTags = `<link rel="preconnect" href="${baseUrl}">
<link rel="dns-prefetch" href="${baseUrl}">`

    // Instruções de uso
    const usageInstructions = generateUsageInstructions(experimentType, hasConversionTracking, finalConversionConfig)

    // Código completo
    return `<!-- RotaFinal SDK v${sdkVersion} - ${experimentName} -->
<!-- Experimento ID: ${experimentId} -->
<!-- Tipo: ${experimentType.toUpperCase()} | Algoritmo: ${algorithm.toUpperCase()} -->

${preconnectTags}

${antiFlickerCSS}

<script>
${inlineSDK}
</script>

${hasConversionTracking ? `
<!-- 🎯 CONVERSION TRACKER - Rastreamento Automático de Conversões -->
<script src="https://rotafinal.com.br/conversion-tracker.js"></script>
` : ''}

${usageInstructions}

<!-- 
📊 TRACKING DE CONVERSÕES:

Manual (em qualquer lugar):
  RotaFinal.convert(valor, { produto: 'x', orderId: '123' })

Por clique em elemento:
  <button data-rf-track="cta_click" data-rf-button="signup">Inscrever-se</button>

${hasConversionTracking ? `✅ Conversão automática configurada (conversion-tracker.js incluído):
  Tipo: ${finalConversionConfig.type || 'page_view'}
  ${finalConversionConfig.url ? `URL: ${finalConversionConfig.url}` : ''}
  ${finalConversionConfig.selector ? `Seletor: ${finalConversionConfig.selector}` : ''}
  ${finalConversionConfig.event ? `Evento: ${finalConversionConfig.event}` : ''}
  
  📍 O script conversion-tracker.js é incluído automaticamente
  e detecta conversões quando o usuário acessa a página configurada.
` : ''}

🐛 DEBUG:
  RotaFinal.setDebug(true)  // Ativar logs
  RotaFinal.getVariant()    // Ver variante atual
  RotaFinal.reload()        // Forçar nova atribuição
-->`
  }

  /**
   * Gera instruções de uso baseado no tipo de experimento
   */
  const generateUsageInstructions = (type: string, hasTracking: boolean, config: any) => {
    const instructions: Record<string, string> = {
      redirect: `<!-- ✅ EXPERIMENTO DE REDIRECIONAMENTO -->
<!-- • Redirecionamento automático para diferentes URLs -->
<!-- • Zero flicker (< 120ms) -->
<!-- • Usuários veem a URL da variante atribuída -->
${hasTracking ? `<!-- • Conversão automática configurada (conversion-tracker.js incluído) -->` : '<!-- • Configure conversão manual com RotaFinal.convert() -->'}`,
      
      split_url: `<!-- ✅ TESTE SPLIT URL -->
<!-- • Cada variante tem sua própria URL -->
<!-- • Redirecionamento instantâneo -->
<!-- • Ideal para páginas muito diferentes -->
${hasTracking ? `<!-- • Tracking automático em ${config?.url || 'URL configurada'} (conversion-tracker.js incluído) -->` : '<!-- • Use RotaFinal.convert() na página de conversão -->'}`,
      
      element: `<!-- ✅ EXPERIMENTO DE ELEMENTO -->
<!-- • Modifica elementos na mesma página -->
<!-- • CSS e JS aplicados automaticamente -->
<!-- • Zero flicker (< 200ms) -->
<!-- • Ideal para testes de copy, cor, layout -->
${hasTracking ? `<!-- • Conversão detectada automaticamente em ${config?.selector || config?.url || 'elemento configurado'} (conversion-tracker.js incluído) -->` : '<!-- • Configure conversão com data-rf-track="conversion" -->'}`,
      
      mab: `<!-- 🧠 MULTI-ARMED BANDIT (${algorithm.toUpperCase()}) -->
<!-- • IA otimiza automaticamente distribuição de tráfego -->
<!-- • Variantes com melhor performance recebem mais visitantes -->
<!-- • Maximiza conversões durante o teste -->
<!-- • Requer mínimo de 100 visitantes para ativar -->
${hasTracking ? `<!-- • Conversão rastreada automaticamente (conversion-tracker.js incluído) -->` : '<!-- • Configure conversão para melhor performance do algoritmo -->'}`,
    }

    return instructions[type] || instructions.redirect
  }

  /**
   * Copia código para clipboard
   */
  const copyToClipboard = async () => {
    const code = generateOptimizedCode()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alertas Importantes */}
      <div className="space-y-3">
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">⚠️ CRÍTICO - Leia Antes de Instalar</AlertTitle>
          <AlertDescription className="text-red-700 space-y-2">
            <div className="font-medium">Para ZERO flicker, siga exatamente esta ordem:</div>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Cole o código <strong>NO TOPO DO &lt;head&gt;</strong></li>
              <li><strong>ANTES</strong> de qualquer outro script</li>
              <li><strong>SEM</strong> atributos async ou defer</li>
              <li>Se piscar = está na posição errada</li>
            </ol>
          </AlertDescription>
        </Alert>

        {!apiKey && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 font-bold">API Key Ausente</AlertTitle>
            <AlertDescription className="text-amber-700">
              Este experimento não tem API key configurada. O código gerado pode não funcionar corretamente.
            </AlertDescription>
          </Alert>
        )}

        {variants.length === 0 && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 font-bold">Nenhuma Variante Configurada</AlertTitle>
            <AlertDescription className="text-amber-700">
              Este experimento não tem variantes configuradas. Configure as variantes antes de gerar o código.
            </AlertDescription>
          </Alert>
        )}

        {hasConversionTracking && (
          <Alert className="border-green-300 bg-green-50">
            <Target className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 font-bold">✅ Rastreamento Automático Ativado</AlertTitle>
            <AlertDescription className="text-green-700">
              O conversion-tracker.js será incluído automaticamente. Conversões serão detectadas quando o usuário acessar a página configurada.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Informações do Experimento */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Informações do Experimento</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {experimentType.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {algorithm.toUpperCase()}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Nome:</span>
            <span className="ml-2 text-gray-900">{experimentName}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">ID:</span>
            <span className="ml-2 text-gray-900 font-mono text-xs">{experimentId}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Variantes:</span>
            <span className="ml-2 text-gray-900">{variants.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Rastreamento:</span>
            <span className={`ml-2 ${hasConversionTracking ? 'text-green-600' : 'text-gray-500'}`}>
              {hasConversionTracking ? 'Ativado' : 'Manual'}
            </span>
          </div>
        </div>
      </div>

          {/* Controles */}
      <div className="flex flex-wrap gap-3">
            <Button
              onClick={copyToClipboard}
          className="flex items-center gap-2"
          size="lg"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado!' : 'Copiar Código'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setDebugMode(!debugMode)}
          className="flex items-center gap-2"
            >
          <Zap className="h-4 w-4" />
          {debugMode ? 'Debug Ativado' : 'Ativar Debug'}
            </Button>
          </div>

          {/* Código Gerado */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Código Gerado</h3>
          <div className="text-sm text-gray-500">
            {generateOptimizedCode().length} caracteres
              </div>
            </div>

                <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
            <code>{generateOptimizedCode()}</code>
                  </pre>
              </div>
            </div>

      {/* Instruções de Instalação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Instruções de Instalação
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. <strong>Copie o código acima</strong> (botão "Copiar Código")</p>
          <p>2. <strong>Cole no &lt;head&gt;</strong> do seu site, antes de qualquer outro script</p>
          <p>3. <strong>Salve e publique</strong> as alterações</p>
          <p>4. <strong>Teste</strong> acessando a URL do experimento</p>
          {hasConversionTracking && (
            <p className="text-green-700 font-medium">
              5. ✅ <strong>Rastreamento automático ativado</strong> - conversões serão detectadas automaticamente
            </p>
          )}
            </div>
          </div>
    </div>
  )
}