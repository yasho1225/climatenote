/*
  Gamification hardening:
  - Use set_config bypass (not ALTER TABLE) for profile/goal stat sync
  - Cap goal progress at target_value to satisfy valid_progress CHECK
  - Sync goal progress on note delete
  - App timezone (America/Chicago) for goal expiry and progress
  - Client-callable refresh_user_goals RPC
*/

-- =============================================================================
-- Profile stats: set_config bypass (matches enforce_user_profile_update_rules)
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_profile_stats(p_user_id uuid)
RETURNS user_profiles
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  stats record;
  result user_profiles;
BEGIN
  SELECT * INTO stats FROM compute_profile_streak(p_user_id);

  PERFORM set_config('app.profile_stats_sync', 'on', true);

  UPDATE user_profiles
  SET
    total_notes = stats.total_notes,
    streak = stats.streak,
    last_note_date = stats.last_note_date,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO result;

  PERFORM set_config('app.profile_stats_sync', 'off', true);

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('app.profile_stats_sync', 'off', true);
    RAISE;
END;
$$;

-- =============================================================================
-- Goal progress: shared sync + insert/delete triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_user_goal_progress(p_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.goal_progress_sync', 'on', true);

  UPDATE user_goals
  SET
    current_progress = LEAST(
      (
        SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'America/Chicago')::date)
        FROM user_notes
        WHERE user_id = p_user_id
          AND (created_at AT TIME ZONE 'America/Chicago')::date >= user_goals.start_date
          AND (created_at AT TIME ZONE 'America/Chicago')::date <= user_goals.end_date
      ),
      target_value
    ),
    updated_at = now()
  WHERE user_id = p_user_id
    AND goal_type = 'streak'
    AND status = 'active';

  UPDATE user_goals
  SET
    current_progress = LEAST(
      (
        SELECT COUNT(*)::integer
        FROM user_notes
        WHERE user_id = p_user_id
          AND (created_at AT TIME ZONE 'America/Chicago')::date >= user_goals.start_date
          AND (created_at AT TIME ZONE 'America/Chicago')::date <= user_goals.end_date
      ),
      target_value
    ),
    updated_at = now()
  WHERE user_id = p_user_id
    AND goal_type = 'action_count'
    AND status = 'active';

  UPDATE user_goals
  SET
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_progress >= target_value
    AND completed_at IS NULL;

  PERFORM set_config('app.goal_progress_sync', 'off', true);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('app.goal_progress_sync', 'off', true);
    RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM sync_user_goal_progress(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_goal_progress ON user_notes;
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT OR DELETE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

-- =============================================================================
-- Goal expiry: app timezone + client-callable refresh
-- =============================================================================

CREATE OR REPLACE FUNCTION check_expired_goals()
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  app_today date;
BEGIN
  app_today := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago')::date;

  UPDATE user_goals
  SET status = 'pending_decision'
  WHERE status = 'active'
    AND end_date < app_today
    AND current_progress < target_value;

  INSERT INTO goal_decision_queue (goal_id, user_id, expired_at, decision_deadline)
  SELECT
    g.id,
    g.user_id,
    now(),
    now() + INTERVAL '48 hours'
  FROM user_goals g
  WHERE g.status = 'pending_decision'
    AND NOT EXISTS (
      SELECT 1 FROM goal_decision_queue q
      WHERE q.goal_id = g.id
    );
END;
$$;

CREATE OR REPLACE FUNCTION refresh_user_goals(p_user_id uuid DEFAULT auth.uid())
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  app_today date;
BEGIN
  IF p_user_id IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized goal refresh';
  END IF;

  app_today := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago')::date;

  PERFORM sync_user_goal_progress(p_user_id);

  UPDATE user_goals
  SET status = 'pending_decision'
  WHERE user_id = p_user_id
    AND status = 'active'
    AND end_date < app_today
    AND current_progress < target_value;

  INSERT INTO goal_decision_queue (goal_id, user_id, expired_at, decision_deadline)
  SELECT
    g.id,
    g.user_id,
    now(),
    now() + INTERVAL '48 hours'
  FROM user_goals g
  WHERE g.user_id = p_user_id
    AND g.status = 'pending_decision'
    AND NOT EXISTS (
      SELECT 1 FROM goal_decision_queue q
      WHERE q.goal_id = g.id
    );
END;
$$;

REVOKE ALL ON FUNCTION refresh_user_goals(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_user_goals(uuid) TO authenticated;

REVOKE ALL ON FUNCTION sync_user_goal_progress(uuid) FROM PUBLIC;
