# 🗄️ Migrações do Supabase - Rota Final

## 📋 Visão Geral

Este diretório contém todas as migrações necessárias para configurar completamente o banco de dados do **Rota Final**, uma plataforma avançada de testes A/B com algoritmos Multi-Armed Bandit.

## 🚀 Como Aplicar as Migrações

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto "Rota Final"
3. Vá para **SQL Editor** na sidebar
4. Execute as migrações na ordem correta:

```sql
-- 1. Execute o conteúdo de: 20240101000001_initial_setup.sql
-- 2. Execute o conteúdo de: 20240101000002_experiments_variants.sql
-- 3. Execute o conteúdo de: 20240101000003_tracking_events.sql
-- 4. Execute o conteúdo de: 20240101000004_mab_functions.sql
-- 5. Execute o conteúdo de: 20240101000005_performance_indexes.sql
```

### Opção 2: Via Supabase CLI

```bash
# Certifique-se de estar na raiz do projeto
cd /caminho/para/rotafinal

# Login no Supabase (se necessário)
supabase login

# Aplique as migrações
supabase db push
```

## 📁 Arquivos de Migração

### 1. `20240101000001_initial_setup.sql`
**Sistema Base e Organizações**
- ✅ Extensões UUID e crypto
- ✅ Tabela `organizations` (multi-tenant)
- ✅ Tabela `organization_members` (papéis de usuário)
- ✅ Tabela `projects` (chaves API)
- ✅ Função de geração automática de chaves API
- ✅ Políticas RLS básicas
- ✅ Triggers de `updated_at`

### 2. `20240101000002_experiments_variants.sql`
**Experimentos A/B e Variantes**
- ✅ Tabela `experiments` (configurações de teste)
- ✅ Tabela `variants` (variações do teste)
- ✅ Tabela `goals` (objetivos de conversão)
- ✅ ENUMs para status e algoritmos
- ✅ Validações de variante de controle
- ✅ Geração automática de chaves
- ✅ Políticas RLS para experimentos

### 3. `20240101000003_tracking_events.sql`
**Sistema de Tracking e Eventos**
- ✅ Tabela `assignments` (visitante → variante)
- ✅ Tabela `events` (particionada por data)
- ✅ Tabela `metrics_snapshots` (cache de métricas)
- ✅ Tabela `visitor_sessions` (sessões de usuário)
- ✅ Particionamento automático mensal
- ✅ Funções de agregação e análise
- ✅ Cálculo de significância estatística
- ✅ Políticas RLS para API

### 4. `20240101000004_mab_functions.sql`
**Algoritmos Multi-Armed Bandit**
- ✅ Thompson Sampling
- ✅ Upper Confidence Bound (UCB1)
- ✅ Epsilon-Greedy
- ✅ Distribuição uniforme
- ✅ Função de atribuição inteligente
- ✅ API de tracking de eventos
- ✅ Autenticação via chave API
- ✅ Jobs de manutenção automática

### 5. `20240101000005_performance_indexes.sql`
**Otimizações e Performance**
- ✅ Índices compostos para queries frequentes
- ✅ Views materializadas para estatísticas
- ✅ Funções de análise avançada
- ✅ Configurações de performance
- ✅ Triggers de atualização automática
- ✅ Procedures de limpeza
- ✅ Relatórios de performance

## 🏗️ Estrutura Final do Banco

### Tabelas Principais
```
📊 SISTEMA MULTI-TENANT
├── organizations          # Organizações
├── organization_members   # Membros e papéis
└── projects              # Projetos com chaves API

🧪 EXPERIMENTOS A/B
├── experiments           # Configurações de teste
├── variants             # Variações do teste
└── goals               # Objetivos de conversão

📈 TRACKING E EVENTOS
├── assignments          # Visitante → Variante
├── events              # Eventos (particionado)
├── metrics_snapshots   # Cache de métricas
└── visitor_sessions    # Sessões de usuário
```

### Algoritmos Multi-Armed Bandit
- **Thompson Sampling** (recomendado)
- **Upper Confidence Bound (UCB1)**
- **Epsilon-Greedy**
- **Distribuição Uniforme**

### Views Materializadas
- `experiment_stats` - Estatísticas por experimento
- `variant_stats` - Estatísticas por variante

## 🔐 Segurança e Permissões

### Row Level Security (RLS)
Todas as tabelas têm RLS ativado com políticas específicas:

- **Organizations**: Acesso baseado em membership
- **Projects**: Herdam permissões da organização
- **Experiments**: Acesso via projeto/organização
- **Events/Assignments**: Acesso via chave API ou membership

### Papéis de Usuário
- **Owner**: Controle total da organização
- **Admin**: Gerenciamento de projetos e membros
- **Editor**: Criação e edição de experimentos
- **Viewer**: Apenas visualização

## 🚀 Funcionalidades Implementadas

### 1. Sistema Multi-Tenant
- ✅ Organizações isoladas
- ✅ Membros com papéis
- ✅ Projetos com chaves API únicas

### 2. Experimentos A/B Avançados
- ✅ Múltiplas variantes por experimento
- ✅ Algoritmos de distribuição inteligente
- ✅ Metas de conversão customizáveis
- ✅ Análise de significância estatística

### 3. Multi-Armed Bandit
- ✅ Thompson Sampling para otimização automática
- ✅ UCB1 para exploração balanceada
- ✅ Epsilon-Greedy para controle manual
- ✅ Adaptação em tempo real

### 4. Tracking Avançado
- ✅ Eventos customizáveis com propriedades JSON
- ✅ Particionamento por data para performance
- ✅ Cache de métricas para queries rápidas
- ✅ Análise de funil e retenção

### 5. API Integrada
- ✅ Autenticação via chave pública/secreta
- ✅ Tracking de eventos via função SQL
- ✅ Atribuição automática de variantes
- ✅ Controle de CORS por projeto

### 6. Analytics e Relatórios
- ✅ Estatísticas em tempo real
- ✅ Análise de significância estatística
- ✅ Relatórios de performance por período
- ✅ Segmentação por UTM e geografia

## ⚙️ Configurações Recomendadas

### Configurações do Banco
```sql
-- Aplicadas automaticamente na migração 5
ALTER SYSTEM SET enable_partition_pruning = on;
ALTER SYSTEM SET enable_partitionwise_join = on;
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
```

### Manutenção Automática
```sql
-- Execute periodicamente (pode ser automatizado)
SELECT scheduled_maintenance();  -- Cria partições futuras e limpa cache
SELECT cleanup_old_data(90);     -- Remove dados antigos (opcional)
SELECT refresh_experiment_stats(); -- Atualiza views materializadas
```

## 🔧 Troubleshooting

### Erro: "function uuid_generate_v4() does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro: RLS impedindo acesso
Verifique se o usuário está autenticado e tem as permissões corretas:
```sql
SELECT auth.uid(); -- Deve retornar o ID do usuário
SELECT * FROM organization_members WHERE user_id = auth.uid();
```

### Performance lenta em consultas
Execute as views materializadas:
```sql
SELECT refresh_experiment_stats();
```

### Partições não criadas automaticamente
Execute manualmente:
```sql
SELECT create_future_partitions();
```

## 📚 Próximos Passos

1. **Aplicar todas as migrações** na ordem correta
2. **Configurar variáveis de ambiente** no Next.js
3. **Testar autenticação** e criação de organizações
4. **Criar primeiro experimento** via dashboard
5. **Integrar SDK** no frontend
6. **Configurar monitoramento** de performance

## 🎯 Recursos Avançados

### Análise Estatística
```sql
-- Verificar significância de todos os experimentos
SELECT * FROM analyze_all_experiments();

-- Relatório de performance mensal
SELECT * FROM experiment_performance_report(
    'uuid-do-projeto',
    '2024-01-01'::timestamp,
    '2024-01-31'::timestamp
);
```

### API Tracking
```sql
-- Registrar evento via SQL
SELECT track_event(
    'rf_pk_sua_chave_publica',
    'visitor_123',
    'conversion',
    'purchase',
    '{"product_id": "abc123", "value": 99.99}'::jsonb,
    99.99,
    'experimento_checkout'
);
```

---

## ✅ Status: PRONTO PARA PRODUÇÃO!

🚀 **O banco de dados do Rota Final está completamente configurado e otimizado para produção.**

Todas as funcionalidades enterprise foram implementadas:
- Multi-tenancy seguro
- Algoritmos MAB avançados  
- Tracking de eventos escalável
- Análise estatística robusta
- Performance otimizada

**Happy A/B Testing!** 🎉
