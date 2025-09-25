-- ===================================================
-- MIGRAÇÃO SISTEMA DE LOGS - ROTA FINAL
-- ===================================================
-- Criação de tabelas para logging estruturado
-- Data: 2024-01-01
-- Versão: 1.0.0

-- ===================================================
-- TABELA: logs
-- ===================================================
-- Armazena logs estruturados do sistema
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Contexto
    user_id UUID,
    organization_id UUID,
    project_id UUID,
    experiment_id UUID,
    variant_id UUID,
    visitor_id TEXT,
    session_id TEXT,
    request_id TEXT,
    
    -- Dados adicionais
    context JSONB,
    metadata JSONB,
    error_message TEXT,
    error_stack TEXT,
    duration_ms INTEGER,
    tags TEXT[],
    
    -- Request info
    method TEXT,
    path TEXT,
    status_code INTEGER,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_level ON logs(level) WHERE level IN ('ERROR', 'FATAL');
CREATE INDEX idx_logs_user_id ON logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_logs_organization_id ON logs(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_logs_project_id ON logs(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_logs_experiment_id ON logs(experiment_id) WHERE experiment_id IS NOT NULL;
CREATE INDEX idx_logs_request_id ON logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_logs_tags ON logs USING gin(tags) WHERE tags IS NOT NULL;
CREATE INDEX idx_logs_error ON logs(timestamp DESC) WHERE level IN ('ERROR', 'FATAL');

-- ===================================================
-- TABELA: performance_metrics
-- ===================================================
-- Armazena métricas de performance agregadas
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'summary')),
    value NUMERIC NOT NULL,
    unit TEXT,
    tags JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Agregações (para histogramas)
    count INTEGER,
    sum NUMERIC,
    min NUMERIC,
    max NUMERIC,
    p50 NUMERIC,
    p90 NUMERIC,
    p95 NUMERIC,
    p99 NUMERIC,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name, timestamp DESC);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_tags ON performance_metrics USING gin(tags);

-- ===================================================
-- TABELA: error_tracking
-- ===================================================
-- Rastreamento detalhado de erros
CREATE TABLE error_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_hash TEXT NOT NULL, -- Hash do erro para agrupamento
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    
    -- Contexto
    user_id UUID,
    organization_id UUID,
    project_id UUID,
    experiment_id UUID,
    
    -- Informações do request
    url TEXT,
    method TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Metadados
    context JSONB,
    tags TEXT[],
    
    -- Contadores
    occurrence_count INTEGER DEFAULT 1,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_error_tracking_hash ON error_tracking(error_hash);
CREATE INDEX idx_error_tracking_status ON error_tracking(status) WHERE status = 'open';
CREATE INDEX idx_error_tracking_last_seen ON error_tracking(last_seen DESC);
CREATE INDEX idx_error_tracking_organization ON error_tracking(organization_id) WHERE organization_id IS NOT NULL;

-- ===================================================
-- FUNÇÕES AUXILIARES
-- ===================================================

-- Função para gerar hash de erro
CREATE OR REPLACE FUNCTION generate_error_hash(
    error_type TEXT,
    error_message TEXT,
    error_stack TEXT
) RETURNS TEXT AS $$
BEGIN
    -- Normalizar mensagem removendo valores dinâmicos
    -- (IDs, timestamps, etc)
    RETURN encode(
        digest(
            error_type || 
            regexp_replace(error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'UUID', 'g') ||
            COALESCE(substring(error_stack FROM 1 FOR 500), ''),
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para atualizar error_tracking
CREATE OR REPLACE FUNCTION update_error_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é um erro, verificar se já existe
    IF NEW.level IN ('ERROR', 'FATAL') AND NEW.error_message IS NOT NULL THEN
        DECLARE
            v_error_hash TEXT;
            v_existing_id UUID;
        BEGIN
            -- Gerar hash do erro
            v_error_hash := generate_error_hash(
                COALESCE(NEW.metadata->>'error_type', 'UnknownError'),
                NEW.error_message,
                NEW.error_stack
            );
            
            -- Verificar se já existe
            SELECT id INTO v_existing_id
            FROM error_tracking
            WHERE error_hash = v_error_hash
            LIMIT 1;
            
            IF v_existing_id IS NOT NULL THEN
                -- Atualizar existente
                UPDATE error_tracking
                SET 
                    occurrence_count = occurrence_count + 1,
                    last_seen = NEW.timestamp,
                    updated_at = now()
                WHERE id = v_existing_id;
            ELSE
                -- Criar novo
                INSERT INTO error_tracking (
                    error_hash,
                    error_type,
                    error_message,
                    error_stack,
                    user_id,
                    organization_id,
                    project_id,
                    experiment_id,
                    url,
                    method,
                    user_agent,
                    ip_address,
                    context,
                    tags
                ) VALUES (
                    v_error_hash,
                    COALESCE(NEW.metadata->>'error_type', 'UnknownError'),
                    NEW.error_message,
                    NEW.error_stack,
                    NEW.user_id,
                    NEW.organization_id,
                    NEW.project_id,
                    NEW.experiment_id,
                    NEW.path,
                    NEW.method,
                    NEW.user_agent,
                    NEW.ip_address,
                    NEW.context,
                    NEW.tags
                );
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_logs_update_error_tracking
    AFTER INSERT ON logs
    FOR EACH ROW
    EXECUTE FUNCTION update_error_tracking();

-- ===================================================
-- VIEWS ÚTEIS
-- ===================================================

-- View de erros recentes
CREATE VIEW recent_errors AS
SELECT 
    l.id,
    l.level,
    l.message,
    l.error_message,
    l.timestamp,
    l.user_id,
    o.name as organization_name,
    p.name as project_name,
    e.name as experiment_name,
    l.request_id,
    l.tags
FROM logs l
LEFT JOIN organizations o ON l.organization_id = o.id
LEFT JOIN projects p ON l.project_id = p.id
LEFT JOIN experiments e ON l.experiment_id = e.id
WHERE l.level IN ('ERROR', 'FATAL')
AND l.timestamp > (now() - INTERVAL '24 hours')
ORDER BY l.timestamp DESC;

-- View de métricas de performance
CREATE VIEW performance_summary AS
SELECT 
    metric_name,
    date_trunc('hour', timestamp) as hour,
    COUNT(*) as count,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_value
FROM performance_metrics
WHERE timestamp > (now() - INTERVAL '24 hours')
GROUP BY metric_name, date_trunc('hour', timestamp)
ORDER BY hour DESC, metric_name;

-- ===================================================
-- POLÍTICAS DE RETENÇÃO
-- ===================================================

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar logs DEBUG mais antigos que 7 dias
    DELETE FROM logs 
    WHERE level = 'DEBUG' 
    AND timestamp < (now() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Deletar logs INFO mais antigos que 30 dias
    DELETE FROM logs 
    WHERE level = 'INFO' 
    AND timestamp < (now() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Deletar logs WARN mais antigos que 90 dias
    DELETE FROM logs 
    WHERE level = 'WARN' 
    AND timestamp < (now() - INTERVAL '90 days');
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Logs ERROR e FATAL são mantidos por 1 ano
    DELETE FROM logs 
    WHERE level IN ('ERROR', 'FATAL') 
    AND timestamp < (now() - INTERVAL '1 year');
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Limpar métricas antigas
    DELETE FROM performance_metrics
    WHERE timestamp < (now() - INTERVAL '30 days');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================

-- Habilitar RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas para logs (apenas membros da organização podem ver)
CREATE POLICY "Membros podem ver logs de sua organização" ON logs
    FOR SELECT USING (
        organization_id IS NULL -- Logs do sistema
        OR EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = logs.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Sistema pode inserir logs
CREATE POLICY "Sistema pode inserir logs" ON logs
    FOR INSERT WITH CHECK (true);

-- Políticas similares para outras tabelas
CREATE POLICY "Membros podem ver métricas de sua organização" ON performance_metrics
    FOR SELECT USING (
        tags->>'organization_id' IS NULL
        OR EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = (tags->>'organization_id')::UUID
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Sistema pode inserir métricas" ON performance_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Membros podem ver erros de sua organização" ON error_tracking
    FOR SELECT USING (
        organization_id IS NULL
        OR EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = error_tracking.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Admins podem atualizar status de erros
CREATE POLICY "Admins podem atualizar erros" ON error_tracking
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = error_tracking.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- ===================================================
-- COMENTÁRIOS
-- ===================================================
COMMENT ON TABLE logs IS 'Logs estruturados do sistema com contexto completo';
COMMENT ON TABLE performance_metrics IS 'Métricas de performance agregadas';
COMMENT ON TABLE error_tracking IS 'Rastreamento e agrupamento de erros';
COMMENT ON FUNCTION cleanup_old_logs() IS 'Remove logs antigos baseado em políticas de retenção';
