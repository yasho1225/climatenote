/*
  Fix gamification stats sync:
  - Ensure note-insert/delete triggers exist and bypass enforce trigger reliably
  - Add refresh_user_profile_stats RPC for client reconciliation
  - Harden goal progress sync against manual-progress guard
*/

-- =============================================================================
-- Shared: recompute streak from note dates (America/Chicago app day)
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_profile_streak(p_user_id uuid)
RETURNS TABLE(total_notes integer, streak integer, last_note_date date)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  note_count integer;
  latest_date date;
  prior_streak integer;
  prior_date date;
  next_streak integer;
  app_today date;
BEGIN
  app_today := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago')::date;

  SELECT COUNT(*)::integer,
         MAX((created_at AT TIME ZONE 'America/Chicago')::date)
  INTO note_count, latest_date
  FROM user_notes
  WHERE user_id = p_user_id;

  SELECT up.streak, up.last_note_date
  INTO prior_streak, prior_date
  FROM user_profiles up
  WHERE up.id = p_user_id;

  IF note_count = 0 OR latest_date IS NULL THEN
    next_streak := 0;
    latest_date := NULL;
  ELSIF latest_date = app_today THEN
    IF prior_date = latest_date THEN
      next_streak := GREATEST(COALESCE(prior_streak, 1), 1);
    ELSIF prior_date = latest_date - 1 THEN
      next_streak := COALESCE(prior_streak, 0) + 1;
    ELSIF prior_date IS NULL OR prior_date < latest_date - 1 THEN
      next_streak := 1;
    ELSE
      next_streak := GREATEST(COALESCE(prior_streak, 1), 1);
    END IF;
  ELSIF latest_date = app_today - 1 THEN
    next_streak := GREATEST(COALESCE(prior_streak, 1), 1);
  ELSIF latest_date < app_today - 1 THEN
    next_streak := 0;
  ELSE
    next_streak := COALESCE(prior_streak, 0);
  END IF;

  RETURN QUERY SELECT note_count, next_streak, latest_date;
END;
$$;

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

  ALTER TABLE user_profiles DISABLE TRIGGER enforce_user_profile_update_rules_trigger;

  UPDATE user_profiles
  SET
    total_notes = stats.total_notes,
    streak = stats.streak,
    last_note_date = stats.last_note_date,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO result;

  ALTER TABLE user_profiles ENABLE TRIGGER enforce_user_profile_update_rules_trigger;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    ALTER TABLE user_profiles ENABLE TRIGGER enforce_user_profile_update_rules_trigger;
    RAISE;
END;
$$;

-- =============================================================================
-- Note insert/delete triggers (idempotent)
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_profile_after_note_insert()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM apply_profile_stats(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_profile_after_note_delete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM apply_profile_stats(OLD.user_id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_after_note_insert_trigger ON user_notes;
CREATE TRIGGER sync_profile_after_note_insert_trigger
  AFTER INSERT ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_after_note_insert();

DROP TRIGGER IF EXISTS sync_profile_after_note_delete_trigger ON user_notes;
CREATE TRIGGER sync_profile_after_note_delete_trigger
  AFTER DELETE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_after_note_delete();

-- =============================================================================
-- Goal progress sync (bypass manual-progress guard)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  ALTER TABLE user_goals DISABLE TRIGGER enforce_user_goal_update_rules_trigger;

  UPDATE user_goals
  SET
    current_progress = (
      SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'America/Chicago')::date)
      FROM user_notes
      WHERE user_id = NEW.user_id
        AND (created_at AT TIME ZONE 'America/Chicago')::date >= user_goals.start_date
        AND (created_at AT TIME ZONE 'America/Chicago')::date <= user_goals.end_date
    ),
    updated_at = now()
  WHERE user_id = NEW.user_id
    AND goal_type = 'streak'
    AND status = 'active';

  UPDATE user_goals
  SET
    current_progress = (
      SELECT COUNT(*)::integer
      FROM user_notes
      WHERE user_id = NEW.user_id
        AND (created_at AT TIME ZONE 'America/Chicago')::date >= user_goals.start_date
        AND (created_at AT TIME ZONE 'America/Chicago')::date <= user_goals.end_date
    ),
    updated_at = now()
  WHERE user_id = NEW.user_id
    AND goal_type = 'action_count'
    AND status = 'active';

  UPDATE user_goals
  SET
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND current_progress >= target_value
    AND completed_at IS NULL;

  ALTER TABLE user_goals ENABLE TRIGGER enforce_user_goal_update_rules_trigger;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    ALTER TABLE user_goals ENABLE TRIGGER enforce_user_goal_update_rules_trigger;
    RAISE;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_goal_progress ON user_notes;
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

-- =============================================================================
-- Client-callable reconciliation RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION refresh_user_profile_stats(p_user_id uuid DEFAULT auth.uid())
RETURNS user_profiles
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_user_id IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized profile stats refresh';
  END IF;

  RETURN apply_profile_stats(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION refresh_user_profile_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_user_profile_stats(uuid) TO authenticated;
