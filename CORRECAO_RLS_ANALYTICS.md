# Correção das Políticas RLS para Acesso aos Dados de Analytics

## Problema Identificado

Os erros de console `Erro ao buscar conversões: {}`, `Erro ao buscar projetos: {}`, etc., eram causados por políticas de Row Level Security (RLS) bloqueando o acesso às tabelas quando:

1. O usuário não estava autenticado
2. O usuário autenticado não tinha permissões adequadas (não era membro da organização)
3. As políticas RLS não permitiam acesso aos dados necessários para analytics

Quando o RLS bloqueia uma query, o Supabase retorna um objeto de erro vazio `{}` em vez de uma mensagem de erro significativa.

## Correções Aplicadas

### Migration: `fix_rls_analytics_access`

Foram criadas/atualizadas políticas RLS para as seguintes tabelas:

#### 1. **projects**
- **Política**: `projects_select_org_members`
- **Permissão**: Membros da organização podem visualizar projetos da sua organização
- **Acesso**: `service_role` OU membros da organização através de `organization_members`

#### 2. **experiments**
- **Políticas**:
  - `experiments_select_org_members` - SELECT
  - `experiments_insert_org_members` - INSERT
  - `experiments_update_org_members` - UPDATE
  - `experiments_delete_admins` - DELETE
- **Permissão**: 
  - Membros da organização podem visualizar/criar/atualizar experimentos dos projetos da organização
  - Apenas owners/admins podem deletar
  - Também permite acesso por `user_id` se o experimento pertencer diretamente ao usuário

#### 3. **events**
- **Política**: `events_select_analytics`
- **Permissão**: 
  - `service_role` sempre tem acesso
  - Usuários autenticados que são membros da organização podem ver eventos dos projetos da organização
  - Eventos sem `project_id` podem ser acessados (tracking público)

#### 4. **conversions**
- **Políticas**:
  - `conversions_select_org_members` - SELECT
  - `conversions_insert_org_members` - INSERT
- **Permissão**: Membros da organização podem visualizar/inserir conversões dos experimentos da organização

#### 5. **assignments**
- **Políticas**:
  - `assignments_select_org_members` - SELECT
  - `assignments_insert_tracking` - INSERT
- **Permissão**: 
  - Membros da organização podem visualizar assignments dos experimentos da organização
  - Permite inserção para tracking (incluindo anônimo se o experimento existir)

#### 6. **variants**
- **Políticas**:
  - `variants_select_org_members` - SELECT
  - `variants_insert_org_members` - INSERT
  - `variants_update_org_members` - UPDATE
  - `variants_delete_admins` - DELETE
- **Permissão**: Membros da organização podem gerenciar variantes dos experimentos da organização

#### 7. **visitor_sessions**
- **Política**: `visitor_sessions_select_org_members`
- **Permissão**: Usuários autenticados podem visualizar sessões de visitantes para analytics

### Migration: `cleanup_duplicate_rls_policies`

Removeu políticas duplicadas e conflitantes que poderiam causar problemas de acesso.

## Como Funciona Agora

### Para Usuários Autenticados

1. **Membros da Organização**: Podem acessar todos os dados (projects, experiments, events, conversions, etc.) relacionados aos projetos da sua organização
2. **Verificação de Membership**: As políticas verificam se o usuário está em `organization_members` com a organização do projeto
3. **Acesso por user_id**: Também permite acesso direto se o registro tiver `user_id` correspondente ao usuário autenticado

### Para Usuários Não Autenticados

- **Events sem project_id**: Podem ser acessados (tracking público)
- **Assignments**: Podem ser inseridos se o experimento existir (para tracking)
- **Outros dados**: Requerem autenticação e membership na organização

## Resultado Esperado

Agora, em vez de ver:
```
❌ Erro ao buscar conversões: {}
❌ Erro ao buscar projetos: {}
```

Você verá:
```
⚠️ Erro ao buscar conversões: Acesso bloqueado por RLS (usuário pode não estar autenticado)
⚠️ Erro ao buscar projetos: Acesso bloqueado por RLS (usuário pode não estar autenticado)
```

**OU** (se o usuário estiver autenticado e for membro da organização):
- As queries funcionarão normalmente
- Os dados serão retornados corretamente
- Não haverá erros de RLS

## Próximos Passos Recomendados

1. **Garantir Autenticação**: Certifique-se de que os usuários estão autenticados antes de fazer queries de analytics
2. **Verificar Membership**: Garanta que os usuários são membros da organização através da tabela `organization_members`
3. **Testar**: Teste as queries de analytics com usuários autenticados e não autenticados para verificar o comportamento
4. **Considerar API Server-Side**: Para maior segurança, considere usar APIs server-side com `service_role` key para dados sensíveis de analytics

## Segurança

As políticas RLS garantem que:
- ✅ Apenas membros da organização podem acessar dados da organização
- ✅ Service role sempre tem acesso completo (para operações administrativas)
- ✅ Usuários podem acessar seus próprios dados através de `user_id`
- ✅ Tracking público (events sem project_id) continua funcionando
- ✅ Operações destrutivas (DELETE) são restritas a owners/admins

## Arquivos Modificados

- `supabase/migrations/fix_rls_analytics_access.sql` (criado)
- `supabase/migrations/cleanup_duplicate_rls_policies.sql` (criado)

## Notas Técnicas

- Todas as políticas verificam `auth.role() = 'service_role'` primeiro para permitir operações administrativas
- As políticas usam JOINs com `organization_members` para verificar membership
- As políticas são permissivas (usando `OR`) para permitir múltiplos caminhos de acesso
- Comentários foram adicionados a todas as políticas para documentação
