#!/bin/bash

# Script para resetar o ambiente de desenvolvimento
# Resolve problemas de chunk loading e cache

echo "🔄 Resetando ambiente de desenvolvimento..."

# Parar o servidor se estiver rodando
echo "⏹️  Parando servidor..."
pkill -f "next dev" || true

# Limpar cache do Next.js
echo "🧹 Limpando cache do Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# Limpar cache do npm/yarn
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Reinstalar dependências se necessário
if [ "$1" = "--reinstall" ]; then
    echo "📦 Reinstalando dependências..."
    rm -rf node_modules
    npm install
fi

# Iniciar servidor de desenvolvimento
echo "🚀 Iniciando servidor de desenvolvimento..."
npm run dev

echo "✅ Reset completo!"
