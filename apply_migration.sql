-- Aplicar migração para tornar projetos opcionais
-- Esta migração deve ser executada no Supabase SQL Editor

-- 1. Tornar project_id opcional
ALTER TABLE experiments ALTER COLUMN project_id DROP NOT NULL;

-- 2. Adicionar coluna created_by
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_experiments_created_by ON experiments(created_by);

-- 4. Atualizar políticas RLS para suportar experimentos sem projeto
DROP POLICY IF EXISTS "Usuários podem ver experimentos de projetos de suas organizações" ON experiments;
DROP POLICY IF EXISTS "Editors+ podem criar experimentos" ON experiments;
DROP POLICY IF EXISTS "Editors+ podem atualizar experimentos" ON experiments;
DROP POLICY IF EXISTS "Admins+ podem deletar experimentos" ON experiments;

-- Política de visualização atualizada
CREATE POLICY "Usuários podem ver experimentos" ON experiments
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            project_id IS NULL OR
            EXISTS (
                SELECT 1 FROM projects p
                JOIN organization_members om ON p.organization_id = om.organization_id
                WHERE p.id = experiments.project_id
                AND om.user_id = auth.uid()
            )
        )
    );

-- Política de criação atualizada
CREATE POLICY "Usuários podem criar experimentos" ON experiments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            project_id IS NULL OR
            EXISTS (
                SELECT 1 FROM projects p
                JOIN organization_members om ON p.organization_id = om.organization_id
                WHERE p.id = experiments.project_id
                AND om.user_id = auth.uid()
                AND om.role IN ('owner', 'admin', 'editor')
            )
        )
    );

-- Política de atualização atualizada
CREATE POLICY "Usuários podem atualizar seus experimentos" ON experiments
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            (project_id IS NULL AND created_by = auth.uid()) OR
            (project_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM projects p
                JOIN organization_members om ON p.organization_id = om.organization_id
                WHERE p.id = experiments.project_id
                AND om.user_id = auth.uid()
                AND om.role IN ('owner', 'admin', 'editor')
            ))
        )
    );

-- Política de deleção atualizada
CREATE POLICY "Usuários podem deletar seus experimentos" ON experiments
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            (project_id IS NULL AND created_by = auth.uid()) OR
            (project_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM projects p
                JOIN organization_members om ON p.organization_id = om.organization_id
                WHERE p.id = experiments.project_id
                AND om.user_id = auth.uid()
                AND om.role IN ('owner', 'admin')
            ))
        )
    );
