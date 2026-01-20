export interface Variant {
    id: string
    name: string
    key: string
    is_control: boolean
    url?: string
    redirect_url?: string
    description?: string
    config?: any
    weight?: number
    traffic_percentage?: number
}

export interface Experiment {
    id: string
    name: string
    status: 'draft' | 'running' | 'paused' | 'completed'
    created_at: string
    variants?: Variant[]
    // Configurações estendidas
    description?: string
    algorithm?: 'uniform' | 'thompson_sampling' | 'ucb1'
    target_url?: string
    goal_type?: 'page_view' | 'click' | 'form_submit' | 'custom'
    goal_value?: string
    duration_days?: number
    traffic_allocation?: number
    test_type?: 'split_url' | 'visual' | 'feature_flag'
    tags?: string[]
    min_sample_size?: number
    project_id?: string
    api_key?: string
}

export const enhanceInstallCode = (code: string) => {
    try {
        let out = code
        // Anti-flicker
        out = out.replace('\n<script>(function(){', '\n<style id="rf-af">html.rf-af{opacity:0!important}</style>\n<script>(function(){try{document.documentElement.classList.add("rf-af")}catch(e){};setTimeout(function(){try{document.documentElement.classList.remove("rf-af")}catch(e){}},1500);')
        out = out.replace('applyRules(variant);\n    window.rotaFinal.track', 'applyRules(variant);\n    try{document.documentElement.classList.remove("rf-af")}catch(e){}\n    window.rotaFinal.track')
        return out
    } catch {
        return code
    }
}

export const generateInstallCodeForExperiment = (exp: Experiment) => {
    if (!exp || !exp.id) {
        console.error('❌ Experiment ID is missing:', exp)
        return `<!-- ❌ ERRO: Experimento sem ID válido -->`
    }

    const experimentId = exp.id
    const apiKey = exp.api_key || ''
    const name = exp.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const variants = (exp.variants || []).map((v: any) => ({
        name: v.name,
        key: v.name.toLowerCase(),
        url: v.config?.redirect_url ?? v.redirect_url ?? null,
        isControl: v.is_control,
        traffic_percentage: v.traffic_percentage || 50,
        description: v.description ?? null
    }))
    const goal = exp.goal_value || exp.goal_type || 'conversion'
    const goalType = exp.goal_type || 'page_view'
    const targetUrl = exp.target_url || ''
    const algorithm = exp.algorithm || 'thompson_sampling'
    const inferredMethod = variants.some(v => !!v.url) ? 'split_url' : 'visual'
    const method = exp.test_type || inferredMethod

    // Build goal handler
    const goalHandler = (() => {
        if (goalType === 'click' && exp.goal_value) {
            return `document.addEventListener('click',function(e){if(e.target.matches('${exp.goal_value}')||e.target.closest('${exp.goal_value}')){window.rotaFinal.track('${goal}',{variant:variant,selector:'${exp.goal_value}',value:1})}});`
        }
        if (goalType === 'form_submit' && exp.goal_value) {
            return `var f=document.querySelector('${exp.goal_value}');if(f){f.addEventListener('submit',function(e){window.rotaFinal.track('${goal}',{variant:variant,form:'${exp.goal_value}',value:1})})}`
        }
        if (goalType === 'page_view' && exp.goal_value) {
            return `if(location.pathname==='${exp.goal_value}'||location.href.indexOf('${exp.goal_value}')>-1){window.rotaFinal.track('${goal}',{variant:variant,page:'${exp.goal_value}',value:1})}`
        }
        return `window.rotaFinal.track('page_view',{variant:variant,experiment_start:true,value:1});`
    })()

    // Base code
    const baseCode = `!function(){"use strict";var experimentId="${experimentId}",apiKey="${apiKey}",baseUrl="${typeof window !== 'undefined' ? window.location.origin : 'https://rotafinal.com'}",getUserId=function(){var userId=localStorage.getItem("rf_user_id");if(!userId){userId="rf_"+Math.random().toString(36).substr(2,9)+"_"+Date.now().toString(36);localStorage.setItem("rf_user_id",userId)}return userId},isBot=function(){return/bot|crawler|spider|crawling/i.test(navigator.userAgent)},apiCall=function(url,options){var headers={"Content-Type":"application/json","X-RF-Version":"2.0.0"};if(apiKey){headers["Authorization"]="Bearer "+apiKey}return fetch(url,Object.assign({headers:headers},options)).then(function(response){if(!response.ok)throw new Error("HTTP "+response.status+": "+response.statusText);return response.json()})},experiment={cachedVariant:null,fetchVariant:function(){var self=this;if(this.cachedVariant)return Promise.resolve(this.cachedVariant);return apiCall(baseUrl+"/api/experiments/"+experimentId+"/assign",{method:"POST",body:JSON.stringify({visitor_id:getUserId(),user_agent:navigator.userAgent,url:window.location.href,referrer:document.referrer,timestamp:new Date().toISOString(),viewport:{width:window.innerWidth,height:window.innerHeight}})})},applyVariant:function(variant){if(!variant)return;this.cachedVariant=variant;document.documentElement.setAttribute("data-rf-experiment",experimentId);document.documentElement.setAttribute("data-rf-variant",variant.name||"control");document.documentElement.setAttribute("data-rf-user",getUserId());if(variant.redirect_url)window.location.href=variant.redirect_url}},tracking={eventQueue:[],track:function(eventName,properties){var eventData={experiment_id:experimentId,visitor_id:getUserId(),event_type:eventName,properties:properties,timestamp:new Date().toISOString(),url:window.location.href,referrer:document.referrer,user_agent:navigator.userAgent,variant:experiment.cachedVariant&&experiment.cachedVariant.name||null};apiCall(baseUrl+"/api/track",{method:"POST",body:JSON.stringify(eventData)}).catch(function(){tracking.eventQueue.push(eventData)})},flushQueue:function(){if(this.eventQueue.length===0)return;var events=this.eventQueue;this.eventQueue=[];apiCall(baseUrl+"/api/track/batch",{method:"POST",body:JSON.stringify({events:events})}).catch(function(){tracking.eventQueue=events})},trackPageview:function(){this.track("page_view",{title:document.title,path:window.location.pathname,search:window.location.search})},setupClickTracking:function(){document.addEventListener("click",function(event){var element=event.target.closest("[data-rf-track]");if(element){var eventName=element.getAttribute("data-rf-track")||"click";var attributes={};Array.from(element.attributes).forEach(function(attr){if(attr.name.startsWith("data-rf-")&&attr.name!=="data-rf-track"){attributes[attr.name.replace("data-rf-","")]=attr.value}});var clickData={element:element.tagName.toLowerCase(),text:(element.textContent||"").trim().substr(0,100)};Object.assign(clickData,attributes);tracking.track(eventName,clickData)}})}},init=function(){if(isBot())return;apiCall(baseUrl+"/api/experiments/"+experimentId+"/assign",{method:"POST",body:JSON.stringify({visitor_id:getUserId(),user_agent:navigator.userAgent,url:window.location.href,referrer:document.referrer,timestamp:new Date().toISOString(),viewport:{width:window.innerWidth,height:window.innerHeight}})}).then(function(response){if(response&&response.variant){experiment.cachedVariant=response.variant;experiment.applyVariant(response.variant)}}).catch(function(error){console.error("RotaFinal: Error loading variant",error)}).finally(function(){document.documentElement.setAttribute("data-rf-ready","true");var style=document.querySelector("style[data-rf-antiflicker]");if(style)setTimeout(function(){style.remove()},100)})};window.RotaFinal={track:function(eventName,properties){return tracking.track(eventName,properties)},convert:function(value,properties){return this.track("conversion",Object.assign({value:value},properties))},getVariant:function(){return experiment.cachedVariant},getUserId:getUserId,reload:function(){experiment.cachedVariant=null;init()},setDebug:function(enabled){}};window.addEventListener("beforeunload",function(){tracking.flushQueue()});if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init)}else{init()}}();`

    return `<!-- 🚀 Rota Final - Experimento: ${name} -->
<!-- ID: ${experimentId} | API Key: ${apiKey ? '✅ Configurada' : '❌ Ausente'} -->
<script>
${baseCode}
</script>`
}

export function getUniqueSelector(el: Element): string {
    if (!(el instanceof Element)) return ''
    if (el.id) return `#${el.id}`
    const parts: string[] = []
    let current: Element | null = el
    while (current && current.nodeType === 1 && parts.length < 5) {
        let selector = current.nodeName.toLowerCase()
        if ((current as HTMLElement).className) {
            const cls = (current as HTMLElement).className
            if (typeof cls === 'string') {
                const classes = cls.split(' ').filter(c => !c.startsWith('hover:') && !c.includes('active'))
                if (classes.length > 0) selector += '.' + classes.join('.')
            }
        }
        parts.unshift(selector)
        current = current.parentElement
        if (current && current.id) {
            parts.unshift('#' + current.id)
            break
        }
    }
    return parts.join(' > ')
}
