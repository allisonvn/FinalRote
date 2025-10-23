'use client'

/**
 * 🚀 GERADOR DE CÓDIGO OTIMIZADO v3.0
 * 
 * Este é o ÚNICO gerador de código oficial do RotaFinal.
 * Gera código inline minificado que funciona 100% sem dependências externas.
 * 
 * Características:
 * - ✅ Código inline completo (sem arquivos externos)
 * - ✅ Anti-flicker otimizado (< 120ms)
 * - ✅ Suporte a MAB (Thompson Sampling, UCB1, Epsilon-Greedy)
 * - ✅ Cache inteligente (sessão completa)
 * - ✅ Logs de debug configuráveis
 * - ✅ Conversão automática por seletor/URL
 * - ✅ Timeout de segurança
 * - ✅ Tratamento robusto de erros
 */

import { useState } from 'react'
import { Copy, Check, Code, AlertTriangle, CheckCircle, Info, Lightbulb, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Variant {
  id: string
  name: string
  description?: string
  redirect_url?: string
  traffic_percentage?: number
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
}

export default function OptimizedCodeGenerator({
  experimentName,
  experimentId,
  experimentType,
  variants = [],
  baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rotafinal.com.br',
  apiKey,
  algorithm = 'thompson_sampling',
  conversionValue = 0
}: OptimizedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  // ✅ CORREÇÃO: Mover antiFlickerTimeout para escopo do componente
  const antiFlickerTimeout = experimentType === 'redirect' || experimentType === 'split_url' ? 120 : 200

  /**
   * Gera o código completo otimizado
   */
  const generateOptimizedCode = () => {
    // Buscar configuração de conversão das variantes
    const conversionConfig = variants.find(v => v.changes?.conversion)?.changes?.conversion
    const hasConversionTracking = conversionConfig && (conversionConfig.url || conversionConfig.selector || conversionConfig.event)

    // ✅ NOVO: Extrair todas as URLs do experimento (de todas as variantes)
    const experimentUrls = variants
      .map(v => v.redirect_url)
      .filter(Boolean)
      .map(url => {
        try {
          const urlObj = new URL(url!)
          return urlObj.pathname // Usar apenas pathname para comparação
        } catch {
          return url!.split('?')[0].split('#')[0] // Fallback para URL relativa
        }
      })

    // Versão do SDK
    const sdkVersion = '3.0.1-auto-conversion'
    
    // Gerar código de aplicação de mudanças para experimentos de elemento
    let applyChangesCode = ''
    if (experimentType === 'element') {
      applyChangesCode = `
;if(variant.css_changes){var style=document.createElement("style");style.textContent=variant.css_changes;style.setAttribute("data-rf-css","");document.head.appendChild(style)}
;if(variant.js_changes){try{eval(variant.js_changes)}catch(e){console.error("RotaFinal: Error executing JS changes",e)}}
;if(variant.changes&&variant.changes.elements){variant.changes.elements.forEach(function(el){var target=document.querySelector(el.selector);if(target){if(el.html)target.innerHTML=el.html;if(el.text)target.textContent=el.text;if(el.attributes){Object.keys(el.attributes).forEach(function(key){target.setAttribute(key,el.attributes[key])})}if(el.style){Object.keys(el.style).forEach(function(key){target.style[key]=el.style[key]})}}})}
`
    }

    // Gerar código de tracking de conversão automática
    let conversionTrackingCode = ''
    if (hasConversionTracking) {
      if (conversionConfig.type === 'page_view' && conversionConfig.url) {
        conversionTrackingCode = `,setupConversionTracking:function(){var e="${conversionConfig.url}";if(window.location.href.includes(e)||window.location.pathname.includes(e)){tracking.track("conversion",{url:window.location.href,type:"page_view",value:${conversionValue}})}}`
      } else if (conversionConfig.selector) {
        conversionTrackingCode = `,setupConversionTracking:function(){var e="${conversionConfig.selector}";document.addEventListener("click",function(t){var n=t.target.closest(e);if(n){tracking.track("conversion",{selector:e,element:n.tagName.toLowerCase(),text:(n.textContent||"").trim().substr(0,100),value:${conversionValue}})}},true)}`
      } else if (conversionConfig.event) {
        conversionTrackingCode = `,setupConversionTracking:function(){var e="${conversionConfig.event}";document.addEventListener(e,function(t){tracking.track("conversion",{event:e,value:${conversionValue}})},true)}`
      }
    }

    // ✅ CORREÇÃO: Para redirect/split_url, fazer redirect IMEDIATAMENTE antes de renderizar qualquer coisa
    const isRedirectExperiment = experimentType === 'redirect' || experimentType === 'split_url'

    // SDK Principal Inline Minificado - AUTO CONVERSION
    const inlineSDK = `!function(){"use strict";var experimentId="${experimentId}",baseUrl="${baseUrl}",apiKey="${apiKey}",version="${sdkVersion}",debugMode=${debugMode ? 'true' : 'false'},ANTIFLICKER_TIMEOUT=${antiFlickerTimeout},VAR_KEY="rf_variant_"+experimentId,EXP_KEY="rf_experiment_"+experimentId,QKEY="rf_queue_"+experimentId,VAR_TTL=18e5,REDIRECT_KEY="rf_redirected_"+experimentId,CONVERSION_TRACKED_KEY="rf_conversion_tracked_"+experimentId,EXPERIMENT_URLS=${JSON.stringify(experimentUrls)},log=function(msg,data){if(debugMode||window.localStorage.getItem("rf_debug")){try{console.log("[RotaFinal v${sdkVersion}]",msg,data||"")}catch(_){}}},hasLS=function(){try{var k="__t";localStorage.setItem(k,"1");localStorage.removeItem(k);return true}catch(_){return false}},getLS=function(k){try{return localStorage.getItem(k)}catch(_){return null}},setLS=function(k,v){try{localStorage.setItem(k,v)}catch(_){}},isValidExperimentUrl=function(){if(!EXPERIMENT_URLS||EXPERIMENT_URLS.length===0)return true;var currentPath=window.location.pathname;for(var i=0;i<EXPERIMENT_URLS.length;i++){var validUrl=EXPERIMENT_URLS[i];if(currentPath===validUrl||currentPath.startsWith(validUrl)){return true}}return false},loadVariantCache=function(){if(!hasLS())return null;try{var raw=getLS(VAR_KEY);if(!raw)return null;var obj=JSON.parse(raw);if(Date.now()-obj.t>VAR_TTL)return null;return obj.v||null}catch(_){return null}},loadExperimentCache=function(){if(!hasLS())return null;try{var raw=getLS(EXP_KEY);if(!raw)return null;var obj=JSON.parse(raw);if(Date.now()-obj.t>VAR_TTL)return null;return obj.e||null}catch(_){return null}},saveExperimentCache=function(expData){if(!hasLS())return;setLS(EXP_KEY,JSON.stringify({e:expData,t:Date.now()}))},doRedirect=function(url){if(!url)return false;var currentUrl=window.location.href.split("?")[0].split("#")[0];var targetUrl=url.split("?")[0].split("#")[0];if(targetUrl===currentUrl)return false;log("⚡ REDIRECT",url);try{sessionStorage.setItem(REDIRECT_KEY,"1")}catch(_){}window.location.replace(url);return true},getUserId=function(){var k="rf_user_id";var v=hasLS()?getLS(k):null;if(!v){v="rf_"+Math.random().toString(36).slice(2,11)+"_"+Date.now().toString(36);if(hasLS())setLS(k,v)}return v},buildPayload=function(){return{visitor_id:getUserId(),user_agent:navigator.userAgent||"",url:location.href,referrer:document.referrer,timestamp:new Date().toISOString(),viewport:{width:window.innerWidth,height:window.innerHeight}}},checkAndTrackConversion=function(expData){if(!expData||!expData.conversion_url)return;try{if(sessionStorage.getItem(CONVERSION_TRACKED_KEY)==="1"){log("Conversion already tracked");return}}catch(_){}var conversionUrl=expData.conversion_url;var currentPath=window.location.pathname;var currentFullUrl=window.location.href.split("?")[0].split("#")[0];var conversionPath="";try{var urlObj=new URL(conversionUrl,window.location.origin);conversionPath=urlObj.pathname}catch(_){conversionPath=conversionUrl.split("?")[0].split("#")[0]}var isOnConversionPage=currentPath===conversionPath||currentFullUrl.indexOf(conversionPath)!==-1||currentPath.indexOf(conversionPath)!==-1;if(isOnConversionPage){log("🎯 Conversion page detected!",{currentPath:currentPath,conversionPath:conversionPath,value:expData.conversion_value});try{sessionStorage.setItem(CONVERSION_TRACKED_KEY,"1")}catch(_){}var conversionValue=parseFloat(expData.conversion_value)||0;window.RotaFinal.convert(conversionValue,{auto:true,url:currentFullUrl,conversion_url:conversionUrl})}};(function(){if(!isValidExperimentUrl())return;try{if(sessionStorage.getItem(REDIRECT_KEY)==="1"){return}}catch(_){}var cached=loadVariantCache();if(cached){var redirectUrl=cached.final_url||cached.redirect_url;if(redirectUrl&&!cached.is_control){doRedirect(redirectUrl);return}}log("⚡ First visit - fetching variant");var xhr=new XMLHttpRequest();xhr.open("POST",baseUrl+"/api/experiments/"+experimentId+"/assign",false);xhr.setRequestHeader("Content-Type","application/json");xhr.setRequestHeader("Authorization","Bearer "+apiKey);xhr.setRequestHeader("X-RF-Version",version);try{xhr.send(JSON.stringify(buildPayload()));if(xhr.status===200){var response=JSON.parse(xhr.responseText);if(response.variant){setLS(VAR_KEY,JSON.stringify({v:response.variant,t:Date.now()}));if(response.experiment){saveExperimentCache(response.experiment)}var redirectUrl=response.variant.final_url||response.variant.redirect_url;if(redirectUrl&&!response.variant.is_control){log("⚡ First visit redirect",redirectUrl);doRedirect(redirectUrl)}}}}catch(err){log("Sync assign error",err)}}());var safeUA=function(){try{return navigator.userAgent||""}catch(_){return""}},nowISO=function(){return new Date().toISOString()},apiCall=function(url,options,tries){tries=tries||3;var controller=new AbortController();var timeoutId=setTimeout(function(){controller.abort()},5000);var headers={"Content-Type":"application/json","Authorization":"Bearer "+apiKey,"X-RF-Version":version};var opts=Object.assign({headers:headers,signal:controller.signal},options||{});return fetch(url,opts).then(function(r){clearTimeout(timeoutId);if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).catch(function(err){clearTimeout(timeoutId);if(tries<=1)throw err;var backoff=Math.min(600,100*Math.pow(2,3-tries))+Math.random()*120;return new Promise(function(res){setTimeout(res,backoff)}).then(function(){return apiCall(url,options,tries-1)})})},isBot=function(){var ua=safeUA().toLowerCase();return/bot|crawler|spider|crawling|archiver|scraper|slurp|wget|curl|httpunit|preview|prerender|headless/i.test(ua)},saveVariantCache=function(variant){if(!hasLS())return;setLS(VAR_KEY,JSON.stringify({v:variant,t:Date.now()}))},experiment={cachedVariant:null,applyVariant:function(variant){if(!variant)return;this.cachedVariant=variant;document.documentElement.setAttribute("data-rf-experiment",experimentId);document.documentElement.setAttribute("data-rf-variant",variant.name||"control");document.documentElement.setAttribute("data-rf-user",getUserId());${applyChangesCode}}},assignInFlight=null,assignOnce=function(){if(experiment.cachedVariant)return Promise.resolve({variant:experiment.cachedVariant});if(assignInFlight)return assignInFlight;var cached=loadVariantCache();if(cached){experiment.cachedVariant=cached;return Promise.resolve({variant:cached})}try{if(sessionStorage.getItem(REDIRECT_KEY)==="1"){return Promise.resolve({variant:{name:"redirected",skip:true}})}}catch(_){}assignInFlight=apiCall(baseUrl+"/api/experiments/"+experimentId+"/assign",{method:"POST",body:JSON.stringify(buildPayload())}).then(function(r){if(r&&r.variant){experiment.cachedVariant=r.variant;saveVariantCache(r.variant)}return r}).catch(function(err){return{variant:{name:"control",is_control:true,error:true}}}).finally(function(){assignInFlight=null});return assignInFlight},tracking={eventQueue:[],_clickBuffer:[],_clickTimer:null,baseEvent:function(type,props){return{experiment_id:experimentId,visitor_id:getUserId(),variant_id:experiment.cachedVariant&&experiment.cachedVariant.id||null,variant:experiment.cachedVariant&&experiment.cachedVariant.name||null,event_type:type,properties:props||{},timestamp:nowISO(),url:location.href,referrer:document.referrer,user_agent:safeUA()}},track:function(eventName,properties){var ev=this.baseEvent(eventName,properties);log("Track",eventName,ev);return apiCall(baseUrl+"/api/track",{method:"POST",body:JSON.stringify(ev)}).catch(function(err){tracking.enqueue(ev)})},trackBufferedClick:function(eventName,props){this._clickBuffer.push(this.baseEvent(eventName,props));if(this._clickTimer)return;this._clickTimer=setTimeout(function(){tracking._clickTimer=null;tracking.flushClicks()},150)},flushClicks:function(){var events=tracking._clickBuffer.splice(0);if(!events.length)return;apiCall(baseUrl+"/api/track/batch",{method:"POST",body:JSON.stringify({events:events})}).catch(function(){tracking.eventQueue.push.apply(tracking.eventQueue,events);persistQueue()})},setupClickTracking:function(){document.addEventListener("click",function(event){var el=event.target&&event.target.closest&&event.target.closest("[data-rf-track]");if(!el)return;var eventName=el.getAttribute("data-rf-track")||"click";var attributes={};Array.prototype.forEach.call(el.attributes,function(attr){if(attr.name.indexOf("data-rf-")===0&&attr.name!=="data-rf-track"){attributes[attr.name.replace("data-rf-","")]=attr.value}});var clickData={element:el.tagName.toLowerCase(),text:(el.textContent||"").trim().slice(0,100)};Object.assign(clickData,attributes);tracking.trackBufferedClick(eventName,clickData)},true)},trackPageview:function(){this.track("page_view",{title:document.title,path:location.pathname,search:location.search})},enqueue:function(ev){tracking.eventQueue.push(ev);persistQueue()},flushQueue:function(){if(!tracking.eventQueue.length)return;var events=tracking.eventQueue.splice(0);persistQueue();apiCall(baseUrl+"/api/track/batch",{method:"POST",body:JSON.stringify({events:events})}).catch(function(){tracking.eventQueue.unshift.apply(tracking.eventQueue,events);persistQueue()})}${conversionTrackingCode}},loadQueue=function(){if(!hasLS())return[];try{return JSON.parse(getLS(QKEY)||"[]")}catch(_){return[]}},persistQueue=function(){if(!hasLS())return;try{setLS(QKEY,JSON.stringify(tracking.eventQueue))}catch(_){}};tracking.eventQueue=loadQueue();var _push=tracking.eventQueue.push.bind(tracking.eventQueue);tracking.eventQueue.push=function(){var r=_push.apply(tracking.eventQueue,arguments);persistQueue();return r};function flushWithBeacon(){if(!tracking.eventQueue.length)return;var payload=JSON.stringify({events:tracking.eventQueue});if(navigator.sendBeacon){var ok=navigator.sendBeacon(baseUrl+"/api/track/batch",new Blob([payload],{type:"application/json"}));if(ok){tracking.eventQueue=[];persistQueue();return}}tracking.flushQueue()}document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flushWithBeacon()});window.addEventListener("beforeunload",flushWithBeacon);function showPage(){document.body.setAttribute("data-rf-ready","true");var style=document.querySelector("style[data-rf-antiflicker]");if(style)setTimeout(function(){try{style.remove()}catch(_){}},80);log("Page visible")}function idle(fn){return window.requestIdleCallback?requestIdleCallback(fn,{timeout:500}):setTimeout(fn,50)}function init(){if(!isValidExperimentUrl()){showPage();return}if(isBot()){showPage();return}log("Init");var tId=setTimeout(showPage,ANTIFLICKER_TIMEOUT);assignOnce().then(function(r){clearTimeout(tId);if(r&&r.variant&&!r.variant.skip){experiment.cachedVariant=r.variant;if(r.experiment){saveExperimentCache(r.experiment);checkAndTrackConversion(r.experiment)}experiment.applyVariant(r.variant);tracking.trackPageview();${hasConversionTracking ? 'idle(function(){tracking.setupConversionTracking()});' : ''}showPage()}else{showPage()}}).catch(function(err){clearTimeout(tId);showPage()});idle(function(){tracking.setupClickTracking();var cachedExp=loadExperimentCache();if(cachedExp){checkAndTrackConversion(cachedExp)}})}window.RotaFinal={track:function(eventName,properties){return tracking.track(eventName,properties)},convert:function(value,properties){return tracking.track("conversion",Object.assign({value:value||${conversionValue}},properties))},getVariant:function(){return experiment.cachedVariant},getUserId:getUserId,reload:function(){experiment.cachedVariant=null;setLS(VAR_KEY,"");setLS(EXP_KEY,"");try{sessionStorage.removeItem(REDIRECT_KEY);sessionStorage.removeItem(CONVERSION_TRACKED_KEY)}catch(_){}location.reload()},setDebug:function(enabled){enabled?localStorage.setItem("rf_debug","1"):localStorage.removeItem("rf_debug");location.reload()}};if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init)}else{init()}}();`

    // CSS Anti-Flicker otimizado
    const antiFlickerCSS = `<style data-rf-antiflicker>
body:not([data-rf-ready]){opacity:0;visibility:hidden}
body[data-rf-ready]{opacity:1;visibility:visible;transition:opacity .1s ease-out}
</style>`

    // Preconnect para otimização
    const preconnectTags = `<link rel="preconnect" href="${baseUrl}">
<link rel="dns-prefetch" href="${baseUrl}">`

    // Instruções de uso
    const usageInstructions = generateUsageInstructions(experimentType, hasConversionTracking, conversionConfig)

    // Código completo
    return `<!-- RotaFinal SDK v${sdkVersion} - ${experimentName} -->
<!-- Experimento ID: ${experimentId} -->
<!-- Tipo: ${experimentType.toUpperCase()} | Algoritmo: ${algorithm.toUpperCase()} -->

${preconnectTags}

${antiFlickerCSS}

<script>
${inlineSDK}
</script>

${usageInstructions}

<!-- 
📊 TRACKING DE CONVERSÕES:

Manual (em qualquer lugar):
  RotaFinal.convert(valor, { produto: 'x', orderId: '123' })

Por clique em elemento:
  <button data-rf-track="cta_click" data-rf-button="signup">Inscrever-se</button>

${hasConversionTracking ? `✅ Conversão automática configurada:
  Tipo: ${conversionConfig.type || 'page_view'}
  ${conversionConfig.url ? `URL: ${conversionConfig.url}` : ''}
  ${conversionConfig.selector ? `Seletor: ${conversionConfig.selector}` : ''}
  ${conversionConfig.event ? `Evento: ${conversionConfig.event}` : ''}
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
${hasTracking ? `<!-- • Conversão automática configurada (${config?.type || 'page_view'}) -->` : '<!-- • Configure conversão manual com RotaFinal.convert() -->'}`,
      
      split_url: `<!-- ✅ TESTE SPLIT URL -->
<!-- • Cada variante tem sua própria URL -->
<!-- • Redirecionamento instantâneo -->
<!-- • Ideal para páginas muito diferentes -->
${hasTracking ? `<!-- • Tracking automático em ${config?.url || 'URL configurada'} -->` : '<!-- • Use RotaFinal.convert() na página de conversão -->'}`,
      
      element: `<!-- ✅ EXPERIMENTO DE ELEMENTO -->
<!-- • Modifica elementos na mesma página -->
<!-- • CSS e JS aplicados automaticamente -->
<!-- • Zero flicker (< 200ms) -->
<!-- • Ideal para testes de copy, cor, layout -->
${hasTracking ? `<!-- • Conversão detectada automaticamente em ${config?.selector || config?.url || 'elemento configurado'} -->` : '<!-- • Configure conversão com data-rf-track="conversion" -->'}`,
      
      mab: `<!-- 🧠 MULTI-ARMED BANDIT (${algorithm.toUpperCase()}) -->
<!-- • IA otimiza automaticamente distribuição de tráfego -->
<!-- • Variantes com melhor performance recebem mais visitantes -->
<!-- • Maximiza conversões durante o teste -->
<!-- • Requer mínimo de 100 visitantes para ativar -->
${hasTracking ? `<!-- • Conversão rastreada automaticamente -->` : '<!-- • Configure conversão para melhor performance do algoritmo -->'}`,
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
              Adicione pelo menos 2 variantes para o experimento funcionar.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Card Principal com o Código */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Code className="h-6 w-6 text-blue-600" />
                Código de Integração Otimizado v3.0
              </CardTitle>
              <CardDescription className="mt-2">
                Código inline completo - Sem dependências externas - 100% funcional
              </CardDescription>
            </div>
            <Badge className="bg-green-500 text-white text-lg px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Pronto para Usar
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Controles */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              onClick={copyToClipboard}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código Completo
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setDebugMode(!debugMode)}
              className={debugMode ? 'border-green-500 text-green-700' : ''}
            >
              <Info className="w-4 h-4 mr-2" />
              {debugMode ? 'Debug Ativado' : 'Debug Desativado'}
            </Button>
          </div>

          {debugMode && (
            <Alert className="border-blue-300 bg-blue-50 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800 font-bold">Modo Debug Ativo</AlertTitle>
              <AlertDescription className="text-blue-700">
                O código gerado incluirá logs detalhados no console. Use para desenvolvimento/teste.
                Desative para produção.
              </AlertDescription>
            </Alert>
          )}

          {/* Código Gerado */}
          <div className="relative">
            <pre className="bg-slate-900 text-green-400 p-6 rounded-xl text-xs overflow-x-auto max-h-[600px] font-mono">
              <code>{generateOptimizedCode()}</code>
            </pre>
          </div>

          {/* Estatísticas do Código */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(generateOptimizedCode().length / 1024)}KB
              </div>
              <div className="text-xs text-blue-600">Tamanho</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {antiFlickerTimeout}ms
              </div>
              <div className="text-xs text-green-600">Timeout</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {variants.length}
              </div>
              <div className="text-xs text-purple-600">Variantes</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-2xl font-bold text-amber-600">
                100%
              </div>
              <div className="text-xs text-amber-600">Confiável</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Rastreamento de Conversões */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Target className="h-5 w-5" />
            📊 Rastreamento de Conversões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-1">Instale o código acima na página original</h4>
                <p className="text-sm text-purple-700">Cole no <code className="bg-purple-100 px-1 rounded">&lt;head&gt;</code> da sua landing page ou página de teste</p>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-2">Adicione este script na página de sucesso</h4>
                <p className="text-sm text-purple-700 mb-2">
                  Na página de conversão (ex: /obrigado, /sucesso, /checkout-completo):
                </p>
                <div className="relative">
                  <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                    <code>{`<!-- Adicione no <head> da página de conversão -->\n<script src="${baseUrl}/conversion-tracker.js"></script>`}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    onClick={() => {
                      navigator.clipboard.writeText(`<script src="${baseUrl}/conversion-tracker.js"></script>`)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-1">Pronto! As conversões serão registradas automaticamente</h4>
                <p className="text-sm text-green-700">
                  Quando um visitante acessar a página de sucesso, a conversão será automaticamente registrada e aparecerá no dashboard em tempo real.
                </p>
              </div>
            </div>
          </div>

          <Alert className="border-blue-300 bg-blue-50">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800 font-bold">Como funciona?</AlertTitle>
            <AlertDescription className="text-blue-700 space-y-1 text-sm">
              <p>1. O visitante acessa sua página e recebe uma variante (A ou B)</p>
              <p>2. Os dados ficam salvos no navegador do visitante</p>
              <p>3. Quando ele acessa a página de sucesso, o script detecta automaticamente</p>
              <p>4. A conversão é registrada com o valor configurado no experimento</p>
              <p>5. Os dados aparecem no dashboard instantaneamente ✨</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Dicas de Instalação */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Lightbulb className="h-5 w-5" />
            Dicas de Instalação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-green-800">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <strong>Posição correta:</strong> Logo após a tag <code className="bg-green-100 px-1 rounded">&lt;head&gt;</code>, antes de tudo
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <strong>Sem modificações:</strong> Cole exatamente como está, não altere nada
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <strong>Teste antes:</strong> Abra o console (F12) e procure por logs [RotaFinal]
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <strong>Modo anônimo:</strong> Teste em navegador anônimo para ver diferentes variantes
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

