-- 20250926000005_fix_rls_recursion.sql
-- Corrigir recursão infinita nas políticas RLS

-- Remover políticas problemáticas
drop policy if exists "usuarios podem ver próprios perfis" on public.users;
drop policy if exists "membros leem propria membership" on public.organization_members;
drop policy if exists "membros gerenciados por owners" on public.organization_members;

-- Recriar políticas sem recursão
create policy "usuarios podem ver próprios perfis" on public.users
for select using (
    auth.role() = 'service_role'
    or auth.uid() = id
);

create policy "membros leem propria membership" on public.organization_members
for select using (
    auth.role() = 'service_role'
    or user_id = auth.uid()
);

create policy "membros gerenciados por owners" on public.organization_members
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
