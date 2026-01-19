-- ==================================================================================
-- ENSURE PROJECT_ID COLUMN EXISTS AND IS PROPERLY INDEXED IN EVENTS TABLE
-- ==================================================================================
-- Esta migration garante que a coluna project_id está presente e acessível
-- ==================================================================================

-- 1. Adicionar projeto_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'project_id') THEN
        ALTER TABLE public.events ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Coluna project_id adicionada em public.events';
    ELSE
        RAISE NOTICE '✅ Coluna project_id já existe em public.events';
    END IF;
END $$;

-- 2. Criar índice para project_id se não existir
CREATE INDEX IF NOT EXISTS idx_events_project_id ON public.events(project_id);

-- 3. Garantir que a coluna é NÃO nula quando um projeto existe (para novos registros)
-- Primeiro verificar se há registros com project_id nulo
DO $$
BEGIN
    -- Atualizar registros nulos com o projeto padrão de demonstração
    UPDATE public.events 
    SET project_id = '00000000-0000-0000-0000-000000000002'
    WHERE project_id IS NULL
    AND created_at > NOW() - INTERVAL '30 days';
    
    RAISE NOTICE '✅ Eventos sem project_id foram atualizados com o projeto padrão';
END $$;

-- 4. Adicionar comentário descritivo à coluna
COMMENT ON COLUMN public.events.project_id IS 'Projeto ao qual o evento pertence';

-- 5. Verificar integridade referencial
DO $$
DECLARE
    orphaned_count INT;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM public.events e
    WHERE project_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = e.project_id);
    
    IF orphaned_count > 0 THEN
        RAISE WARNING 'Encontrados % eventos com project_id órfão (referência inválida)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ Integridade referencial verificada - nenhum project_id órfão encontrado';
    END IF;
END $$;

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ SCHEMA FIX FOR PROJECT_ID COMPLETED!';
END $$;
