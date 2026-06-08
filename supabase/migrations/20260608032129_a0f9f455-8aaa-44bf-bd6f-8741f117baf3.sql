
-- 1) activity_log: enforce actor_id = auth.uid()
DROP POLICY IF EXISTS "activity ws insert" ON public.activity_log;
CREATE POLICY "activity ws insert self" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id() AND actor_id = auth.uid());

-- 2) Drop unused anon insert policies on candidates and applications
DROP POLICY IF EXISTS "candidates public insert" ON public.candidates;
DROP POLICY IF EXISTS "apps public insert" ON public.applications;

-- 3) Replace anon SELECT on jobs with workspace-scoped RPC
DROP POLICY IF EXISTS "jobs public read" ON public.jobs;

CREATE OR REPLACE FUNCTION public.list_public_jobs_by_slug(_slug text)
RETURNS TABLE(id uuid, title text, department text, description text, due_date date, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.id, j.title, j.department, j.description, j.due_date, j.created_at
  FROM public.jobs j
  JOIN public.workspaces w ON w.id = j.workspace_id
  WHERE w.slug = _slug AND j.status = 'open'
  ORDER BY j.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_public_jobs_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_jobs_by_slug(text) TO anon, authenticated, service_role;
