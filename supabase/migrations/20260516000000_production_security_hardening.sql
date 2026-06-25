/*
  Production security hardening:
  - Block self-service role / gamification field escalation on user_profiles
  - Tighten article writer INSERT/UPDATE so only admins can publish
  - Remove permissive note_impacts / impact_review_queue INSERT for clients
*/

-- =============================================================================
-- user_profiles: prevent privilege and leaderboard tampering
-- =============================================================================

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

DROP TRIGGER IF EXISTS enforce_user_profile_update_rules_trigger ON user_profiles;
CREATE TRIGGER enforce_user_profile_update_rules_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_user_profile_update_rules();

-- =============================================================================
-- articles: writers cannot self-publish via direct API calls
-- =============================================================================

DROP POLICY IF EXISTS "Writers can create articles" ON articles;
DROP POLICY IF EXISTS "Writers can update own drafts" ON articles;

CREATE POLICY "Writers can create articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('writer', 'admin')
    ) AND
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
      )
      OR (
        status IN ('draft', 'pending_review') AND
        is_published = false AND
        COALESCE(auto_publish, false) = false
      )
    )
  );

CREATE POLICY "Writers can update own drafts"
  ON articles FOR UPDATE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid()) AND
    status IN ('draft', 'pending_review') AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('writer', 'admin')
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('writer', 'admin')
    ) AND
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
      )
      OR (
        status IN ('draft', 'pending_review') AND
        is_published = false AND
        COALESCE(auto_publish, false) = false
      )
    )
  );

-- =============================================================================
-- impact tables: only service role (edge functions) may write
-- =============================================================================

DROP POLICY IF EXISTS "System can insert impacts" ON note_impacts;
DROP POLICY IF EXISTS "System can insert review queue" ON impact_review_queue;

-- =============================================================================
-- user_notes: server-side streak / stats (clients can no longer patch these)
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_profile_after_note_insert()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  prior_date date;
  current_streak integer;
  next_streak integer;
BEGIN
  SELECT last_note_date, streak
  INTO prior_date, current_streak
  FROM user_profiles
  WHERE id = NEW.user_id;

  IF prior_date IS NULL OR prior_date < (CURRENT_DATE - INTERVAL '1 day')::date THEN
    next_streak := 1;
  ELSIF prior_date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
    next_streak := COALESCE(current_streak, 0) + 1;
  ELSE
    next_streak := GREATEST(COALESCE(current_streak, 1), 1);
  END IF;

  PERFORM set_config('app.profile_stats_sync', 'on', true);

  UPDATE user_profiles
  SET
    total_notes = COALESCE(total_notes, 0) + 1,
    streak = next_streak,
    last_note_date = CURRENT_DATE,
    updated_at = now()
  WHERE id = NEW.user_id;

  PERFORM set_config('app.profile_stats_sync', 'off', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_after_note_insert_trigger ON user_notes;
CREATE TRIGGER sync_profile_after_note_insert_trigger
  AFTER INSERT ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_after_note_insert();
