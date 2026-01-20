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
    conversion_config?: any
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

  // DEBUG: Log das props recebidas removed

  // ✅ VALIDAÇÃO: Garantir que experimentId nunca seja null/undefined
  if (!experimentId || experimentId === 'null' || experimentId === 'undefined') {
    console.error('❌ ERRO: experimentId inválido:', experimentId)
  }

  // Buscar configuração de conversão das variantes
  const variantConversionConfig = variants.find((v: any) => v.conversion_config)?.conversion_config
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
    const utmParamsList = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "src", "sck", "msclkid", "ttclid"]

    // Variável de algoritmo para uso no SDK
    const algorithmVar = experimentType === 'element' ? 'element' : 'redirect'

    // SDK Principal Inline Minificado - VERSÃO CORRIGIDA (v3.0.2) COM Rastreamento UTM + Propagação
    const inlineSDK = `(function(w,d,i,k,b,a,v,u,dm){
      var h=d.documentElement,t=setTimeout(function(){h.setAttribute("data-rf-ready","true")},1500);
      var g=function(){var id=localStorage.getItem("rf_uid");if(!id){id="rf_"+Math.random().toString(36).substr(2,9)+"_"+Date.now().toString(36);localStorage.setItem("rf_uid",id)}return id};
      var p=function(){var q=new URLSearchParams(w.location.search),utms={};u.forEach(function(p){var v=q.get(p)||localStorage.getItem("rf_"+p);if(v){utms[p]=v;localStorage.setItem("rf_"+p,v)}});return utms};
      var tk=function(type,name,props,val){
        fetch(b+"/api/track",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+k},
          body:JSON.stringify({experiment_id:i,visitor_id:g(),event_type:type,event_name:name,properties:props||{},value:val||0,url:w.location.href,referrer:d.referrer,timestamp:new Date().toISOString()})
        }).catch(function(){});
      };
      var init=function(){
        var uid=g(),utms=p();
        fetch(b+"/api/experiments/"+i+"/assign",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+k},
          body:JSON.stringify({visitor_id:uid,url:w.location.href,referrer:d.referrer,utm_data:utms})
        }).then(function(r){return r.json()}).then(function(r){
          if(r&&r.variant){
            var vn=r.variant.name;h.setAttribute("data-rf-variant",vn);
            if(r.variant.redirect_url&&a==="redirect"){
              var url=new URL(r.variant.redirect_url);
              Object.keys(utms).forEach(function(k){url.searchParams.set(k,utms[k])});
              w.location.href=url.href;
            }else{
              clearTimeout(t);h.setAttribute("data-rf-ready","true");
              var variant=r.variant;${applyChangesCode}
            }
          }
        }).catch(function(){clearTimeout(t);h.setAttribute("data-rf-ready","true")});
      };
      window.rotaFinal={track:tk,p:p};
      init();
      var N={setupConversionTracking:function(){},track:tk};
      ${conversionTrackingCode}
      if(N.setupConversionTracking)N.setupConversionTracking();
    })(window,document,'${experimentId}','${apiKey}','${baseUrl}','${algorithmVar}',${JSON.stringify(variants)},${JSON.stringify(utmParamsList)},${JSON.stringify(allAllowedDomains)});`.replace(/\s+/g, ' ');
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