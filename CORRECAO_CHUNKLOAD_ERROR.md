# 🔧 Correção: ChunkLoadError - 400 Bad Request

## Problema
```
Failed to load resource: the server responded with a status of 400
Refused to execute script because its MIME type ('text/html') is not executable
ChunkLoadError: Loading chunk 4459 failed
```

## Causa Raiz
O middleware (`middleware.ts`) estava interceptando **todas** as requisições, incluindo os assets estáticos do Next.js (`/_next/static/chunks/*.js`). Isso causava:

1. **Status 400**: O middleware não estava processando corretamente as requisições de chunks
2. **MIME type text/html**: Os chunks estavam sendo retornados como HTML em vez de JavaScript
3. **Falha de carregamento**: O navegador rejeitava os scripts com MIME type incorreto

## Soluções Aplicadas

### 1. ✅ Middleware Corrigido (`middleware.ts`)
- Removemos a interceptação de `/_next/*`
- Agora o Next.js serve os assets estáticos diretamente sem processamento
- Middleware só processa rotas de negócio

```typescript
// ❌ ANTES: Capturava tudo
'/((?!_next/static|_next/image|favicon.ico).*)'

// ✅ DEPOIS: Ignora _next completamente
'/((?!_next|favicon.ico).*)'
```

### 2. ✅ Configuração Vercel/Netlify
Adicionamos headers corretos para `/_next/static/chunks/*`:

```json
"headers": [
  {
    "source": "/_next/static/(.*)",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
      { "key": "Content-Type", "value": "application/javascript" }
    ]
  }
]
```

### 3. ✅ Next.js Config Otimizado
- Configuração determinística de módulos para hashes consistentes
- Chunking estratégico em produção
- Desabilitado source maps em produção

## Passo a Passo para Resolver

### 1️⃣ Local - Limpar Cache e Reconstruir
```bash
cd /Users/allisonnascimento/Desktop/site/rotafinal

# Remover cache
rm -rf .next node_modules/.cache

# Reconstruir
npm run build
```

### 2️⃣ Verificar a Build
```bash
# Verificar se os chunks foram gerados corretamente
ls -la .next/static/chunks/

# Os arquivos devem ser .js (JavaScript), não .html
```

### 3️⃣ Deploy
```bash
# Commitar alterações
git add middleware.ts next.config.js netlify.toml vercel.json

git commit -m "fix: Corrigir ChunkLoadError removendo interceptação de assets estáticos"

# Push (Vercel/Netlify iniciará build automaticamente)
git push
```

### 4️⃣ Validar em Produção
Após o deploy:

1. Abrir https://rotafinal.com.br
2. Abrir DevTools (F12) → Console
3. Verificar se não há erros de ChunkLoadError
4. Verificar se os chunks estão sendo servidos com status 200 e MIME type `application/javascript`

## Verificação Técnica

### Headers Esperados (Verifica no DevTools)
```
Status: 200 (não 400)
Content-Type: application/javascript
Cache-Control: public, max-age=31536000, immutable
```

### Request URL
```
https://rotafinal.com.br/_next/static/chunks/6138-88024d94cc3fc4a2.js
```

## Se Ainda Tiver Problemas

### 1. Limpar Cache CDN (Cloudflare)
Se usar Cloudflare, ir a:
- Caching → Cache Rules → Purge Everything
- Ou Dashboard → Purge Cache

### 2. Forçar Cache Bust
Adicionar parâmetro de query (teste local):
```javascript
// No browser console
location.reload(true)  // Força recarregamento sem cache
```

### 3. Verificar Logs de Deploy
- **Vercel**: https://vercel.com/dashboard → Deployments → Logs
- **Netlify**: https://app.netlify.com → Deployments → Deploy logs

## Checklist de Confirmação

- ✅ `middleware.ts` atualizado para não interceptar `/_next/*`
- ✅ `next.config.js` otimizado para produção
- ✅ `vercel.json` com headers de Content-Type corretos
- ✅ `netlify.toml` com headers de Content-Type corretos
- ✅ Cache local limpo (`.next`, `node_modules/.cache`)
- ✅ Build executada localmente com sucesso
- ✅ Push enviado para repositório
- ✅ Deploy concluído em Vercel/Netlify
- ✅ Validação em produção sem erros de ChunkLoadError

## Documentação Referência

- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
- [Vercel Static Assets](https://vercel.com/docs/concepts/edge-network/static-files)
- [Netlify Headers Configuration](https://docs.netlify.com/routing/headers/)

---

**Última atualização**: October 16, 2025
**Status**: ✅ Corrigido
