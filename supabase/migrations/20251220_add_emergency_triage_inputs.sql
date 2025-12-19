ALTER TABLE public.emergency_triage_logs
ADD COLUMN IF NOT EXISTS dog_age TEXT,
ADD COLUMN IF NOT EXISTS issues TEXT[],
ADD COLUMN IF NOT EXISTS classification TEXT;
