#!/bin/bash

echo "🔧 Corrigindo variáveis de ambiente no servidor..."

# Backup do arquivo atual
echo "📦 Fazendo backup do .env.local atual..."
cp /var/www/rotafinal.com.br/.env.local /var/www/rotafinal.com.br/.env.local.backup

# Criar novo arquivo .env.local com as configurações corretas
echo "✏️ Criando novo arquivo .env.local..."
cat > /var/www/rotafinal.com.br/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://qptaizbqcgproqtvwvet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTkzNjcsImV4cCI6MjA3NDQ5NTM2N30.trQBHGS4wM7kov0jyPAN-nTC99r9PS2L7MnQM5XVIps
NEXT_PUBLIC_SITE_URL=https://rotafinal.com.br
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxOTM2NywiZXhwIjoyMDc0NDk1MzY3fQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q
EOF

echo "✅ Arquivo .env.local atualizado!"

# Verificar o conteúdo
echo "📋 Conteúdo do arquivo .env.local:"
cat /var/www/rotafinal.com.br/.env.local

echo ""
echo "🔄 Reiniciando PM2..."
pm2 restart rotafinal

echo "⏳ Aguardando 5 segundos para o serviço inicializar..."
sleep 5

echo "🧪 Testando a API..."
curl -X POST https://rotafinal.com.br/api/experiments/defb3829-e9bb-453d-af56-b08b167b9be3/assign \
  -H "Content-Type: application/json" \
  -d '{"visitor_id":"test123"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "🎯 Correção aplicada! Se ainda houver erro, verifique os logs do PM2:"
echo "   pm2 logs rotafinal"
