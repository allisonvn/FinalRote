# 🚨 SOLUÇÃO DEFINITIVA - Erros 400 em Produção

## ❌ Problema Raiz Identificado

Os erros **400 Bad Request** estão sendo causados pelo **Nginx proxy** — não pelo Next.js.

**Indicadores:**
- `net::ERR_ABORTED 400` — conexão abortada com erro 400
- Todos os arquivos estáticos afetados
- Erro acontece ao fazer proxy para o Next.js

## 🔧 Causa Raiz

O Nginx está com **buffers insuficientes** ou **headers de proxy incorretos**, causando:
1. Requisições malformadas ao proxiar
2. Rejeição de conexões pelo backend
3. Erro 400 (Bad Request)

## ✅ Solução Final

### Arquivo: `nginx.conf.production`

Nova configuração com:
- ✅ Buffers aumentados (256 x 16k)
- ✅ Timeout aumentado para 60s
- ✅ Headers de proxy otimizados
- ✅ Suporte a WebSocket
- ✅ Configuração simplificada (sem regras de location complexas)

## 📋 Passos para Aplicar (URGENTE)

### **PASSO 1: Fazer backup**

```bash
cd /var/www/rotafinal.com.br

# Backup da configuração atual
sudo cp /etc/nginx/sites-available/rotafinal /etc/nginx/sites-available/rotafinal.backup.$(date +%Y%m%d_%H%M%S)
```

### **PASSO 2: Copiar nova configuração**

```bash
# Copiar arquivo de produção
sudo cp nginx.conf.production /etc/nginx/sites-available/rotafinal

# Se não tiver nginx.conf.production, usar:
# sudo cp nginx.conf /etc/nginx/sites-available/rotafinal
```

### **PASSO 3: Testar Nginx**

```bash
sudo nginx -t
```

**Resposta esperada:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### **PASSO 4: Recarregar Nginx**

```bash
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

### **PASSO 5: Monitorar erros**

```bash
# Terminal 1: Ver erros do Nginx em tempo real
sudo tail -f /var/log/nginx/error.log

# Terminal 2: Ver erros do Next.js
pm2 logs rotafinal
```

### **PASSO 6: Testar no navegador**

1. Abrir DevTools (F12)
2. Ir para aba "Console"
3. Recarregar página (Ctrl+Shift+R)
4. Verificar se erros 400 desaparecem

## ✅ Alterações na Configuração

### De:
```nginx
location /_next/static/ {
    proxy_pass http://localhost:3000;
    # Headers duplicados, buffers não configurados
}
```

### Para:
```nginx
# Configurações GLOBAIS de proxy (antes de qualquer bloco server)
proxy_buffering on;
proxy_buffer_size 128k;
proxy_buffers 256 16k;
proxy_busy_buffers_size 256k;

# Location padrão - tudo via proxy
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    # Headers mínimos necessários
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🎯 Por que isso funciona

1. **Buffers aumentados** — permite requisições maiores sem truncar
2. **proxy_http_version 1.1** — versão de HTTP mais estável
3. **Headers simples** — sem conflitos
4. **Configuração global** — aplicada a todas as requisições
5. **Location única** — sem sobreposição de regras

## ⚠️ Se ainda houver erros:

### 1. Verificar logs do Nginx:

```bash
sudo tail -100 /var/log/nginx/error.log | grep -i "400\|bad request\|proxy"
```

### 2. Verificar se Next.js está rodando:

```bash
pm2 list
pm2 logs rotafinal --lines 50
```

### 3. Testar diretamente no Next.js:

```bash
# Sem passar por Nginx
curl -I http://localhost:3000/_next/static/css/7e7d96b1e6991756.css

# Se retornar 200 → problema é no Nginx
# Se retornar 400 → problema é no Next.js
```

### 4. Verificar porta:

```bash
# Confirmando que Next.js está na porta 3000
netstat -tlnp | grep node

# Se não for 3000, atualizar nginx.conf
```

### 5. Reiniciar tudo:

```bash
pm2 restart rotafinal
sudo systemctl reload nginx

# Aguardar 10 segundos
sleep 10

# Testar novamente
curl -I https://rotafinal.com.br/_next/static/css/7e7d96b1e6991756.css
```

## 📝 Notas Importantes

1. **Não adicionar Content-Type** no Nginx — deixar Next.js fazer
2. **Não adicionar headers demais** — Nginx enxuto e simples
3. **Buffers grandes** — essencial para arquivos estáticos
4. **HTTP/1.1 no proxy** — mais estável que keep-alive automático

## 🚀 Checklist Final

- [ ] Backup feito
- [ ] Arquivo nginx.conf.production copiado
- [ ] `sudo nginx -t` retornou OK
- [ ] `sudo systemctl reload nginx` executado
- [ ] Logs monitorados
- [ ] Página recarregada (Ctrl+Shift+R)
- [ ] Erros 400 desapareceram
- [ ] Site carrega completamente
- [ ] Console do navegador limpo

## 🆘 Suporte

Se após seguir TODOS os passos ainda houver erro 400:

1. Enviar output de:
   - `sudo nginx -t`
   - `pm2 list`
   - `pm2 logs rotafinal --lines 20`
   - `sudo tail -20 /var/log/nginx/error.log`
   - `curl -v https://rotafinal.com.br/_next/static/css/7e7d96b1e6991756.css 2>&1 | head -30`

2. Possíveis causas adicionais:
   - Firewall bloqueando portas
   - Cloudflare ou CDN interferindo
   - Limite de arquivo no sistema
   - Espaço em disco insuficiente

