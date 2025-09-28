-- 20250926000007_add_experiments_update_policy.sql
-- Adicionar política de UPDATE para tabela experiments

-- Política de UPDATE para experiments
CREATE POLICY experiments_update_policy
    ON public.experiments
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR (
            user_has_project_access(project_id)
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR (
            user_has_project_access(project_id)
            AND user_id = auth.uid()
        )
    );

-- Política de DELETE para experiments
CREATE POLICY experiments_delete_policy
    ON public.experiments
    FOR DELETE
    USING (
        auth.role() = 'service_role'
        OR (
            user_has_project_access(project_id)
            AND user_id = auth.uid()
        )
    );

-- Política de UPDATE para variants
CREATE POLICY variants_update_policy
    ON public.variants
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR (
            user_has_project_access(experiment_id)
            AND EXISTS (
                SELECT 1 FROM public.experiments e
                WHERE e.id = variants.experiment_id
                AND e.user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR (
            user_has_project_access(experiment_id)
            AND EXISTS (
                SELECT 1 FROM public.experiments e
                WHERE e.id = variants.experiment_id
                AND e.user_id = auth.uid()
            )
        )
    );

-- Política de DELETE para variants
CREATE POLICY variants_delete_policy
    ON public.variants
    FOR DELETE
    USING (
        auth.role() = 'service_role'
        OR (
            user_has_project_access(experiment_id)
            AND EXISTS (
                SELECT 1 FROM public.experiments e
                WHERE e.id = variants.experiment_id
                AND e.user_id = auth.uid()
            )
        )
    );

-- Comentários para documentação
COMMENT ON POLICY experiments_update_policy ON public.experiments IS 'Permite atualização de experimentos pelo proprietário ou service_role';
COMMENT ON POLICY experiments_delete_policy ON public.experiments IS 'Permite exclusão de experimentos pelo proprietário ou service_role';
COMMENT ON POLICY variants_update_policy ON public.variants IS 'Permite atualização de variantes pelo proprietário do experimento ou service_role';
COMMENT ON POLICY variants_delete_policy ON public.variants IS 'Permite exclusão de variantes pelo proprietário do experimento ou service_role';
