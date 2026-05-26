/*
  Security audit log + tighten data access:
  - Append-only audit_log (service role writes only)
  - Remove anonymous public read on user_notes (require authentication)
  - Restrict note_impacts reads to owner-only
*/

-- =============================================================================
-- audit_log (append-only, no client updates/deletes)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  ip text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (edge functions) can insert; clients have no access.

-- =============================================================================
-- user_notes: require authentication (no anonymous reads)
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can read notes" ON user_notes;

CREATE POLICY "Authenticated users can read community notes"
  ON user_notes
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- note_impacts: owner-only reads (remove broad authenticated read)
-- =============================================================================

DROP POLICY IF EXISTS "Public can read impacts for stats" ON note_impacts;

-- "Users can read own impacts" should already exist from earlier migration.

-- Aggregated platform stats without exposing per-user impact rows.
CREATE OR REPLACE FUNCTION get_collective_impact_stats()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE sql
AS $$
  SELECT jsonb_build_object(
    'total_co2_kg', COALESCE(SUM(co2_saved_kg), 0),
    'total_plastic_g', COALESCE(SUM(plastic_saved_g), 0),
    'total_water_liters', COALESCE(SUM(water_saved_liters), 0),
    'total_energy_kwh', COALESCE(SUM(energy_saved_kwh), 0),
    'category_breakdown', COALESCE(
      (
        SELECT jsonb_object_agg(action_category, cnt)
        FROM (
          SELECT action_category, COUNT(*)::int AS cnt
          FROM note_impacts
          GROUP BY action_category
        ) c
      ),
      '{}'::jsonb
    )
  )
  FROM note_impacts;
$$;

GRANT EXECUTE ON FUNCTION get_collective_impact_stats() TO authenticated;
