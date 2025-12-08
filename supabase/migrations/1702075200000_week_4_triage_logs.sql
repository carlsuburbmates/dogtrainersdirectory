-- Week 4: Triage Logs & Telemetry
-- Creates triage_logs and triage_events tables with indexes and RLS

-- Step 0: Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: triage_logs table
CREATE TABLE IF NOT EXISTS public.triage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
  source text NOT NULL DEFAULT 'api' CHECK (source IN ('api','admin','seed')),
  message text NOT NULL,
  suburb_id integer,
  classification text NOT NULL CHECK (classification IN ('medical','stray','crisis_training','other')),
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  summary text,
  recommended_action text CHECK (recommended_action IN ('vet','shelter','trainer','other')),
  urgency text CHECK (urgency IN ('immediate','urgent','moderate','low')),
  medical jsonb DEFAULT '{}'::jsonb,
  llm_provider text,
  llm_model text,
  tokens_prompt integer,
  tokens_completion integer,
  tokens_total integer,
  duration_ms integer,
  request_meta jsonb DEFAULT '{}'::jsonb,
  tags text[],
  error_id uuid REFERENCES public.error_logs(id) ON DELETE SET NULL
);

-- Step 2: triage_events table (optional step-level telemetry)
CREATE TABLE IF NOT EXISTS public.triage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triage_log_id uuid NOT NULL REFERENCES public.triage_logs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
  stage text NOT NULL CHECK (stage IN ('llm_call','heuristics','postprocess','persist','error')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer
);

-- Step 3: Indexes
CREATE INDEX IF NOT EXISTS idx_triage_logs_created_at ON public.triage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_logs_classification_created_at ON public.triage_logs (classification, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_logs_urgency_created_at ON public.triage_logs (urgency, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_logs_is_medical ON public.triage_logs ((medical->>'is_medical'));
CREATE INDEX IF NOT EXISTS idx_triage_logs_tags ON public.triage_logs USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_triage_events_logid_created_at ON public.triage_events (triage_log_id, created_at DESC);

-- Step 4: RLS
ALTER TABLE IF EXISTS public.triage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.triage_events ENABLE ROW LEVEL SECURITY;

-- Step 5: Policies (align with Week 3 roles)
CREATE POLICY "Service role can insert triage_logs" ON public.triage_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Admin can select triage_logs" ON public.triage_logs
  FOR SELECT TO admin
  USING (true);

CREATE POLICY "Service role can insert triage_events" ON public.triage_events
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Admin can select triage_events" ON public.triage_events
  FOR SELECT TO admin
  USING (true);

-- Step 6: Helper view for admin metrics
CREATE OR REPLACE VIEW public.triage_metrics_hourly AS
SELECT
  date_trunc('hour', created_at) AS hour,
  COUNT(*)::bigint AS total,
  COUNT(*) FILTER (WHERE classification = 'medical')::bigint AS medical_count,
  COUNT(*) FILTER (WHERE urgency = 'immediate')::bigint AS immediate_count,
  AVG(duration_ms)::numeric AS avg_latency_ms
FROM public.triage_logs
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON public.triage_metrics_hourly TO admin;
