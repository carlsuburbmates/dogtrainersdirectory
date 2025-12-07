-- AI Automation Infrastructure Migration
-- Adds tables and columns required for full automation, monitoring, and evaluation

-- ============================================================================
-- PART 1: Event Logging Tables
-- ============================================================================

-- Featured placement lifecycle events (for monetization audit trail)
CREATE TABLE IF NOT EXISTS featured_placement_events (
  id BIGSERIAL PRIMARY KEY,
  placement_id BIGINT REFERENCES featured_placements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('expired', 'promoted', 'renewed', 'manual_override', 'stripe_payment')),
  previous_status TEXT,
  new_status TEXT,
  triggered_by TEXT NOT NULL, -- 'cron' | 'manual' | 'stripe_webhook' | 'admin_override'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_featured_placement_events_placement ON featured_placement_events(placement_id);
CREATE INDEX idx_featured_placement_events_created_at ON featured_placement_events(created_at DESC);

COMMENT ON TABLE featured_placement_events IS 'Audit trail for all featured placement state changes';
COMMENT ON COLUMN featured_placement_events.triggered_by IS 'Source of the event: cron (automated), manual (admin UI), stripe_webhook (payment), admin_override (manual force)';

-- ============================================================================
-- PART 2: Cron Job Health Monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS cron_job_runs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT,
  duration_ms INT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cron_job_runs_name ON cron_job_runs(job_name);
CREATE INDEX idx_cron_job_runs_status ON cron_job_runs(status);
CREATE INDEX idx_cron_job_runs_started_at ON cron_job_runs(started_at DESC);

COMMENT ON TABLE cron_job_runs IS 'Health monitoring for all scheduled jobs (moderation, expiry, verification, digest, etc)';
COMMENT ON COLUMN cron_job_runs.duration_ms IS 'Execution time in milliseconds (completed_at - started_at)';

-- ============================================================================
-- PART 3: AI Evaluation Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_evaluation_runs (
  id BIGSERIAL PRIMARY KEY,
  pipeline TEXT NOT NULL, -- 'triage' | 'moderation' | 'verification' | 'digest'
  dataset_version TEXT NOT NULL,
  total_cases INT NOT NULL,
  correct_predictions INT NOT NULL,
  accuracy_pct NUMERIC(5,2) NOT NULL,
  false_positives INT DEFAULT 0,
  false_negatives INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_evaluation_runs_pipeline ON ai_evaluation_runs(pipeline);
CREATE INDEX idx_ai_evaluation_runs_created_at ON ai_evaluation_runs(created_at DESC);

COMMENT ON TABLE ai_evaluation_runs IS 'Offline evaluation results using golden datasets for AI quality monitoring';
COMMENT ON COLUMN ai_evaluation_runs.accuracy_pct IS 'Percentage of correct predictions (correct_predictions / total_cases * 100)';

-- ============================================================================
-- PART 4: Add Prompt Version Tracking to Existing Tables
-- ============================================================================

-- Emergency triage logs
ALTER TABLE emergency_triage_logs 
ADD COLUMN IF NOT EXISTS ai_prompt_version TEXT;

CREATE INDEX IF NOT EXISTS idx_emergency_triage_logs_prompt_version 
ON emergency_triage_logs(ai_prompt_version) WHERE ai_prompt_version IS NOT NULL;

-- Daily ops digests
ALTER TABLE daily_ops_digests 
ADD COLUMN IF NOT EXISTS ai_prompt_version TEXT;

CREATE INDEX IF NOT EXISTS idx_daily_ops_digests_prompt_version 
ON daily_ops_digests(ai_prompt_version) WHERE ai_prompt_version IS NOT NULL;

-- AI review decisions
ALTER TABLE ai_review_decisions 
ADD COLUMN IF NOT EXISTS ai_prompt_version TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_review_decisions_prompt_version 
ON ai_review_decisions(ai_prompt_version) WHERE ai_prompt_version IS NOT NULL;

-- Emergency resource verification events
ALTER TABLE emergency_resource_verification_events 
ADD COLUMN IF NOT EXISTS ai_prompt_version TEXT;

CREATE INDEX IF NOT EXISTS idx_emergency_verification_prompt_version 
ON emergency_resource_verification_events(ai_prompt_version) WHERE ai_prompt_version IS NOT NULL;

-- Emergency triage weekly metrics
ALTER TABLE emergency_triage_weekly_metrics 
ADD COLUMN IF NOT EXISTS ai_prompt_version TEXT;

CREATE INDEX IF NOT EXISTS idx_emergency_weekly_prompt_version 
ON emergency_triage_weekly_metrics(ai_prompt_version) WHERE ai_prompt_version IS NOT NULL;

-- ============================================================================
-- PART 5: Helper Views for Dashboard Queries
-- ============================================================================

-- AI Health Summary View
CREATE OR REPLACE VIEW ai_health_summary AS
SELECT 
  'triage' as pipeline,
  COUNT(*) FILTER (WHERE decision_source = 'llm') as ai_decisions,
  COUNT(*) FILTER (WHERE decision_source = 'deterministic') as deterministic_decisions,
  COUNT(*) FILTER (WHERE decision_source = 'manual_override') as manual_overrides,
  MAX(created_at) as last_activity
FROM emergency_triage_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'moderation' as pipeline,
  COUNT(*) FILTER (WHERE decision_source = 'llm'),
  COUNT(*) FILTER (WHERE decision_source = 'deterministic'),
  COUNT(*) FILTER (WHERE decision_source = 'manual_override'),
  MAX(created_at)
FROM ai_review_decisions
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'digest' as pipeline,
  COUNT(*) FILTER (WHERE decision_source = 'llm'),
  COUNT(*) FILTER (WHERE decision_source = 'deterministic'),
  COUNT(*) FILTER (WHERE decision_source = 'manual_override'),
  MAX(created_at)
FROM daily_ops_digests
WHERE created_at > NOW() - INTERVAL '24 hours';

COMMENT ON VIEW ai_health_summary IS 'Real-time AI health metrics for dashboard - shows decision source breakdown per pipeline';

-- Cron Health Summary View
CREATE OR REPLACE VIEW cron_health_summary AS
WITH latest_runs AS (
  SELECT DISTINCT ON (job_name) 
    job_name,
    status,
    started_at,
    completed_at,
    duration_ms,
    error_message
  FROM cron_job_runs
  ORDER BY job_name, started_at DESC
)
SELECT 
  job_name,
  status,
  started_at as last_run,
  duration_ms,
  error_message,
  CASE 
    WHEN status = 'failed' THEN 'critical'
    WHEN started_at < NOW() - INTERVAL '2 hours' THEN 'warning'
    ELSE 'ok'
  END as health_status
FROM latest_runs;

COMMENT ON VIEW cron_health_summary IS 'Latest status of all cron jobs for monitoring dashboard';
