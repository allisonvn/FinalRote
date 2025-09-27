-- =====================================================
-- MIGRAÇÕES PARA NOVO PROJETO SUPABASE
-- =====================================================
-- Execute este script no SQL Editor do novo projeto
-- Execute as migrações em ordem sequencial

-- =====================================================
-- MIGRAÇÃO 1: SETUP INICIAL
-- =====================================================

-- Criar tipos personalizados
CREATE TYPE experiment_type AS ENUM ('redirect', 'element', 'split_url', 'mab');
CREATE TYPE experiment_status AS ENUM ('draft', 'running', 'paused', 'completed', 'archived');

-- Criar tabela projects
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true
);

-- Criar tabela experiments
CREATE TABLE IF NOT EXISTS public.experiments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    hypothesis text,
    type experiment_type NOT NULL DEFAULT 'redirect',
    traffic_allocation numeric(4,2) DEFAULT 99.99,
    status experiment_status DEFAULT 'draft',
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    url_targeting jsonb DEFAULT '{}',
    audience_targeting jsonb DEFAULT '{}',
    mab_config jsonb DEFAULT '{}',
    primary_goal jsonb,
    secondary_goals jsonb DEFAULT '[]',
    total_visitors integer DEFAULT 0,
    total_conversions integer DEFAULT 0,
    confidence_level numeric(5,2) DEFAULT 95.00,
    statistical_significance numeric(6,4),
    tags text[] DEFAULT '{}',
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    conversions_config jsonb DEFAULT '{}',
    conversion_goals jsonb DEFAULT '[]',
    created_by uuid REFERENCES auth.users(id),
    tracking_config jsonb DEFAULT '{}',
    user_id uuid REFERENCES auth.users(id)
);

-- =====================================================
-- MIGRAÇÃO 2: VARIANTS E STATS
-- =====================================================

-- Criar tabela variants
CREATE TABLE IF NOT EXISTS public.variants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    experiment_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_control boolean DEFAULT false,
    traffic_percentage numeric(4,2) DEFAULT 50.00,
    redirect_url text,
    changes jsonb DEFAULT '{}',
    css_changes text,
    js_changes text,
    visitors integer DEFAULT 0,
    conversions integer DEFAULT 0,
    conversion_rate numeric(8,4) DEFAULT 0.0000,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- Criar tabela variant_stats
CREATE TABLE IF NOT EXISTS public.variant_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    experiment_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    variant_id uuid NOT NULL REFERENCES public.variants(id) ON DELETE CASCADE,
    visitors integer DEFAULT 0,
    conversions integer DEFAULT 0,
    conversion_rate numeric(8,4) DEFAULT 0.0000,
    conversion_value numeric(12,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- MIGRAÇÃO 3: TRACKING E EVENTOS
-- =====================================================

-- Criar tabela events
CREATE TABLE IF NOT EXISTS public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    experiment_id uuid REFERENCES public.experiments(id) ON DELETE CASCADE,
    event_name text NOT NULL,
    event_type text NOT NULL,
    properties jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar tabela visits
CREATE TABLE IF NOT EXISTS public.visits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    experiment_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES public.variants(id) ON DELETE CASCADE,
    visitor_id text NOT NULL,
    converted boolean DEFAULT false,
    conversion_value numeric(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- MIGRAÇÃO 4: FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_experiments_updated_at
    BEFORE UPDATE ON public.experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_variants_updated_at
    BEFORE UPDATE ON public.variants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- MIGRAÇÃO 5: RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Função para obter user_id atual
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        IF auth.role() = 'service_role' THEN
            RETURN '00000000-0000-0000-0000-000000000000'::uuid;
        ELSE
            RAISE EXCEPTION 'User not authenticated';
        END IF;
    END IF;
    
    RETURN auth.uid();
END;
$$;

-- Função para verificar acesso ao projeto
CREATE OR REPLACE FUNCTION public.user_has_project_access(project_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se for service_role, sempre tem acesso
    IF auth.role() = 'service_role' THEN
        RETURN true;
    END IF;
    
    -- Verificar se o usuário tem acesso ao projeto
    RETURN EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_uuid
        AND (p.created_by = auth.uid() OR p.user_id = auth.uid())
    );
END;
$$;

-- Políticas RLS para projects
CREATE POLICY projects_select_policy
    ON public.projects
    FOR SELECT
    USING (user_has_project_access(id));

CREATE POLICY projects_insert_policy
    ON public.projects
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR user_id = auth.uid()
    );

-- Políticas RLS para experiments
CREATE POLICY experiments_select_policy
    ON public.experiments
    FOR SELECT
    USING (user_has_project_access(project_id));

CREATE POLICY experiments_insert_policy
    ON public.experiments
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR (
            user_has_project_access(project_id)
            AND user_id = auth.uid()
        )
    );

-- Políticas RLS para variants
CREATE POLICY variants_select_policy
    ON public.variants
    FOR SELECT
    USING (user_has_project_access(experiment_id));

CREATE POLICY variants_insert_policy
    ON public.variants
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR (
            user_has_project_access(experiment_id)
            AND created_by = auth.uid()
        )
    );

-- =====================================================
-- MIGRAÇÃO 6: ÍNDICES E PERFORMANCE
-- =====================================================

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_experiments_project_id ON public.experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments(status);
CREATE INDEX IF NOT EXISTS idx_variants_experiment_id ON public.variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON public.events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_experiment_id ON public.events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_visits_experiment_id ON public.visits(experiment_id);

-- =====================================================
-- MIGRAÇÃO 7: DADOS INICIAIS
-- =====================================================

-- Inserir projeto padrão
INSERT INTO public.projects (id, name, description, created_by)
VALUES (
    'b302fac6-3255-4923-833b-5e71a11d5bfe',
    'Projeto Padrão',
    'Projeto padrão para testes',
    'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MIGRAÇÃO 8: FUNÇÕES RPC
-- =====================================================

-- Função para criar experimento
CREATE OR REPLACE FUNCTION public.create_experiment_safe(
    p_name text,
    p_project_id uuid,
    p_description text DEFAULT NULL,
    p_type text DEFAULT 'redirect',
    p_traffic_allocation numeric DEFAULT 99.99,
    p_status text DEFAULT 'draft',
    p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    new_id uuid;
BEGIN
    INSERT INTO public.experiments (
        name, project_id, description, type, 
        traffic_allocation, status, user_id
    ) VALUES (
        p_name, p_project_id, p_description, p_type::experiment_type,
        p_traffic_allocation, p_status::experiment_status, p_user_id
    ) RETURNING id INTO new_id;
    
    SELECT jsonb_build_object(
        'id', new_id,
        'name', p_name,
        'traffic_allocation', p_traffic_allocation,
        'status', p_status
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', true,
            'message', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'experiments', 'variants', 'events', 'visits')
ORDER BY table_name;

-- Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_user_id', 'user_has_project_access', 'create_experiment_safe')
ORDER BY routine_name;

-- Verificar se as políticas RLS foram criadas
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'experiments', 'variants')
ORDER BY tablename, policyname;

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA
-- =====================================================
-- Execute este script no SQL Editor do novo projeto
-- Verifique se todas as tabelas, funções e políticas foram criadas
-- Teste com: node test-new-project.js
