-- ==================================================================================
-- MIGRATION: Add Missing Tables for Logs, Usage, and Views
-- ==================================================================================
-- Esta migration adiciona tabelas de log e views que são esperadas pelo código
-- ==================================================================================

-- 1. TABELA: webhook_logs - Para registrar webhooks recebidos
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON public.webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- RLS para webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_webhook_logs" ON public.webhook_logs;
CREATE POLICY "service_role_all_webhook_logs" ON public.webhook_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. TABELA: email_logs - Adicionar coluna user_id à tabela existente
-- NOTA: A tabela email_logs já existe com estrutura diferente
-- Esta migration adiciona apenas a coluna user_id que estava faltando
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'user_id') THEN
        ALTER TABLE public.email_logs ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
        RAISE NOTICE '✅ Coluna user_id adicionada em email_logs';
    END IF;
END $$;

-- RLS para email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_email_logs" ON public.email_logs;
CREATE POLICY "service_role_all_email_logs" ON public.email_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_read_own_emails" ON public.email_logs;
CREATE POLICY "users_read_own_emails" ON public.email_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 3. TABELA: subscription_logs - Adicionar coluna org_id faltante
-- NOTA: A tabela subscription_logs já existe, apenas adicionamos a coluna org_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_logs' AND column_name = 'org_id') THEN
        ALTER TABLE public.subscription_logs ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Coluna org_id adicionada em subscription_logs';
    END IF;
END $$;

-- RLS para subscription_logs
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_subscription_logs" ON public.subscription_logs;
CREATE POLICY "service_role_all_subscription_logs" ON public.subscription_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_read_own_subscription_logs" ON public.subscription_logs;
CREATE POLICY "users_read_own_subscription_logs" ON public.subscription_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 4. ADICIONAR COLUNAS FALTANTES EM subscriptions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end') THEN
        ALTER TABLE public.subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Coluna cancel_at_period_end adicionada em subscriptions';
    END IF;
END $$;

-- 5. ADICIONAR COLUNAS FALTANTES EM organizations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_blocked') THEN
        ALTER TABLE public.organizations ADD COLUMN is_blocked BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Coluna is_blocked adicionada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'blocked_reason') THEN
        ALTER TABLE public.organizations ADD COLUMN blocked_reason TEXT;
        RAISE NOTICE '✅ Coluna blocked_reason adicionada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'blocked_at') THEN
        ALTER TABLE public.organizations ADD COLUMN blocked_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Coluna blocked_at adicionada';
    END IF;
END $$;

-- 6. PERMISSÕES GERAIS
GRANT ALL ON public.webhook_logs TO service_role;
GRANT ALL ON public.email_logs TO service_role;
GRANT ALL ON public.subscription_logs TO service_role;
GRANT SELECT ON public.email_logs TO authenticated;
GRANT SELECT ON public.subscription_logs TO authenticated;

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ MIGRATION COMPLETED: Missing logs and views tables created!';
END $$;
