-- Migration: Add AI metadata columns to logs and digests tables
-- Purpose: Standardize AI observability and decision source tracking across all pipelines

-- 1. emergency_triage_logs
ALTER TABLE emergency_triage_logs 
ADD COLUMN IF NOT EXISTS decision_source text CHECK (decision_source IN ('llm', 'deterministic', 'manual_override')),
ADD COLUMN IF NOT EXISTS ai_mode text,
ADD COLUMN IF NOT EXISTS ai_provider text,
ADD COLUMN IF NOT EXISTS ai_model text;
-- (Note: confidence already exists in this table)

-- 2. daily_ops_digests
ALTER TABLE daily_ops_digests
ADD COLUMN IF NOT EXISTS decision_source text CHECK (decision_source IN ('llm', 'deterministic', 'manual_override')),
ADD COLUMN IF NOT EXISTS ai_mode text,
ADD COLUMN IF NOT EXISTS ai_provider text,
ADD COLUMN IF NOT EXISTS ai_confidence numeric;
-- (Note: model and generated_by (equivalent to provider) already exist, but we standardize provider)

-- 3. ai_review_decisions
-- This table is for AI decisions specifically, but we might want to track if it was a manual override
ALTER TABLE ai_review_decisions
ADD COLUMN IF NOT EXISTS decision_source text CHECK (decision_source IN ('llm', 'deterministic', 'manual_override')),
ADD COLUMN IF NOT EXISTS ai_mode text,
ADD COLUMN IF NOT EXISTS ai_provider text,
ADD COLUMN IF NOT EXISTS ai_model text;
-- (Note: reason and confidence already exist)

-- 4. emergency_triage_weekly_metrics
ALTER TABLE emergency_triage_weekly_metrics
ADD COLUMN IF NOT EXISTS ai_mode text; -- To track which mode was dominant during this week

-- Comment on columns for clarity
COMMENT ON COLUMN emergency_triage_logs.decision_source IS 'Source of the classification: llm, deterministic, or manual_override';
COMMENT ON COLUMN emergency_triage_logs.ai_mode IS 'The AI execution mode active at the time: live, shadow, or disabled';
