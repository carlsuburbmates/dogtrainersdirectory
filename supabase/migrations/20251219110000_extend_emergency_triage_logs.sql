-- Extend emergency_triage_logs with missing operational columns
-- Adds fields for full emergency context capture (situation, location, contact, priority, follow_up_actions)

BEGIN;

ALTER TABLE emergency_triage_logs
ADD COLUMN IF NOT EXISTS situation TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS contact TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT,
ADD COLUMN IF NOT EXISTS follow_up_actions TEXT[];

COMMIT;
