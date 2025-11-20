# Rota Final - SaaS de Teste A/B com Multi-Armed Bandit

Plataforma profissional de teste A/B que usa algoritmos de Multi-Armed Bandit para otimização automática de conversões.

## 🚀 Recursos Principais

- **Multi-Armed Bandit**: Thompson Sampling, UCB1, Epsilon-Greedy
- **Zero-Flicker**: Anti-flicker com SSR/Edge
- **Escalável**: Milhões de eventos por mês
- **Estatísticas**: Significância automática e confiança bayesiana
- **Multi-tenant**: Organizações com controle de acesso
- **Real-time**: Dashboard em tempo real

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Infraestrutura**: Cloudflare CDN
- **Pagamentos**: Stripe
- **Email**: Resend

## 🔧 Configuração do Desenvolvimento

### Pré-requisitos

- Node.js 18+
- Conta Supabase
- Variáveis de ambiente configuradas

### Instalação

1. Clone o repositório:
```bash
git clone <repo-url>
cd rotafinal
```

2. Instale dependências:
```bash
npm install
```

3. Configure variáveis de ambiente:
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

4. Execute migrações do banco:
```bash
# No Supabase Dashboard, execute as migrações em supabase/migrations/
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📊 Schema do Banco

### Tabelas Principais

- `organizations`: Organizações multi-tenant
- `organization_members`: Membros com roles
- `projects`: Projetos com chaves API
- `experiments`: Experimentos A/B
- `variants`: Variantes dos experimentos
- `assignments`: Atribuições visitante→variante
- `events`: Eventos particionados por mês
- `metrics_snapshots`: Cache de métricas

### Funções PostgreSQL

- `is_member(org_id)`: Verificação RLS
- `get_variant_weights(exp_id)`: Algoritmos MAB
- `compute_experiment_metrics(exp_id)`: Cálculos estatísticos

## 🔐 Segurança

- **RLS**: Row Level Security em todas as tabelas
- **HMAC**: Assinatura de requests administrativos
- **Rate Limiting**: Por IP e chave pública
- **Origin Allowlist**: Controle de domínios

## 📈 Algoritmos MAB

### Thompson Sampling
- Cold start: 2000 visitantes uniformes
- Atualização bayesiana contínua
- 95% confiança para convergência

### UCB1 & Epsilon-Greedy
- Alternativas configuráveis
- Mesmos trilhos de segurança

## 🚀 Deploy

### Supabase

1. Create new project
2. Run migrations
3. Configure RLS policies

## 🔧 Troubleshooting Recente (19/11/2025)

Se você está vendo erros como:
- `"Could not find the table 'public.project_settings' in the schema cache"`
- `POST /rest/v1/rpc/get_experiment_stats 400 (Bad Request)`

**Solução rápida:**
```bash
node apply-project-settings-migration.js
```

Mais detalhes em: `CORRECAO_ERROS_DASHBOARD_19_11_2025.md`

## 📝 Comandos Úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção  
npm run start        # Inicia produção
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## 📋 Roadmap

- [ ] ✅ Setup base (Next.js + Supabase)
- [ ] ✅ Schema PostgreSQL com RLS
- [ ] ✅ Sistema de autenticação
- [ ] 🔄 CRUD de projetos e experimentos
- [ ] 🔄 SDK JavaScript otimizado
- [ ] 🔄 Edge Functions (assign/ingest)
- [ ] 🔄 Dashboard com analytics
- [ ] 🔄 Integração Stripe
- [ ] 🔄 Deploy e monitoramento

## 🤝 Contribuição

1. Fork o projeto
2. Create feature branch
3. Commit changes
4. Push to branch  
5. Create Pull Request

## 📄 Licença

MIT License - veja LICENSE.md