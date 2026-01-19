-- ==================================================================================
-- ADD UTM COLUMNS AND JSONB INDEXES TO EVENTS TABLE
-- ==================================================================================
-- Esta migration adiciona colunas diretas para campos UTM frequentemente filtrados
-- e índices GIN para queries JSONB mais eficientes
-- ==================================================================================

-- Adicionar colunas diretas para campos frequentemente filtrados
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Criar índices para performance de queries UTM
CREATE INDEX IF NOT EXISTS idx_events_utm_source ON public.events(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_utm_medium ON public.events(utm_medium) WHERE utm_medium IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_utm_campaign ON public.events(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_device_type ON public.events(device_type) WHERE device_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_browser ON public.events(browser) WHERE browser IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_country ON public.events(country) WHERE country IS NOT NULL;

-- Índice GIN para queries JSONB (para casos onde colunas diretas não são suficientes)
CREATE INDEX IF NOT EXISTS idx_events_event_data_gin ON public.events USING GIN (event_data jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_events_utm_data_gin ON public.events USING GIN (utm_data jsonb_path_ops);

-- Migrar dados existentes do JSONB para as novas colunas
UPDATE public.events SET
    utm_source = COALESCE(utm_source, utm_data->>'utm_source', event_data->>'utm_source'),
    utm_medium = COALESCE(utm_medium, utm_data->>'utm_medium', event_data->>'utm_medium'),
    utm_campaign = COALESCE(utm_campaign, utm_data->>'utm_campaign', event_data->>'utm_campaign'),
    utm_term = COALESCE(utm_term, utm_data->>'utm_term', event_data->>'utm_term'),
    utm_content = COALESCE(utm_content, utm_data->>'utm_content', event_data->>'utm_content'),
    device_type = COALESCE(device_type, event_data->>'device_type'),
    browser = COALESCE(browser, event_data->>'browser'),
    country = COALESCE(country, event_data->>'country'),
    os = COALESCE(os, event_data->>'os'),
    city = COALESCE(city, event_data->>'city'),
    session_id = COALESCE(session_id, event_data->>'session_id'),
    referrer = COALESCE(referrer, event_data->>'referrer')
WHERE 
    utm_source IS NULL 
    OR utm_medium IS NULL 
    OR utm_campaign IS NULL 
    OR device_type IS NULL 
    OR browser IS NULL 
    OR country IS NULL;

-- Trigger para automaticamente extrair UTM e device data de novos eventos
CREATE OR REPLACE FUNCTION public.extract_event_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Extrair UTM data
    NEW.utm_source := COALESCE(NEW.utm_source, NEW.utm_data->>'utm_source', NEW.event_data->>'utm_source');
    NEW.utm_medium := COALESCE(NEW.utm_medium, NEW.utm_data->>'utm_medium', NEW.event_data->>'utm_medium');
    NEW.utm_campaign := COALESCE(NEW.utm_campaign, NEW.utm_data->>'utm_campaign', NEW.event_data->>'utm_campaign');
    NEW.utm_term := COALESCE(NEW.utm_term, NEW.utm_data->>'utm_term', NEW.event_data->>'utm_term');
    NEW.utm_content := COALESCE(NEW.utm_content, NEW.utm_data->>'utm_content', NEW.event_data->>'utm_content');
    
    -- Extrair device/browser data
    NEW.device_type := COALESCE(NEW.device_type, NEW.event_data->>'device_type');
    NEW.browser := COALESCE(NEW.browser, NEW.event_data->>'browser');
    NEW.country := COALESCE(NEW.country, NEW.event_data->>'country');
    NEW.os := COALESCE(NEW.os, NEW.event_data->>'os');
    NEW.city := COALESCE(NEW.city, NEW.event_data->>'city');
    NEW.session_id := COALESCE(NEW.session_id, NEW.event_data->>'session_id');
    NEW.referrer := COALESCE(NEW.referrer, NEW.event_data->>'referrer');
    
    RETURN NEW;
END;
$$;

-- Drop trigger se existir e criar novamente
DROP TRIGGER IF EXISTS extract_event_metadata_trigger ON public.events;
CREATE TRIGGER extract_event_metadata_trigger
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.extract_event_metadata();

-- Comentários
COMMENT ON COLUMN public.events.utm_source IS 'UTM Source extraído automaticamente de utm_data ou event_data';
COMMENT ON COLUMN public.events.utm_medium IS 'UTM Medium extraído automaticamente de utm_data ou event_data';
COMMENT ON COLUMN public.events.utm_campaign IS 'UTM Campaign extraído automaticamente de utm_data ou event_data';
COMMENT ON COLUMN public.events.device_type IS 'Tipo de dispositivo (desktop, mobile, tablet)';
COMMENT ON COLUMN public.events.browser IS 'Nome do navegador';
COMMENT ON COLUMN public.events.country IS 'País de origem do evento';

-- Verificação
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ UTM COLUMNS MIGRATION COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added columns: utm_source, utm_medium, utm_campaign, utm_term, utm_content';
    RAISE NOTICE 'Added columns: device_type, browser, country, os, city, session_id, referrer';
    RAISE NOTICE 'Created indexes for fast filtering';
    RAISE NOTICE 'Created trigger for automatic extraction';
    RAISE NOTICE '========================================';
END $$;
