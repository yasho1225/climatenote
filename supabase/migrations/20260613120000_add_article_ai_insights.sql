-- Cache AI-generated article insights (summary, choices, figure data)
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS ai_insights jsonb;

COMMENT ON COLUMN articles.ai_insights IS 'Cached AI insights: summary bullets, action choices, and figure/chart data';

-- Allow authenticated users to read ai_insights on published articles (inherits from existing SELECT policies)
