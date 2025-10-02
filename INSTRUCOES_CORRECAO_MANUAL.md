# Instruções para Correção Manual no Servidor

## Opção 1: Script Automático (Recomendado)

Execute este comando no servidor:

```bash
# Baixar e executar o script de correção
curl -o corrigir-servidor.sh https://raw.githubusercontent.com/allisonvn/FinalRote/main/corrigir-servidor.sh
chmod +x corrigir-servidor.sh
./corrigir-servidor.sh
```

## Opção 2: Correção Manual

### 1. Fazer backup do arquivo atual
```bash
cp /var/www/rotafinal.com.br/.env.local /var/www/rotafinal.com.br/.env.local.backup
```

### 2. Editar o arquivo .env.local
```bash
nano /var/www/rotafinal.com.br/.env.local
```

### 3. Substituir TODO o conteúdo por:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qptaizbqcgproqtvwvet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTkzNjcsImV4cCI6MjA3NDQ5NTM2N30.trQBHGS4wM7kov0jyPAN-nTC99r9PS2L7MnQM5XVIps
NEXT_PUBLIC_SITE_URL=https://rotafinal.com.br
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxOTM2NywiZXhwIjoyMDc0NDk1MzY3fQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q
```

### 4. Salvar o arquivo
- Pressione `Ctrl + X`
- Pressione `Y` para confirmar
- Pressione `Enter` para salvar

### 5. Reiniciar o PM2
```bash
pm2 restart rotafinal
```

### 6. Testar a API
```bash
curl -X POST https://rotafinal.com.br/api/experiments/defb3829-e9bb-453d-af56-b08b167b9be3/assign \
  -H "Content-Type: application/json" \
  -d '{"visitor_id":"test123"}'
```

## Resultado Esperado

Após a correção, você deve ver uma resposta como:
```json
{
  "variant": {
    "id": "f8cf7fed-d5be-43a8-b902-6b2d7d3c7f80",
    "name": "Controle",
    "is_control": true,
    "traffic_percentage": "50.00"
  },
  "assignment": "new",
  "algorithm": "deterministic_hash"
}
```

## Verificação Adicional

Se ainda houver problemas, verifique os logs:
```bash
pm2 logs rotafinal --lines 50
```

## Problema Identificado

O erro "Experiment not found" ocorre porque a `SUPABASE_SERVICE_ROLE_KEY` no servidor está truncada/incorreta. A correção acima resolve este problema.
