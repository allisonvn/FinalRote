import React, { useState, useEffect } from 'react'
import { Copy, Check, AlertTriangle, Target } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface OptimizedCodeGeneratorProps {
  experimentName: string
  experimentId: string
  experimentType: 'redirect' | 'split_url' | 'element' | 'mab'
  variants?: Array<{
    name: string
    redirect_url?: string
    css_changes?: string
    js_changes?: string
  }>
  baseUrl?: string
  apiKey?: string
  algorithm?: string
  conversionValue?: number
  conversionConfig?: {
    url?: string
    selector?: string
    event?: string
    value?: number
    type?: string
  } | null
  projectId?: string
}

export default function OptimizedCodeGenerator({
  experimentName,
  experimentId,
  experimentType,
  variants = [],
  baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rotafinal.com.br',
  apiKey,
  algorithm = 'thompson_sampling',
  conversionValue = 0,
  conversionConfig = null,
  projectId // NOVO: Adicionar projectId como prop
}: OptimizedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const [debugMode] = useState(false)
  const [antiFlickerTimeout] = useState(120)
  const [customDomains, setCustomDomains] = useState<string[]>([])

  // Efeito para carregar domínios personalizados quando o projectId muda
  useEffect(() => {
    if (projectId) {
      fetchCustomDomains(projectId)
    }
  }, [projectId])

  const fetchCustomDomains = async (id: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/settings/custom-domains?projectId=${id}`)
      const data = await response.json()
      if (response.ok && data && data.domains) {
        setCustomDomains(data.domains)
      } else {
        console.warn('Não foi possível carregar domínios personalizados ou nenhum encontrado.', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar domínios personalizados para o gerador de código:', error)
    }
  }

  // DEBUG: Log das props recebidas
  console.log('🔍 OptimizedCodeGenerator Props:', {
    experimentName,
    experimentId,
    experimentType,
    baseUrl,
    apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined',
    variants: variants.length,
    conversionValue
  })

  // ✅ VALIDAÇÃO: Garantir que experimentId nunca seja null/undefined
  if (!experimentId || experimentId === 'null' || experimentId === 'undefined') {
    console.error('❌ ERRO: experimentId inválido:', experimentId)
  }

  // Buscar configuração de conversão das variantes
  const variantConversionConfig = variants.find(v => v.conversion_config)?.conversion_config
  const finalConversionConfig = conversionConfig || variantConversionConfig
  const hasConversionTracking = finalConversionConfig && (finalConversionConfig.url || finalConversionConfig.selector || finalConversionConfig.event)

  /**
   * Gera o código completo otimizado
   */
  const generateOptimizedCode = () => {
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
    const sdkVersion = '3.0.2'
    
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

    // Código para setup de conversão (se houver)
    const setupConversionCode = hasConversionTracking ? 'T(function(){N.setupConversionTracking()});' : ''

    // Lista completa de domínios permitidos para anexar UTMs (padrão)
    const allowedDomains_default = [
      // Hotmart
      'pay.hotmart.com', 'payment.hotmart.com', 'pagamento.hotmart.com', 'go.hotmart.com',
      'app-vlc.hotmart.com/checkout',
      // Eduzz
      'sun.eduzz.com', 'pay.eduzz.com', 'checkout.sun.eduzz.com',
      // Kiwify
      'pay.kiwify.com.br', 'pay.kiwify.app',
      // Ticto
      'payment.ticto.app', 'checkout.ticto.app', 'pay.ticto.com.br',
      // Monetizze
      'checkout.monetizze.com.br', 'app.monetizze.com.br/checkout',
      // Braip
      'checkout.braip.com', 'app.braip.com/checkout', 'checkout.braip.dev', 'checkout.braip.app',
      // PerfectPay
      'pay.perfectpay.com.br', 'checkout.perfectpay.com.br', 'checkout.perfectpay.com',
      // HeroSpark
      'pay.herospark.com', 'checkout.herospark.com', 'checkout.herospark.com.br',
      // CartPanda
      'checkout.cartpanda.com', 'pay.cartpanda.com', 'checkout.cartpanda.com.br',
      // CartX
      'checkout.cartx.io', 'checkout.cartx.com.br',
      // Yampi
      'checkout.yampi.com.br', 'checkout.yampi.app',
      // Pagamentos BR
      'mpago.la', 'checkout.mercadopago.com.br', 'pag.ae', 'pagseguro.uol.com.br/checkout',
      'checkout.pagar.me', 'checkout.pagar.me/pay', 'checkout.iugu.com', 'checkout.vindi.com.br',
      'pagamento.asaas.com', 'checkout.asaas.com', 'link.efi.com.br', 'pagamento.efi.com.br',
      'cielo.com.br/ecommerce/checkout', 'checkout.pagbrasil.com', 'checkout.yapay.com.br',
      'checkout.picpay.com', 'checkout.pagarme.com.br', 'checkout.clickbank.net',
      'checkout.pagbank.com.br', 'checkout.getnet.com.br', 'checkout.stone.com.br',
      // PlugnPay
      'checkout.thrivecart.com', 'checkout.samcart.com', 'checkout.paykickstart.com',
      'checkout.kajabi.com', 'checkout.teachable.com', 'checkout.learnworlds.com',
      'checkout.kartra.com', 'checkout.systeme.io', 'checkout.podia.com',
      'gumroad.com/checkout', 'pay.gumroad.com', 'checkout.payhip.com',
      // E-commerce
      'checkout.nuvemshop.com.br', 'checkout.tray.com.br', 'checkout.lojaintegrada.com.br',
      'checkout.magazinevoce.com.br', 'checkout.hubsales.com.br',
      // Stripe & Gateway
      'checkout.stripe.com', 'buy.stripe.com', 'checkout.braintreepayments.com',
      // PayPal
      'www.paypal.com/checkoutnow',
      // Adyen
      'checkoutshopper-live.adyen.com',
      // E-commerce Global
      'checkout.squarespace.com', 'checkout.bigcommerce.com', 'checkout.wix.com',
      'checkout.shop.app', 'checkout.shopify.com', 'store.myshopify.com/checkout',
      // Gateways Internacionais
      'checkout.wepay.com', 'checkout.2checkout.com', 'checkout.paddle.com',
      'checkout.chargebee.com', 'checkout.recurly.com', 'checkout.fast.co',
      'checkout.fastspring.com', 'checkout.authorize.net', 'checkout.payoneer.com',
      // Ebanx
      'checkout.ebanx.com',
      // Prefixos genéricos
      'checkout.', 'pay.', 'pagamento.'
    ]

    const allAllowedDomains = [...allowedDomains_default, ...customDomains]
    const utmParamsList = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","fbclid","gclid","src","sck","msclkid","ttclid"]
    
    // SDK Principal Inline Minificado - VERSÃO CORRIGIDA (v3.0.2) COM Rastreamento UTM + Propagação
    const inlineSDK = '!function(){"use strict";var e="' + experimentId + '",t="' + baseUrl + '",r="' + apiKey + '",n="' + sdkVersion + '",o=' + (debugMode ? 'true' : 'false') + ',a=' + antiFlickerTimeout + ',i="rf_variant_"+e,s="rf_experiment_"+e,l="rotafinal_exp_"+e,c="rf_queue_"+e,u=18e5,d="rf_redirected_"+e,f="rf_conversion_tracked_"+e,p=' + JSON.stringify(experimentUrls) + ',ad=' + JSON.stringify(allAllowedDomains) + ',up=' + JSON.stringify(utmParamsList) + ',g=function(e,t){if(o||localStorage.getItem("rf_debug")){try{console.log("[RotaFinal v"+n+"]",e,t||"")}catch(_){}}},h=function(){try{var e="__t";localStorage.setItem(e,"1");localStorage.removeItem(e);return true}catch(_){return false}},m=function(e){try{return localStorage.getItem(e)}catch(_){return null}},v=function(e,t){try{localStorage.setItem(e,t)}catch(_){}},w=function(){if(!p||p.length===0)return true;var e=window.location.pathname;for(var t=0;t<p.length;t++){var r=p[t];if(e===r||e.startsWith(r)||e.includes(r))return true}return false},x=function(){if(!h())return null;try{var e=m(i);if(!e)return null;var t=JSON.parse(e);if(Date.now()-t.t>u)return null;return t.v||null}catch(_){return null}},y=function(){if(!h())return null;try{var e=m(s);if(!e)return null;var t=JSON.parse(e);if(Date.now()-t.t>u)return null;return t.e||null}catch(_){return null}},z=function(e){if(!h())return;v(s,JSON.stringify({e:e,t:Date.now()}))},A=function(e,t){if(!h())return;var r={experimentId:e,experiment_id:e,variantId:t.id,variant_id:t.id,variantName:t.name,variant:t.name,visitorId:B(),visitor_id:B(),timestamp:Date.now()};v(l,JSON.stringify(r));g("💾 Assignment data saved",r);var n={url:window.location.href,title:document.title,timestamp:Date.now()};v("rotafinal_origin_"+e,JSON.stringify(n));g("💾 Origin page data saved",n)},C=function(e){if(!e)return false;var t=window.location.href.split("?")[0].split("#")[0],r=e.split("?")[0].split("#")[0];if(r===t)return false;g("⚡ REDIRECT",e);try{sessionStorage.setItem(d,"1")}catch(_){}window.location.replace(e);return true},B=function(){var e="rf_user_id",t=h()?m(e):null;if(!t){t="rf_"+Math.random().toString(36).slice(2,11)+"_"+Date.now().toString(36);if(h())v(e,t)}return t},Qa=function(){try{var e=window.location.search,t=new URLSearchParams(e),n=up,i=false;n.forEach(function(o){if(t.has(o)){var l=t.get(o);if(l){var d=m("rf_"+o);if(!d){localStorage.setItem("rf_"+o,l);i=true}}});if(i){var r=window.location.origin+window.location.pathname+window.location.hash;history.replaceState({},document.title,r)}}catch(_){}},Ra=function(){var e={};try{up.slice(0,5).forEach(function(t){var r=m("rf_"+t);if(r)e[t]=r})}catch(_){e={}}return e},Sa=function(){var e=Ra();up.forEach(function(t){var r=m("rf_"+t);if(r)e[t]=r});return e},Ta=function(){var e=Sa();document.querySelectorAll("form").forEach(function(t){up.forEach(function(n){if(e[n]){var i=t.querySelector("input[name=\\"+n+"\\"]");if(!i){i=document.createElement("input");i.type="hidden";i.name=n;t.appendChild(i)}i.value=e[n]}})})},Ua=function(){var e=Sa();document.querySelectorAll("a").forEach(function(t){try{var r=new URL(t.href),n=r.hostname;var i=ad.some(function(l){return n.includes(l)});if(i){var s=new URLSearchParams(r.search);up.forEach(function(o){if(e[o]){s.set(o.toLowerCase(),e[o])}});t.href=r.origin+r.pathname+"?"+s.toString()}}catch(_){}})};var D=function(){var e=Ra();return{visitor_id:B(),user_agent:navigator.userAgent||"",url:location.href,referrer:document.referrer,timestamp:new Date().toISOString(),viewport:{width:window.innerWidth,height:window.innerHeight},utm_source:e.utm_source||null,utm_medium:e.utm_medium||null,utm_campaign:e.utm_campaign||null,utm_term:e.utm_term||null,utm_content:e.utm_content||null}};if(!x()){var E=w();if(!E)return;Qa();try{var F=new XMLHttpRequest();F.open("GET",t+"/api/assign-variant?experimentId="+e+"&visitorId="+B(),!1);F.setRequestHeader("Authorization","Bearer "+r);F.setRequestHeader("Content-Type","application/json");F.timeout=5000;F.send(null);if(F.status===200){var G=JSON.parse(F.responseText);if(G&&G.variant){A(e,G.variant);"element"!==algorithm&&C(G.variant.redirect_url);"element"===algorithm&&setTimeout(function(){Ta();Ua()},100)}}}catch(H){g("⚠️ Assign error",H);}}else{var I=x();z(I);"element"===algorithm&&setTimeout(function(){Ta();Ua()},100)}var J=m(d);if(J){var K=m("rotafinal_origin_"+e);if(K){var L=JSON.parse(K);g("📍 Origin",L);try{var M=new XMLHttpRequest();M.open("POST",t+"/api/track-event");M.setRequestHeader("Authorization","Bearer "+r);M.setRequestHeader("Content-Type","application/json");M.timeout=5000;M.send(JSON.stringify({experiment_id:e,experimentId:e,variant_id:I,variantId:I,visitor_id:B(),visitorId:B(),event_type:"page_view",eventType:"page_view",url:L.url,title:L.title,properties:D(),context:D()}));sessionStorage.removeItem(d);localStorage.removeItem("rotafinal_origin_"+e)}catch(N){g("⚠️ Track error",N)}};window.RotaFinalUTM={getAll:function(){return Ra()},get:function(param){return m("rf_"+param)||null},send:function(eventType,props){var utms=Ra();return fetch(t+"/api/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event_type:eventType,visitor_id:B(),properties:Object.assign(utms,props||{}),timestamp:new Date().toISOString()})}).catch(function(){return null})}}};g("✅ RotaFinalUTM API exposta")}}();})();'
    
    // CSS Anti-Flicker
    const antiFlickerCSS = experimentType === 'redirect' 
      ? `<style data-rf-antiflicker>html:not([data-rf-ready]){opacity:0!important;visibility:hidden!important}html[data-rf-ready]{opacity:1!important;visibility:visible!important;transition:opacity 150ms ease-in-out!important}</style>`
      : ''
    
    // Código completo
    const fullCode = `${antiFlickerCSS}
<!-- RotaFinal A/B Test SDK v${sdkVersion} -->
<script>${inlineSDK}</script>`
    
    return fullCode
  }
  
  const code = generateOptimizedCode()
  const antiFlickerTimeoutMs = antiFlickerTimeout
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Instruções</AlertTitle>
        <AlertDescription>
          Copie o código abaixo e cole-o antes do fechamento da tag <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;/body&gt;</code> na página onde deseja executar o experimento.
        </AlertDescription>
      </Alert>

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="absolute top-2 right-2 z-10"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copiar
            </>
          )}
        </Button>
        
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Target className="w-4 h-4" />
        <span>Experimento: <strong>{experimentName}</strong></span>
        <Badge variant="outline">{experimentType}</Badge>
      </div>
    </div>
  )
}