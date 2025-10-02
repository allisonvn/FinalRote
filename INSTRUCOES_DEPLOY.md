# 🚨 INSTRUÇÕES URGENTES: Deploy Não Processado

## ⚠️ Problema Atual

O **deploy não foi processado** no servidor de produção. O código antigo ainda está em execução, causando erro 404 nos experimentos.

## ✅ Correções JÁ Commitadas (Aguardando Deploy)

1. **`src/app/api/track/route.ts`** - Tornado público
2. **`src/app/api/track/batch/route.ts`** - Tornado público  
3. **`src/app/api/experiments/[id]/assign/route.ts`** - Corrigido para usar `createServiceClient`

## 🔍 Verificação Necessária

### Onde você está hospedando o site?

Dependendo da plataforma, as instruções são diferentes:

---

### 📦 **OPÇÃO 1: Vercel**

1. **Acesse:** https://vercel.com/dashboard
2. **Verifique:** Se o deploy está "Building" ou "Ready"
3. **Se estiver "Ready":** Limpe o cache e force um novo deploy
4. **Comando:** `vercel --prod --force` (se usar CLI)

**Verificar variáveis de ambiente:**
- Ir em **Settings → Environment Variables**
- Confirmar que `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Verificar se `NEXT_PUBLIC_SUPABASE_URL` está correta

---

### 🌐 **OPÇÃO 2: Netlify**

1. **Acesse:** https://app.netlify.com/
2. **Vá em:** Site → Deploys
3. **Verifique:** Status do último deploy
4. **Se necessário:** Trigger deploy manually

**Verificar variáveis de ambiente:**
- Ir em **Site settings → Environment variables**
- Confirmar que `SUPABASE_SERVICE_ROLE_KEY` está configurada

---

### 🖥️ **OPÇÃO 3: Servidor Próprio (VPS, AWS, etc.)**

1. **Conectar ao servidor via SSH:**
   ```bash
   ssh seu-usuario@seu-servidor.com
   ```

2. **Ir para o diretório do projeto:**
   ```bash
   cd /caminho/do/projeto
   ```

3. **Puxar as últimas mudanças:**
   ```bash
   git pull origin main
   ```

4. **Instalar dependências:**
   ```bash
   npm install
   ```

5. **Fazer build:**
   ```bash
   npm run build
   ```

6. **Reiniciar o serviço:**
   ```bash
   # PM2:
   pm2 restart rotafinal
   
   # systemd:
   sudo systemctl restart rotafinal
   
   # Docker:
   docker-compose down && docker-compose up -d --build
   ```

7. **Verificar variáveis de ambiente:**
   ```bash
   cat .env.production
   # ou
   cat .env
   ```

**Variáveis obrigatórias:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://qptaizbqcgproqtvwvet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 🧪 Teste Após Deploy

Após o deploy ser processado, teste com:

```bash
curl -X POST https://rotafinal.com.br/api/experiments/b672c7b4-f845-4569-bb5a-063e2d483c81/assign \
  -H "Content-Type: application/json" \
  -d '{"visitor_id":"test123"}' \
  -v
```

**Resultado esperado:**
```json
{
  "variant": {
    "id": "...",
    "name": "Controle",
    "is_control": true,
    ...
  },
  "assignment": "new",
  "algorithm": "deterministic_hash"
}
```

**Status HTTP esperado:** `200 OK` (não 404!)

---

## 📋 Checklist de Verificação

- [ ] Deploy processado com sucesso
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] Variável `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] Endpoint retorna 200 (não 404)
- [ ] Logs do Supabase não mostram mais 401
- [ ] Experimento funciona no site de teste

---

## 🆘 Se o Problema Persistir

Se após fazer o deploy o problema continuar, pode haver **cache** no servidor. Tente:

### Vercel/Netlify:
1. Vá em **Settings → Functions**
2. Limpe o cache
3. Force um redeploy

### Servidor Próprio:
```bash
# Limpar cache do Next.js
rm -rf .next
npm run build

# Reiniciar serviço
pm2 restart rotafinal --update-env
```

---

## 📞 Informações Adicionais

**Commits enviados:**
- `7ade7c7` - Usar createServiceClient no endpoint assign
- `1223d21` - Remover validação obrigatória de API key dos endpoints públicos

**Branch:** `main`
**Repositório:** https://github.com/allisonvn/FinalRote.git

---

## ⏭️ Próximo Passo

**ME INFORME:**
1. Onde o site está hospedado? (Vercel/Netlify/Servidor próprio)
2. O deploy foi processado com sucesso?
3. As variáveis de ambiente estão configuradas?

Assim que me informar, posso te ajudar a verificar e resolver o problema! 🚀
