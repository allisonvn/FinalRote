-- Temporary migration to allow authenticated users to read events
-- This is for development purposes - in production, keep the stricter RLS

-- Drop existing restrictive policy
DROP POLICY IF EXISTS events_select_by_org ON events;

-- Create more permissive policy for authenticated users
CREATE POLICY events_select_authenticated ON events
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Keep strict insert policy (only service role or org members can insert)
-- This ensures data integrity while allowing read access for testing

COMMENT ON POLICY events_select_authenticated ON events IS
  'Allows any authenticated user to read events - FOR DEVELOPMENT ONLY';
