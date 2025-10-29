-- Create the project_settings table
CREATE TABLE project_settings (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    allowed_domains_custom TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for project_settings
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for project owners" ON project_settings
FOR SELECT USING (
    ("project_id" IN ( SELECT auth.uid() AS uid ))
);

CREATE POLICY "Enable insert for project owners" ON project_settings
FOR INSERT WITH CHECK (
    ("project_id" IN ( SELECT auth.uid() AS uid ))
);

CREATE POLICY "Enable update for project owners" ON project_settings
FOR UPDATE USING (
    ("project_id" IN ( SELECT auth.uid() AS uid ))
);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_settings_updated_at
BEFORE UPDATE ON project_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
