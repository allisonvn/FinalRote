-- ===================================================
-- MIGRAÇÃO FUNÇÕES MAB - ROTA FINAL
-- ===================================================
-- Funções avançadas para Multi-Armed Bandit e otimizações
-- Data: 2024-01-01
-- Versão: 1.0.0

-- ===================================================
-- FUNÇÕES PARA MULTI-ARMED BANDIT
-- ===================================================

-- Função para Thompson Sampling
CREATE OR REPLACE FUNCTION thompson_sampling_weights(exp_id UUID)
RETURNS TABLE (variant_id UUID, weight NUMERIC) AS $$
DECLARE
    rec RECORD;
    alpha NUMERIC;
    beta NUMERIC;
    total_weight NUMERIC := 0;
    weights NUMERIC[];
    variant_ids UUID[];
    i INTEGER := 1;
BEGIN
    -- Coleta dados de cada variante
    FOR rec IN 
        SELECT v.id, 
               COALESCE(conversions.count, 0) as conversions,
               COALESCE(visitors.count, 0) as visitors
        FROM variants v
        LEFT JOIN (
            SELECT a.variant_id, COUNT(DISTINCT e.visitor_id) as count
            FROM assignments a
            LEFT JOIN events e ON e.visitor_id = a.visitor_id 
                AND e.experiment_id = a.experiment_id
                AND e.event_type = 'conversion'
            WHERE a.experiment_id = exp_id
            GROUP BY a.variant_id
        ) conversions ON v.id = conversions.variant_id
        LEFT JOIN (
            SELECT variant_id, COUNT(DISTINCT visitor_id) as count
            FROM assignments
            WHERE experiment_id = exp_id
            GROUP BY variant_id
        ) visitors ON v.id = visitors.variant_id
        WHERE v.experiment_id = exp_id
    LOOP
        -- Parâmetros da distribuição Beta
        alpha := rec.conversions + 1;
        beta := (rec.visitors - rec.conversions) + 1;
        
        -- Amostra da distribuição Beta (aproximação com Gamma)
        -- weight = gamma(alpha) / (gamma(alpha) + gamma(beta))
        -- Simplificação: usa proporção + ruído para simular amostragem
        variant_ids := array_append(variant_ids, rec.id);
        weights := array_append(weights, 
            CASE 
                WHEN rec.visitors > 0 THEN 
                    (rec.conversions::NUMERIC / rec.visitors) + 
                    (random() * 0.1) -- Adiciona exploração
                ELSE 0.5 + (random() * 0.5) -- Peso alto para variantes não testadas
            END
        );
        
        total_weight := total_weight + weights[i];
        i := i + 1;
    END LOOP;
    
    -- Normaliza pesos
    FOR i IN 1..array_length(weights, 1) LOOP
        weight := CASE WHEN total_weight > 0 THEN weights[i] / total_weight ELSE 0 END;
        variant_id := variant_ids[i];
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para UCB1 (Upper Confidence Bound)
CREATE OR REPLACE FUNCTION ucb1_weights(exp_id UUID)
RETURNS TABLE (variant_id UUID, weight NUMERIC) AS $$
DECLARE
    rec RECORD;
    total_plays INTEGER := 0;
    ucb_value NUMERIC;
    max_ucb NUMERIC := 0;
    weights_sum NUMERIC := 0;
    temp_weights NUMERIC[];
    variant_ids UUID[];
    i INTEGER := 1;
BEGIN
    -- Conta total de plays
    SELECT COUNT(*) INTO total_plays 
    FROM assignments 
    WHERE experiment_id = exp_id;
    
    -- Se não há dados suficientes, distribui uniformemente
    IF total_plays < 10 THEN
        FOR rec IN SELECT id FROM variants WHERE experiment_id = exp_id LOOP
            variant_id := rec.id;
            weight := 1.0 / (SELECT COUNT(*) FROM variants WHERE experiment_id = exp_id);
            RETURN NEXT;
        END LOOP;
        RETURN;
    END IF;
    
    -- Calcula UCB para cada variante
    FOR rec IN 
        SELECT v.id,
               COALESCE(conversions.count, 0) as conversions,
               COALESCE(visitors.count, 0) as visitors
        FROM variants v
        LEFT JOIN (
            SELECT a.variant_id, COUNT(DISTINCT e.visitor_id) as count
            FROM assignments a
            LEFT JOIN events e ON e.visitor_id = a.visitor_id 
                AND e.experiment_id = a.experiment_id
                AND e.event_type = 'conversion'
            WHERE a.experiment_id = exp_id
            GROUP BY a.variant_id
        ) conversions ON v.id = conversions.variant_id
        LEFT JOIN (
            SELECT variant_id, COUNT(DISTINCT visitor_id) as count
            FROM assignments
            WHERE experiment_id = exp_id
            GROUP BY variant_id
        ) visitors ON v.id = visitors.variant_id
        WHERE v.experiment_id = exp_id
    LOOP
        IF rec.visitors > 0 THEN
            -- UCB1: média + sqrt(2 * ln(total) / plays)
            ucb_value := (rec.conversions::NUMERIC / rec.visitors) + 
                        sqrt(2 * ln(total_plays) / rec.visitors);
        ELSE
            -- Valor alto para variantes não testadas
            ucb_value := 1.0;
        END IF;
        
        variant_ids := array_append(variant_ids, rec.id);
        temp_weights := array_append(temp_weights, ucb_value);
        
        IF ucb_value > max_ucb THEN
            max_ucb := ucb_value;
        END IF;
        
        i := i + 1;
    END LOOP;
    
    -- Converte UCB em pesos (softmax)
    FOR i IN 1..array_length(temp_weights, 1) LOOP
        temp_weights[i] := exp(temp_weights[i] - max_ucb);
        weights_sum := weights_sum + temp_weights[i];
    END LOOP;
    
    -- Retorna pesos normalizados
    FOR i IN 1..array_length(temp_weights, 1) LOOP
        variant_id := variant_ids[i];
        weight := temp_weights[i] / weights_sum;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para Epsilon-Greedy
CREATE OR REPLACE FUNCTION epsilon_greedy_weights(exp_id UUID, epsilon NUMERIC DEFAULT 0.1)
RETURNS TABLE (variant_id UUID, weight NUMERIC) AS $$
DECLARE
    rec RECORD;
    best_variant UUID;
    best_rate NUMERIC := -1;
    variant_count INTEGER;
    exploration_weight NUMERIC;
    exploitation_weight NUMERIC;
BEGIN
    -- Conta variantes
    SELECT COUNT(*) INTO variant_count 
    FROM variants 
    WHERE experiment_id = exp_id;
    
    -- Encontra a melhor variante
    FOR rec IN 
        SELECT v.id,
               CASE 
                   WHEN COALESCE(visitors.count, 0) > 0 
                   THEN COALESCE(conversions.count, 0)::NUMERIC / visitors.count
                   ELSE 0 
               END as conversion_rate
        FROM variants v
        LEFT JOIN (
            SELECT a.variant_id, COUNT(DISTINCT e.visitor_id) as count
            FROM assignments a
            LEFT JOIN events e ON e.visitor_id = a.visitor_id 
                AND e.experiment_id = a.experiment_id
                AND e.event_type = 'conversion'
            WHERE a.experiment_id = exp_id
            GROUP BY a.variant_id
        ) conversions ON v.id = conversions.variant_id
        LEFT JOIN (
            SELECT variant_id, COUNT(DISTINCT visitor_id) as count
            FROM assignments
            WHERE experiment_id = exp_id
            GROUP BY variant_id
        ) visitors ON v.id = visitors.variant_id
        WHERE v.experiment_id = exp_id
        ORDER BY conversion_rate DESC
    LOOP
        IF rec.conversion_rate > best_rate THEN
            best_rate := rec.conversion_rate;
            best_variant := rec.id;
        END IF;
    END LOOP;
    
    -- Calcula pesos
    exploration_weight := epsilon / variant_count;
    exploitation_weight := (1 - epsilon) + exploration_weight;
    
    -- Retorna pesos
    FOR rec IN SELECT id FROM variants WHERE experiment_id = exp_id LOOP
        variant_id := rec.id;
        weight := CASE 
            WHEN rec.id = best_variant THEN exploitation_weight
            ELSE exploration_weight
        END;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função principal para obter pesos por algoritmo
CREATE OR REPLACE FUNCTION get_variant_weights(exp_id UUID)
RETURNS TABLE (variant_id UUID, weight NUMERIC) AS $$
DECLARE
    algorithm experiment_algorithm;
BEGIN
    -- Busca algoritmo do experimento
    SELECT e.algorithm INTO algorithm
    FROM experiments e
    WHERE e.id = exp_id;
    
    -- Aplica algoritmo correspondente
    CASE algorithm
        WHEN 'thompson_sampling' THEN
            RETURN QUERY SELECT * FROM thompson_sampling_weights(exp_id);
        WHEN 'ucb1' THEN
            RETURN QUERY SELECT * FROM ucb1_weights(exp_id);
        WHEN 'epsilon_greedy' THEN
            RETURN QUERY SELECT * FROM epsilon_greedy_weights(exp_id);
        ELSE -- 'uniform'
            RETURN QUERY 
            SELECT v.id, (1.0 / COUNT(*) OVER())::NUMERIC
            FROM variants v
            WHERE v.experiment_id = exp_id;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- FUNÇÃO PARA ATRIBUIÇÃO DE VARIANTES
-- ===================================================
CREATE OR REPLACE FUNCTION assign_variant(
    exp_id UUID,
    visitor_id TEXT,
    context_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    existing_assignment UUID;
    variant_weights RECORD;
    random_value NUMERIC;
    cumulative_weight NUMERIC := 0;
    selected_variant UUID;
    experiment_active BOOLEAN;
BEGIN
    -- Verifica se experimento está ativo
    SELECT status = 'running' INTO experiment_active
    FROM experiments
    WHERE id = exp_id;
    
    IF NOT experiment_active THEN
        RAISE EXCEPTION 'Experimento não está ativo';
    END IF;
    
    -- Verifica se já existe atribuição
    SELECT variant_id INTO existing_assignment
    FROM assignments
    WHERE experiment_id = exp_id AND visitor_id = assign_variant.visitor_id;
    
    IF existing_assignment IS NOT NULL THEN
        RETURN existing_assignment;
    END IF;
    
    -- Gera valor aleatório
    random_value := random();
    
    -- Seleciona variante baseada nos pesos
    FOR variant_weights IN 
        SELECT vw.variant_id, vw.weight
        FROM get_variant_weights(exp_id) vw
        ORDER BY vw.variant_id
    LOOP
        cumulative_weight := cumulative_weight + variant_weights.weight;
        
        IF random_value <= cumulative_weight THEN
            selected_variant := variant_weights.variant_id;
            EXIT;
        END IF;
    END LOOP;
    
    -- Se não selecionou (erro de arredondamento), pega a primeira
    IF selected_variant IS NULL THEN
        SELECT v.id INTO selected_variant
        FROM variants v
        WHERE v.experiment_id = exp_id
        ORDER BY v.created_at
        LIMIT 1;
    END IF;
    
    -- Salva atribuição
    INSERT INTO assignments (experiment_id, variant_id, visitor_id, context)
    VALUES (exp_id, selected_variant, assign_variant.visitor_id, context_data);
    
    RETURN selected_variant;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- FUNÇÕES PARA CACHE DE MÉTRICAS
-- ===================================================

-- Função para computar métricas de um experimento
CREATE OR REPLACE FUNCTION compute_experiment_metrics(exp_id UUID)
RETURNS VOID AS $$
DECLARE
    variant_rec RECORD;
    metric_data RECORD;
BEGIN
    -- Remove cache antigo
    DELETE FROM metrics_snapshots
    WHERE experiment_id = exp_id
    AND computed_at < (now() - INTERVAL '10 minutes');
    
    -- Calcula métricas para cada variante
    FOR variant_rec IN 
        SELECT id FROM variants WHERE experiment_id = exp_id
    LOOP
        -- Métricas de visitantes
        INSERT INTO metrics_snapshots (
            experiment_id, variant_id, metric_type, count, value
        )
        SELECT 
            exp_id,
            variant_rec.id,
            'visitors',
            COUNT(DISTINCT visitor_id),
            COUNT(DISTINCT visitor_id)
        FROM assignments
        WHERE experiment_id = exp_id
        AND variant_id = variant_rec.id;
        
        -- Métricas de conversões
        INSERT INTO metrics_snapshots (
            experiment_id, variant_id, metric_type, count, value
        )
        SELECT 
            exp_id,
            variant_rec.id,
            'conversions',
            COUNT(DISTINCT e.visitor_id),
            COUNT(DISTINCT e.visitor_id)
        FROM assignments a
        LEFT JOIN events e ON e.visitor_id = a.visitor_id
            AND e.experiment_id = a.experiment_id
            AND e.event_type = 'conversion'
        WHERE a.experiment_id = exp_id
        AND a.variant_id = variant_rec.id;
        
        -- Métricas de receita
        INSERT INTO metrics_snapshots (
            experiment_id, variant_id, metric_type, count, value
        )
        SELECT 
            exp_id,
            variant_rec.id,
            'revenue',
            COUNT(*),
            COALESCE(SUM(e.value), 0)
        FROM assignments a
        LEFT JOIN events e ON e.visitor_id = a.visitor_id
            AND e.experiment_id = a.experiment_id
            AND e.event_type = 'conversion'
            AND e.value IS NOT NULL
        WHERE a.experiment_id = exp_id
        AND a.variant_id = variant_rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- FUNÇÕES DE API PARA INTEGRAÇÃO
-- ===================================================

-- Função para autenticar via API key
CREATE OR REPLACE FUNCTION authenticate_api_key(api_key TEXT)
RETURNS UUID AS $$
DECLARE
    project_uuid UUID;
BEGIN
    SELECT id INTO project_uuid
    FROM projects
    WHERE public_key = api_key OR secret_key = api_key;
    
    IF project_uuid IS NULL THEN
        RAISE EXCEPTION 'Chave API inválida';
    END IF;
    
    -- Define a chave na sessão para RLS
    PERFORM set_config('app.api_key', api_key, true);
    
    RETURN project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar evento via API
CREATE OR REPLACE FUNCTION track_event(
    api_key TEXT,
    visitor_id TEXT,
    event_type TEXT,
    event_name TEXT,
    properties JSONB DEFAULT '{}',
    event_value NUMERIC DEFAULT NULL,
    experiment_key TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    project_uuid UUID;
    experiment_uuid UUID;
BEGIN
    -- Autentica
    project_uuid := authenticate_api_key(api_key);
    
    -- Busca experimento se fornecido
    IF experiment_key IS NOT NULL THEN
        SELECT e.id INTO experiment_uuid
        FROM experiments e
        WHERE e.project_id = project_uuid
        AND e.key = experiment_key
        AND e.status = 'running';
    END IF;
    
    -- Registra evento
    INSERT INTO events (
        project_id, experiment_id, visitor_id, 
        event_type, event_name, properties, value
    ) VALUES (
        project_uuid, experiment_uuid, visitor_id,
        event_type, event_name, properties, event_value
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================
-- TRIGGERS PARA MANUTENÇÃO AUTOMÁTICA
-- ===================================================

-- Função para limpeza automática de partições antigas
CREATE OR REPLACE FUNCTION cleanup_old_partitions()
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    cutoff_date DATE := CURRENT_DATE - INTERVAL '2 years';
BEGIN
    -- Lista partições antigas para remoção
    FOR partition_name IN
        SELECT schemaname||'.'||tablename
        FROM pg_tables
        WHERE tablename LIKE 'events_%'
        AND tablename ~ '\d{4}_\d{2}$'
        AND to_date(right(tablename, 7), 'YYYY_MM') < cutoff_date
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || partition_name;
        RAISE NOTICE 'Removida partição antiga: %', partition_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para criar partições futuras
CREATE OR REPLACE FUNCTION create_future_partitions()
RETURNS VOID AS $$
DECLARE
    start_date DATE := date_trunc('month', CURRENT_DATE + INTERVAL '1 month');
    i INTEGER;
BEGIN
    FOR i IN 0..2 LOOP
        PERFORM create_monthly_partition('events', start_date + (i || ' months')::INTERVAL);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- JOBS AGENDADOS (USANDO pg_cron se disponível)
-- ===================================================

-- Função para executar manutenção agendada
CREATE OR REPLACE FUNCTION scheduled_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Cria partições futuras
    PERFORM create_future_partitions();
    
    -- Remove partições antigas (se configurado)
    -- PERFORM cleanup_old_partitions();
    
    -- Atualiza cache de métricas para experimentos ativos
    PERFORM compute_experiment_metrics(id)
    FROM experiments
    WHERE status = 'running'
    AND updated_at > (now() - INTERVAL '24 hours');
    
    -- Remove snapshots muito antigos
    DELETE FROM metrics_snapshots
    WHERE computed_at < (now() - INTERVAL '7 days');
    
    RAISE NOTICE 'Manutenção automática executada em %', now();
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- COMENTÁRIOS DAS FUNÇÕES
-- ===================================================
COMMENT ON FUNCTION thompson_sampling_weights(UUID) IS 'Calcula pesos usando Thompson Sampling para Multi-Armed Bandit';
COMMENT ON FUNCTION ucb1_weights(UUID) IS 'Calcula pesos usando Upper Confidence Bound para MAB';
COMMENT ON FUNCTION epsilon_greedy_weights(UUID, NUMERIC) IS 'Calcula pesos usando Epsilon-Greedy para MAB';
COMMENT ON FUNCTION get_variant_weights(UUID) IS 'Função principal que retorna pesos baseado no algoritmo do experimento';
COMMENT ON FUNCTION assign_variant(UUID, TEXT, JSONB) IS 'Atribui visitante a uma variante usando algoritmo MAB';
COMMENT ON FUNCTION compute_experiment_metrics(UUID) IS 'Computa e cacheia métricas de um experimento';
COMMENT ON FUNCTION track_event(TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, TEXT) IS 'API para registrar eventos de tracking';
COMMENT ON FUNCTION authenticate_api_key(TEXT) IS 'Autentica e valida chave de API';
COMMENT ON FUNCTION scheduled_maintenance() IS 'Executa manutenção automática do sistema';
