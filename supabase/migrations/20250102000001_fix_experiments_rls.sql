-- 20250102000001_fix_experiments_rls.sql
-- Corrigir política RLS da tabela experiments para permitir acesso aos próprios experimentos

-- Habilitar RLS na tabela experiments se não estiver habilitado
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- Remover política existente se houver
DROP POLICY IF EXISTS experiments_select_policy ON public.experiments;

-- Criar nova política de SELECT que permite ao usuário ver seus próprios experimentos
CREATE POLICY experiments_select_policy
    ON public.experiments
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR created_by = auth.uid()
        OR user_id = auth.uid()
    );

-- Atualizar política de INSERT para usar created_by
DROP POLICY IF EXISTS experiments_insert_policy ON public.experiments;

CREATE POLICY experiments_insert_policy
    ON public.experiments
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR created_by = auth.uid()
    );

-- Atualizar política de UPDATE
DROP POLICY IF EXISTS experiments_update_policy ON public.experiments;

CREATE POLICY experiments_update_policy
    ON public.experiments
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR created_by = auth.uid()
        OR user_id = auth.uid()
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR created_by = auth.uid()
        OR user_id = auth.uid()
    );

-- Atualizar política de DELETE
DROP POLICY IF EXISTS experiments_delete_policy ON public.experiments;

CREATE POLICY experiments_delete_policy
    ON public.experiments
    FOR DELETE
    USING (
        auth.role() = 'service_role'
        OR created_by = auth.uid()
        OR user_id = auth.uid()
    );

-- Comentários para documentação
COMMENT ON POLICY experiments_select_policy ON public.experiments IS 'Permite visualização de experimentos pelo proprietário (created_by ou user_id) ou service_role';
COMMENT ON POLICY experiments_insert_policy ON public.experiments IS 'Permite criação de experimentos pelo usuário autenticado ou service_role';
COMMENT ON POLICY experiments_update_policy ON public.experiments IS 'Permite atualização de experimentos pelo proprietário ou service_role';
COMMENT ON POLICY experiments_delete_policy ON public.experiments IS 'Permite exclusão de experimentos pelo proprietário ou service_role';
