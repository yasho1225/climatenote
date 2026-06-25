/*
  Comprehensive security and integrity fixes:
  - Lock down global goal RPCs
  - Harden SECURITY DEFINER functions (search_path)
  - Remove anonymous profile reads; authenticated community read only
  - Prevent profile stat seeding on INSERT
  - Prevent manual goal progress tampering
  - Fix goal_decision_queue ownership check
  - Make audit_log append-only at DB level
  - Reconcile profile stats on note delete
*/

-- =============================================================================
-- Goal RPCs: service role only
-- =============================================================================

CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.goal_progress_sync', 'on', true);

  UPDATE user_goals
  SET
    current_progress = (
      SELECT COUNT(DISTINCT DATE(created_at))
      FROM user_notes
      WHERE user_id = NEW.user_id
        AND created_at >= user_goals.start_date
        AND created_at <= user_goals.end_date
    ),
    updated_at = now()
  WHERE user_id = NEW.user_id
    AND goal_type = 'streak'
    AND status = 'active';

  UPDATE user_goals
  SET
    current_progress = (
      SELECT COUNT(*)
      FROM user_notes
      WHERE user_id = NEW.user_id
        AND created_at >= user_goals.start_date
        AND created_at <= user_goals.end_date
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

  PERFORM set_config('app.goal_progress_sync', 'off', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_expired_goals()
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_goals
  SET status = 'pending_decision'
  WHERE status = 'active'
    AND end_date < CURRENT_DATE
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_archive_undecided_goals()
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_goals
  SET
    status = 'failed',
    updated_at = now()
  WHERE id IN (
    SELECT goal_id
    FROM goal_decision_queue
    WHERE decision_deadline < now()
      AND decision IS NULL
  );

  UPDATE goal_decision_queue
  SET
    decision = 'archive',
    decision_made_at = now()
  WHERE decision_deadline < now()
    AND decision IS NULL;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION check_expired_goals() FROM PUBLIC;
REVOKE ALL ON FUNCTION auto_archive_undecided_goals() FROM PUBLIC;
REVOKE ALL ON FUNCTION update_goal_progress() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION check_expired_goals() TO service_role;
GRANT EXECUTE ON FUNCTION auto_archive_undecided_goals() TO service_role;

-- =============================================================================
-- user_profiles: no anonymous reads; lock stats on INSERT
-- =============================================================================

DROP POLICY IF EXISTS "Public can read basic profile info" ON user_profiles;

CREATE POLICY "Authenticated users can read community profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION enforce_user_profile_update_rules()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
    NEW.streak := 0;
    NEW.total_notes := 0;
    NEW.last_note_date := NULL;
    RETURN NEW;
  END IF;

  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  ) INTO caller_is_admin;

  IF NOT caller_is_admin THEN
    IF current_setting('app.profile_stats_sync', true) = 'on' THEN
      NEW.role := OLD.role;
      RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;

    IF NEW.streak IS DISTINCT FROM OLD.streak
      OR NEW.total_notes IS DISTINCT FROM OLD.total_notes
      OR NEW.last_note_date IS DISTINCT FROM OLD.last_note_date THEN
      NEW.streak := OLD.streak;
      NEW.total_notes := OLD.total_notes;
      NEW.last_note_date := OLD.last_note_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- user_goals: block manual progress inflation
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_user_goal_update_rules()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('app.goal_progress_sync', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.current_progress IS DISTINCT FROM OLD.current_progress THEN
    NEW.current_progress := OLD.current_progress;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_user_goal_update_rules_trigger ON user_goals;
CREATE TRIGGER enforce_user_goal_update_rules_trigger
  BEFORE UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION enforce_user_goal_update_rules();

-- =============================================================================
-- goal_decision_queue: require goal ownership
-- =============================================================================

DROP POLICY IF EXISTS "System can create decision queue items" ON goal_decision_queue;

CREATE POLICY "System can create decision queue items"
  ON goal_decision_queue FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_goals
      WHERE user_goals.id = goal_decision_queue.goal_id
        AND user_goals.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Profile stats reconciliation on note delete
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_profile_after_note_delete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  note_count integer;
  latest_date date;
BEGIN
  SELECT COUNT(*), MAX(DATE(created_at))
  INTO note_count, latest_date
  FROM user_notes
  WHERE user_id = OLD.user_id;

  PERFORM set_config('app.profile_stats_sync', 'on', true);

  UPDATE user_profiles
  SET
    total_notes = note_count,
    last_note_date = latest_date,
    updated_at = now()
  WHERE id = OLD.user_id;

  PERFORM set_config('app.profile_stats_sync', 'off', true);

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_after_note_delete_trigger ON user_notes;
CREATE TRIGGER sync_profile_after_note_delete_trigger
  AFTER DELETE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_after_note_delete();

-- =============================================================================
-- audit_log: append-only
-- =============================================================================

CREATE OR REPLACE FUNCTION deny_audit_log_mutation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_deny_update ON audit_log;
CREATE TRIGGER audit_log_deny_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION deny_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_log_deny_delete ON audit_log;
CREATE TRIGGER audit_log_deny_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION deny_audit_log_mutation();
