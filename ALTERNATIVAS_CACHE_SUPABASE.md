# 🔧 ALTERNATIVAS PARA CONTORNAR CACHE DO SUPABASE

## 🎯 PROBLEMA ATUAL
Cache de schema corrompido impedindo acesso às tabelas via cliente Supabase.

## 🚀 ALTERNATIVAS DISPONÍVEIS

### **1. USAR SQL DIRETO (PostgREST)**
```javascript
// Contornar cache usando SQL direto
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_direct`, {
  method: 'POST',
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'SELECT * FROM experiments LIMIT 1'
  })
})
```

### **2. REGENERAR TIPOS TYPESCRIPT**
```bash
# Forçar regeneração de tipos
npx supabase gen types typescript --project-id ypoxxzkuetblrtphoaxr > src/types/supabase.ts

# Reiniciar servidor
npm run dev
```

### **3. FORÇAR REFRESH DO SCHEMA VIA SQL**
```sql
-- Executar no SQL Editor
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload rls';

-- Ou via função
SELECT pg_notify('pgrst', 'reload schema');
```

### **4. USAR CLIENTE SUPABASE COM CONFIGURAÇÕES ESPECÍFICAS**
```javascript
const supabase = createClient(supabaseUrl, anonKey, {
  db: { schema: 'public' },
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
  global: { headers: { 'Cache-Control': 'no-cache' } }
})
```

### **5. CRIAR FUNÇÕES RPC PERSONALIZADAS**
```sql
-- Função para inserir experimento
CREATE OR REPLACE FUNCTION insert_experiment_bypass(
  p_name text,
  p_project_id uuid,
  p_type text DEFAULT 'redirect',
  p_traffic_allocation numeric DEFAULT 99.99
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  INSERT INTO experiments (name, project_id, type, traffic_allocation)
  VALUES (p_name, p_project_id, p_type::experiment_type, p_traffic_allocation)
  RETURNING id INTO new_id;
  
  SELECT jsonb_build_object(
    'id', new_id,
    'name', p_name,
    'traffic_allocation', p_traffic_allocation
  ) INTO result;
  
  RETURN result;
END;
$$;
```

### **6. USAR API REST DIRETA**
```javascript
// Usar fetch direto para contornar cache
const insertExperiment = async (data) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/experiments`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  })
  
  return response.json()
}
```

### **7. REINICIAR PROJETO NO DASHBOARD**
1. Acesse: https://supabase.com/dashboard/project/ypoxxzkuetblrtphoaxr
2. Vá em: Settings > General
3. Clique em: "Restart Project"
4. Aguarde: 2-3 minutos

### **8. USAR PROJETO TEMPORÁRIO PARA TESTES**
```javascript
// Criar projeto temporário para testes
const tempProject = {
  name: 'RotaFinal-Temp',
  description: 'Projeto temporário para testes'
}
```

## 🎯 RECOMENDAÇÕES POR PRIORIDADE

### **🥇 PRIORIDADE 1: SQL Direto**
- Mais rápido de implementar
- Contorna completamente o cache
- Funciona imediatamente

### **🥈 PRIORIDADE 2: Funções RPC**
- Solução robusta
- Reutilizável
- Mantém segurança

### **🥉 PRIORIDADE 3: API REST Direta**
- Contorna cache do cliente
- Controle total
- Requer mais código

## 🚀 IMPLEMENTAÇÃO RÁPIDA

### **Opção A: SQL Direto (5 minutos)**
```javascript
// Script para testar SQL direto
const testSQLDirect = async () => {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_direct`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'INSERT INTO experiments (name, project_id, type, traffic_allocation) VALUES ($1, $2, $3, $4) RETURNING id, name, traffic_allocation',
      params: ['Teste_SQL_Direto', 'b302fac6-3255-4923-833b-5e71a11d5bfe', 'redirect', 99.99]
    })
  })
  
  const result = await response.json()
  console.log('Resultado SQL direto:', result)
}
```

### **Opção B: Função RPC (10 minutos)**
```sql
-- Criar função no SQL Editor
CREATE OR REPLACE FUNCTION test_insert_experiment(
  p_name text,
  p_project_id uuid,
  p_traffic_allocation numeric DEFAULT 99.99
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  INSERT INTO experiments (name, project_id, type, traffic_allocation)
  VALUES (p_name, p_project_id, 'redirect'::experiment_type, p_traffic_allocation)
  RETURNING id INTO new_id;
  
  SELECT jsonb_build_object(
    'id', new_id,
    'name', p_name,
    'traffic_allocation', p_traffic_allocation,
    'status', 'success'
  ) INTO result;
  
  RETURN result;
END;
$$;
```

## 🎯 QUAL OPÇÃO ESCOLHER?

### **Para Teste Rápido:**
- Use **SQL Direto** - funciona imediatamente

### **Para Produção:**
- Use **Funções RPC** - mais seguro e reutilizável

### **Para Desenvolvimento:**
- Use **API REST Direta** - máximo controle

## 💡 PRÓXIMOS PASSOS

1. **Escolha uma opção** baseada na sua necessidade
2. **Implemente a solução** escolhida
3. **Teste o funcionamento** com o novo projeto
4. **Migre gradualmente** para a solução definitiva

**Todas as opções contornam o problema de cache e permitem usar o novo projeto imediatamente!**
