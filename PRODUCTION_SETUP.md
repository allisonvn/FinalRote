# 🚀 Configuração para Produção - RotaFinal SaaS

## 📋 Visão Geral

O RotaFinal é um **SaaS de testes A/B** hospedado em **rotafinal.com.br** onde:
- Clientes criam experimentos dentro da plataforma
- Sistema gera código JavaScript pronto para uso
- Cliente instala o código no site dele (ex: esmalt.com.br)
- Código faz chamadas de API de volta para rotafinal.com.br

## ✅ Correções Aplicadas (25/10/2025)

### 1. **CORS Global (next.config.js:23-45)**

Headers CORS configurados para permitir chamadas de sites externos:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-RF-Version, X-Requested-With' },
      ],
    },
    {
      source: '/:path*.js',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    },
  ]
}
```

### 2. **CORS em Rotas Individuais**

✅ **`src/app/api/experiments/[id]/route.ts`**
- Adicionados CORS headers em todas as respostas
- Função OPTIONS implementada para preflight requests

✅ **`src/app/api/experiments/[id]/assign/route.ts`**
- CORS já estava implementado

✅ **`src/app/api/track/route.ts`**
- CORS já estava implementado

### 3. **Variáveis de Ambiente (.env.local)**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xtexltigzzayfrscvzaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# URLs do Sistema
NEXT_PUBLIC_SITE_URL=http://localhost:3001          # Em dev
NEXT_PUBLIC_API_URL=https://rotafinal.com.br        # URL da API para código gerado
```

### 4. **OptimizedCodeGenerator (src/components/OptimizedCodeGenerator.tsx:35)**

```typescript
baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rotafinal.com.br'
```

- ✅ Usa variável de ambiente `NEXT_PUBLIC_API_URL`
- ✅ Sempre gera código apontando para rotafinal.com.br
- ✅ Validação de experimentId implementada
- ✅ Alertas visuais para problemas

### 5. **Correção de API Key (src/app/experiments/[id]/page.tsx:224)**

```typescript
<CodeGenerator
  experimentName={experiment.name}
  experimentId={experiment.id}
  variants={experiment.variants || []}
  apiKey={projectApiKey || ''}  // ✅ Corrigido de experiment.api_key
/>
```

## 🔧 Deploy no Vercel

### 1. Variáveis de Ambiente

No Vercel (Settings → Environment Variables), adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://xtexltigzzayfrscvzaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://rotafinal.com.br
NEXT_PUBLIC_API_URL=https://rotafinal.com.br
```

### 2. Domínio Personalizado

1. Settings → Domains → Add Domain
2. Adicione: `rotafinal.com.br` e `www.rotafinal.com.br`
3. Configure DNS conforme instruções do Vercel

### 3. Build & Deploy

```bash
# Build local (testar antes de fazer deploy)
npm run build

# Deploy (via CLI ou GitHub)
vercel --prod
```

## 🧪 Testando em Produção

### 1. Criar Experimento no SaaS

1. Acesse https://rotafinal.com.br/dashboard
2. Crie um novo experimento
3. Configure variantes e conversão
4. Copie o código gerado

### 2. Instalar em Site Externo

Cole o código no `<head>` do site de teste (ex: esmalt.com.br):

```html
<!DOCTYPE html>
<html>
<head>
  <!-- RotaFinal SDK - COLE NO TOPO DO HEAD -->
  <link rel="preconnect" href="https://rotafinal.com.br">

  <style data-rf-antiflicker>
  body:not([data-rf-ready]){opacity:0;visibility:hidden}
  </style>

  <script>
  !function(){"use strict";var e="experiment-id-aqui"...
  </script>

  <!-- conversion-tracker.js (se configurado) -->
  <script src="https://rotafinal.com.br/conversion-tracker.js"></script>

  <!-- Resto do site -->
  <title>Meu Site</title>
</head>
<body>
  ...
</body>
</html>
```

### 3. Verificar Chamadas de API (DevTools → Network)

✅ **POST** `https://rotafinal.com.br/api/experiments/[id]/assign`
```json
Request: {
  "visitor_id": "rf_abc123...",
  "user_agent": "Mozilla/5.0...",
  "url": "https://esmalt.com.br/",
  "timestamp": "2025-10-25T..."
}

Response: {
  "variant": {
    "id": "...",
    "name": "Variante A",
    "redirect_url": "https://esmalt.com.br/landing-a"
  },
  "assignment": "new"
}
```

✅ **POST** `https://rotafinal.com.br/api/track`
```json
Request: {
  "experiment_id": "...",
  "visitor_id": "rf_abc123...",
  "event_type": "conversion",
  "value": 99.90
}

Response: {
  "success": true
}
```

✅ **GET** `https://rotafinal.com.br/api/experiments/[id]` (conversion-tracker)
```json
Response: {
  "success": true,
  "experiment": {
    "conversion_value": 50,
    "conversion_url": "/obrigado"
  }
}
```

### 4. Verificar CORS (DevTools → Console)

**✅ SEM erros de CORS:**
```
RotaFinal: Assignment received
RotaFinal: Variant = Variante A
```

**❌ Se aparecer erro de CORS:**
```
Access to fetch at 'https://rotafinal.com.br/api/...'
from origin 'https://esmalt.com.br' has been blocked by CORS policy
```

**Solução:**
1. Verifique next.config.js (linhas 23-45)
2. Faça novo deploy no Vercel
3. Limpe cache do navegador

## 🐛 Troubleshooting

### Problema: "experiment ID is null"

**Sintomas:**
```
POST https://rotafinal.com.br/api/experiments/null/assign 404
```

**Causa:** Página do experimento não carregou o ID

**Solução:**
1. Recarregue a página do experimento no dashboard
2. Verifique console do navegador
3. Se persistir, problema pode estar em `src/app/experiments/[id]/page.tsx`

---

### Problema: "API key ausente"

**Sintomas:**
- Alerta amarelo no gerador de código
- Código gerado com `apiKey=""`

**Solução:**
1. Dashboard → Projetos → Selecione o projeto
2. Copie a API Key
3. Se não houver, gere uma nova
4. Recarregue a página do experimento

---

### Problema: "CORS blocked"

**Sintomas:**
```
has been blocked by CORS policy: Response to preflight request
doesn't pass access control check
```

**Soluções:**
1. ✅ Verifique next.config.js tem headers CORS
2. ✅ Reinicie servidor local: `npm run dev`
3. ✅ Em produção, faça novo deploy
4. ✅ Teste com curl primeiro:
```bash
curl -X OPTIONS https://rotafinal.com.br/api/track \
  -H "Origin: https://esmalt.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

---

### Problema: "404 Not Found"

**Sintomas:**
```
POST https://rotafinal.com.br/api/track 404 (Not Found)
```

**Solução:**
1. Verifique se rota existe: `src/app/api/track/route.ts`
2. Teste localmente: `http://localhost:3001/api/track`
3. Verifique logs do Vercel
4. Certifique-se que deploy foi feito

---

### Problema: "undefined/api/experiments/..."

**Sintomas:**
```
POST https://esmalt.com.br/undefined/api/experiments/.../assign
```

**Causa:** `baseUrl` não foi configurado corretamente

**Solução:**
1. Verifique `.env.local` tem `NEXT_PUBLIC_API_URL=https://rotafinal.com.br`
2. Reinicie servidor de desenvolvimento
3. Regenere o código do experimento
4. Substitua código antigo no site

## 📝 Checklist Pré-Deploy

- [ ] ✅ Variáveis de ambiente configuradas no Vercel
- [ ] ✅ `NEXT_PUBLIC_API_URL=https://rotafinal.com.br`
- [ ] ✅ CORS headers no next.config.js (linhas 23-45)
- [ ] ✅ Domínio rotafinal.com.br configurado e ativo
- [ ] ✅ Build local funciona: `npm run build`
- [ ] ✅ Experimento teste criado
- [ ] ✅ Código gerado testado localmente
- [ ] ✅ CORS testado de domínio externo (pode usar esmalt.com.br)
- [ ] ✅ Conversões rastreando corretamente

## 🎯 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│  Site do Cliente (esmalt.com.br)                    │
│  ┌───────────────────────────────────────────────┐  │
│  │  <script> RotaFinal SDK inline </script>      │  │
│  │  - Carrega variante                           │  │
│  │  - Aplica mudanças                            │  │
│  │  - Rastreia eventos                           │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS + CORS
                  ↓
┌─────────────────────────────────────────────────────┐
│  RotaFinal SaaS (rotafinal.com.br)                  │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Next.js API Routes (com CORS)             │    │
│  │  - /api/experiments/[id]          (GET)    │    │
│  │  - /api/experiments/[id]/assign   (POST)   │    │
│  │  - /api/track                     (POST)   │    │
│  └────────────────────────────────────────────┘    │
│                      │                              │
│                      ↓                              │
│  ┌────────────────────────────────────────────┐    │
│  │  Supabase Client (Service Role)            │    │
│  │  - Autenticação do service account         │    │
│  │  - RLS policies                            │    │
│  └────────────────────────────────────────────┘    │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│  Supabase PostgreSQL                                │
│  - experiments                                      │
│  - variants                                         │
│  - assignments                                      │
│  - events                                           │
│  - variant_stats                                    │
└─────────────────────────────────────────────────────┘
```

## 📊 Próximos Passos Pós-Deploy

1. **Analytics & Monitoring**
   - Configure Vercel Analytics
   - Configure Sentry para error tracking
   - Configure LogRocket para session replay

2. **Performance**
   - Configure CDN (Cloudflare)
   - Otimize cache de arquivos estáticos
   - Configure Vercel Edge Functions

3. **Segurança**
   - Configure rate limiting
   - Implemente API key validation
   - Configure WAF (Web Application Firewall)

4. **Backup & Recovery**
   - Configure backups automáticos do Supabase
   - Teste procedimento de recovery
   - Configure alertas de falha

5. **Documentação**
   - Crie documentação pública da API
   - Adicione exemplos de integração
   - Crie tutoriais em vídeo

## 📞 Suporte

Em caso de problemas:

1. **Logs do Vercel**: https://vercel.com/dashboard
2. **Logs do Supabase**: https://supabase.com/dashboard/project/.../logs
3. **Teste local primeiro**: `npm run dev`
4. **Verifique variáveis**: `.env.local` vs Vercel Environment Variables

---

**✨ Sistema pronto para produção com CORS totalmente funcional!**
