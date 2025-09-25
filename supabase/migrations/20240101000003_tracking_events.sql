-- ===================================================
-- MIGRAÇÃO TRACKING E EVENTOS - ROTA FINAL
-- ===================================================
-- Criação das tabelas para tracking de eventos e atribuições
-- Data: 2024-01-01
-- Versão: 1.0.0

-- ===================================================
-- TABELA: assignments
-- ===================================================
-- Armazena atribuições de visitantes para variantes
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL CHECK (length(trim(visitor_id)) > 0),
    context JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Garante uma atribuição por visitante por experimento
    UNIQUE(experiment_id, visitor_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_assignments_experiment_id ON assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_variant_id ON assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_assignments_visitor_id ON assignments(visitor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at);
CREATE INDEX IF NOT EXISTS idx_assignments_context ON assignments USING gin(context);

-- ===================================================
-- TABELA: events (PARTICIONADA POR DATA)
-- ===================================================
-- Armazena eventos de tracking com particionamento para performance
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    experiment_id UUID REFERENCES experiments(id) ON DELETE SET NULL,
    visitor_id TEXT NOT NULL CHECK (length(trim(visitor_id)) > 0),
    event_type TEXT NOT NULL CHECK (length(trim(event_type)) > 0),
    event_name TEXT NOT NULL CHECK (length(trim(event_name)) > 0),
    properties JSONB NOT NULL DEFAULT '{}',
    value NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Índices para a tabela principal de eventos
CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_experiment_id ON events(experiment_id, created_at) WHERE experiment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON events(visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_events_properties ON events USING gin(properties);
CREATE INDEX IF NOT EXISTS idx_events_value ON events(value, created_at) WHERE value IS NOT NULL;

-- Função para criar partições mensais automaticamente
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name TEXT, start_date DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
    is_partitioned BOOLEAN;
BEGIN
    -- Verificar se a tabela está particionada
    SELECT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhparent
        WHERE c.relname = table_name
    ) INTO is_partitioned;
    
    -- Se não estiver particionada, tentar alterar a estrutura
    IF NOT is_partitioned THEN
        -- Para a tabela events, precisamos convertê-la para particionada
        IF table_name = 'events' THEN
            -- Criar uma nova tabela particionada temporária
            EXECUTE format(
                'CREATE TABLE %I_temp (
                    id UUID DEFAULT uuid_generate_v4(),
                    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    experiment_id UUID REFERENCES experiments(id) ON DELETE SET NULL,
                    visitor_id TEXT NOT NULL CHECK (length(trim(visitor_id)) > 0),
                    event_type TEXT NOT NULL CHECK (length(trim(event_type)) > 0),
                    event_name TEXT NOT NULL CHECK (length(trim(event_name)) > 0),
                    properties JSONB NOT NULL DEFAULT ''{}'',
                    value NUMERIC,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    PRIMARY KEY (id, created_at)
                ) PARTITION BY RANGE (created_at)',
                table_name
            );
            
            -- Copiar dados da tabela original para a nova
            EXECUTE format('INSERT INTO %I_temp SELECT * FROM %I', table_name, table_name);
            
            -- Remover a tabela original e renomear a nova
            EXECUTE format('DROP TABLE %I', table_name);
            EXECUTE format('ALTER TABLE %I_temp RENAME TO %I', table_name, table_name);
            
            -- Recriar os índices
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_events_project_id ON %I(project_id, created_at)', table_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_events_experiment_id ON %I(experiment_id, created_at) WHERE experiment_id IS NOT NULL', table_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON %I(visitor_id, created_at)', table_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_events_event_type ON %I(event_type, created_at)', table_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_events_event_name ON %I(event_name, created_at)', table_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_events_properties ON %I USING gin(properties)', table_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_events_value ON %I(value, created_at) WHERE value IS NOT NULL', table_name);
        END IF;
    END IF;
    
    -- Agora criar a partição
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date
    );
    
    -- Criar índices na partição
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(project_id, created_at)', 
                   'idx_' || partition_name || '_project_created', partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(experiment_id, created_at) WHERE experiment_id IS NOT NULL', 
                   'idx_' || partition_name || '_experiment_created', partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(visitor_id, created_at)', 
                   'idx_' || partition_name || '_visitor_created', partition_name);
END;
$$ LANGUAGE plpgsql;

-- Criar partições para os próximos 12 meses
DO $$
DECLARE
    start_date DATE := date_trunc('month', CURRENT_DATE)::DATE;
    i INTEGER;
BEGIN
    FOR i IN 0..11 LOOP
        PERFORM create_monthly_partition('events', (start_date + (i || ' months')::INTERVAL)::DATE);
    END LOOP;
END $$;

-- ===================================================
-- TABELA: metrics_snapshots
-- ===================================================
-- Armazena snapshots de métricas para performance
CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('visitors', 'conversions', 'revenue', 'engagement')),
    count BIGINT NOT NULL DEFAULT 0,
    value NUMERIC NOT NULL DEFAULT 0,
    confidence_interval JSONB,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
    
    -- Índice único para evitar duplicatas por período
    UNIQUE(experiment_id, variant_id, metric_type, computed_at)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_experiment_id ON metrics_snapshots(experiment_id);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_variant_id ON metrics_snapshots(variant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_metric_type ON metrics_snapshots(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_computed_at ON metrics_snapshots(computed_at);

-- Criar índice na coluna valid_until apenas se ela existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics_snapshots' 
        AND column_name = 'valid_until'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_valid_until ON metrics_snapshots(valid_until);
    END IF;
END $$;

-- ===================================================
-- TABELA: visitor_sessions
-- ===================================================
-- Armazena sessões de visitantes para análise de comportamento
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL CHECK (length(trim(visitor_id)) > 0),
    session_id TEXT NOT NULL CHECK (length(trim(session_id)) > 0),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    country_code CHAR(2),
    region TEXT,
    city TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser_name TEXT,
    browser_version TEXT,
    os_name TEXT,
    os_version TEXT,
    screen_resolution TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    page_views INTEGER NOT NULL DEFAULT 1,
    events_count INTEGER NOT NULL DEFAULT 0,
    
    UNIQUE(project_id, visitor_id, session_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_project_id ON visitor_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor_id ON visitor_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_started_at ON visitor_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_country_code ON visitor_sessions(country_code);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_device_type ON visitor_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_utm ON visitor_sessions(utm_source, utm_medium, utm_campaign);

-- ===================================================
-- FUNÇÕES DE AGREGAÇÃO E ANÁLISE
-- ===================================================

-- Função para obter métricas de um experimento
CREATE OR REPLACE FUNCTION get_experiment_metrics(exp_id UUID, from_date TIMESTAMPTZ DEFAULT NULL, to_date TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
    variant_id UUID,
    variant_name TEXT,
    visitors BIGINT,
    conversions BIGINT,
    conversion_rate NUMERIC,
    revenue NUMERIC,
    avg_value NUMERIC
) AS $$
BEGIN
    -- Define datas padrão se não fornecidas
    from_date := COALESCE(from_date, (SELECT created_at FROM experiments WHERE id = exp_id));
    to_date := COALESCE(to_date, now());
    
    RETURN QUERY
    WITH variant_data AS (
        SELECT v.id, v.name
        FROM variants v
        WHERE v.experiment_id = exp_id
    ),
    visitor_counts AS (
        SELECT 
            a.variant_id,
            COUNT(DISTINCT a.visitor_id) as unique_visitors
        FROM assignments a
        WHERE a.experiment_id = exp_id
        AND a.created_at >= from_date
        AND a.created_at <= to_date
        GROUP BY a.variant_id
    ),
    conversion_counts AS (
        SELECT 
            a.variant_id,
            COUNT(DISTINCT e.visitor_id) as conversions,
            SUM(COALESCE(e.value, 0)) as total_revenue,
            AVG(COALESCE(e.value, 0)) as avg_event_value
        FROM assignments a
        LEFT JOIN events e ON e.visitor_id = a.visitor_id 
            AND e.experiment_id = a.experiment_id
            AND e.event_type = 'conversion'
            AND e.created_at >= from_date
            AND e.created_at <= to_date
        WHERE a.experiment_id = exp_id
        AND a.created_at >= from_date
        AND a.created_at <= to_date
        GROUP BY a.variant_id
    )
    SELECT 
        vd.id,
        vd.name,
        COALESCE(vc.unique_visitors, 0),
        COALESCE(cc.conversions, 0),
        CASE 
            WHEN COALESCE(vc.unique_visitors, 0) > 0 
            THEN ROUND((COALESCE(cc.conversions, 0)::NUMERIC / vc.unique_visitors) * 100, 2)
            ELSE 0 
        END,
        COALESCE(cc.total_revenue, 0),
        COALESCE(cc.avg_event_value, 0)
    FROM variant_data vd
    LEFT JOIN visitor_counts vc ON vd.id = vc.variant_id
    LEFT JOIN conversion_counts cc ON vd.id = cc.variant_id
    ORDER BY vd.name;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular significância estatística
CREATE OR REPLACE FUNCTION calculate_significance(
    control_conversions INTEGER,
    control_visitors INTEGER,
    variant_conversions INTEGER,
    variant_visitors INTEGER
) RETURNS JSONB AS $$
DECLARE
    p1 NUMERIC;
    p2 NUMERIC;
    p_pooled NUMERIC;
    se NUMERIC;
    z_score NUMERIC;
    p_value NUMERIC;
    confidence_level NUMERIC;
    margin_error NUMERIC;
    lift NUMERIC;
BEGIN
    -- Verifica se há dados suficientes
    IF control_visitors < 30 OR variant_visitors < 30 THEN
        RETURN jsonb_build_object(
            'significant', false,
            'reason', 'Dados insuficientes (mínimo 30 visitantes por variante)',
            'confidence_level', 0,
            'lift', 0
        );
    END IF;
    
    -- Calcula taxas de conversão
    p1 := control_conversions::NUMERIC / control_visitors;
    p2 := variant_conversions::NUMERIC / variant_visitors;
    
    -- Calcula lift
    lift := CASE WHEN p1 > 0 THEN ((p2 - p1) / p1) * 100 ELSE 0 END;
    
    -- Calcula taxa combinada
    p_pooled := (control_conversions + variant_conversions)::NUMERIC / (control_visitors + variant_visitors);
    
    -- Calcula erro padrão
    se := sqrt(p_pooled * (1 - p_pooled) * (1.0/control_visitors + 1.0/variant_visitors));
    
    -- Calcula z-score
    z_score := CASE WHEN se > 0 THEN (p2 - p1) / se ELSE 0 END;
    
    -- Calcula p-value (aproximação normal)
    p_value := 2 * (1 - (0.5 * (1 + erf(abs(z_score) / sqrt(2)))));
    
    -- Determina nível de confiança
    confidence_level := (1 - p_value) * 100;
    
    -- Calcula margem de erro (95% de confiança)
    margin_error := 1.96 * sqrt((p2 * (1 - p2)) / variant_visitors) * 100;
    
    RETURN jsonb_build_object(
        'significant', p_value < 0.05,
        'confidence_level', ROUND(confidence_level, 2),
        'p_value', ROUND(p_value, 4),
        'z_score', ROUND(z_score, 4),
        'lift', ROUND(lift, 2),
        'margin_error', ROUND(margin_error, 2),
        'control_rate', ROUND(p1 * 100, 2),
        'variant_rate', ROUND(p2 * 100, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- TRIGGERS PARA ATUALIZAÇÃO DE MÉTRICAS
-- ===================================================

-- Função para invalidar cache de métricas
CREATE OR REPLACE FUNCTION invalidate_metrics_cache()
RETURNS TRIGGER AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar se a coluna valid_until existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics_snapshots' 
        AND column_name = 'valid_until'
    ) INTO column_exists;
    
    -- Remove snapshots antigos para forçar recálculo
    IF column_exists THEN
        DELETE FROM metrics_snapshots 
        WHERE experiment_id = COALESCE(NEW.experiment_id, OLD.experiment_id)
        AND valid_until < now();
    ELSE
        DELETE FROM metrics_snapshots 
        WHERE experiment_id = COALESCE(NEW.experiment_id, OLD.experiment_id)
        AND computed_at < (now() - INTERVAL '5 minutes');
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para invalidar cache quando eventos são inseridos
DROP TRIGGER IF EXISTS tr_events_invalidate_cache ON events;
CREATE TRIGGER tr_events_invalidate_cache
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_metrics_cache();

-- Trigger para invalidar cache quando atribuições mudam
DROP TRIGGER IF EXISTS tr_assignments_invalidate_cache ON assignments;
CREATE TRIGGER tr_assignments_invalidate_cache
    AFTER INSERT OR UPDATE OR DELETE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_metrics_cache();

-- ===================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================

-- Habilitar RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para assignments
DROP POLICY IF EXISTS "API pode ler/escrever atribuições" ON assignments;
CREATE POLICY "API pode ler/escrever atribuições" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM experiments e
            JOIN projects p ON e.project_id = p.id
            WHERE e.id = assignments.experiment_id
            AND (
                -- Acesso via chave API (public ou secret)
                current_setting('app.api_key', true) = p.public_key
                OR current_setting('app.api_key', true) = p.secret_key
                -- Ou acesso via usuário membro da organização
                OR EXISTS (
                    SELECT 1 FROM organization_members om
                    WHERE om.organization_id = p.organization_id
                    AND om.user_id = auth.uid()
                )
            )
        )
    );

-- Políticas para events
DROP POLICY IF EXISTS "API pode ler/escrever eventos" ON events;
CREATE POLICY "API pode ler/escrever eventos" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = events.project_id
            AND (
                -- Acesso via chave API
                current_setting('app.api_key', true) = p.public_key
                OR current_setting('app.api_key', true) = p.secret_key
                -- Ou acesso via usuário membro da organização
                OR EXISTS (
                    SELECT 1 FROM organization_members om
                    WHERE om.organization_id = p.organization_id
                    AND om.user_id = auth.uid()
                )
            )
        )
    );

-- Políticas para metrics_snapshots (somente leitura para membros)
DROP POLICY IF EXISTS "Membros podem ver métricas de suas organizações" ON metrics_snapshots;
CREATE POLICY "Membros podem ver métricas de suas organizações" ON metrics_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM experiments e
            JOIN projects p ON e.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE e.id = metrics_snapshots.experiment_id
            AND om.user_id = auth.uid()
        )
    );

-- Sistema pode escrever métricas
DROP POLICY IF EXISTS "Sistema pode escrever métricas" ON metrics_snapshots;
CREATE POLICY "Sistema pode escrever métricas" ON metrics_snapshots
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Sistema pode atualizar métricas" ON metrics_snapshots;
CREATE POLICY "Sistema pode atualizar métricas" ON metrics_snapshots
    FOR UPDATE USING (true);

-- Políticas para visitor_sessions
DROP POLICY IF EXISTS "API pode gerenciar sessões" ON visitor_sessions;
CREATE POLICY "API pode gerenciar sessões" ON visitor_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = visitor_sessions.project_id
            AND (
                current_setting('app.api_key', true) = p.public_key
                OR current_setting('app.api_key', true) = p.secret_key
                OR EXISTS (
                    SELECT 1 FROM organization_members om
                    WHERE om.organization_id = p.organization_id
                    AND om.user_id = auth.uid()
                )
            )
        )
    );

-- ===================================================
-- COMENTÁRIOS DAS TABELAS
-- ===================================================
COMMENT ON TABLE assignments IS 'Atribuições de visitantes para variantes de experimentos';
COMMENT ON TABLE events IS 'Eventos de tracking particionados por data para performance';
COMMENT ON TABLE metrics_snapshots IS 'Cache de métricas agregadas por experimento/variante';
COMMENT ON TABLE visitor_sessions IS 'Sessões de visitantes com dados demográficos e técnicos';

COMMENT ON COLUMN events.properties IS 'Propriedades customizadas do evento em JSON';
COMMENT ON COLUMN events.value IS 'Valor numérico do evento (receita, tempo, etc)';
COMMENT ON COLUMN assignments.context IS 'Contexto da atribuição (browser, localização, etc)';
-- Comentário sobre a coluna confidence_interval (apenas se ela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics_snapshots' 
        AND column_name = 'confidence_interval'
    ) THEN
        COMMENT ON COLUMN metrics_snapshots.confidence_interval IS 'Intervalo de confiança das métricas';
    END IF;
END $$;
