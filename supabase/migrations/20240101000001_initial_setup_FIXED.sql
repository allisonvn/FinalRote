-- ===================================================
-- MIGRAÇÃO INICIAL - ROTA FINAL A/B TESTING PLATFORM (CORRIGIDA)
-- ===================================================
-- Criação das tabelas básicas de organizações e membros
-- Data: 2024-01-01
-- Versão: 1.0.1 (Corrigida)

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================
-- TABELA: organizations
-- ===================================================
-- Armazena organizações para sistema multi-tenant
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    slug TEXT NOT NULL UNIQUE CHECK (length(trim(slug)) > 0 AND slug ~ '^[a-z0-9-]+$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- TABELA: organization_members
-- ===================================================
-- Armazena membros das organizações com seus papéis
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Garante que um usuário pode estar apenas uma vez por organização
    UNIQUE(organization_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_role ON organization_members(role);

-- Trigger para updated_at automático
CREATE TRIGGER tr_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- TABELA: projects
-- ===================================================
-- Armazena projetos com chaves API e domínios permitidos
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    description TEXT,
    public_key TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL UNIQUE,
    allowed_origins TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_projects_public_key ON projects(public_key);
CREATE INDEX idx_projects_secret_key ON projects(secret_key);

-- Trigger para updated_at automático
CREATE TRIGGER tr_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- FUNÇÃO: Geração automática de chaves API
-- ===================================================
-- Gera chaves públicas e secretas únicas para projetos
CREATE OR REPLACE FUNCTION generate_api_keys()
RETURNS TRIGGER AS $$
BEGIN
    -- Gera chave pública no formato: rf_pk_xxxxxxxxx
    NEW.public_key = 'rf_pk_' || encode(gen_random_bytes(16), 'hex');
    
    -- Gera chave secreta no formato: rf_sk_xxxxxxxxx  
    NEW.secret_key = 'rf_sk_' || encode(gen_random_bytes(32), 'hex');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar chaves API automaticamente
CREATE TRIGGER tr_projects_generate_keys
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION generate_api_keys();

-- ===================================================
-- FUNÇÃO: Verificação de membros (RLS)
-- ===================================================
-- Função para verificar se usuário é membro de uma organização
CREATE OR REPLACE FUNCTION is_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Políticas para organizations
CREATE POLICY "Usuários podem ver organizações que são membros" ON organizations
    FOR SELECT USING (is_member(id));

CREATE POLICY "Usuários podem atualizar organizações se são admin/owner" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Qualquer usuário autenticado pode criar organizações" ON organizations
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Políticas para organization_members
CREATE POLICY "Usuários podem ver membros de suas organizações" ON organization_members
    FOR SELECT USING (is_member(organization_id));

CREATE POLICY "Owners podem gerenciar membros" ON organization_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role = 'owner'
        )
    );

CREATE POLICY "Admins podem adicionar/remover membros (exceto owners)" ON organization_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
        AND organization_members.role != 'owner'
    );

-- Políticas para projects
CREATE POLICY "Usuários podem ver projetos de suas organizações" ON projects
    FOR SELECT USING (is_member(organization_id));

CREATE POLICY "Editors+ podem criar projetos" ON projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = projects.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Admins+ podem atualizar projetos" ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = projects.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners podem deletar projetos" ON projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = projects.organization_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- ===================================================
-- COMENTÁRIOS DAS TABELAS
-- ===================================================
COMMENT ON TABLE organizations IS 'Organizações do sistema multi-tenant';
COMMENT ON TABLE organization_members IS 'Membros das organizações com papéis de acesso';
COMMENT ON TABLE projects IS 'Projetos com chaves API para integração';

COMMENT ON COLUMN organizations.slug IS 'Identificador único amigável para URLs';
COMMENT ON COLUMN projects.public_key IS 'Chave pública para uso no frontend (rf_pk_*)';
COMMENT ON COLUMN projects.secret_key IS 'Chave secreta para uso no backend (rf_sk_*)';
COMMENT ON COLUMN projects.allowed_origins IS 'Domínios permitidos para CORS';
