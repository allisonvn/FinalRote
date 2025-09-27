-- 20250926000002_domain.sql
-- Tabelas de domínio: projetos, tarefas, comentários, anexos, logs

set check_function_bodies = off;

create table public.project_statuses (
    value text primary key,
    sort_order smallint not null
);

insert into public.project_statuses (value, sort_order) values
    ('draft', 10),
    ('active', 20),
    ('paused', 30),
    ('completed', 40),
    ('archived', 50)
on conflict (value) do update set sort_order = excluded.sort_order;

create table public.task_statuses (
    value text primary key,
    sort_order smallint not null
);

insert into public.task_statuses (value, sort_order) values
    ('backlog', 10),
    ('in_progress', 20),
    ('blocked', 30),
    ('completed', 40),
    ('archived', 50)
on conflict (value) do update set sort_order = excluded.sort_order;

create table public.task_priorities (
    value text primary key,
    sort_order smallint not null
);

insert into public.task_priorities (value, sort_order) values
    ('low', 10),
    ('medium', 20),
    ('high', 30),
    ('urgent', 40)
on conflict (value) do update set sort_order = excluded.sort_order;

create table public.projects (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations (id) on delete cascade,
    name text not null,
    description text,
    status text not null default 'draft' references public.project_statuses (value),
    start_date date,
    end_date date,
    created_by uuid references public.users (id) on delete set null,
    updated_by uuid references public.users (id) on delete set null,
    archived_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.projects
    add constraint projects_end_after_start check (end_date is null or start_date is null or end_date >= start_date);

create index projects_org_idx on public.projects (org_id);
create index projects_org_status_idx on public.projects (org_id, status);

create table public.tasks (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations (id) on delete cascade,
    project_id uuid not null references public.projects (id) on delete cascade,
    title text not null,
    description text,
    status text not null default 'backlog' references public.task_statuses (value),
    priority text not null default 'medium' references public.task_priorities (value),
    assignee_id uuid references public.users (id) on delete set null,
    created_by uuid references public.users (id) on delete set null,
    updated_by uuid references public.users (id) on delete set null,
    due_date date,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index tasks_org_idx on public.tasks (org_id);
create index tasks_org_project_idx on public.tasks (org_id, project_id);
create index tasks_org_assignee_idx on public.tasks (org_id, assignee_id);

create table public.task_comments (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations (id) on delete cascade,
    task_id uuid not null references public.tasks (id) on delete cascade,
    author_id uuid not null references public.users (id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    deleted_at timestamptz
);

create index task_comments_org_task_idx on public.task_comments (org_id, task_id);

create table public.attachments (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations (id) on delete cascade,
    entity_type text not null,
    entity_id uuid not null,
    bucket text not null,
    path text not null,
    file_name text,
    mime_type text,
    size_bytes bigint,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references public.users (id) on delete set null,
    created_at timestamptz not null default now()
);

create index attachments_org_entity_idx on public.attachments (org_id, entity_type, entity_id);

create table public.audit_logs (
    id bigint primary key generated always as identity,
    org_id uuid references public.organizations (id) on delete cascade,
    user_id uuid references public.users (id) on delete set null,
    action text not null,
    resource_type text not null,
    resource_id uuid,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index audit_logs_org_created_idx on public.audit_logs (org_id, created_at desc);
create index audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);
create index audit_logs_payload_gin on public.audit_logs using gin (payload);

create trigger set_projects_updated_at
before update on public.projects
for each row
execute procedure public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute procedure public.set_updated_at();

create or replace function public.set_task_comment_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger set_task_comments_updated_at
before update on public.task_comments
for each row
execute procedure public.set_task_comment_updated_at();

alter table public.project_statuses enable row level security;
alter table public.task_statuses enable row level security;
alter table public.task_priorities enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_logs enable row level security;

create policy "lookups legíveis" on public.project_statuses
for select using (true);

create policy "task status legíveis" on public.task_statuses
for select using (true);

create policy "task priorities legíveis" on public.task_priorities
for select using (true);

create policy "projects select membros" on public.projects
for select using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = projects.org_id
          and m.user_id = auth.uid()
    )
);

create policy "projects insert membros" on public.projects
for insert with check (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = projects.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin', 'member')
    )
);

create policy "projects update admins" on public.projects
for update using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = projects.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin', 'member')
    )
)
with check (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = projects.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin', 'member')
    )
);

create policy "projects delete owners" on public.projects
for delete using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = projects.org_id
          and m.user_id = auth.uid()
          and m.role = 'owner'
    )
);

create policy "tasks select membros" on public.tasks
for select using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = tasks.org_id
          and m.user_id = auth.uid()
    )
);

create policy "tasks insert membros" on public.tasks
for insert with check (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = tasks.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin', 'member')
    )
);

create policy "tasks update membros" on public.tasks
for update using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = tasks.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin', 'member')
    )
)
with check (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = tasks.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin', 'member')
    )
);

create policy "tasks delete owners" on public.tasks
for delete using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = tasks.org_id
          and m.user_id = auth.uid()
          and m.role = 'owner'
    )
);

create policy "comments select membros" on public.task_comments
for select using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = task_comments.org_id
          and m.user_id = auth.uid()
    )
);

create policy "comments insert membros" on public.task_comments
for insert with check (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = task_comments.org_id
          and m.user_id = auth.uid()
    )
);

create policy "comments update autor ou admin" on public.task_comments
for update using (
    auth.role() = 'service_role'
    or task_comments.author_id = auth.uid()
    or exists (
        select 1 from public.organization_members m
        where m.org_id = task_comments.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin')
    )
)
with check (
    auth.role() = 'service_role'
    or task_comments.author_id = auth.uid()
    or exists (
        select 1 from public.organization_members m
        where m.org_id = task_comments.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin')
    )
);

create policy "comments delete autor" on public.task_comments
for delete using (
    auth.role() = 'service_role'
    or task_comments.author_id = auth.uid()
    or exists (
        select 1 from public.organization_members m
        where m.org_id = task_comments.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin')
    )
);

create policy "attachments select membros" on public.attachments
for select using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = attachments.org_id
          and m.user_id = auth.uid()
    )
);

create policy "attachments insert membros" on public.attachments
for insert with check (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = attachments.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin', 'member')
    )
);

create policy "attachments delete admins" on public.attachments
for delete using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = attachments.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin')
    )
);

create policy "audit logs select admins" on public.audit_logs
for select using (
    auth.role() = 'service_role'
    or exists (
        select 1 from public.organization_members m
        where m.org_id = audit_logs.org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'admin')
    )
);

create policy "audit logs insert service" on public.audit_logs
for insert with check (auth.role() = 'service_role');


