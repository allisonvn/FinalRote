-- Tabela de administradores do sistema
-- Esta tabela armazena os IDs de usuários que têm acesso ao painel administrativo /root-panel

CREATE TABLE IF NOT EXISTS system_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(user_id)
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_system_admins_user_id ON system_admins(user_id);

-- RLS: Apenas service role pode manipular esta tabela
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- Política: Nenhum usuário normal pode ler/escrever nesta tabela
-- O acesso é feito via service role nas APIs admin
CREATE POLICY "System admins table is service role only"
  ON system_admins
  FOR ALL
  USING (false);

-- Comentário na tabela
COMMENT ON TABLE system_admins IS 'Tabela de administradores do sistema com acesso ao /root-panel';
COMMENT ON COLUMN system_admins.user_id IS 'ID do usuário que é administrador';
COMMENT ON COLUMN system_admins.created_by IS 'ID do admin que adicionou este admin';
COMMENT ON COLUMN system_admins.notes IS 'Notas sobre o admin (motivo de adição, etc)';

-- Função para verificar se um usuário é admin do sistema
CREATE OR REPLACE FUNCTION is_system_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM system_admins WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar coluna is_blocked na tabela profiles se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Adicionar coluna phone na tabela profiles se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Adicionar colunas de subscription na tabela organizations se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_plan TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_started_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_canceled_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_canceled_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE organizations ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Índice para busca por status de assinatura
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status
  ON organizations(subscription_status);
