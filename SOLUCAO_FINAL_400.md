# 🔧 Solução Final para Erros 400 em Produção

## ❌ Problema Persistente

Todos os arquivos estáticos retornam **400 Bad Request**:
```
GET /_next/static/chunks/common-e2933f1fd35f0787.js - 400
GET /_next/static/css/7e7d96b1e6991756.css - 400
```

## ✅ Correções Aplicadas no Código

### 1. **Removido Content-Type do next.config.js**

**PROBLEMA:** Definir `Content-Type` manualmente para arquivos estáticos causa conflito com o Next.js.

**SOLUÇÃO:** Removido `Content-Type` dos headers - Next.js define isso automaticamente.

```javascript
// ❌ ANTES (causava 400)
source: '/_next/static/css/:path*.css',
headers: [
  { key: 'Content-Type', value: 'text/css; charset=utf-8' }, // ❌ Causa conflito
  ...
]

// ✅ DEPOIS (correto)
source: '/_next/static/:path*',
headers: [
  // SEM Content-Type - Next.js faz isso automaticamente
  { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
  { key: 'Access-Control-Allow-Origin', value: '*' },
]
```

### 2. **Configuração Nginx Simplificada**

Nova configuração que não interfere com arquivos estáticos:
```nginx
location /_next/static/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    # SEM headers - Next.js faz isso
}
```

### 3. **Middleware Correto**

O middleware já está fazendo bypass correto para `/_next/static/`.

## 📋 Passos para Aplicar no Servidor

### **PASSO 1: Executar Diagnóstico**

```bash
# No servidor de produção
cd /var/www/rotafinal.com.br
./diagnostico-servidor.sh
```

Isso vai identificar:
- ✅ Se Next.js está rodando
- ✅ Se as portas coincidem
- ✅ Se arquivos estáticos existem
- ✅ Se há problemas de configuração

### **PASSO 2: Atualizar Código**

```bash
# Fazer pull das mudanças
cd /var/www/rotafinal.com.br
git pull origin main

# OU copiar arquivos manualmente:
# - next.config.js (sem Content-Type para estáticos)
# - nginx.conf (configuração simplificada)
```

### **PASSO 3: Atualizar Nginx**

```bash
# Backup
sudo cp /etc/nginx/sites-available/rotafinal /etc/nginx/sites-available/rotafinal.backup.$(date +%Y%m%d)

# Copiar nova configuração
sudo cp nginx.conf /etc/nginx/sites-available/rotafinal

# Testar
sudo nginx -t

# Se OK, recarregar
sudo systemctl reload nginx
```

### **PASSO 4: Fazer Rebuild**

```bash
cd /var/www/rotafinal.com.br

# Limpar cache
rm -rf .next node_modules/.cache

# Rebuild
npm run build

# Verificar se arquivos foram gerados
ls -la .next/static/css/ | head -5
ls -la .next/static/chunks/ | head -5
```

### **PASSO 5: Reiniciar Next.js**

```bash
pm2 restart rotafinal

# Verificar logs
pm2 logs rotafinal --lines 50
```

### **PASSO 6: Testar**

```bash
# Testar arquivo CSS
curl -I https://rotafinal.com.br/_next/static/css/7e7d96b1e6991756.css

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: text/css; charset=utf-8 (definido pelo Next.js)

# Testar chunk JS
curl -I https://rotafinal.com.br/_next/static/chunks/webpack-54d97ceab7ed6d40.js

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=utf-8 (definido pelo Next.js)
```

## 🔍 Troubleshooting Avançado

### Se ainda houver erros 400:

#### **1. Verificar se Next.js está servindo corretamente:**

```bash
# Testar diretamente (sem nginx)
curl -I http://localhost:3000/_next/static/css/7e7d96b1e6991756.css

# Se retornar 200 → problema é no nginx
# Se retornar 400 → problema é no Next.js
```

#### **2. Verificar logs detalhados:**

```bash
# Logs do Next.js
pm2 logs rotafinal --lines 100

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

#### **3. Verificar se há múltiplas configurações:**

```bash
# Verificar todas as configurações do nginx
sudo nginx -T | grep -A 20 "rotafinal"

# Verificar se há includes
grep -r "include" /etc/nginx/sites-available/rotafinal
```

#### **4. Verificar permissões:**

```bash
# Verificar permissões dos arquivos
ls -la /var/www/rotafinal.com.br/.next/static/

# Verificar usuário do PM2
pm2 info rotafinal | grep user

# Se necessário, ajustar permissões
sudo chown -R $(whoami):$(whoami) /var/www/rotafinal.com.br/.next
```

#### **5. Verificar se há proxy reverso adicional:**

```bash
# Verificar se há Cloudflare ou outro proxy
curl -I https://rotafinal.com.br/_next/static/css/7e7d96b1e6991756.css -v

# Verificar headers de resposta
# Se houver headers como CF-*, pode ser Cloudflare causando problemas
```

## 🎯 Causas Comuns de Erro 400

1. **Headers Content-Type duplicados**
   - ✅ CORRIGIDO: Removido do next.config.js

2. **Nginx adicionando headers conflitantes**
   - ✅ CORRIGIDO: Configuração simplificada

3. **Porta incorreta no nginx**
   - ⚠️ Verificar com `diagnostico-servidor.sh`

4. **Arquivos não existem**
   - ⚠️ Verificar com `ls -la .next/static/`

5. **Build desatualizado**
   - ⚠️ Fazer rebuild: `npm run build`

6. **Next.js não está rodando**
   - ⚠️ Verificar com `pm2 list`

7. **Cache do navegador**
   - ⚠️ Limpar cache: Ctrl+Shift+R

## ✅ Checklist Final

Após aplicar todas as correções:

- [ ] Código atualizado (git pull ou copiar arquivos)
- [ ] `next.config.js` sem Content-Type para estáticos
- [ ] `nginx.conf` simplificado (sem headers para `/_next/static/`)
- [ ] Nginx testado (`nginx -t`) sem erros
- [ ] Nginx recarregado (`systemctl reload nginx`)
- [ ] Build feito (`npm run build`)
- [ ] Arquivos estáticos existem (`.next/static/`)
- [ ] Next.js rodando (`pm2 list`)
- [ ] Portas coincidem (nginx e Next.js)
- [ ] Teste direto retorna 200 (`curl http://localhost:3000/_next/static/...`)
- [ ] Teste via nginx retorna 200 (`curl https://rotafinal.com.br/_next/static/...`)
- [ ] Console do navegador sem erros 400
- [ ] Site carrega completamente

## 📝 Notas Importantes

1. **NÃO definir Content-Type** para arquivos estáticos no `next.config.js` - Next.js faz isso automaticamente

2. **NÃO adicionar headers** no nginx para `/_next/static/` - deixar o Next.js fazer isso

3. **O middleware já está correto** - faz bypass para `/_next/static/`

4. **Sempre testar diretamente** no Next.js antes de testar via nginx para identificar onde está o problema

5. **Limpar cache do navegador** após fazer mudanças

## 🚀 Próximos Passos

1. Executar `diagnostico-servidor.sh` no servidor
2. Aplicar correções conforme diagnóstico
3. Testar com `curl` antes de testar no navegador
4. Monitorar logs por alguns minutos após aplicar correções

