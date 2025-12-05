-- Phase 5 automation + AI oversight tables

DO $$
BEGIN
    CREATE TYPE emergency_classification AS ENUM ('medical', 'stray', 'crisis', 'normal', 'manual_review');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
    CREATE TYPE review_ai_action AS ENUM ('auto_approve', 'auto_reject', 'manual');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS emergency_last_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS emergency_verification_status verification_status DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS emergency_verification_notes TEXT;

ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE TABLE IF NOT EXISTS emergency_triage_logs (
    id BIGSERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    predicted_category emergency_classification NOT NULL,
    recommended_flow emergency_classification NOT NULL,
    confidence NUMERIC(5,2),
    classifier_version TEXT DEFAULT 'phase5-rule-v1',
    source TEXT DEFAULT 'rule_based',
    user_suburb_id INTEGER REFERENCES suburbs(id),
    user_lat NUMERIC,
    user_lng NUMERIC,
    resolution_category emergency_classification,
    was_correct BOOLEAN,
    feedback_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emergency_triage_logs_created_at ON emergency_triage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_triage_logs_resolution ON emergency_triage_logs (resolution_category);

CREATE TABLE IF NOT EXISTS emergency_triage_weekly_metrics (
    week_start DATE PRIMARY KEY,
    total_logs INTEGER NOT NULL DEFAULT 0,
    correct_predictions INTEGER NOT NULL DEFAULT 0,
    manual_reviews INTEGER NOT NULL DEFAULT 0,
    accuracy_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_resource_verification_runs (
    id BIGSERIAL PRIMARY KEY,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_resources INTEGER DEFAULT 0,
    auto_updates INTEGER DEFAULT 0,
    flagged_manual INTEGER DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS emergency_resource_verification_events (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT REFERENCES emergency_resource_verification_runs(id) ON DELETE SET NULL,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL,
    result TEXT NOT NULL,
    status_before verification_status,
    status_after verification_status,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_resource_verification_events_business ON emergency_resource_verification_events (business_id);

CREATE TABLE IF NOT EXISTS daily_ops_digests (
    id BIGSERIAL PRIMARY KEY,
    digest_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    metrics JSONB NOT NULL,
    model TEXT,
    generated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_ops_digests_date ON daily_ops_digests (digest_date);

CREATE TABLE IF NOT EXISTS ai_review_decisions (
    id BIGSERIAL PRIMARY KEY,
    review_id INTEGER UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    ai_decision review_ai_action NOT NULL,
    confidence NUMERIC(5,2),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_review_decisions_decision ON ai_review_decisions (ai_decision);

UPDATE businesses
SET emergency_verification_status = COALESCE(emergency_verification_status, (CASE
    WHEN resource_type IN ('emergency_vet','urgent_care','emergency_shelter') THEN 'verified'
    ELSE 'pending'
END)::verification_status),
    emergency_last_verified_at = COALESCE(emergency_last_verified_at, NOW())
WHERE emergency_verification_status IS NULL;

