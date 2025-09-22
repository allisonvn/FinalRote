-- ===================================================
-- MIGRAÇÃO: TORNAR PROJETOS OPCIONAIS - ROTA FINAL
-- ===================================================
-- Remove a obrigatoriedade de projetos nos experimentos
-- Data: 2024-01-01
-- Versão: 1.0.6

-- ===================================================
-- MODIFICAR TABELA EXPERIMENTS
-- ===================================================

-- Remover a constraint NOT NULL de project_id
ALTER TABLE experiments ALTER COLUMN project_id DROP NOT NULL;

-- Remover a constraint UNIQUE que incluía project_id
ALTER TABLE experiments DROP CONSTRAINT experiments_project_id_key;

-- Criar nova constraint UNIQUE que funciona com ou sem project_id
-- Se project_id for NULL, apenas key deve ser único globalmente
-- Se project_id não for NULL, key deve ser único por projeto
DROP INDEX IF EXISTS idx_experiments_unique_key;
CREATE UNIQUE INDEX idx_experiments_unique_key ON experiments (
    COALESCE(project_id::text, 'global'), key
);

-- ===================================================
-- ATUALIZAR FUNÇÕES DE VALIDAÇÃO
-- ===================================================

-- Atualizar função de geração de chave para trabalhar sem project_id
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
                WHERE (
                    (NEW.project_id IS NULL AND project_id IS NULL) OR
                    (NEW.project_id IS NOT NULL AND project_id = NEW.project_id)
                )
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

-- ===================================================
-- ATUALIZAR POLÍTICAS RLS
-- ===================================================

-- Remover políticas existentes para experiments
DROP POLICY IF EXISTS "Usuários podem ver experimentos de projetos de suas organizações" ON experiments;
DROP POLICY IF EXISTS "Editors+ podem criar experimentos" ON experiments;
DROP POLICY IF EXISTS "Editors+ podem atualizar experimentos" ON experiments;
DROP POLICY IF EXISTS "Admins+ podem deletar experimentos" ON experiments;

-- Criar novas políticas que suportam experimentos sem projeto

-- Visualização:
-- - Experimentos sem projeto: todos os usuários autenticados podem ver
-- - Experimentos com projeto: apenas membros da organização
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

-- Criação:
-- - Experimentos sem projeto: usuários autenticados podem criar
-- - Experimentos com projeto: apenas editors+ da organização
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

-- Atualização:
-- - Experimentos sem projeto: apenas o criador pode atualizar
-- - Experimentos com projeto: editors+ da organização
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

-- Deleção:
-- - Experimentos sem projeto: apenas o criador pode deletar
-- - Experimentos com projeto: admins+ da organização
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

-- ===================================================
-- ADICIONAR COLUNA CREATED_BY
-- ===================================================

-- Adicionar coluna created_by para rastrear criador do experimento
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_experiments_created_by ON experiments(created_by);

-- Trigger para definir created_by automaticamente
CREATE OR REPLACE FUNCTION set_experiment_created_by()
RETURNS TRIGGER AS $$
BEGIN
    -- Define created_by apenas na inserção, se não foi especificado
    IF TG_OP = 'INSERT' AND NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_experiments_set_created_by
    BEFORE INSERT ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION set_experiment_created_by();

-- ===================================================
-- ATUALIZAR POLÍTICAS DE VARIANTES E GOALS
-- ===================================================

-- Atualizar políticas de variants para suportar experimentos sem projeto
DROP POLICY IF EXISTS "Usuários podem ver variantes de experimentos acessíveis" ON variants;
DROP POLICY IF EXISTS "Editors+ podem gerenciar variantes" ON variants;

CREATE POLICY "Usuários podem ver variantes" ON variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM experiments e
            WHERE e.id = variants.experiment_id
            AND (
                e.project_id IS NULL OR
                EXISTS (
                    SELECT 1 FROM projects p
                    JOIN organization_members om ON p.organization_id = om.organization_id
                    WHERE p.id = e.project_id
                    AND om.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Usuários podem gerenciar variantes" ON variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM experiments e
            WHERE e.id = variants.experiment_id
            AND (
                (e.project_id IS NULL AND e.created_by = auth.uid()) OR
                (e.project_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM projects p
                    JOIN organization_members om ON p.organization_id = om.organization_id
                    WHERE p.id = e.project_id
                    AND om.user_id = auth.uid()
                    AND om.role IN ('owner', 'admin', 'editor')
                ))
            )
        )
    );

-- Atualizar políticas de goals
DROP POLICY IF EXISTS "Usuários podem ver metas de experimentos acessíveis" ON goals;
DROP POLICY IF EXISTS "Editors+ podem gerenciar metas" ON goals;

CREATE POLICY "Usuários podem ver metas" ON goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM experiments e
            WHERE e.id = goals.experiment_id
            AND (
                e.project_id IS NULL OR
                EXISTS (
                    SELECT 1 FROM projects p
                    JOIN organization_members om ON p.organization_id = om.organization_id
                    WHERE p.id = e.project_id
                    AND om.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Usuários podem gerenciar metas" ON goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM experiments e
            WHERE e.id = goals.experiment_id
            AND (
                (e.project_id IS NULL AND e.created_by = auth.uid()) OR
                (e.project_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM projects p
                    JOIN organization_members om ON p.organization_id = om.organization_id
                    WHERE p.id = e.project_id
                    AND om.user_id = auth.uid()
                    AND om.role IN ('owner', 'admin', 'editor')
                ))
            )
        )
    );

-- ===================================================
-- COMENTÁRIOS ATUALIZADOS
-- ===================================================
COMMENT ON COLUMN experiments.project_id IS 'ID do projeto (opcional - NULL para experimentos pessoais)';
COMMENT ON COLUMN experiments.created_by IS 'ID do usuário que criou o experimento';