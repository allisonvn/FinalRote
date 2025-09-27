-- 20250926000001_init.sql
-- Estrutura base multi-tenant, usuários e membresia

set check_function_bodies = off;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table public.roles (
    name text primary key,
    description text not null
);

insert into public.roles (name, description) values
    ('owner', 'Controle total da organização'),
    ('admin', 'Gerencia configurações e membros'),
    ('member', 'Gerencia recursos principais'),
    ('viewer', 'Acesso somente leitura')
on conflict (name) do update set description = excluded.description;

create table public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug citext not null unique,
    plan text,
    metadata jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now()
);

comment on table public.organizations is 'Organizações isolam dados multi-tenant.';

create table public.users (
    id uuid primary key,
    email citext not null unique,
    full_name text,
    avatar_url text,
    metadata jsonb not null default '{}'::jsonb,
    default_org_id uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.users is 'Perfil complementar ao auth.users.';

alter table public.users
    add constraint users_default_org_fk foreign key (default_org_id) references public.organizations (id) on delete set null;

create table public.organization_members (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations (id) on delete cascade,
    user_id uuid not null references public.users (id) on delete cascade,
    role text not null references public.roles (name),
    invited_by uuid references public.users (id),
    joined_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

alter table public.organizations
    add constraint organizations_created_by_fk foreign key (created_by) references public.users (id) on delete set null;

create unique index organization_members_org_user_idx on public.organization_members (org_id, user_id);

create index organization_members_user_idx on public.organization_members (user_id);

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
    select auth.uid();
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger set_users_updated_at
before update on public.users
for each row
execute procedure public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.organization_members enable row level security;
alter table public.roles enable row level security;

create policy "roles legíveis por autenticados" on public.roles
for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "roles gerenciadas por service role" on public.roles
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "organizações visíveis por membros" on public.organizations
for select using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = organizations.id
          and m.user_id = auth.uid()
    )
);

create policy "organizações editáveis por owners" on public.organizations
for update using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = organizations.id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin')
    )
)
with check (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = organizations.id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin')
    )
);

create policy "organizações inseridas pelo criador" on public.organizations
for insert with check (
    auth.role() = 'service_role'
    or auth.uid() = created_by
);

create policy "organizações removidas por owners" on public.organizations
for delete using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = organizations.id
          and m.user_id = auth.uid()
          and m.role = 'owner'
    )
);

create policy "usuarios podem ver próprios perfis" on public.users
for select using (
    auth.role() = 'service_role'
    or auth.uid() = id
);

create policy "usuarios podem atualizar perfil próprio" on public.users
for update using (auth.uid() = id or auth.role() = 'service_role')
with check (auth.uid() = id or auth.role() = 'service_role');

create policy "usuarios inseridos por service role" on public.users
for insert with check (auth.role() = 'service_role');

create policy "usuarios removidos por service role" on public.users
for delete using (auth.role() = 'service_role');

create policy "membros leem propria membership" on public.organization_members
for select using (
    auth.role() = 'service_role'
    or user_id = auth.uid()
);

create policy "membros gerenciados por owners" on public.organization_members
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

grant usage on schema public to anon, authenticated, service_role;

grant select on public.roles to authenticated;
grant all privileges on all tables in schema public to service_role;


