-- Expose only community-safe profile fields (no email).
-- security_invoker=false runs as view owner and bypasses user_profiles RLS for these columns.

DROP POLICY IF EXISTS "Authenticated users can read community profiles" ON public.user_profiles;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE OR REPLACE VIEW public.community_profiles
WITH (security_invoker = false) AS
SELECT
  id,
  display_name,
  streak,
  total_notes,
  created_at
FROM public.user_profiles;

GRANT SELECT ON public.community_profiles TO authenticated;
