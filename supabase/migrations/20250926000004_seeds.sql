-- 20250926000004_seeds.sql
-- Seeds iniciais e utilidades de teste

insert into public.project_statuses (value, sort_order) values
    ('planning', 15)
on conflict (value) do update set sort_order = excluded.sort_order;

insert into public.task_statuses (value, sort_order) values
    ('review', 25)
on conflict (value) do update set sort_order = excluded.sort_order;

insert into public.task_priorities (value, sort_order) values
    ('none', 5)
on conflict (value) do update set sort_order = excluded.sort_order;

-- Organização demo opcional (pode ser removida em produção)
do $$
declare
    demo_org uuid;
begin
    if auth.role() = 'service_role' then
        insert into public.organizations (name, slug, plan, created_by)
        values ('Organização Demo', 'org-demo', 'trial', null)
        returning id into demo_org;

        -- Para testes, será necessário adicionar usuários via função add_user_to_org depois de criar auth.users
    end if;
end;
$$;


