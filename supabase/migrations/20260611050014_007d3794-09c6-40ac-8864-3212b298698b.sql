
DROP POLICY IF EXISTS "workspaces: owner can delete" ON public.workspaces;
CREATE POLICY "workspaces: owner can delete"
ON public.workspaces
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());
