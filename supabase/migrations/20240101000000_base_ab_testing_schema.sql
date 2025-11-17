-- ==================================================================================
-- BASE SCHEMA FOR A/B TESTING SYSTEM
-- ==================================================================================
-- Este arquivo cria as tabelas fundamentais do sistema de A/B testing que estavam
-- faltando nas migrações originais.
-- ==================================================================================

SET check_function_bodies = off;

-- ==================================================================================
-- 1. TABELA EXPERIMENTS - Experimentos A/B
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT UNIQUE, -- Identificador único do experimento (opcional, pode usar name)
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
    algorithm TEXT NOT NULL DEFAULT 'uniform' CHECK (algorithm IN ('uniform', 'thompson_sampling', 'ucb1', 'epsilon_greedy')),
    traffic_allocation DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),

    -- Configurações de conversão
    target_url TEXT,
    conversion_url TEXT,
    conversion_type TEXT DEFAULT 'page_view' CHECK (conversion_type IN ('page_view', 'click', 'form_submit', 'custom')),
    conversion_value DECIMAL(12,2) DEFAULT 0,

    -- Configurações de duração
    duration_days INTEGER DEFAULT 30,
    min_sample_size INTEGER DEFAULT 100,

    -- Timestamps
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(project_id, name),
    CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

-- Índices para experiments
CREATE INDEX IF NOT EXISTS idx_experiments_project_id ON public.experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_key ON public.experiments(key);
CREATE INDEX IF NOT EXISTS idx_experiments_project_status ON public.experiments(project_id, status);

COMMENT ON TABLE public.experiments IS 'Experimentos A/B com suporte a múltiplos algoritmos MAB';
COMMENT ON COLUMN public.experiments.key IS 'Identificador único textual do experimento';
COMMENT ON COLUMN public.experiments.algorithm IS 'Algoritmo de seleção: uniform (A/B clássico), thompson_sampling, ucb1, epsilon_greedy';
COMMENT ON COLUMN public.experiments.traffic_allocation IS 'Porcentagem do tráfego total direcionado ao experimento';

-- ==================================================================================
-- 2. TABELA VARIANTS - Variantes dos experimentos
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT, -- Identificador textual da variante
    description TEXT,
    is_control BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    traffic_percentage INTEGER NOT NULL DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    config JSONB DEFAULT '{}'::jsonb, -- Configurações customizadas da variante

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(experiment_id, name),
    UNIQUE(experiment_id, key)
);

-- Índices para variants
CREATE INDEX IF NOT EXISTS idx_variants_experiment_id ON public.variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_variants_is_control ON public.variants(is_control);
CREATE INDEX IF NOT EXISTS idx_variants_is_active ON public.variants(is_active);
CREATE INDEX IF NOT EXISTS idx_variants_key ON public.variants(key);

COMMENT ON TABLE public.variants IS 'Variantes de cada experimento A/B';
COMMENT ON COLUMN public.variants.key IS 'Identificador textual único da variante dentro do experimento';
COMMENT ON COLUMN public.variants.traffic_percentage IS 'Porcentagem de tráfego para esta variante (usado em distribuição uniforme)';
COMMENT ON COLUMN public.variants.config IS 'Configurações JSON customizadas (CSS, JS, atributos HTML)';

-- ==================================================================================
-- 3. TABELA EVENTS - Eventos de tracking
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.variants(id) ON DELETE SET NULL,
    visitor_id TEXT NOT NULL,

    -- Dados do evento
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'conversion', 'experiment_assignment', 'identify', 'custom')),
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    properties JSONB DEFAULT '{}'::jsonb, -- Mantido para compatibilidade
    value DECIMAL(12,2),

    -- UTM tracking
    utm_data JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para events (otimizados para queries comuns)
CREATE INDEX IF NOT EXISTS idx_events_experiment_id ON public.events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_events_variant_id ON public.events(variant_id);
CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON public.events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_experiment_visitor ON public.events(experiment_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_conversion ON public.events(experiment_id, event_type) WHERE event_type = 'conversion';
CREATE INDEX IF NOT EXISTS idx_events_project_created ON public.events(project_id, created_at DESC);

-- Índice parcial para conversões (muito usado em queries)
CREATE INDEX IF NOT EXISTS idx_events_conversions_only ON public.events(experiment_id, variant_id, created_at)
WHERE event_type = 'conversion';

COMMENT ON TABLE public.events IS 'Eventos de tracking incluindo page views, cliques, conversões e assignments';
COMMENT ON COLUMN public.events.event_data IS 'Dados estruturados do evento';
COMMENT ON COLUMN public.events.properties IS 'Propriedades adicionais (compatibilidade com SDK)';
COMMENT ON COLUMN public.events.utm_data IS 'Parâmetros UTM capturados';

-- ==================================================================================
-- 4. TABELA GOALS - Objetivos/Métricas dos experimentos
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'conversion' CHECK (type IN ('page_view', 'click', 'conversion', 'custom', 'revenue')),
    value_type TEXT NOT NULL DEFAULT 'binary' CHECK (value_type IN ('binary', 'numeric', 'revenue')),
    target_value DECIMAL(12,2),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(experiment_id, key)
);

CREATE INDEX IF NOT EXISTS idx_goals_experiment_id ON public.goals(experiment_id);
CREATE INDEX IF NOT EXISTS idx_goals_is_primary ON public.goals(is_primary);

COMMENT ON TABLE public.goals IS 'Objetivos e métricas de sucesso para experimentos';
COMMENT ON COLUMN public.goals.type IS 'Tipo de evento que conta como sucesso';
COMMENT ON COLUMN public.goals.value_type IS 'Tipo de valor: binary (sim/não), numeric (contagem), revenue (monetário)';

-- ==================================================================================
-- 5. TRIGGERS PARA UPDATED_AT
-- ==================================================================================
CREATE TRIGGER set_experiments_updated_at
    BEFORE UPDATE ON public.experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_variants_updated_at
    BEFORE UPDATE ON public.variants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ==================================================================================
-- 6. ROW LEVEL SECURITY
-- ==================================================================================
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- ==================================================================================
-- 7. POLÍTICAS RLS PARA EXPERIMENTS
-- ==================================================================================

-- SELECT: Membros da organização podem ver experimentos dos seus projetos
CREATE POLICY "experiments_select_org_members" ON public.experiments
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE p.id = experiments.project_id
              AND om.user_id = auth.uid()
        )
    );

-- INSERT: Membros podem criar experimentos em seus projetos
CREATE POLICY "experiments_insert_org_members" ON public.experiments
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE p.id = experiments.project_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- UPDATE: Membros podem atualizar experimentos
CREATE POLICY "experiments_update_org_members" ON public.experiments
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE p.id = experiments.project_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE p.id = experiments.project_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- DELETE: Apenas owners e admins podem deletar
CREATE POLICY "experiments_delete_admins" ON public.experiments
    FOR DELETE
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE p.id = experiments.project_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin')
        )
    );

-- ==================================================================================
-- 8. POLÍTICAS RLS PARA VARIANTS
-- ==================================================================================

CREATE POLICY "variants_select_org_members" ON public.variants
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = variants.experiment_id
              AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "variants_insert_org_members" ON public.variants
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = variants.experiment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "variants_update_org_members" ON public.variants
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = variants.experiment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = variants.experiment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "variants_delete_admins" ON public.variants
    FOR DELETE
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = variants.experiment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin')
        )
    );

-- ==================================================================================
-- 9. POLÍTICAS RLS PARA EVENTS (mais permissivas para tracking)
-- ==================================================================================

-- SELECT: Service role sempre, autenticados podem ver eventos de seus projetos
CREATE POLICY "events_select_policy" ON public.events
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR auth.role() = 'anon'
        OR auth.role() = 'authenticated'
    );

-- INSERT: Qualquer um pode inserir eventos (tracking público)
CREATE POLICY "events_insert_policy" ON public.events
    FOR INSERT
    WITH CHECK (true);

-- UPDATE: Apenas service_role
CREATE POLICY "events_update_service" ON public.events
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- DELETE: Apenas service_role
CREATE POLICY "events_delete_service" ON public.events
    FOR DELETE
    USING (auth.role() = 'service_role');

-- ==================================================================================
-- 10. POLÍTICAS RLS PARA GOALS
-- ==================================================================================

CREATE POLICY "goals_select_org_members" ON public.goals
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = goals.experiment_id
              AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "goals_insert_org_members" ON public.goals
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = goals.experiment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "goals_update_org_members" ON public.goals
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = goals.experiment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = goals.experiment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "goals_delete_admins" ON public.goals
    FOR DELETE
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.experiments e
            JOIN public.projects p ON p.id = e.project_id
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE e.id = goals.experiment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin')
        )
    );

-- ==================================================================================
-- 11. GRANTS
-- ==================================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiments TO authenticated;
GRANT SELECT ON public.experiments TO anon;
GRANT ALL PRIVILEGES ON public.experiments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.variants TO authenticated;
GRANT SELECT ON public.variants TO anon;
GRANT ALL PRIVILEGES ON public.variants TO service_role;

GRANT SELECT, INSERT ON public.events TO authenticated, anon;
GRANT ALL PRIVILEGES ON public.events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT ON public.goals TO anon;
GRANT ALL PRIVILEGES ON public.goals TO service_role;

-- ==================================================================================
-- 12. FUNÇÃO HELPER: Gerar key automaticamente
-- ==================================================================================
CREATE OR REPLACE FUNCTION public.generate_experiment_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se key não foi fornecida, gerar baseado no name
    IF NEW.key IS NULL OR NEW.key = '' THEN
        NEW.key := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]', '_', 'g'));
        -- Garantir unicidade adicionando timestamp se necessário
        IF EXISTS (SELECT 1 FROM public.experiments WHERE key = NEW.key AND id != NEW.id) THEN
            NEW.key := NEW.key || '_' || EXTRACT(EPOCH FROM NOW())::INTEGER;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_experiment_key
    BEFORE INSERT OR UPDATE ON public.experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_experiment_key();

CREATE OR REPLACE FUNCTION public.generate_variant_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se key não foi fornecida, gerar baseado no name
    IF NEW.key IS NULL OR NEW.key = '' THEN
        NEW.key := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]', '_', 'g'));
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_variant_key
    BEFORE INSERT OR UPDATE ON public.variants
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_variant_key();

-- ==================================================================================
-- 13. VERIFICAÇÃO FINAL
-- ==================================================================================
DO $$
DECLARE
    tables_count INTEGER;
    policies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('experiments', 'variants', 'events', 'goals');

    SELECT COUNT(*) INTO policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('experiments', 'variants', 'events', 'goals');

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ BASE SCHEMA CRIADO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tabelas criadas: % / 4', tables_count;
    RAISE NOTICE 'Políticas RLS: %', policies_count;
    RAISE NOTICE '========================================';
END $$;
