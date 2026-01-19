-- =====================================================
-- Migration: Add Missing Fields to visitor_sessions
-- Description: Adiciona campos usados pelo codigo de tracking
-- Version: 1.0.0
-- Date: 2026-01-17
-- =====================================================

-- Adicionar campos faltantes na tabela visitor_sessions
-- Campos usados em: src/app/api/track/route.ts:257-281

-- 1. Adicionar project_id (FK para projects)
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- 2. Adicionar campos de request/session
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS referrer text;

-- 3. Adicionar campos de browser detalhados
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS browser_name text,
ADD COLUMN IF NOT EXISTS browser_version text;

-- 4. Adicionar campos de OS detalhados
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS os_name text,
ADD COLUMN IF NOT EXISTS os_version text;

-- 5. Adicionar campo de resolucao de tela
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS screen_resolution text;

-- 6. Adicionar campo de ultima atividade
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- 7. Adicionar campos de click IDs (ads tracking)
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS fbclid text,
ADD COLUMN IF NOT EXISTS gclid text,
ADD COLUMN IF NOT EXISTS msclkid text,
ADD COLUMN IF NOT EXISTS ttclid text;

-- 8. Adicionar metricas adicionais
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS page_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversions integer DEFAULT 0;

-- 9. Adicionar constraint unique se nao existir
-- Primeiro verificar se ja existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_project_visitor_session'
  ) THEN
    -- Tentar adicionar, ignorar se falhar por dados duplicados
    BEGIN
      ALTER TABLE public.visitor_sessions
      ADD CONSTRAINT unique_project_visitor_session
      UNIQUE (project_id, visitor_id, session_id);
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'Constraint unique_project_visitor_session could not be added due to duplicate data';
    END;
  END IF;
END $$;

-- 10. Criar indices para os novos campos
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_project_id
ON public.visitor_sessions(project_id);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_project_started
ON public.visitor_sessions(project_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_activity
ON public.visitor_sessions(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_lookup
ON public.visitor_sessions(project_id, visitor_id, session_id);

-- 11. Atualizar politica de INSERT para permitir anon (SDK publico)
DROP POLICY IF EXISTS "visitor_sessions_insert_authenticated" ON public.visitor_sessions;

CREATE POLICY "visitor_sessions_insert_public" ON public.visitor_sessions
FOR INSERT WITH CHECK (true);

-- 12. Atualizar politica de SELECT para membros do projeto
DROP POLICY IF EXISTS "visitor_sessions_select_all" ON public.visitor_sessions;

CREATE POLICY "visitor_sessions_select_by_project" ON public.visitor_sessions
FOR SELECT USING (
  auth.role() = 'service_role'
  OR auth.role() = 'anon'
  OR EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.organization_members om ON p.org_id = om.org_id
    WHERE p.id = visitor_sessions.project_id
      AND om.user_id = auth.uid()
  )
);

-- 13. Adicionar politica de UPDATE para service_role
CREATE POLICY IF NOT EXISTS "visitor_sessions_update_service" ON public.visitor_sessions
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 14. Comentarios
COMMENT ON COLUMN public.visitor_sessions.project_id IS 'Projeto ao qual a sessao pertence';
COMMENT ON COLUMN public.visitor_sessions.user_agent IS 'User-Agent do navegador';
COMMENT ON COLUMN public.visitor_sessions.ip_address IS 'IP do visitante (anonimizado se necessario)';
COMMENT ON COLUMN public.visitor_sessions.browser_name IS 'Nome do navegador (Chrome, Firefox, etc)';
COMMENT ON COLUMN public.visitor_sessions.screen_resolution IS 'Resolucao da tela (ex: 1920x1080)';
COMMENT ON COLUMN public.visitor_sessions.fbclid IS 'Facebook Click ID';
COMMENT ON COLUMN public.visitor_sessions.gclid IS 'Google Click ID';

-- 15. Verificacao final
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'visitor_sessions';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table visitor_sessions now has % columns', col_count;
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added:';
  RAISE NOTICE '  - project_id (FK to projects)';
  RAISE NOTICE '  - user_agent, ip_address, referrer';
  RAISE NOTICE '  - browser_name, browser_version';
  RAISE NOTICE '  - os_name, os_version';
  RAISE NOTICE '  - screen_resolution';
  RAISE NOTICE '  - last_activity_at';
  RAISE NOTICE '  - fbclid, gclid, msclkid, ttclid';
  RAISE NOTICE '  - page_views, conversions';
  RAISE NOTICE '========================================';
END $$;
