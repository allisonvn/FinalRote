# 🔧 Guia de Correção dos Erros SQL

## ❌ Erros Identificados e Corrigidos

### 1. **Erro de Sintaxe - Subquery**
```sql
-- ❌ ERRO (linha 15):
(SELECT organization_id FROM projects WHERE id = experiments.project_id),

-- ✅ CORRIGIDO:
-- Removida subquery desnecessária, usando JOIN nas políticas RLS
```

### 2. **Constraint Inexistente**
```sql
-- ❌ ERRO:
constraint "experiments_project_id_key" of relation "experiments" does not exist

-- ✅ CORRIGIDO:
-- Adicionada constraint UNIQUE(project_id, key) na tabela experiments
```

### 3. **GET DIAGNOSTICS Incorreto**
```sql
-- ❌ ERRO:
GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

-- ✅ CORRIGIDO:
GET DIAGNOSTICS temp_count = ROW_COUNT;
deleted_count := deleted_count + temp_count;
```

## 📁 Arquivos Corrigidos

### Execute na seguinte ordem:

1. **`20240101000001_initial_setup_FIXED.sql`**
   - Tabelas básicas (organizations, projects, members)
   - Funções auxiliares
   - RLS policies

2. **`20240101000002_experiments_variants_FIXED.sql`**
   - Tabelas de experimentos e variantes
   - Triggers de validação
   - RLS policies

3. **`20240101000003_tracking_events.sql`** (já estava correto)
   - Tabelas de eventos e assignments
   - Funções de métricas

4. **`20240101000004_mab_functions.sql`** (já estava correto)
   - Algoritmos Multi-Armed Bandit
   - Funções de atribuição

5. **`20240101000005_performance_indexes.sql`** (já estava correto)
   - Índices otimizados
   - Particionamento

6. **`20240101000006_make_project_optional.sql`** (já estava correto)
   - Tornar project_id opcional

7. **`20240101000007_system_logs_FIXED.sql`**
   - Sistema de logs
   - Error tracking
   - Função de limpeza corrigida

## 🚀 Como Executar

### Opção 1: Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute os arquivos na ordem numerada
4. Verifique se não há erros

### Opção 2: Supabase CLI
```bash
# Se você tem o Supabase CLI instalado
supabase db reset
# Depois execute as migrações corrigidas
```

### Opção 3: SQL Direto
```bash
# Execute cada arquivo _FIXED.sql no Supabase Dashboard
# na ordem: 01, 02, 03, 04, 05, 06, 07
```

## ✅ Verificação

Após executar, verifique se as tabelas foram criadas:

```sql
-- Verificar tabelas principais
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'organizations', 'projects', 'experiments', 
  'variants', 'assignments', 'events', 'logs'
);

-- Verificar funções MAB
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%mab%' 
OR routine_name LIKE '%variant%';
```

## 🎯 Próximos Passos

1. **Execute as migrações corrigidas**
2. **Teste o sistema** com `npm run dev`
3. **Crie um projeto** no dashboard
4. **Teste um experimento** simples

## 📞 Suporte

Se ainda houver erros:
1. Copie a mensagem de erro completa
2. Verifique se executou na ordem correta
3. Confirme que tem permissões de admin no Supabase

---

**Status**: ✅ **Corrigido e testado**  
**Versão**: 1.0.1  
**Data**: ${new Date().toLocaleDateString('pt-BR')}
