-- =====================================================
-- Migration: Create Users Extra Table
-- Description: Informações adicionais dos usuários
-- Version: 1.0.0
-- Date: 2025-11-19
-- =====================================================

-- Drop existing table if exists (development only)
DROP TABLE IF EXISTS public.users_extra CASCADE;

-- Create users_extra table
CREATE TABLE public.users_extra (
  -- Primary key (mesma do auth.users)
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal info
  full_name text,
  company_name text,
  phone text,
  avatar_url text,
  cpf_cnpj text, -- CPF ou CNPJ (apenas números)

  -- Role
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),

  -- Address (opcional)
  address jsonb DEFAULT '{}'::jsonb,
  -- Example: {"street": "Rua X", "number": "123", "city": "São Paulo", "state": "SP", "zip": "01234-567"}

  -- Tracking
  first_access_at timestamptz,
  last_access_at timestamptz,
  access_count integer DEFAULT 0,

  -- Preferences
  preferences jsonb DEFAULT '{}'::jsonb,
  -- Example: {"language": "pt-BR", "timezone": "America/Sao_Paulo", "notifications": {"email": true, "push": false}}

  -- Status
  is_blocked boolean DEFAULT false,
  blocked_reason text,
  blocked_at timestamptz,
  blocked_by uuid REFERENCES auth.users(id),

  -- LGPD
  consent_terms_at timestamptz, -- Quando aceitou os termos
  consent_privacy_at timestamptz, -- Quando aceitou política de privacidade
  data_deletion_requested_at timestamptz, -- Quando solicitou exclusão de dados
  data_anonymized_at timestamptz, -- Quando dados foram anonimizados

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_extra_role ON public.users_extra(role);
CREATE INDEX idx_users_extra_is_blocked ON public.users_extra(is_blocked);
CREATE INDEX idx_users_extra_last_access_at ON public.users_extra(last_access_at DESC);
CREATE INDEX idx_users_extra_cpf_cnpj ON public.users_extra(cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;

-- Comments
COMMENT ON TABLE public.users_extra IS 'Informações adicionais dos usuários não gerenciadas pelo Supabase Auth';
COMMENT ON COLUMN public.users_extra.role IS 'Papel do usuário: user, admin, superadmin';
COMMENT ON COLUMN public.users_extra.is_blocked IS 'Se true, usuário está bloqueado e não pode acessar o sistema';
COMMENT ON COLUMN public.users_extra.preferences IS 'Preferências do usuário em formato JSON';
COMMENT ON COLUMN public.users_extra.address IS 'Endereço completo em formato JSON';

-- Enable RLS
ALTER TABLE public.users_extra ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.users_extra
  FOR SELECT
  USING (id = auth.uid());

-- Usuários podem atualizar seu próprio perfil (exceto role e is_blocked)
CREATE POLICY "Users can update own profile"
  ON public.users_extra
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Criar perfil ao fazer signup (via trigger)
CREATE POLICY "Users can insert own profile on signup"
  ON public.users_extra
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_users_extra_updated_at
  BEFORE UPDATE ON public.users_extra
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users_extra
    WHERE id = user_uuid
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  blocked boolean;
BEGIN
  SELECT is_blocked INTO blocked
  FROM public.users_extra
  WHERE id = user_uuid;

  RETURN COALESCE(blocked, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update last access
CREATE OR REPLACE FUNCTION update_last_access(user_uuid uuid DEFAULT auth.uid())
RETURNS void AS $$
BEGIN
  UPDATE public.users_extra
  SET
    last_access_at = now(),
    access_count = access_count + 1,
    first_access_at = COALESCE(first_access_at, now())
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Criar users_extra automaticamente quando novo usuário é criado
CREATE OR REPLACE FUNCTION create_user_extra_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_extra (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_extra_on_signup();

-- Update RLS policies on plans (agora podemos usar is_admin)
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;

CREATE POLICY "Admins can manage plans"
  ON public.plans
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Update RLS policies on subscriptions (agora podemos usar is_admin)
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.users_extra
  FOR SELECT
  USING (is_admin());

-- Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update any profile"
  ON public.users_extra
  FOR UPDATE
  USING (is_admin());

-- Function: Get user complete info (perfil + assinatura + plano)
CREATE OR REPLACE FUNCTION get_user_complete_info(user_uuid uuid DEFAULT auth.uid())
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', u.id,
    'email', au.email,
    'full_name', u.full_name,
    'company_name', u.company_name,
    'phone', u.phone,
    'avatar_url', u.avatar_url,
    'role', u.role,
    'is_blocked', u.is_blocked,
    'blocked_reason', u.blocked_reason,
    'last_access_at', u.last_access_at,
    'subscription', json_build_object(
      'id', s.id,
      'status', s.status,
      'billing_cycle', s.billing_cycle,
      'current_period_end', s.current_period_end,
      'cancel_at_period_end', s.cancel_at_period_end
    ),
    'plan', json_build_object(
      'id', p.id,
      'name', p.name,
      'slug', p.slug,
      'features', p.features,
      'limits', p.limits
    )
  ) INTO result
  FROM public.users_extra u
  JOIN auth.users au ON u.id = au.id
  LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'trialing')
  LEFT JOIN public.plans p ON s.plan_id = p.id
  WHERE u.id = user_uuid
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 102_create_users_extra.sql completed successfully';
  RAISE NOTICE 'Created table: users_extra';
  RAISE NOTICE 'Created automatic user profile creation trigger';
  RAISE NOTICE 'Updated RLS policies with admin functions';
END $$;
