#!/bin/bash

# Script para corrigir problema de arquivos estáticos 404
# Este script reconstrói a aplicação sem output: 'standalone'

echo "🔧 Corrigindo problema de arquivos estáticos 404..."

# Parar processos em execução
echo "⏹️ Parando processos em execução..."
pkill -f "next" || true
pkill -f "node.*next" || true

# Limpar cache completamente
echo "🧹 Limpando cache completamente..."
rm -rf .next
rm -rf .next/cache
rm -rf .next/static
rm -rf .next/server
rm -rf out
rm -rf dist
rm -rf build

# Limpar node_modules e reinstalar
echo "📦 Reinstalando dependências..."
rm -rf node_modules
rm -f package-lock.json
npm install

# Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Fazer build sem output: 'standalone'
echo "🏗️ Fazendo build de produção (sem standalone)..."
NODE_ENV=production npm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    
    # Verificar se os arquivos estáticos foram gerados
    if [ -d ".next/static" ]; then
        echo "✅ Arquivos estáticos gerados corretamente!"
        echo "📁 Arquivos em .next/static:"
        ls -la .next/static/
    else
        echo "❌ Arquivos estáticos não foram gerados!"
        exit 1
    fi
    
    # Iniciar servidor de produção
    echo "🚀 Iniciando servidor de produção..."
    NODE_ENV=production npm run start &
    
    # Aguardar um pouco para o servidor inicializar
    sleep 5
    
    echo "🎉 Correção de arquivos estáticos concluída!"
    echo "📝 O servidor está rodando em modo de produção"
    echo "🔍 Verifique se os arquivos estáticos estão sendo servidos corretamente"
    echo "🌐 Acesse: http://localhost:3000"
else
    echo "❌ Erro durante o build. Verifique os logs acima."
    exit 1
fi
