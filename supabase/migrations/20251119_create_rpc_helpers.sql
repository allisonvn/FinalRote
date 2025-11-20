-- ==================================================================================
-- Criar funções RPC auxiliares para gerenciar project_settings
-- ==================================================================================

-- Remover função antiga problemática se existir
DROP FUNCTION IF EXISTS public.create_project_settings_table_if_not_exists();

-- Função para garantir que um projeto tem uma entrada em project_settings
CREATE OR REPLACE FUNCTION public.ensure_project_settings(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_count INTEGER;
BEGIN
    -- Verificar se a tabela existe (apenas checagem simples via catalogo)
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'project_settings'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Tabela project_settings não existe. Execute a migração 1 primeiro.',
            'action', 'error'
        );
    END IF;

    -- Verificar se já existe entrada para este projeto
    SELECT COUNT(*) INTO v_count
    FROM public.project_settings
    WHERE project_id = p_project_id;

    IF v_count = 0 THEN
        -- Inserir nova entrada
        INSERT INTO public.project_settings (project_id, allowed_domains_custom)
        VALUES (p_project_id, ARRAY[]::TEXT[]);

        v_result := json_build_object(
            'success', true,
            'message', 'Entrada de configuração do projeto criada',
            'action', 'created'
        );
    ELSE
        v_result := json_build_object(
            'success', true,
            'message', 'Entrada de configuração do projeto já existe',
            'action', 'exists'
        );
    END IF;

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM,
        'action', 'error'
    );
END;
$$;

-- Dar permissão para todos os roles executarem esta função
GRANT EXECUTE ON FUNCTION public.ensure_project_settings(UUID) 
TO authenticated, anon, service_role;

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ Função RPC ensure_project_settings criada com sucesso';
END $$;
