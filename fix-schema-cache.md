# 🔧 Correção do Cache de Schema do Supabase

## 🚨 Problema Identificado
O sistema de teste está consultando um **cache de schema desatualizado** que contém:
- Campo `key` (não existe mais)
- Campo `traffic_allocation` como `numeric(5,4)` (agora é `numeric(4,2)`)
- Outros campos antigos que causam overflow

## ✅ Schema Real (Correto)
```sql
traffic_allocation: numeric(4,2) -- 0.00 a 99.99
statistical_significance: numeric(6,4) -- 0.0000 a 100.0000
confidence_level: numeric(5,2) -- 80.00 a 99.99
```

## 🛠️ Soluções para Aplicar

### 1. Limpar Cache do Supabase (Dashboard)
1. Acesse o dashboard do Supabase
2. Vá em "Settings" > "API"
3. Clique em "Regenerate API Documentation"
4. Aguarde a regeneração completa

### 2. Regenerar Tipos TypeScript
```bash
cd /Users/allisonnascimento/Desktop/site/rotafinal
npx supabase gen types typescript --project-id xtexltigzzayfrscvzaa > src/types/supabase.ts
```

### 3. Reiniciar Edge Functions
```bash
# Se estiver usando edge functions
npx supabase functions restart
```

### 4. Forçar Refresh do Schema (Programático)
```javascript
// Adicionar ao sistema de teste
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(url, key, {
  db: { schema: 'public' },
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
  global: { headers: { 'Cache-Control': 'no-cache' } }
})
```

### 5. Alternativa: Usar SQL Direto
```javascript
// Bypass do cache usando raw SQL
const { data, error } = await supabase.rpc('exec_sql', {
  sql: `
    INSERT INTO experiments (name, project_id, type, traffic_allocation, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, traffic_allocation
  `,
  params: [name, projectId, type, traffic, status]
})
```

## 🎯 Próximos Passos
1. **Aplicar limpeza de cache** no dashboard
2. **Regenerar tipos** com comando acima
3. **Testar sistema** novamente
4. **Monitorar logs** para confirmação

## ✅ Confirmação de Sucesso
Quando corrigido, o sistema deve:
- ✅ Aceitar valores de `traffic_allocation` até 99.99
- ✅ Não mencionar campo `key` inexistente
- ✅ Funcionar com client anônimo e service role
- ✅ Passar em todos os testes do sistema
