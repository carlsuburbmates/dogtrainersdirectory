-- Migration: create abn_verifications table and ensure businesses ABN columns exist
-- This migration is idempotent and safe to run multiple times.

-- Create abn_verifications table if missing
CREATE TABLE IF NOT EXISTS abn_verifications (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    abn TEXT NOT NULL,
    business_name TEXT NOT NULL,
    matched_name TEXT,
    similarity_score DECIMAL(3,2),
    verification_method TEXT NOT NULL CHECK (verification_method IN ('api', 'manual_upload')),
    status verification_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure matched_json column exists (JSONB, nullable)
ALTER TABLE abn_verifications
  ADD COLUMN IF NOT EXISTS matched_json jsonb DEFAULT NULL;

-- Ensure businesses has ABN-related columns (idempotent)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS abn TEXT,
  ADD COLUMN IF NOT EXISTS abn_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS abn_encrypted TEXT;

-- Add index for lookups by abn (if applicable)
CREATE INDEX IF NOT EXISTS idx_abn_verifications_abn ON abn_verifications (abn);
CREATE INDEX IF NOT EXISTS idx_businesses_abn ON businesses (abn);
