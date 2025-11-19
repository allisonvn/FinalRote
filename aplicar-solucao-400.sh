#!/bin/bash

# Script para aplicar a SOLUÇÃO DEFINITIVA para erros 400
# Execute no servidor de produção com sudo

echo "🚀 APLICANDO SOLUÇÃO DEFINITIVA PARA ERROS 400"
echo "=============================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Este script deve ser executado com sudo${NC}"
    exit 1
fi

# 1. Fazer backup
echo "1️⃣ Fazendo backup da configuração atual..."
BACKUP_FILE="/etc/nginx/sites-available/rotafinal.backup.$(date +%Y%m%d_%H%M%S)"
cp /etc/nginx/sites-available/rotafinal "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
echo ""

# 2. Copiar nova configuração
echo "2️⃣ Aplicando nova configuração do Nginx..."
if [ -f "nginx.conf" ]; then
    cp nginx.conf /etc/nginx/sites-available/rotafinal
    echo -e "${GREEN}✅ Configuração copiada${NC}"
else
    echo -e "${RED}❌ Arquivo nginx.conf não encontrado${NC}"
    exit 1
fi
echo ""

# 3. Testar Nginx
echo "3️⃣ Testando sintaxe do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✅ Teste passou${NC}"
else
    echo -e "${RED}❌ Teste falhou${NC}"
    echo "   Revertendo para backup..."
    cp "$BACKUP_FILE" /etc/nginx/sites-available/rotafinal
    exit 1
fi
echo ""

# 4. Recarregar Nginx
echo "4️⃣ Recarregando Nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx recarregado${NC}"
else
    echo -e "${RED}❌ Falha ao recarregar Nginx${NC}"
    cp "$BACKUP_FILE" /etc/nginx/sites-available/rotafinal
    exit 1
fi
echo ""

# 5. Verificar status
echo "5️⃣ Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx ativo${NC}"
else
    echo -e "${RED}❌ Nginx não está ativo${NC}"
    exit 1
fi
echo ""

# 6. Verificar Next.js
echo "6️⃣ Verificando status do Next.js..."
if pm2 list | grep -q "rotafinal.*online"; then
    echo -e "${GREEN}✅ Next.js está rodando${NC}"
    pm2 list | grep rotafinal
else
    echo -e "${YELLOW}⚠️  Next.js não está rodando${NC}"
    echo "   Iniciando com: pm2 start ecosystem.config.js"
    pm2 start ecosystem.config.js
fi
echo ""

# 7. Fazer rebuild se necessário
echo "7️⃣ Verificando build do Next.js..."
if [ ! -d ".next/static" ]; then
    echo -e "${YELLOW}⚠️  Diretório .next/static não existe${NC}"
    echo "   Fazendo build..."
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build realizado${NC}"
    else
        echo -e "${RED}❌ Build falhou${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Build já existe${NC}"
fi
echo ""

# 8. Testar acesso
echo "8️⃣ Testando acesso aos arquivos estáticos..."
WEBPACK_FILE=$(find .next/static/chunks -name "webpack-*.js" 2>/dev/null | head -1)
if [ -n "$WEBPACK_FILE" ]; then
    FILE_NAME=$(basename "$WEBPACK_FILE")
    TEST_PATH="/_next/static/chunks/$FILE_NAME"
    
    # Testar diretamente no Next.js
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$TEST_PATH" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Acesso direto: 200 OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Acesso direto retornou: $HTTP_CODE${NC}"
    fi
fi
echo ""

# 9. Resumo
echo "=============================================="
echo -e "${GREEN}✅ SOLUÇÃO APLICADA COM SUCESSO${NC}"
echo "=============================================="
echo ""
echo "📋 Próximas etapas:"
echo "1. Abrir navegador: https://rotafinal.com.br"
echo "2. Limpar cache: Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)"
echo "3. Abrir DevTools (F12) e verificar console"
echo "4. Erros 400 devem ter desaparecido"
echo ""
echo "📊 Monitorar logs:"
echo "  - Nginx:  sudo tail -f /var/log/nginx/error.log"
echo "  - Next.js: pm2 logs rotafinal"
echo ""
echo "🔙 Se necessário reverter:"
echo "  sudo cp $BACKUP_FILE /etc/nginx/sites-available/rotafinal"
echo "  sudo systemctl reload nginx"
echo ""

