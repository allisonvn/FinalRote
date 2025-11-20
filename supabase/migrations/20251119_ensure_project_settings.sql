-- ==================================================================================
-- Criar tabela project_settings se não existir
-- ==================================================================================
-- Esta migração garante que a tabela project_settings existe com a estrutura correta
-- e todas as policies RLS aplicadas

-- Criar a tabela se não existir
CREATE TABLE IF NOT EXISTS public.project_settings (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    allowed_domains_custom TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir que a tabela tem RLS habilitado
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Enable read access for project owners" ON public.project_settings;
DROP POLICY IF EXISTS "Enable insert for project owners" ON public.project_settings;
DROP POLICY IF EXISTS "Enable update for project owners" ON public.project_settings;
DROP POLICY IF EXISTS "Enable service role access" ON public.project_settings;

-- Criar policy para leitura - service role pode ler tudo
CREATE POLICY "service_role_read_all" ON public.project_settings
FOR SELECT TO service_role
USING (true);

-- Criar policy para insert - service role pode inserir
CREATE POLICY "service_role_insert" ON public.project_settings
FOR INSERT TO service_role
WITH CHECK (true);

-- Criar policy para update - service role pode atualizar
CREATE POLICY "service_role_update" ON public.project_settings
FOR UPDATE TO service_role
USING (true);

-- Criar policy para delete - service role pode deletar
CREATE POLICY "service_role_delete" ON public.project_settings
FOR DELETE TO service_role
USING (true);

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_project_settings_updated_at ON public.project_settings;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_project_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_project_settings_updated_at
BEFORE UPDATE ON public.project_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_project_settings_updated_at();

-- Garantir índices para performance
CREATE INDEX IF NOT EXISTS idx_project_settings_project_id ON public.project_settings(project_id);

-- Refresh schema cache
SELECT pg_catalog.pg_sleep(1);

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela project_settings criada/verificada com sucesso';
    RAISE NOTICE '✅ RLS policies aplicadas para service_role';
    RAISE NOTICE '✅ Trigger para updated_at criado';
    RAISE NOTICE '✅ Schema cache será atualizado em poucos momentos';
END $$;

