-- Content reports table for UGC moderation (Apple Guideline 1.2)
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note_id UUID REFERENCES user_notes(id) ON DELETE CASCADE,
  reason TEXT,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a report
CREATE POLICY "Authenticated users can submit reports"
  ON content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON content_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can view and update all reports
CREATE POLICY "Admins can manage all reports"
  ON content_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- Index for efficient admin querying
CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_reports_note_id_idx ON content_reports(note_id);
