
-- Tighten users INSERT policy: workspace must be owned by inserting user
DROP POLICY IF EXISTS "users: insert own profile" ON public.users;
CREATE POLICY "users: insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  AND workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
);

-- Tighten users UPDATE policy: prevent role/workspace_id changes at policy level
DROP POLICY IF EXISTS "users: update self" ON public.users;
CREATE POLICY "users: update self"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  AND workspace_id = (SELECT workspace_id FROM public.users WHERE id = auth.uid())
);

-- Ensure the update guard trigger is attached as defense-in-depth
DROP TRIGGER IF EXISTS users_prevent_role_change ON public.users;
CREATE TRIGGER users_prevent_role_change
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_role_change();
