#!/bin/bash

# Script para corrigir erros de CSS e chunks do Next.js

echo "🔧 Corrigindo erros de CSS e chunks..."

# Parar processos Next.js em execução
echo "⏹️  Parando processos Next.js..."
pkill -f "next dev" || true
pkill -f "next start" || true
sleep 2

# Limpar cache e builds anteriores
echo "🧹 Limpando cache e builds anteriores..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

# Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Reinstalar dependências (opcional, mas ajuda em alguns casos)
# echo "📦 Reinstalando dependências..."
# rm -rf node_modules
# npm install

# Fazer build limpo
echo "🏗️  Fazendo build limpo..."
npm run build

# Verificar se os arquivos foram gerados
echo "✅ Verificando arquivos gerados..."
if [ -d ".next/static/css" ]; then
    echo "✅ Diretório CSS encontrado"
    ls -la .next/static/css/ | head -5
else
    echo "❌ Diretório CSS não encontrado"
fi

if [ -d ".next/static/chunks" ]; then
    echo "✅ Diretório chunks encontrado"
    ls -la .next/static/chunks/ | head -5
else
    echo "❌ Diretório chunks não encontrado"
fi

echo "✅ Correção concluída! Execute 'npm run dev' ou 'npm start' para iniciar o servidor."

