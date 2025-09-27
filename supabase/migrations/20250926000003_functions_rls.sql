-- 20250926000003_functions_rls.sql
-- Funções auxiliares, triggers de integridade e políticas complementares

set check_function_bodies = off;

create or replace function public.enforce_same_org()
returns trigger
language plpgsql
as $$
declare
    parent_org uuid;
begin
    if tg_table_name = 'tasks' then
        select org_id into parent_org from public.projects where id = new.project_id;
        if parent_org is null then
            raise exception 'Projecto inexistente %', new.project_id;
        end if;
        if parent_org <> new.org_id then
            raise exception 'org_id inconsistente em tasks';
        end if;
    elsif tg_table_name = 'task_comments' then
        select org_id into parent_org from public.tasks where id = new.task_id;
        if parent_org is null then
            raise exception 'Tarefa inexistente %', new.task_id;
        end if;
        if parent_org <> new.org_id then
            raise exception 'org_id inconsistente em task_comments';
        end if;
    elsif tg_table_name = 'attachments' then
        -- Opcional: validar contra entidade conforme tipo
        null;
    end if;
    return new;
end;
$$;

create trigger enforce_tasks_org
before insert or update on public.tasks
for each row
execute procedure public.enforce_same_org();

create trigger enforce_task_comments_org
before insert or update on public.task_comments
for each row
execute procedure public.enforce_same_org();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    default_org uuid;
begin
    insert into public.users (id, email, full_name, avatar_url, metadata)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url', coalesce(new.raw_user_meta_data, '{}'::jsonb))
    on conflict (id) do update set
        email = excluded.email,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        metadata = excluded.metadata,
        updated_at = now();

    if new.raw_user_meta_data ? 'default_org_id' then
        default_org := (new.raw_user_meta_data ->> 'default_org_id')::uuid;
    end if;

    update public.users set default_org_id = default_org where id = new.id;

    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.add_user_to_org(target_org uuid, target_user uuid, target_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    requester uuid := auth.uid();
begin
    if auth.role() <> 'service_role' then
        if requester is null then
            raise exception 'Usuário não autenticado';
        end if;
        if not exists (
            select 1 from public.organization_members m
            where m.org_id = target_org
              and m.user_id = requester
              and m.role in ('owner', 'admin')
        ) then
            raise exception 'Usuário sem permissão para adicionar membros';
        end if;
    end if;

    insert into public.organization_members (org_id, user_id, role, invited_by)
    values (target_org, target_user, target_role, requester)
    on conflict (org_id, user_id) do update set role = excluded.role;

    update public.users set default_org_id = target_org where id = target_user and default_org_id is null;
end;
$$;

grant execute on function public.add_user_to_org(uuid, uuid, text) to authenticated;

create or replace function public.create_organization(name text, slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    new_org uuid;
    requester uuid := auth.uid();
begin
    if requester is null and auth.role() <> 'service_role' then
        raise exception 'Usuário não autenticado';
    end if;

    insert into public.organizations (name, slug, created_by)
    values (name, slug, requester)
    returning id into new_org;

    perform public.add_user_to_org(new_org, coalesce(requester, new_org), 'owner');

    return new_org;
end;
$$;

grant execute on function public.create_organization(text, text) to authenticated;

create or replace function public.switch_organization(new_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'Usuário não autenticado';
    end if;
    if not exists (
        select 1 from public.organization_members m
        where m.org_id = new_org_id
          and m.user_id = auth.uid()
    ) then
        raise exception 'Usuário não pertence à organização';
    end if;
    update public.users set default_org_id = new_org_id where id = auth.uid();
end;
$$;

grant execute on function public.switch_organization(uuid) to authenticated;

create or replace function public.log_audit()
returns trigger
language plpgsql
as $$
declare
    actor uuid := auth.uid();
    record_payload jsonb;
    target_org uuid;
begin
    if tg_op = 'INSERT' then
        record_payload := to_jsonb(new);
        target_org := coalesce(new.org_id, (new).org_id);
    elsif tg_op = 'UPDATE' then
        record_payload := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
        target_org := coalesce(new.org_id, old.org_id);
    elsif tg_op = 'DELETE' then
        record_payload := to_jsonb(old);
        target_org := old.org_id;
    end if;

    insert into public.audit_logs (org_id, user_id, action, resource_type, resource_id, payload)
    values (
        target_org,
        actor,
        tg_op,
        tg_table_name,
        coalesce(new.id, old.id),
        record_payload
    );

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create trigger audit_projects
after insert or update or delete on public.projects
for each row execute procedure public.log_audit();

create trigger audit_tasks
after insert or update or delete on public.tasks
for each row execute procedure public.log_audit();

create trigger audit_task_comments
after insert or update or delete on public.task_comments
for each row execute procedure public.log_audit();

create trigger audit_attachments
after insert or update or delete on public.attachments
for each row execute procedure public.log_audit();

create or replace function public.current_org_id()
returns uuid
language plpgsql
stable
as $$
declare
    claim jsonb;
    resolved uuid;
begin
    claim := auth.jwt();
    if claim ? 'org_id' then
        resolved := (claim ->> 'org_id')::uuid;
    end if;
    if resolved is null and auth.uid() is not null then
        select default_org_id into resolved from public.users where id = auth.uid();
    end if;
    return resolved;
end;
$$;


