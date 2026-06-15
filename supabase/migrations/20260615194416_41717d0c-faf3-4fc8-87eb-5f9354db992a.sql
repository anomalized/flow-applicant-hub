DROP POLICY IF EXISTS "users: insert own profile" ON public.users;
CREATE POLICY "users: insert own profile" ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  id = auth.uid()
  AND workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  AND role IN ('owner','member')
);