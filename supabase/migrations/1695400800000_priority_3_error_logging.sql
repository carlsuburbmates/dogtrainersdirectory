-- Migration for Priority 3: Error Logging & Monitoring
-- Deploy Week 3: Create error_logs, error_alerts, error_alert_events tables

-- Step 1: Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT (now() at time zone 'utc') NOT NULL,
    level text NOT NULL CONSTRAINT error_logs_level_check CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
    category text NOT NULL CONSTRAINT error_logs_category_check CHECK (category IN ('api', 'llm', 'validation', 'db', 'client', 'other')),
    route text,
    method text,
    status_code integer,
    message text NOT NULL,
    stack text,
    context jsonb DEFAULT '{}'::jsonb,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    request_id text,
    duration_ms integer,
    env text DEFAULT 'dev' CONSTRAINT error_logs_env_check CHECK (env IN ('dev', 'staging', 'prod'))
);

-- Step 2: Create indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level_created_at ON public.error_logs (level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_category_created_at ON public.error_logs (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_route_created_at ON public.error_logs (route, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id_created_at ON public.error_logs (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON public.error_logs (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_request_id ON public.error_logs (request_id) WHERE request_id IS NOT NULL;

-- Step 3: Create error_alerts table
CREATE TABLE IF NOT EXISTS public.error_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT (now() at time zone 'utc') NOT NULL,
    alert_type text NOT NULL,
    severity text NOT NULL,
    threshold jsonb NOT NULL,
    status text NOT NULL DEFAULT 'open' CONSTRAINT error_alerts_status_check CHECK (status IN ('open', 'ack', 'closed')),
    last_triggered_at timestamptz,
    meta jsonb DEFAULT '{}'::jsonb,
    acked_at timestamptz,
    acked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Step 4: Create indexes for error_alerts
CREATE INDEX IF NOT EXISTS idx_error_alerts_alert_type ON public.error_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_error_alerts_status ON public.error_alerts (status);
CREATE INDEX IF NOT EXISTS idx_error_alerts_severity ON public.error_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_error_alerts_last_triggered ON public.error_alerts (last_triggered_at DESC);

-- Step 5: Create error_alert_events table
CREATE TABLE IF NOT EXISTS public.error_alert_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id uuid NOT NULL REFERENCES public.error_alerts(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT (now() at time zone 'utc') NOT NULL,
    message text NOT NULL,
    sample_error_ids uuid[],
    meta jsonb DEFAULT '{}'::jsonb
);

-- Step 6: Create indexes for error_alert_events
CREATE INDEX IF NOT EXISTS idx_error_alert_events_alert_id ON public.error_alert_events (alert_id);
CREATE INDEX IF NOT EXISTS idx_error_alert_events_created_at ON public.error_alert_events (created_at DESC);

-- Step 7: Row Level Security (RLS)
ALTER TABLE IF EXISTS public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_alert_events ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies

-- RLS for error_logs
-- Service role (api) can insert logs
CREATE OR REPLACE POLICY "Service role can insert error_logs" ON public.error_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Admin role can read all error_logs
CREATE OR REPLACE POLICY "Admin role can select error_logs" ON public.error_logs
  FOR SELECT TO admin
  USING (true);

-- RLS for error_alerts
-- Service role (api) can manage alerts
CREATE OR REPLACE POLICY "Service role can manage error_alerts" ON public.error_alerts
  FOR ALL TO service_role
  WITH CHECK (true);

-- Admin role can view and acknowledge alerts
CREATE OR REPLACE POLICY "Admin role can view error_alerts" ON public.error_alerts
  FOR SELECT TO admin
  USING (true);

CREATE OR REPLACE POLICY "Admin role can acknowledge error_alerts" ON public.error_alerts
  FOR UPDATE TO admin
  WITH CHECK (status IN ('ack', 'closed') AND acked_by = auth.uid());

-- RLS for error_alert_events
-- Service role (api) can insert events
CREATE OR REPLACE POLICY "Service role can insert error_alert_events" ON public.error_alert_events
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Step 9: Function to clean up old error logs (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    days_old integer := 30;
BEGIN
    DELETE FROM public.error_logs
    WHERE created_at < (now() at time zone 'utc' - make_interval(days => days_old));
    
    RAISE NOTICE 'Cleaned up error_logs older than % days', days_old;
END;
$$;

-- Step 10: Grant permission to service role for cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_old_error_logs() TO service_role;

-- Step 11: Function to check error rates for alerting
CREATE OR REPLACE FUNCTION public.check_error_rate_alert(
    minutes_ago integer DEFAULT 5,
    threshold integer DEFAULT 5,
    consecutive_minutes integer DEFAULT 5
)
RETURNS TABLE (
    triggered boolean,
    error_rate numeric,
    minutes_checked integer,
    current_minute timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    end_time timestamp with time zone := now() at time zone 'utc';
    start_time timestamp with time zone := end_time - make_interval(minutes => minutes_ago);
    consecutive_count integer := 0;
    current_minute_check timestamp with time zone;
    errors_per_minute numeric;
BEGIN
    -- Check each minute in the window
    FOR current_minute_check IN (
        SELECT generate_series(
            start_time,
            end_time - make_interval(minutes => 1),
            '1 minute'::interval
        )
    )
    LOOP
        SELECT INTO errors_per_minute COUNT(*)::numeric
        FROM public.error_logs
        WHERE created_at >= current_minute_check
        AND created_at < current_minute_check + make_interval(minutes => 1)
        AND level IN ('error', 'critical');
        
        IF errors_per_minute >= threshold THEN
            consecutive_count := consecutive_count + 1;
        ELSE
            consecutive_count := 0;
        END IF;
        
        IF consecutive_count >= consecutive_minutes THEN
            RETURN QUERY SELECT true, errors_per_minute, minutes_ago, current_minute_check;
            RETURN;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT false, 0::numeric, minutes_ago, end_time;
END;
$$;

-- Step 12: Grant permission to service role for check_error_rate_alert function
GRANT EXECUTE ON FUNCTION public.check_error_rate_alert(integer, integer, integer) TO service_role;

-- Step 13: Grant permission to authenticated role for monitoring functions
GRANT EXECUTE ON FUNCTION public.check_error_rate_alert(integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_error_logs() TO authenticated;

COMMIT;