-- ==================================================================================
-- ADICIONAR API KEYS AOS PROJETOS
-- ==================================================================================
-- Esta migração adiciona suporte para API keys públicas e secretas nos projetos
-- ==================================================================================

-- 1. Adicionar colunas de API keys se não existirem
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS public_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS secret_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS allowed_origins TEXT[] DEFAULT ARRAY['*']::TEXT[];

-- 2. Criar função para gerar API keys automaticamente
CREATE OR REPLACE FUNCTION public.generate_project_api_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Gerar public_key se não fornecida
    IF NEW.public_key IS NULL OR NEW.public_key = '' THEN
        NEW.public_key := 'rf_pk_' || encode(gen_random_bytes(24), 'hex');
    END IF;

    -- Gerar secret_key se não fornecida
    IF NEW.secret_key IS NULL OR NEW.secret_key = '' THEN
        NEW.secret_key := 'rf_sk_' || encode(gen_random_bytes(32), 'hex');
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Criar trigger para auto-geração
DROP TRIGGER IF EXISTS auto_generate_project_api_keys ON public.projects;
CREATE TRIGGER auto_generate_project_api_keys
    BEFORE INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_project_api_keys();

-- 4. Gerar keys para projetos existentes que não têm
UPDATE public.projects
SET
    public_key = COALESCE(public_key, 'rf_pk_' || encode(gen_random_bytes(24), 'hex')),
    secret_key = COALESCE(secret_key, 'rf_sk_' || encode(gen_random_bytes(32), 'hex')),
    allowed_origins = COALESCE(allowed_origins, ARRAY['*']::TEXT[])
WHERE public_key IS NULL OR secret_key IS NULL;

-- 5. Criar índices para busca rápida por API key
CREATE INDEX IF NOT EXISTS idx_projects_public_key ON public.projects(public_key);
CREATE INDEX IF NOT EXISTS idx_projects_secret_key ON public.projects(secret_key);

-- 6. Função para validar API key
CREATE OR REPLACE FUNCTION public.validate_api_key(api_key TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_id UUID;
BEGIN
    -- Tentar encontrar por public_key primeiro
    SELECT id INTO project_id
    FROM public.projects
    WHERE public_key = api_key OR secret_key = api_key;

    RETURN project_id;
END;
$$;

-- 7. Função para regenerar API keys de um projeto
CREATE OR REPLACE FUNCTION public.regenerate_project_keys(project_uuid UUID)
RETURNS TABLE(new_public_key TEXT, new_secret_key TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_pk TEXT;
    new_sk TEXT;
BEGIN
    -- Verificar permissão
    IF auth.role() != 'service_role' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organization_members om ON om.org_id = p.org_id
            WHERE p.id = project_uuid
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin')
        ) THEN
            RAISE EXCEPTION 'Unauthorized to regenerate keys';
        END IF;
    END IF;

    -- Gerar novas keys
    new_pk := 'rf_pk_' || encode(gen_random_bytes(24), 'hex');
    new_sk := 'rf_sk_' || encode(gen_random_bytes(32), 'hex');

    -- Atualizar projeto
    UPDATE public.projects
    SET
        public_key = new_pk,
        secret_key = new_sk,
        updated_at = NOW()
    WHERE id = project_uuid;

    RETURN QUERY SELECT new_pk, new_sk;
END;
$$;

-- 8. Grants
GRANT EXECUTE ON FUNCTION public.validate_api_key(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.regenerate_project_keys(UUID) TO authenticated;

-- 9. Comentários
COMMENT ON COLUMN public.projects.public_key IS 'API key pública para uso no frontend (prefixo rf_pk_)';
COMMENT ON COLUMN public.projects.secret_key IS 'API key secreta para uso no backend (prefixo rf_sk_)';
COMMENT ON COLUMN public.projects.allowed_origins IS 'Lista de origens permitidas para CORS (* = todas)';
COMMENT ON FUNCTION public.validate_api_key IS 'Valida uma API key e retorna o project_id';
COMMENT ON FUNCTION public.regenerate_project_keys IS 'Regenera as API keys de um projeto';

-- 10. Verificação
DO $$
DECLARE
    projects_with_keys INTEGER;
BEGIN
    SELECT COUNT(*) INTO projects_with_keys
    FROM public.projects
    WHERE public_key IS NOT NULL AND secret_key IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ API KEYS CONFIGURADAS!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Projetos com API keys: %', projects_with_keys;
    RAISE NOTICE '========================================';
END $$;
