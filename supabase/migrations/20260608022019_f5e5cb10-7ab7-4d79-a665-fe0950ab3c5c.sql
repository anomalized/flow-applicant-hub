
-- 1) Restrict applications/candidates public insert to valid open jobs
DROP POLICY IF EXISTS "apps public insert" ON public.applications;
CREATE POLICY "apps public insert"
  ON public.applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.workspace_id = applications.workspace_id
        AND j.status = 'open'
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = applications.candidate_id
        AND c.workspace_id = applications.workspace_id
    )
  );

DROP POLICY IF EXISTS "candidates public insert" ON public.candidates;
CREATE POLICY "candidates public insert"
  ON public.candidates FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.workspace_id = candidates.workspace_id
        AND j.status = 'open'
    )
  );

-- 2) Workspaces: drop overly broad anon read; provide safe lookup function
DROP POLICY IF EXISTS "workspaces: anyone can read by slug" ON public.workspaces;

CREATE OR REPLACE FUNCTION public.get_public_workspace_by_slug(_slug text)
RETURNS TABLE (id uuid, name text, slug text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id, w.name, w.slug, w.logo_url
  FROM public.workspaces w
  WHERE w.slug = _slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_workspace_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_workspace_by_slug(text) TO anon, authenticated;

-- 3) Workspace themes: drop overly broad anon read; safe lookup by slug
DROP POLICY IF EXISTS "themes public read" ON public.workspace_themes;

CREATE OR REPLACE FUNCTION public.get_public_theme_by_slug(_slug text)
RETURNS TABLE (
  primary_color text,
  accent_color text,
  bg_color text,
  surface_color text,
  text_color text,
  font_family text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.primary_color, t.accent_color, t.bg_color, t.surface_color, t.text_color, t.font_family
  FROM public.workspace_themes t
  JOIN public.workspaces w ON w.id = t.workspace_id
  WHERE w.slug = _slug AND t.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_theme_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_theme_by_slug(text) TO anon, authenticated;

-- 4) Prevent users from escalating their own role
CREATE OR REPLACE FUNCTION public.prevent_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role cannot be changed by user';
  END IF;
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    RAISE EXCEPTION 'workspace_id cannot be changed by user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_prevent_role_change ON public.users;
CREATE TRIGGER users_prevent_role_change
BEFORE UPDATE ON public.users
FOR EACH ROW
WHEN (current_setting('role', true) <> 'service_role')
EXECUTE FUNCTION public.prevent_user_role_change();

-- 5) Restrict current_workspace_id() execution to authenticated only
REVOKE ALL ON FUNCTION public.current_workspace_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_workspace_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_workspace_id() TO authenticated, service_role;

-- 6) Realtime: scope channel subscriptions to user's workspace
-- Authorize only subscriptions whose topic equals the user's workspace id.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='realtime' AND c.relname='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "realtime workspace subscribe" ON realtime.messages';
    EXECUTE $p$CREATE POLICY "realtime workspace subscribe" ON realtime.messages
      FOR SELECT TO authenticated
      USING (
        (realtime.topic())::text = ('activity-' || public.current_workspace_id()::text)
      )$p$;
  END IF;
END$$;
