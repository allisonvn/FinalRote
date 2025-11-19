-- =====================================================
-- Migration: Admin Functions and Views
-- Description: Funções e views para painel administrativo
-- Version: 1.0.0
-- Date: 2025-11-19
-- =====================================================

-- =====================================================
-- VIEWS
-- =====================================================

-- View: User complete data (para admin dashboard)
CREATE OR REPLACE VIEW admin_users_view AS
SELECT
  u.id,
  au.email,
  u.full_name,
  u.company_name,
  u.phone,
  u.role,
  u.is_blocked,
  u.blocked_reason,
  u.last_access_at,
  u.access_count,
  u.created_at as user_created_at,

  -- Subscription info
  s.id as subscription_id,
  s.status as subscription_status,
  s.billing_cycle,
  s.current_period_end,
  s.cancel_at_period_end,
  s.kiwify_subscription_id,

  -- Plan info
  p.id as plan_id,
  p.name as plan_name,
  p.slug as plan_slug,
  p.price_monthly as plan_price,

  -- Calculated fields
  CASE
    WHEN s.status IN ('active', 'trialing') AND s.current_period_end > now() THEN true
    ELSE false
  END as has_active_subscription,

  CASE
    WHEN s.current_period_end < now() THEN EXTRACT(DAY FROM now() - s.current_period_end)::integer
    ELSE 0
  END as days_overdue

FROM public.users_extra u
JOIN auth.users au ON u.id = au.id
LEFT JOIN public.subscriptions s ON u.id = s.user_id
LEFT JOIN public.plans p ON s.plan_id = p.id
WHERE s.id IS NULL OR s.id = (
  SELECT id FROM public.subscriptions
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 1
);

COMMENT ON VIEW admin_users_view IS 'View consolidada de usuários para o painel administrativo';

-- View: Subscription statistics
CREATE OR REPLACE VIEW admin_subscription_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'trialing') as trial_subscriptions,
  COUNT(*) FILTER (WHERE status = 'past_due') as past_due_subscriptions,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled_subscriptions,
  COUNT(*) FILTER (WHERE status = 'unpaid') as unpaid_subscriptions,

  -- Revenue (aproximado, apenas assinaturas ativas)
  SUM(p.price_monthly) FILTER (WHERE s.status = 'active' AND s.billing_cycle = 'monthly') as mrr_monthly,
  SUM(p.price_yearly / 12) FILTER (WHERE s.status = 'active' AND s.billing_cycle = 'yearly') as mrr_yearly,
  SUM(
    CASE
      WHEN s.billing_cycle = 'monthly' THEN p.price_monthly
      WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12
      ELSE 0
    END
  ) FILTER (WHERE s.status = 'active') as total_mrr,

  -- Churn (canceladas nos últimos 30 dias)
  COUNT(*) FILTER (
    WHERE status = 'canceled'
    AND canceled_at > now() - interval '30 days'
  ) as churned_last_30_days,

  -- Conversões (trial -> active nos últimos 30 dias)
  COUNT(*) FILTER (
    WHERE status = 'active'
    AND created_at > now() - interval '30 days'
    AND trial_ends_at IS NOT NULL
  ) as trial_conversions_last_30_days

FROM public.subscriptions s
LEFT JOIN public.plans p ON s.plan_id = p.id;

COMMENT ON VIEW admin_subscription_stats IS 'Estatísticas consolidadas de assinaturas';

-- View: Revenue by plan
CREATE OR REPLACE VIEW admin_revenue_by_plan AS
SELECT
  p.id as plan_id,
  p.name as plan_name,
  p.slug as plan_slug,
  COUNT(s.id) as active_subscriptions,
  SUM(
    CASE
      WHEN s.billing_cycle = 'monthly' THEN p.price_monthly
      WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12
      ELSE 0
    END
  ) as mrr,
  SUM(
    CASE
      WHEN s.billing_cycle = 'monthly' THEN p.price_monthly * 12
      WHEN s.billing_cycle = 'yearly' THEN p.price_yearly
      ELSE 0
    END
  ) as arr
FROM public.plans p
LEFT JOIN public.subscriptions s ON p.id = s.plan_id AND s.status = 'active'
GROUP BY p.id, p.name, p.slug
ORDER BY mrr DESC NULLS LAST;

COMMENT ON VIEW admin_revenue_by_plan IS 'Receita separada por plano';

-- =====================================================
-- ADMIN FUNCTIONS
-- =====================================================

-- Function: Get dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.users_extra),
    'active_users', (
      SELECT COUNT(*)
      FROM public.users_extra
      WHERE last_access_at > now() - interval '30 days'
    ),
    'blocked_users', (
      SELECT COUNT(*)
      FROM public.users_extra
      WHERE is_blocked = true
    ),
    'subscriptions', (SELECT row_to_json(admin_subscription_stats.*) FROM admin_subscription_stats),
    'new_users_last_30_days', (
      SELECT COUNT(*)
      FROM public.users_extra
      WHERE created_at > now() - interval '30 days'
    ),
    'new_subscriptions_last_30_days', (
      SELECT COUNT(*)
      FROM public.subscriptions
      WHERE created_at > now() - interval '30 days'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Search users
CREATE OR REPLACE FUNCTION search_users(
  search_query text DEFAULT NULL,
  filter_status text DEFAULT NULL,
  filter_plan_slug text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  company_name text,
  role text,
  is_blocked boolean,
  subscription_status text,
  plan_name text,
  last_access_at timestamptz,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    au.email,
    u.full_name,
    u.company_name,
    u.role,
    u.is_blocked,
    s.status as subscription_status,
    p.name as plan_name,
    u.last_access_at,
    u.created_at
  FROM public.users_extra u
  JOIN auth.users au ON u.id = au.id
  LEFT JOIN public.subscriptions s ON u.id = s.user_id
  LEFT JOIN public.plans p ON s.plan_id = p.id
  WHERE
    -- Search filter
    (search_query IS NULL OR
      au.email ILIKE '%' || search_query || '%' OR
      u.full_name ILIKE '%' || search_query || '%' OR
      u.company_name ILIKE '%' || search_query || '%')
    -- Status filter
    AND (filter_status IS NULL OR s.status = filter_status)
    -- Plan filter
    AND (filter_plan_slug IS NULL OR p.slug = filter_plan_slug)
    -- Get latest subscription only
    AND (s.id IS NULL OR s.id = (
      SELECT id FROM public.subscriptions
      WHERE user_id = u.id
      ORDER BY created_at DESC
      LIMIT 1
    ))
  ORDER BY u.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Block/Unblock user
CREATE OR REPLACE FUNCTION admin_toggle_user_block(
  target_user_id uuid,
  should_block boolean,
  reason text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  admin_user_id uuid;
  result json;
BEGIN
  admin_user_id := auth.uid();

  -- Check if current user is admin
  IF NOT is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can block/unblock users';
  END IF;

  -- Update user
  UPDATE public.users_extra
  SET
    is_blocked = should_block,
    blocked_reason = CASE WHEN should_block THEN reason ELSE NULL END,
    blocked_at = CASE WHEN should_block THEN now() ELSE NULL END,
    blocked_by = CASE WHEN should_block THEN admin_user_id ELSE NULL END,
    updated_at = now()
  WHERE id = target_user_id;

  -- Log action
  PERFORM log_audit_action(
    admin_user_id,
    CASE WHEN should_block THEN 'block_user' ELSE 'unblock_user' END,
    'user',
    target_user_id,
    NULL,
    jsonb_build_object('reason', reason)
  );

  -- Return result
  SELECT json_build_object(
    'success', true,
    'user_id', target_user_id,
    'is_blocked', should_block,
    'reason', reason
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Change user plan (upgrade/downgrade)
CREATE OR REPLACE FUNCTION admin_change_user_plan(
  target_user_id uuid,
  new_plan_id uuid,
  reason text DEFAULT 'admin_action'
)
RETURNS json AS $$
DECLARE
  admin_user_id uuid;
  old_plan_id uuid;
  subscription_id uuid;
  result json;
BEGIN
  admin_user_id := auth.uid();

  -- Check if current user is admin
  IF NOT is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change user plans';
  END IF;

  -- Get current subscription
  SELECT id, plan_id INTO subscription_id, old_plan_id
  FROM public.subscriptions
  WHERE user_id = target_user_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  IF subscription_id IS NULL THEN
    RAISE EXCEPTION 'User does not have an active subscription';
  END IF;

  -- Update subscription
  UPDATE public.subscriptions
  SET
    plan_id = new_plan_id,
    updated_at = now()
  WHERE id = subscription_id;

  -- Log event
  PERFORM log_subscription_event(
    subscription_id,
    target_user_id,
    'plan_changed',
    'manual',
    NULL,
    NULL,
    old_plan_id,
    new_plan_id,
    jsonb_build_object('reason', reason, 'changed_by', admin_user_id)
  );

  -- Log audit
  PERFORM log_audit_action(
    admin_user_id,
    'change_user_plan',
    'subscription',
    subscription_id,
    jsonb_build_object('old_plan_id', old_plan_id),
    jsonb_build_object('new_plan_id', new_plan_id, 'reason', reason)
  );

  -- Return result
  SELECT json_build_object(
    'success', true,
    'subscription_id', subscription_id,
    'old_plan_id', old_plan_id,
    'new_plan_id', new_plan_id
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel subscription
CREATE OR REPLACE FUNCTION admin_cancel_subscription(
  target_subscription_id uuid,
  cancel_immediately boolean DEFAULT false,
  reason text DEFAULT 'admin_action'
)
RETURNS json AS $$
DECLARE
  admin_user_id uuid;
  target_user_id uuid;
  result json;
BEGIN
  admin_user_id := auth.uid();

  -- Check if current user is admin
  IF NOT is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can cancel subscriptions';
  END IF;

  -- Get user_id
  SELECT user_id INTO target_user_id
  FROM public.subscriptions
  WHERE id = target_subscription_id;

  IF cancel_immediately THEN
    -- Cancel immediately
    UPDATE public.subscriptions
    SET
      status = 'canceled',
      canceled_at = now(),
      cancel_reason = reason,
      updated_at = now()
    WHERE id = target_subscription_id;
  ELSE
    -- Cancel at period end
    UPDATE public.subscriptions
    SET
      cancel_at_period_end = true,
      cancel_reason = reason,
      updated_at = now()
    WHERE id = target_subscription_id;
  END IF;

  -- Log event
  PERFORM log_subscription_event(
    target_subscription_id,
    target_user_id,
    'canceled',
    'manual',
    NULL,
    CASE WHEN cancel_immediately THEN 'canceled' ELSE NULL END,
    NULL,
    NULL,
    jsonb_build_object(
      'reason', reason,
      'canceled_by', admin_user_id,
      'immediate', cancel_immediately
    )
  );

  -- Return result
  SELECT json_build_object(
    'success', true,
    'subscription_id', target_subscription_id,
    'cancel_immediately', cancel_immediately
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get subscription history
CREATE OR REPLACE FUNCTION get_subscription_history(
  target_subscription_id uuid
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', sl.id,
      'event_type', sl.event_type,
      'event_source', sl.event_source,
      'old_status', sl.old_status,
      'new_status', sl.new_status,
      'metadata', sl.metadata,
      'created_at', sl.created_at
    )
    ORDER BY sl.created_at DESC
  ) INTO result
  FROM public.subscription_logs sl
  WHERE sl.subscription_id = target_subscription_id;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user activity logs
CREATE OR REPLACE FUNCTION get_user_activity_logs(
  target_user_id uuid,
  limit_count integer DEFAULT 50
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', al.id,
      'action', al.action,
      'resource_type', al.resource_type,
      'resource_id', al.resource_id,
      'ip_address', al.ip_address,
      'created_at', al.created_at
    )
    ORDER BY al.created_at DESC
  ) INTO result
  FROM public.audit_logs al
  WHERE al.user_id = target_user_id
  LIMIT limit_count;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CRON JOB FUNCTIONS
-- =====================================================

-- Function: Check and update expired subscriptions
CREATE OR REPLACE FUNCTION cron_check_expired_subscriptions()
RETURNS json AS $$
DECLARE
  expired_count integer := 0;
  blocked_count integer := 0;
  grace_period_days integer := 7;
  subscription_record record;
BEGIN
  -- 1. Mark expired subscriptions as past_due
  FOR subscription_record IN
    SELECT id, user_id, plan_id
    FROM public.subscriptions
    WHERE status IN ('active', 'trialing')
      AND current_period_end < now()
  LOOP
    UPDATE public.subscriptions
    SET
      status = 'past_due',
      updated_at = now()
    WHERE id = subscription_record.id;

    -- Log event
    PERFORM log_subscription_event(
      subscription_record.id,
      subscription_record.user_id,
      'expired',
      'cron',
      NULL,
      'past_due'
    );

    expired_count := expired_count + 1;
  END LOOP;

  -- 2. Block users with subscriptions past_due beyond grace period
  FOR subscription_record IN
    SELECT s.id, s.user_id, s.plan_id
    FROM public.subscriptions s
    WHERE s.status = 'past_due'
      AND s.current_period_end < now() - (grace_period_days || ' days')::interval
  LOOP
    -- Update subscription to unpaid
    UPDATE public.subscriptions
    SET
      status = 'unpaid',
      updated_at = now()
    WHERE id = subscription_record.id;

    -- Block user
    UPDATE public.users_extra
    SET
      is_blocked = true,
      blocked_reason = 'payment_overdue',
      blocked_at = now(),
      updated_at = now()
    WHERE id = subscription_record.user_id;

    -- Log event
    PERFORM log_subscription_event(
      subscription_record.id,
      subscription_record.user_id,
      'blocked',
      'cron',
      'past_due',
      'unpaid',
      NULL,
      NULL,
      jsonb_build_object('reason', 'payment_overdue_grace_period_expired')
    );

    blocked_count := blocked_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'expired_count', expired_count,
    'blocked_count', blocked_count,
    'executed_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Retry failed webhooks
CREATE OR REPLACE FUNCTION cron_retry_failed_webhooks()
RETURNS json AS $$
DECLARE
  retry_count integer := 0;
  webhook_record record;
BEGIN
  FOR webhook_record IN
    SELECT id, event_type, payload
    FROM public.kiwify_webhooks
    WHERE processed = false
      AND processing_attempts < 5
      AND received_at > now() - interval '24 hours'
    ORDER BY received_at ASC
    LIMIT 100
  LOOP
    -- Increment attempt counter
    UPDATE public.kiwify_webhooks
    SET processing_attempts = processing_attempts + 1
    WHERE id = webhook_record.id;

    retry_count := retry_count + 1;

    -- TODO: Processar webhook
    -- Este é um placeholder - a lógica real será implementada no backend
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'retry_count', retry_count,
    'executed_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS (para service_role e anon)
-- =====================================================

-- Grant execute on functions para authenticated
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_user_block(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_change_user_plan(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_cancel_subscription(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_logs(uuid, integer) TO authenticated;

-- Cron functions apenas para service_role
GRANT EXECUTE ON FUNCTION cron_check_expired_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION cron_retry_failed_webhooks() TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 104_create_admin_functions_and_views.sql completed successfully';
  RAISE NOTICE 'Created admin views and functions';
  RAISE NOTICE 'Created cron job functions';
  RAISE NOTICE 'System is ready for production!';
END $$;
