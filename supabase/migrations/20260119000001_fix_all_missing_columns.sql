-- ==================================================================================
-- FINAL SCHEMA FIX FOR EVENTS AND PROJECT SETTINGS
-- ==================================================================================
-- Esta migration garante que as colunas críticas existem em todas as tabelas
-- e corrige problemas de RLS/permissões
-- ==================================================================================

-- 1. CORRIGIR TABELA EVENTS
DO $$
BEGIN
    -- Garantir que a coluna project_id existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'project_id') THEN
        ALTER TABLE public.events ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Coluna project_id adicionada em public.events';
    END IF;

    -- Garantir que as colunas de UTM e metadata existem (migration anterior pode ter falhado)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'utm_source') THEN
        ALTER TABLE public.events ADD COLUMN utm_source TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'utm_medium') THEN
        ALTER TABLE public.events ADD COLUMN utm_medium TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'utm_campaign') THEN
        ALTER TABLE public.events ADD COLUMN utm_campaign TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'device_type') THEN
        ALTER TABLE public.events ADD COLUMN device_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'browser') THEN
        ALTER TABLE public.events ADD COLUMN browser TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'country') THEN
        ALTER TABLE public.events ADD COLUMN country TEXT;
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_events_project_id ON public.events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_utm_source ON public.events(utm_source);
CREATE INDEX IF NOT EXISTS idx_events_utm_medium ON public.events(utm_medium);
CREATE INDEX IF NOT EXISTS idx_events_utm_campaign ON public.events(utm_campaign);

-- 2. CORRIGIR TABELA PROJECT_SETTINGS
CREATE TABLE IF NOT EXISTS public.project_settings (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    allowed_domains_custom TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir RLS em project_settings
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para project_settings (mais seguras)
DROP POLICY IF EXISTS "service_role_all" ON public.project_settings;
CREATE POLICY "service_role_all" ON public.project_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_read_own_project_settings" ON public.project_settings;
CREATE POLICY "users_read_own_project_settings" ON public.project_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE p.id = project_settings.project_id
              AND om.user_id = auth.uid()
        )
    );

-- 3. CRIAR PROJETO DEFAULT PARA EVITAR ERROS DE IDS INEXISTENTES
-- Este ID é o que está sendo usado como fallback no frontend
INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Org', 'default-org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, org_id, name, status)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Projeto de Demonstração', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_settings (project_id, allowed_domains_custom)
VALUES ('00000000-0000-0000-0000-000000000002', ARRAY['localhost', 'rotafinal.com']::TEXT[])
ON CONFLICT (project_id) DO NOTHING;

-- 4. PERMISSÕES FALTANTES
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.project_settings TO service_role;
GRANT SELECT ON public.events TO authenticated, anon;
GRANT SELECT ON public.project_settings TO authenticated;

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ SCHEMA FIX COMPLETED!';
    RAISE NOTICE 'Added project_id column and default demonstration project.';
END $$;
