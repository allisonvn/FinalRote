-- =====================================================
-- Migration: Create Logs Tables
-- Description: Sistema de logs para auditoria e debugging
-- Version: 1.0.0
-- Date: 2025-11-19
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTION LOGS
-- =====================================================

DROP TABLE IF EXISTS public.subscription_logs CASCADE;

CREATE TABLE public.subscription_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event info
  event_type text NOT NULL, -- purchase, payment, late, canceled, upgraded, downgraded, blocked, unblocked, etc.
  event_source text NOT NULL, -- kiwify, manual, system, cron, user

  -- Status changes
  old_status text,
  new_status text,

  -- Plan changes
  old_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  new_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,

  -- Additional data
  metadata jsonb DEFAULT '{}'::jsonb,
  -- Example: {"payment_amount": 99.90, "payment_method": "credit_card", "reason": "user_request"}

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscription_logs_subscription_id ON public.subscription_logs(subscription_id);
CREATE INDEX idx_subscription_logs_user_id ON public.subscription_logs(user_id);
CREATE INDEX idx_subscription_logs_event_type ON public.subscription_logs(event_type);
CREATE INDEX idx_subscription_logs_event_source ON public.subscription_logs(event_source);
CREATE INDEX idx_subscription_logs_created_at ON public.subscription_logs(created_at DESC);

-- Partitioning by month (opcional, para projetos grandes)
-- CREATE TABLE subscription_logs_2024_01 PARTITION OF subscription_logs
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Comments
COMMENT ON TABLE public.subscription_logs IS 'Log de todos os eventos relacionados a assinaturas';
COMMENT ON COLUMN public.subscription_logs.event_type IS 'Tipo de evento: purchase, payment, late, canceled, etc.';
COMMENT ON COLUMN public.subscription_logs.event_source IS 'Origem do evento: kiwify, manual, system, cron, user';

-- Enable RLS
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription logs"
  ON public.subscription_logs
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can view all subscription logs"
  ON public.subscription_logs
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert subscription logs"
  ON public.subscription_logs
  FOR INSERT
  WITH CHECK (true); -- Qualquer serviço autenticado pode criar logs

-- =====================================================
-- 2. EMAIL LOGS
-- =====================================================

DROP TABLE IF EXISTS public.email_logs CASCADE;

CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Email info
  template text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,

  -- Status
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),

  -- Provider info (Resend)
  provider_id text, -- Resend email ID
  provider_response jsonb,

  -- Error tracking
  error_message text,
  error_code text,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz
);

-- Indexes
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_template ON public.email_logs(template);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX idx_email_logs_provider_id ON public.email_logs(provider_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Comments
COMMENT ON TABLE public.email_logs IS 'Log de todos os emails enviados pelo sistema';
COMMENT ON COLUMN public.email_logs.template IS 'Nome do template usado';
COMMENT ON COLUMN public.email_logs.provider_id IS 'ID do email no Resend';

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own email logs"
  ON public.email_logs
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can view all email logs"
  ON public.email_logs
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert email logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 3. KIWIFY WEBHOOKS
-- =====================================================

DROP TABLE IF EXISTS public.kiwify_webhooks CASCADE;

CREATE TABLE public.kiwify_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook info
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  signature text,

  -- Headers (para debugging)
  headers jsonb,

  -- Processing
  processed boolean DEFAULT false,
  processed_at timestamptz,
  processing_attempts integer DEFAULT 0,
  error_message text,

  -- Timestamps
  received_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_kiwify_webhooks_event_type ON public.kiwify_webhooks(event_type);
CREATE INDEX idx_kiwify_webhooks_processed ON public.kiwify_webhooks(processed);
CREATE INDEX idx_kiwify_webhooks_received_at ON public.kiwify_webhooks(received_at DESC);
CREATE INDEX idx_kiwify_webhooks_created_at ON public.kiwify_webhooks(created_at DESC);

-- Index for unprocessed webhooks (for retry logic)
CREATE INDEX idx_kiwify_webhooks_unprocessed ON public.kiwify_webhooks(received_at)
  WHERE processed = false AND processing_attempts < 5;

-- Comments
COMMENT ON TABLE public.kiwify_webhooks IS 'Log de todos os webhooks recebidos da Kiwify';
COMMENT ON COLUMN public.kiwify_webhooks.processed IS 'Se o webhook já foi processado com sucesso';
COMMENT ON COLUMN public.kiwify_webhooks.processing_attempts IS 'Número de tentativas de processamento';

-- Enable RLS
ALTER TABLE public.kiwify_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (apenas admins podem ver)
CREATE POLICY "Admins can view all webhooks"
  ON public.kiwify_webhooks
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert webhooks"
  ON public.kiwify_webhooks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update webhooks"
  ON public.kiwify_webhooks
  FOR UPDATE
  USING (true);

-- =====================================================
-- 4. AUDIT LOGS (LOGS GERAIS DO SISTEMA)
-- =====================================================

DROP TABLE IF EXISTS public.audit_logs CASCADE;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who performed the action
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,

  -- Action info
  action text NOT NULL, -- login, logout, update_profile, create_project, delete_experiment, etc.
  resource_type text, -- user, subscription, plan, experiment, project, etc.
  resource_id uuid,

  -- Changes (para UPDATE actions)
  old_values jsonb,
  new_values jsonb,

  -- Request info
  ip_address inet,
  user_agent text,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_ip_address ON public.audit_logs(ip_address);

-- Comments
COMMENT ON TABLE public.audit_logs IS 'Log de auditoria de todas as ações importantes do sistema';

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Log subscription event
CREATE OR REPLACE FUNCTION log_subscription_event(
  p_subscription_id uuid,
  p_user_id uuid,
  p_event_type text,
  p_event_source text,
  p_old_status text DEFAULT NULL,
  p_new_status text DEFAULT NULL,
  p_old_plan_id uuid DEFAULT NULL,
  p_new_plan_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.subscription_logs (
    subscription_id,
    user_id,
    event_type,
    event_source,
    old_status,
    new_status,
    old_plan_id,
    new_plan_id,
    metadata
  ) VALUES (
    p_subscription_id,
    p_user_id,
    p_event_type,
    p_event_source,
    p_old_status,
    p_new_status,
    p_old_plan_id,
    p_new_plan_id,
    p_metadata
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log email
CREATE OR REPLACE FUNCTION log_email(
  p_user_id uuid,
  p_template text,
  p_recipient text,
  p_subject text,
  p_status text DEFAULT 'sent',
  p_provider_id text DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.email_logs (
    user_id,
    template,
    recipient,
    subject,
    status,
    provider_id,
    error_message,
    metadata
  ) VALUES (
    p_user_id,
    p_template,
    p_recipient,
    p_subject,
    p_status,
    p_provider_id,
    p_error_message,
    p_metadata
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log audit action
CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
  user_email_val text;
BEGIN
  -- Get user email
  SELECT email INTO user_email_val FROM auth.users WHERE id = p_user_id;

  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    user_email_val,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Log subscription changes automatically
CREATE OR REPLACE FUNCTION auto_log_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log on UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_subscription_event(
        NEW.id,
        NEW.user_id,
        'status_changed',
        'system',
        OLD.status,
        NEW.status,
        OLD.plan_id,
        NEW.plan_id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;

    -- Log plan changes
    IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
      PERFORM log_subscription_event(
        NEW.id,
        NEW.user_id,
        CASE
          WHEN NEW.plan_id IS NULL THEN 'plan_removed'
          WHEN OLD.plan_id IS NULL THEN 'plan_added'
          ELSE 'plan_changed'
        END,
        'system',
        OLD.status,
        NEW.status,
        OLD.plan_id,
        NEW.plan_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_log_subscription_changes
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_log_subscription_changes();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 103_create_logs.sql completed successfully';
  RAISE NOTICE 'Created tables: subscription_logs, email_logs, kiwify_webhooks, audit_logs';
  RAISE NOTICE 'Created helper functions for logging';
  RAISE NOTICE 'Created automatic subscription change logging trigger';
END $$;
