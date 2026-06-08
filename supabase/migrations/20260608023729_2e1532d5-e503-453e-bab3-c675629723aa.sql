
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

-- Replace write policies to require admin/owner role
-- jobs
DROP POLICY IF EXISTS "jobs ws write" ON public.jobs;
CREATE POLICY "jobs ws write admin" ON public.jobs
  FOR ALL TO authenticated
  USING (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'))
  WITH CHECK (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'));

-- candidates
DROP POLICY IF EXISTS "candidates ws write" ON public.candidates;
CREATE POLICY "candidates ws write admin" ON public.candidates
  FOR ALL TO authenticated
  USING (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'))
  WITH CHECK (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'));

-- applications
DROP POLICY IF EXISTS "apps ws write" ON public.applications;
CREATE POLICY "apps ws write admin" ON public.applications
  FOR ALL TO authenticated
  USING (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'))
  WITH CHECK (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'));

-- interviews
DROP POLICY IF EXISTS "interviews ws write" ON public.interviews;
CREATE POLICY "interviews ws write admin" ON public.interviews
  FOR ALL TO authenticated
  USING (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'))
  WITH CHECK (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'));

-- offers
DROP POLICY IF EXISTS "offers ws write" ON public.offers;
CREATE POLICY "offers ws write admin" ON public.offers
  FOR ALL TO authenticated
  USING (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'))
  WITH CHECK (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'));

-- workspace_themes
DROP POLICY IF EXISTS "themes ws write" ON public.workspace_themes;
CREATE POLICY "themes ws write admin" ON public.workspace_themes
  FOR ALL TO authenticated
  USING (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'))
  WITH CHECK (workspace_id = public.current_workspace_id() AND public.current_user_role() IN ('admin','owner'));
