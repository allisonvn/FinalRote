#!/bin/bash
echo "🔄 Resetando ambiente de desenvolvimento..."

# Matar processo na porta 3001
echo "⏹️  Parando servidor na porta 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Nenhum processo encontrado"

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# Limpar cache do npm
echo "📦 Limpando cache do npm..."
npm cache clean --force

echo "✅ Limpeza concluída!"
echo ""
echo "🚀 Para reiniciar o servidor, execute:"
echo "   npm run dev"
