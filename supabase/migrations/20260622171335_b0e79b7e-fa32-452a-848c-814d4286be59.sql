
GRANT SELECT ON public.visualizer_usage TO authenticated;
CREATE POLICY "platform admins read visualizer usage"
  ON public.visualizer_usage
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));
