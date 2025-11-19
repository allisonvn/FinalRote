#!/bin/bash

# Script de diagnóstico para erros 400 em produção
# Execute este script no servidor de produção para identificar o problema

echo "🔍 DIAGNÓSTICO DE ERROS 400 - rotafinal.com.br"
echo "=============================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se Next.js está rodando
echo "1️⃣ Verificando processo Next.js..."
if pm2 list | grep -q "rotafinal.*online"; then
    echo -e "${GREEN}✅ Next.js está rodando${NC}"
    pm2 list | grep rotafinal
else
    echo -e "${RED}❌ Next.js NÃO está rodando${NC}"
    echo "   Execute: pm2 start ecosystem.config.js"
fi
echo ""

# 2. Verificar porta do Next.js
echo "2️⃣ Verificando porta do Next.js..."
PORT=$(grep -o "PORT: [0-9]*" ecosystem.config.js 2>/dev/null | grep -o "[0-9]*" || echo "3000")
echo "   Porta configurada: $PORT"
if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo -e "${GREEN}✅ Porta $PORT está em uso${NC}"
    netstat -tlnp 2>/dev/null | grep ":$PORT "
else
    echo -e "${RED}❌ Porta $PORT NÃO está em uso${NC}"
fi
echo ""

# 3. Verificar configuração do Nginx
echo "3️⃣ Verificando configuração do Nginx..."
if [ -f "/etc/nginx/sites-available/rotafinal" ]; then
    echo -e "${GREEN}✅ Arquivo de configuração existe${NC}"
    
    # Verificar porta no nginx
    NGINX_PORT=$(grep -o "localhost:[0-9]*" /etc/nginx/sites-available/rotafinal 2>/dev/null | head -1 | grep -o "[0-9]*" || echo "não encontrado")
    echo "   Porta configurada no nginx: $NGINX_PORT"
    
    if [ "$NGINX_PORT" = "$PORT" ]; then
        echo -e "${GREEN}✅ Portas coincidem${NC}"
    else
        echo -e "${RED}❌ Portas NÃO coincidem!${NC}"
        echo "   Nginx aponta para: $NGINX_PORT"
        echo "   Next.js está em: $PORT"
    fi
    
    # Verificar se há headers duplicados
    if grep -q "add_header.*Content-Type" /etc/nginx/sites-available/rotafinal 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Nginx tem headers Content-Type - pode causar conflito${NC}"
        echo "   Linhas com Content-Type:"
        grep -n "add_header.*Content-Type" /etc/nginx/sites-available/rotafinal 2>/dev/null | head -5
    else
        echo -e "${GREEN}✅ Nginx não define Content-Type (correto)${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo de configuração não encontrado${NC}"
fi
echo ""

# 4. Verificar se arquivos estáticos existem
echo "4️⃣ Verificando arquivos estáticos..."
if [ -d ".next/static" ]; then
    echo -e "${GREEN}✅ Diretório .next/static existe${NC}"
    
    CSS_COUNT=$(find .next/static/css -name "*.css" 2>/dev/null | wc -l)
    JS_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l)
    
    echo "   Arquivos CSS: $CSS_COUNT"
    echo "   Arquivos JS: $JS_COUNT"
    
    if [ "$CSS_COUNT" -eq 0 ] || [ "$JS_COUNT" -eq 0 ]; then
        echo -e "${RED}❌ Arquivos estáticos não encontrados!${NC}"
        echo "   Execute: npm run build"
    else
        echo -e "${GREEN}✅ Arquivos estáticos encontrados${NC}"
        echo "   Exemplos:"
        find .next/static/css -name "*.css" 2>/dev/null | head -2
        find .next/static/chunks -name "*.js" 2>/dev/null | head -2
    fi
else
    echo -e "${RED}❌ Diretório .next/static não existe${NC}"
    echo "   Execute: npm run build"
fi
echo ""

# 5. Testar acesso direto ao Next.js
echo "5️⃣ Testando acesso direto ao Next.js..."
if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
    TEST_URL="http://localhost:$PORT/_next/static/chunks/webpack-*.js"
    echo "   Testando: $TEST_URL"
    
    # Tentar encontrar um arquivo webpack real
    WEBPACK_FILE=$(find .next/static/chunks -name "webpack-*.js" 2>/dev/null | head -1)
    if [ -n "$WEBPACK_FILE" ]; then
        FILE_NAME=$(basename "$WEBPACK_FILE")
        TEST_PATH="/_next/static/chunks/$FILE_NAME"
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT$TEST_PATH" 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Next.js responde 200 OK${NC}"
        elif [ "$HTTP_CODE" = "400" ]; then
            echo -e "${RED}❌ Next.js retorna 400 Bad Request${NC}"
            echo "   Isso indica problema no Next.js, não no Nginx"
        elif [ "$HTTP_CODE" = "404" ]; then
            echo -e "${YELLOW}⚠️  Next.js retorna 404 Not Found${NC}"
            echo "   Arquivo pode não existir ou build está desatualizado"
        else
            echo -e "${RED}❌ Next.js retorna $HTTP_CODE${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Não foi possível encontrar arquivo para testar${NC}"
    fi
else
    echo -e "${RED}❌ Não é possível testar - Next.js não está rodando${NC}"
fi
echo ""

# 6. Verificar logs do Next.js
echo "6️⃣ Últimas linhas dos logs do Next.js..."
if pm2 list | grep -q "rotafinal.*online"; then
    echo "   Últimas 10 linhas:"
    pm2 logs rotafinal --lines 10 --nostream 2>/dev/null | tail -10 || echo "   Não foi possível ler logs"
else
    echo "   Next.js não está rodando"
fi
echo ""

# 7. Verificar logs do Nginx
echo "7️⃣ Verificando logs do Nginx..."
if [ -f "/var/log/nginx/error.log" ]; then
    echo "   Últimas 5 linhas de erro:"
    sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "   Não foi possível ler logs (precisa de sudo)"
else
    echo "   Arquivo de log não encontrado"
fi
echo ""

# 8. Verificar configuração do next.config.js
echo "8️⃣ Verificando next.config.js..."
if [ -f "next.config.js" ]; then
    if grep -q "Content-Type.*text/css" next.config.js; then
        echo -e "${YELLOW}⚠️  next.config.js define Content-Type para CSS${NC}"
        echo "   Isso pode causar conflito - Next.js já define isso automaticamente"
    else
        echo -e "${GREEN}✅ next.config.js não define Content-Type (correto)${NC}"
    fi
    
    if grep -q "output.*standalone" next.config.js && ! grep -q "^[[:space:]]*//.*output.*standalone" next.config.js; then
        echo -e "${RED}❌ next.config.js tem output: 'standalone' ativo${NC}"
        echo "   Isso impede o Next.js de servir arquivos estáticos"
    else
        echo -e "${GREEN}✅ output: 'standalone' está desabilitado${NC}"
    fi
else
    echo -e "${RED}❌ next.config.js não encontrado${NC}"
fi
echo ""

# Resumo
echo "=============================================="
echo "📋 RESUMO DO DIAGNÓSTICO"
echo "=============================================="
echo ""
echo "Se todos os itens estão ✅, o problema pode ser:"
echo "1. Cache do navegador - limpe o cache"
echo "2. Configuração do Nginx não foi recarregada - execute: sudo systemctl reload nginx"
echo "3. Build desatualizado - execute: npm run build && pm2 restart rotafinal"
echo ""
echo "Para aplicar correções:"
echo "1. Copiar nova configuração: sudo cp nginx.conf /etc/nginx/sites-available/rotafinal"
echo "2. Testar: sudo nginx -t"
echo "3. Recarregar: sudo systemctl reload nginx"
echo "4. Fazer rebuild: npm run build"
echo "5. Reiniciar: pm2 restart rotafinal"
echo ""

