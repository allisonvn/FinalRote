-- ===================================================
-- MIGRAÇÃO EXPERIMENTOS E VARIANTES - ROTA FINAL (CORRIGIDA)
-- ===================================================
-- Criação das tabelas para experimentos A/B e variantes
-- Data: 2024-01-01
-- Versão: 1.0.1 (Corrigida)

-- ===================================================
-- ENUMS PARA EXPERIMENTOS
-- ===================================================

-- Status dos experimentos
CREATE TYPE experiment_status AS ENUM ('draft', 'running', 'paused', 'completed');

-- Algoritmos de Multi-Armed Bandit
CREATE TYPE experiment_algorithm AS ENUM (
    'uniform',              -- Distribuição uniforme (50/50)
    'thompson_sampling',    -- Thompson Sampling (recomendado)
    'ucb1',                -- Upper Confidence Bound
    'epsilon_greedy'       -- Epsilon-Greedy
);

-- ===================================================
-- TABELA: experiments
-- ===================================================
-- Armazena experimentos A/B com configurações avançadas
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    key TEXT NOT NULL CHECK (length(trim(key)) > 0 AND key ~ '^[a-z0-9_-]+$'),
    description TEXT,
    status experiment_status NOT NULL DEFAULT 'draft',
    algorithm experiment_algorithm NOT NULL DEFAULT 'thompson_sampling',
    traffic_allocation INTEGER NOT NULL DEFAULT 100 CHECK (traffic_allocation >= 1 AND traffic_allocation <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Garante chave única por projeto
    UNIQUE(project_id, key),
    
    -- Validações de datas
    CHECK (started_at IS NULL OR started_at >= created_at),
    CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

-- Índices para performance
CREATE INDEX idx_experiments_project_id ON experiments(project_id);
CREATE INDEX idx_experiments_key ON experiments(key);
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_algorithm ON experiments(algorithm);
CREATE INDEX idx_experiments_created_at ON experiments(created_at);
CREATE INDEX idx_experiments_started_at ON experiments(started_at);

-- Trigger para updated_at automático
CREATE TRIGGER tr_experiments_updated_at
    BEFORE UPDATE ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- TABELA: variants
-- ===================================================
-- Armazena variantes dos experimentos
CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    key TEXT NOT NULL CHECK (length(trim(key)) > 0 AND key ~ '^[a-z0-9_-]+$'),
    weight INTEGER NOT NULL DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
    is_control BOOLEAN NOT NULL DEFAULT false,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Garante chave única por experimento
    UNIQUE(experiment_id, key)
);

-- Índices para performance
CREATE INDEX idx_variants_experiment_id ON variants(experiment_id);
CREATE INDEX idx_variants_key ON variants(key);
CREATE INDEX idx_variants_is_control ON variants(is_control);
CREATE INDEX idx_variants_weight ON variants(weight);
CREATE INDEX idx_variants_config ON variants USING gin(config);

-- Trigger para updated_at automático
CREATE TRIGGER tr_variants_updated_at
    BEFORE UPDATE ON variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- TABELA: goals
-- ===================================================
-- Armazena metas/objetivos dos experimentos
CREATE TYPE goal_type AS ENUM ('page_view', 'click', 'conversion', 'custom');
CREATE TYPE goal_value_type AS ENUM ('binary', 'numeric');

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    key TEXT NOT NULL CHECK (length(trim(key)) > 0 AND key ~ '^[a-z0-9_-]+$'),
    type goal_type NOT NULL DEFAULT 'conversion',
    value_type goal_value_type NOT NULL DEFAULT 'binary',
    target_value NUMERIC,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Garante chave única por experimento
    UNIQUE(experiment_id, key)
);

-- Índices para performance
CREATE INDEX idx_goals_experiment_id ON goals(experiment_id);
CREATE INDEX idx_goals_key ON goals(key);
CREATE INDEX idx_goals_type ON goals(type);
CREATE INDEX idx_goals_value_type ON goals(value_type);

-- Trigger para updated_at automático
CREATE TRIGGER tr_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- FUNÇÕES DE VALIDAÇÃO
-- ===================================================

-- Função para validar que há pelo menos uma variante de controle
CREATE OR REPLACE FUNCTION validate_control_variant()
RETURNS TRIGGER AS $$
BEGIN
    -- Em inserção ou atualização
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Se está definindo como controle, remove controle de outras variantes
        IF NEW.is_control = true THEN
            UPDATE variants 
            SET is_control = false 
            WHERE experiment_id = NEW.experiment_id 
            AND id != NEW.id 
            AND is_control = true;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Em deleção, verifica se não está removendo a única variante de controle
    IF TG_OP = 'DELETE' THEN
        IF OLD.is_control = true THEN
            -- Verifica se há outras variantes de controle
            IF NOT EXISTS (
                SELECT 1 FROM variants 
                WHERE experiment_id = OLD.experiment_id 
                AND id != OLD.id 
                AND is_control = true
            ) THEN
                -- Define a primeira variante restante como controle
                UPDATE variants 
                SET is_control = true 
                WHERE experiment_id = OLD.experiment_id 
                AND id != OLD.id 
                ORDER BY created_at 
                LIMIT 1;
            END IF;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validação de variante de controle
CREATE TRIGGER tr_variants_validate_control
    AFTER INSERT OR UPDATE OR DELETE ON variants
    FOR EACH ROW
    EXECUTE FUNCTION validate_control_variant();

-- ===================================================
-- FUNÇÃO: Geração automática de chaves
-- ===================================================
CREATE OR REPLACE FUNCTION generate_experiment_key()
RETURNS TRIGGER AS $$
BEGIN
    -- Se não foi fornecida uma chave, gera automaticamente baseada no nome
    IF NEW.key IS NULL OR NEW.key = '' THEN
        NEW.key = regexp_replace(
            lower(trim(NEW.name)), 
            '[^a-z0-9]+', 
            '_', 
            'g'
        );
        
        -- Remove underscores do início e fim
        NEW.key = regexp_replace(NEW.key, '^_+|_+$', '', 'g');
        
        -- Garante que é único adicionando número se necessário
        DECLARE
            base_key TEXT := NEW.key;
            counter INTEGER := 1;
        BEGIN
            WHILE EXISTS (
                SELECT 1 FROM experiments 
                WHERE project_id = NEW.project_id 
                AND key = NEW.key 
                AND id != COALESCE(NEW.id, uuid_nil())
            ) LOOP
                NEW.key = base_key || '_' || counter;
                counter = counter + 1;
            END LOOP;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar chave automaticamente
CREATE TRIGGER tr_experiments_generate_key
    BEFORE INSERT OR UPDATE ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION generate_experiment_key();

-- Similar para variantes
CREATE OR REPLACE FUNCTION generate_variant_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.key IS NULL OR NEW.key = '' THEN
        NEW.key = regexp_replace(
            lower(trim(NEW.name)), 
            '[^a-z0-9]+', 
            '_', 
            'g'
        );
        NEW.key = regexp_replace(NEW.key, '^_+|_+$', '', 'g');
        
        DECLARE
            base_key TEXT := NEW.key;
            counter INTEGER := 1;
        BEGIN
            WHILE EXISTS (
                SELECT 1 FROM variants 
                WHERE experiment_id = NEW.experiment_id 
                AND key = NEW.key 
                AND id != COALESCE(NEW.id, uuid_nil())
            ) LOOP
                NEW.key = base_key || '_' || counter;
                counter = counter + 1;
            END LOOP;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_variants_generate_key
    BEFORE INSERT OR UPDATE ON variants
    FOR EACH ROW
    EXECUTE FUNCTION generate_variant_key();

-- ===================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================

-- Habilitar RLS
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Políticas para experiments
CREATE POLICY "Usuários podem ver experimentos de projetos de suas organizações" ON experiments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE p.id = experiments.project_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Editors+ podem criar experimentos" ON experiments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE p.id = experiments.project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Editors+ podem atualizar experimentos" ON experiments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE p.id = experiments.project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Admins+ podem deletar experimentos" ON experiments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE p.id = experiments.project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- Políticas para variants (herdam do experimento)
CREATE POLICY "Usuários podem ver variantes de experimentos acessíveis" ON variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM experiments e
            JOIN projects p ON e.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE e.id = variants.experiment_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Editors+ podem gerenciar variantes" ON variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM experiments e
            JOIN projects p ON e.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE e.id = variants.experiment_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );

-- Políticas para goals (herdam do experimento)
CREATE POLICY "Usuários podem ver metas de experimentos acessíveis" ON goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM experiments e
            JOIN projects p ON e.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE e.id = goals.experiment_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Editors+ podem gerenciar metas" ON goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM experiments e
            JOIN projects p ON e.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE e.id = goals.experiment_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );

-- ===================================================
-- COMENTÁRIOS DAS TABELAS
-- ===================================================
COMMENT ON TABLE experiments IS 'Experimentos A/B com algoritmos de Multi-Armed Bandit';
COMMENT ON TABLE variants IS 'Variantes dos experimentos com configurações';
COMMENT ON TABLE goals IS 'Metas e objetivos dos experimentos';

COMMENT ON COLUMN experiments.algorithm IS 'Algoritmo de distribuição de tráfego (MAB)';
COMMENT ON COLUMN experiments.traffic_allocation IS 'Porcentagem de tráfego alocada (1-100%)';
COMMENT ON COLUMN variants.weight IS 'Peso da variante para distribuição de tráfego';
COMMENT ON COLUMN variants.is_control IS 'Indica se é a variante de controle (baseline)';
COMMENT ON COLUMN variants.config IS 'Configurações JSON da variante (URLs, CSS, etc)';
COMMENT ON COLUMN goals.value_type IS 'Tipo de valor: binary (sim/não) ou numeric (valor)';
