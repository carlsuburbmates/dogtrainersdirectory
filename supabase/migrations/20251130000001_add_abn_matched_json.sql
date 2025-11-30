-- Migration: add matched_json jsonb column to abn_verifications
ALTER TABLE abn_verifications
  ADD COLUMN IF NOT EXISTS matched_json jsonb DEFAULT NULL;
