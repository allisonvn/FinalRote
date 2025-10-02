# Solução do Problema do Experimento 404

## Problema Identificado

O experimento estava retornando erro 404 "Experiment not found" no servidor, mesmo existindo no banco de dados. O problema estava na configuração das variáveis de ambiente no servidor.

## Causa Raiz

A `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.local` do servidor estava truncada/incorreta:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxOTM2NywiZXhwIjoyMDc0NDk1MzY3fQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q
```

## Solução

### 1. Corrigir o arquivo .env.local no servidor

Execute os seguintes comandos no servidor:

```bash
# 1. Editar o arquivo .env.local
nano /var/www/rotafinal.com.br/.env.local

# 2. Substituir todo o conteúdo por:
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://qptaizbqcgproqtvwvet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTkzNjcsImV4cCI6MjA3NDQ5NTM2N30.trQBHGS4wM7kov0jyPAN-nTC99r9PS2L7MnQM5XVIps
NEXT_PUBLIC_SITE_URL=https://rotafinal.com.br
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxOTM2NywiZXhwIjoyMDc0NDk1MzY3fQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q
```

### 2. Reiniciar o PM2

```bash
pm2 restart rotafinal
```

### 3. Testar a API

```bash
curl -X POST https://rotafinal.com.br/api/experiments/defb3829-e9bb-453d-af56-b08b167b9be3/assign \
  -H "Content-Type: application/json" \
  -d '{"visitor_id":"test123"}'
```

## Verificação

Após aplicar a correção, a API deve retornar:
- Status 200 (sucesso)
- Dados da variante atribuída
- Sem erro "Experiment not found"

## Status do Experimento

- **ID**: `defb3829-e9bb-453d-af56-b08b167b9be3`
- **Nome**: `esmalt`
- **Status**: `running`
- **Variantes**: 2 (Controle 50%, Variante A 50%)

## Arquivos de Teste Criados

- `test-server-connection.js` - Testa conexão com Supabase
- `test-api-debug.js` - Testa API de assign
- `fix-server-env.js` - Script de correção
- `test-with-anon-key.js` - Teste com anon key

## Próximos Passos

1. Aplicar a correção no servidor
2. Testar a API
3. Verificar se o experimento está funcionando no site
4. Monitorar logs para garantir que não há mais erros
