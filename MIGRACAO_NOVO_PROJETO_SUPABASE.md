# 🚀 GUIA COMPLETO: MIGRAÇÃO PARA NOVO PROJETO SUPABASE

## 🎯 OBJETIVO
Migrar para um novo projeto Supabase para contornar o problema de cache corrompido.

## 📋 ETAPAS DA MIGRAÇÃO

### 1. **CRIAR NOVO PROJETO SUPABASE**

#### 1.1 Acessar Dashboard
1. Vá para: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Escolha sua organização
4. Preencha os dados:
   - **Name**: `rotafinal-new` (ou nome de sua escolha)
   - **Database Password**: Gere uma senha forte
   - **Region**: Escolha a região mais próxima
   - **Pricing Plan**: Free (ou Pro se necessário)

#### 1.2 Aguardar Criação
- ⏱️ **Tempo estimado**: 2-3 minutos
- ✅ Aguarde até aparecer "Project is ready"

### 2. **OBTER NOVAS CHAVES**

#### 2.1 Acessar Configurações
1. No novo projeto, vá em **Settings** > **API**
2. Copie as seguintes chaves:
   - **Project URL**
   - **anon public** key
   - **service_role** key

#### 2.2 Exemplo de Novas Chaves
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-novo-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-nova-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-nova-service-role-key
```

### 3. **EXECUTAR MIGRAÇÕES NO NOVO PROJETO**

#### 3.1 Conectar ao Novo Projeto
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Vincular ao novo projeto
supabase link --project-ref seu-novo-projeto-id
```

#### 3.2 Executar Migrações
```bash
# Aplicar todas as migrações
supabase db push

# Ou executar migrações manualmente no SQL Editor
```

#### 3.3 Migrações Manuais (SQL Editor)
Execute no SQL Editor do novo projeto:

```sql
-- 1. Executar migração inicial
-- (Copie o conteúdo de supabase/migrations/20240101000001_initial_setup_FIXED.sql)

-- 2. Executar migração de experimentos
-- (Copie o conteúdo de supabase/migrations/20240101000002_experiments_variants_FIXED.sql)

-- 3. Executar outras migrações conforme necessário
-- (Execute todas as migrações em ordem)
```

### 4. **ATUALIZAR CONFIGURAÇÕES LOCAIS**

#### 4.1 Atualizar .env.local
```bash
# Substituir as chaves antigas pelas novas
NEXT_PUBLIC_SUPABASE_URL=https://seu-novo-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-nova-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-nova-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 4.2 Atualizar Configurações do Supabase
```bash
# Atualizar project ID no config
echo 'project_id = "seu-novo-projeto-id"' > .supabase/config.toml
```

### 5. **REGENERAR TIPOS TYPESCRIPT**

#### 5.1 Gerar Novos Tipos
```bash
# Gerar tipos do novo projeto
npx supabase gen types typescript --project-id seu-novo-projeto-id > src/types/supabase.ts
```

#### 5.2 Verificar Tipos
```bash
# Verificar se os tipos foram atualizados
grep -n "experiments" src/types/supabase.ts
```

### 6. **TESTAR NOVO PROJETO**

#### 6.1 Criar Script de Teste
```javascript
// test-new-project.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://seu-novo-projeto.supabase.co'
const supabaseKey = 'sua-nova-service-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testNewProject() {
  console.log('🧪 Testando novo projeto...')
  
  // Teste de inserção
  const { data, error } = await supabase
    .from('experiments')
    .insert({
      name: 'Teste_Novo_Projeto',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      type: 'redirect',
      traffic_allocation: 99.99,
      status: 'draft'
    })
    .select('id, name, traffic_allocation')
  
  if (error) {
    console.error('❌ Erro:', error)
  } else {
    console.log('✅ Sucesso:', data)
  }
}

testNewProject()
```

#### 6.2 Executar Teste
```bash
node test-new-project.js
```

### 7. **MIGRAR DADOS (SE NECESSÁRIO)**

#### 7.1 Exportar Dados do Projeto Antigo
```sql
-- No projeto antigo, exportar dados importantes
COPY (SELECT * FROM experiments) TO '/tmp/experiments.csv' WITH CSV HEADER;
COPY (SELECT * FROM projects) TO '/tmp/projects.csv' WITH CSV HEADER;
COPY (SELECT * FROM variants) TO '/tmp/variants.csv' WITH CSV HEADER;
```

#### 7.2 Importar Dados no Novo Projeto
```sql
-- No novo projeto, importar dados
COPY experiments FROM '/tmp/experiments.csv' WITH CSV HEADER;
COPY projects FROM '/tmp/projects.csv' WITH CSV HEADER;
COPY variants FROM '/tmp/variants.csv' WITH CSV HEADER;
```

### 8. **ATUALIZAR DEPLOYMENT**

#### 8.1 Variáveis de Ambiente
Atualize as variáveis de ambiente em:
- **Vercel**: Dashboard > Settings > Environment Variables
- **Netlify**: Dashboard > Site Settings > Environment Variables
- **Outros provedores**: Conforme necessário

#### 8.2 Deploy
```bash
# Fazer deploy com novas configurações
npm run build
npm run deploy
```

### 9. **VERIFICAÇÃO FINAL**

#### 9.1 Teste Completo
```bash
# Executar teste final
node test-final-system.js
```

#### 9.2 Verificar Funcionamento
- ✅ Inserção de experimentos
- ✅ Valores até 99.99
- ✅ Sem campos fantasma
- ✅ Funções RPC funcionando

## 🚨 TROUBLESHOOTING

### Problema: Erro de conexão
**Solução**: Verificar se as chaves estão corretas no `.env.local`

### Problema: Migrações falhando
**Solução**: Executar migrações uma por vez no SQL Editor

### Problema: Tipos não atualizados
**Solução**: Regenerar tipos com `npx supabase gen types typescript`

### Problema: Dados não migrados
**Solução**: Verificar se as tabelas existem antes de importar

## 📋 CHECKLIST DE MIGRAÇÃO

- [ ] Novo projeto criado
- [ ] Novas chaves obtidas
- [ ] Migrações executadas
- [ ] .env.local atualizado
- [ ] Tipos regenerados
- [ ] Teste básico funcionando
- [ ] Dados migrados (se necessário)
- [ ] Deployment atualizado
- [ ] Teste final passando

## 🎉 RESULTADO ESPERADO

Após a migração, você terá:
- ✅ **Cache limpo** - Sem problemas de cache
- ✅ **Schema correto** - Tipos numéricos corretos
- ✅ **Funcionamento 100%** - Sistema operacional
- ✅ **Sem campos fantasma** - Schema limpo

## 💡 DICAS IMPORTANTES

1. **Backup**: Sempre faça backup dos dados importantes
2. **Teste**: Teste cada etapa antes de prosseguir
3. **Documentação**: Mantenha as novas chaves seguras
4. **Monitoramento**: Monitore o novo projeto após migração

**A migração para um novo projeto é a solução mais eficaz para contornar o problema de cache corrompido!**
