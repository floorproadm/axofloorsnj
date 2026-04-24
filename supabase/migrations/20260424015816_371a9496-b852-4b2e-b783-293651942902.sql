-- Allow partner users to update their own partner record (limited fields enforced via UI)
CREATE POLICY "partners_self_update"
ON public.partners
FOR UPDATE
TO authenticated
USING (id = public.get_partner_id_for_user())
WITH CHECK (id = public.get_partner_id_for_user());