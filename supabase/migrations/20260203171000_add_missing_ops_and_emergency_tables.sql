-- Add missing tables, columns, and functions referenced by the app (implementation-aligned)

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Column additions for existing tables
-- ------------------------------------------------------------

-- Businesses: emergency verification + emergency contact fields + optional primary service
alter table public.businesses
  add column if not exists emergency_phone text,
  add column if not exists emergency_hours text,
  add column if not exists emergency_services text[],
  add column if not exists cost_indicator text,
  add column if not exists capacity_notes text,
  add column if not exists emergency_verification_status verification_status,
  add column if not exists emergency_verification_notes text,
  add column if not exists service_type_primary service_type;

-- Reviews: manual moderation state
alter table public.reviews
  add column if not exists is_rejected boolean default false,
  add column if not exists rejection_reason text;

-- Featured placements: activation + slot metadata
alter table public.featured_placements
  add column if not exists expiry_date timestamptz,
  add column if not exists priority integer default 0,
  add column if not exists slot_type text default 'standard',
  add column if not exists active boolean default false;

-- Emergency resources: optional operational metadata
alter table public.emergency_resources
  add column if not exists emergency_phone text,
  add column if not exists emergency_hours text,
  add column if not exists emergency_services text[],
  add column if not exists cost_indicator text,
  add column if not exists capacity_notes text,
  add column if not exists emergency_verification_status verification_status,
  add column if not exists emergency_verification_notes text;

-- ------------------------------------------------------------
-- New tables
-- ------------------------------------------------------------

create table if not exists public.council_contacts (
  council_id integer primary key references public.councils(id) on delete cascade,
  phone text,
  after_hours_phone text,
  report_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_ops_digests (
  id bigserial primary key,
  digest_date date not null unique,
  summary text not null,
  metrics jsonb not null default '{}'::jsonb,
  model text,
  generated_by text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cron_job_runs (
  id bigserial primary key,
  job_name text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null,
  duration_ms integer,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists cron_job_runs_job_idx on public.cron_job_runs (job_name, started_at desc);

create table if not exists public.featured_placement_events (
  id bigserial primary key,
  placement_id bigint references public.featured_placements(id) on delete cascade,
  event_type text not null,
  previous_status text,
  new_status text,
  triggered_by text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists featured_placement_events_placement_idx on public.featured_placement_events (placement_id, created_at desc);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  category text not null,
  route text,
  method text,
  status_code integer,
  message text not null,
  stack text,
  context jsonb default '{}'::jsonb,
  user_id text,
  session_id text,
  request_id text,
  duration_ms integer,
  env text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists error_logs_created_at_idx on public.error_logs (created_at desc);
create index if not exists error_logs_level_idx on public.error_logs (level, created_at desc);
create index if not exists error_logs_category_idx on public.error_logs (category, created_at desc);

create table if not exists public.error_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null,
  severity text not null,
  threshold jsonb not null default '{}'::jsonb,
  status text not null,
  last_triggered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.error_alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.error_alerts(id) on delete cascade,
  message text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_review_decisions (
  id bigserial primary key,
  review_id bigint not null references public.reviews(id) on delete cascade,
  ai_decision text not null,
  confidence numeric,
  reason text,
  decision_source text,
  ai_mode text,
  ai_provider text,
  ai_model text,
  ai_prompt_version text,
  raw_response jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists ai_review_decisions_review_id_uidx on public.ai_review_decisions (review_id);

create table if not exists public.ai_evaluation_runs (
  id bigserial primary key,
  pipeline text not null,
  dataset_version text,
  total_cases integer not null,
  correct_predictions integer not null,
  accuracy_pct numeric,
  false_positives integer,
  false_negatives integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.emergency_triage_logs (
  id bigserial primary key,
  description text,
  situation text,
  location text,
  contact text,
  dog_age text,
  issues text[],
  classification text,
  priority text,
  follow_up_actions text[],
  decision_source text,
  predicted_category text,
  recommended_flow text,
  confidence numeric,
  user_suburb_id integer references public.suburbs(id),
  user_lat numeric,
  user_lng numeric,
  resolution_category text,
  was_correct boolean,
  resolved_at timestamptz,
  ai_mode text,
  ai_provider text,
  ai_model text,
  classifier_version text,
  source text,
  metadata jsonb default '{}'::jsonb,
  ai_prompt_version text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists emergency_triage_logs_created_idx on public.emergency_triage_logs (created_at desc);

create table if not exists public.emergency_triage_feedback (
  id bigserial primary key,
  triage_id bigint references public.emergency_triage_logs(id) on delete cascade,
  was_helpful boolean,
  feedback_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.emergency_triage_weekly_metrics (
  id bigserial primary key,
  week_start timestamptz not null,
  total_triages integer not null default 0,
  classification_breakdown jsonb default '{}'::jsonb,
  priority_breakdown jsonb default '{}'::jsonb,
  decision_source_breakdown jsonb default '{}'::jsonb,
  accuracy_pct numeric default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.emergency_resource_verification_events (
  id bigserial primary key,
  resource_id bigint,
  phone text,
  website text,
  is_valid boolean,
  reason text,
  confidence numeric,
  verification_method text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.emergency_resource_verification_runs (
  id bigserial primary key,
  started_at timestamptz not null,
  completed_at timestamptz,
  total_resources integer,
  auto_updates integer,
  flagged_manual integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.triage_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'api',
  message text not null,
  suburb_id integer references public.suburbs(id),
  classification text,
  confidence numeric,
  summary text,
  recommended_action text,
  urgency text,
  medical jsonb default '{}'::jsonb,
  llm_provider text,
  llm_model text,
  tokens_prompt integer,
  tokens_completion integer,
  tokens_total integer,
  duration_ms integer,
  request_meta jsonb default '{}'::jsonb,
  tags text[] default '{}'::text[],
  error_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists triage_logs_created_idx on public.triage_logs (created_at desc);

create table if not exists public.triage_events (
  id uuid primary key default gen_random_uuid(),
  triage_log_id uuid references public.triage_logs(id) on delete cascade,
  stage text not null,
  payload jsonb default '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace view public.triage_metrics_hourly as
select
  date_trunc('hour', created_at) as hour,
  count(*)::bigint as total,
  count(*) filter (where classification = 'medical')::bigint as medical_count,
  count(*) filter (where urgency = 'immediate')::bigint as immediate_count,
  coalesce(round(avg(duration_ms)::numeric, 0), 0)::bigint as avg_latency_ms,
  coalesce(sum(tokens_total), 0)::bigint as total_tokens
from public.triage_logs
group by 1
order by 1 desc;

-- ------------------------------------------------------------
-- Missing RPCs / functions
-- ------------------------------------------------------------

create or replace function public.get_enum_values(constraint_name text)
returns table(enum_values text)
language plpgsql
stable
as $$
declare
  enum_type_oid oid;
begin
  select t.oid
    into enum_type_oid
  from pg_constraint c
  join pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = any(c.conkey)
  join pg_type t
    on t.oid = a.atttypid
  where c.conname = constraint_name
  limit 1;

  if enum_type_oid is null then
    select t.oid into enum_type_oid
    from pg_type t
    where t.typname = constraint_name
    limit 1;
  end if;

  if enum_type_oid is null then
    return;
  end if;

  return query
    select string_agg(e.enumlabel, ',')
    from pg_enum e
    where e.enumtypid = enum_type_oid;
end;
$$;

create or replace function public.check_error_rate_alert(
  minutes_ago integer,
  threshold integer default 1,
  consecutive_minutes integer default 1
)
returns table (
  minute timestamptz,
  error_rate integer
)
language sql
stable
security definer
as $$
  select
    date_trunc('minute', created_at) as minute,
    count(*)::integer as error_rate
  from public.error_logs
  where created_at >= now() - make_interval(mins => minutes_ago)
  group by 1
  order by 1;
$$;

create or replace function public.get_errors_per_hour(
  start_at timestamptz,
  hours_count integer default 24
)
returns table (
  hour timestamptz,
  error_count bigint,
  errors_by_level jsonb
)
language sql
stable
security definer
as $$
  with hours as (
    select generate_series(
      date_trunc('hour', start_at),
      date_trunc('hour', start_at) + make_interval(hours => hours_count - 1),
      '1 hour'::interval
    ) as hour
  )
  select
    h.hour,
    coalesce(sum(l.level_count), 0) as error_count,
    coalesce(
      jsonb_object_agg(l.level, l.level_count) filter (where l.level is not null),
      '{}'::jsonb
    ) as errors_by_level
  from hours h
  left join lateral (
    select level, count(*)::bigint as level_count
    from public.error_logs
    where created_at >= h.hour
      and created_at < h.hour + interval '1 hour'
    group by level
  ) l on true
  group by h.hour
  order by h.hour;
$$;

create or replace function public.search_emergency_resources(
  user_lat numeric,
  user_lng numeric,
  resource_filters text[] default null,
  limit_entries integer default 50,
  p_key text default null
)
returns table (
  business_id integer,
  business_name text,
  business_email text,
  business_phone text,
  website text,
  address text,
  suburb_name text,
  council_name text,
  region region,
  emergency_hours text,
  emergency_services text[],
  cost_indicator text,
  capacity_notes text,
  distance_km numeric
)
language plpgsql
as $$
begin
  return query
  select
    b.id as business_id,
    b.name as business_name,
    decrypt_sensitive(b.email_encrypted, p_key) as business_email,
    coalesce(b.emergency_phone, decrypt_sensitive(b.phone_encrypted, p_key)) as business_phone,
    b.website,
    b.address,
    s.name as suburb_name,
    c.name as council_name,
    c.region,
    b.emergency_hours,
    b.emergency_services,
    b.cost_indicator,
    b.capacity_notes,
    case
      when user_lat is null or user_lng is null then null
      else calculate_distance(user_lat, user_lng, s.latitude, s.longitude)
    end as distance_km
  from public.businesses b
  join public.suburbs s on b.suburb_id = s.id
  join public.councils c on s.council_id = c.id
  where b.is_active = true
    and b.is_deleted = false
    and (resource_filters is null or b.resource_type = any(resource_filters))
  order by
    distance_km nulls last,
    b.name asc
  limit limit_entries;
end;
$$;

-- ------------------------------------------------------------
-- RLS and service role policies
-- ------------------------------------------------------------

alter table public.payment_audit enable row level security;
alter table public.business_subscription_status enable row level security;
alter table public.latency_metrics enable row level security;
alter table public.emergency_triage_logs enable row level security;
alter table public.emergency_triage_feedback enable row level security;
alter table public.emergency_triage_weekly_metrics enable row level security;
alter table public.emergency_resource_verification_events enable row level security;
alter table public.emergency_resource_verification_runs enable row level security;
alter table public.daily_ops_digests enable row level security;
alter table public.cron_job_runs enable row level security;
alter table public.featured_placement_events enable row level security;
alter table public.error_logs enable row level security;
alter table public.error_alerts enable row level security;
alter table public.error_alert_events enable row level security;
alter table public.ai_review_decisions enable row level security;
alter table public.ai_evaluation_runs enable row level security;
alter table public.triage_logs enable row level security;
alter table public.triage_events enable row level security;

-- Emergency resources and council contacts are managed server-side
alter table public.emergency_resources enable row level security;
alter table public.council_contacts enable row level security;

-- Featured placement metadata is server-side only
alter table public.featured_placements enable row level security;
alter table public.featured_placement_queue enable row level security;
alter table public.webhook_events enable row level security;

-- Helper to create service-role-only policies if missing

do $$
begin
  -- payment_audit
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_audit' and policyname = 'service-role-payment-audit') then
    execute 'create policy "service-role-payment-audit" on public.payment_audit for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- business_subscription_status
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'business_subscription_status' and policyname = 'service-role-business-subscription-status') then
    execute 'create policy "service-role-business-subscription-status" on public.business_subscription_status for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- latency_metrics
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'latency_metrics' and policyname = 'service-role-latency-metrics') then
    execute 'create policy "service-role-latency-metrics" on public.latency_metrics for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- emergency triage logs
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'emergency_triage_logs' and policyname = 'service-role-emergency-triage-logs') then
    execute 'create policy "service-role-emergency-triage-logs" on public.emergency_triage_logs for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- emergency triage feedback
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'emergency_triage_feedback' and policyname = 'service-role-emergency-triage-feedback') then
    execute 'create policy "service-role-emergency-triage-feedback" on public.emergency_triage_feedback for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- emergency triage weekly metrics
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'emergency_triage_weekly_metrics' and policyname = 'service-role-emergency-triage-weekly-metrics') then
    execute 'create policy "service-role-emergency-triage-weekly-metrics" on public.emergency_triage_weekly_metrics for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- emergency resource verification events
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'emergency_resource_verification_events' and policyname = 'service-role-emergency-resource-verification-events') then
    execute 'create policy "service-role-emergency-resource-verification-events" on public.emergency_resource_verification_events for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- emergency resource verification runs
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'emergency_resource_verification_runs' and policyname = 'service-role-emergency-resource-verification-runs') then
    execute 'create policy "service-role-emergency-resource-verification-runs" on public.emergency_resource_verification_runs for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- daily ops digests
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'daily_ops_digests' and policyname = 'service-role-daily-ops-digests') then
    execute 'create policy "service-role-daily-ops-digests" on public.daily_ops_digests for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- cron job runs
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cron_job_runs' and policyname = 'service-role-cron-job-runs') then
    execute 'create policy "service-role-cron-job-runs" on public.cron_job_runs for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- featured placement events
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'featured_placement_events' and policyname = 'service-role-featured-placement-events') then
    execute 'create policy "service-role-featured-placement-events" on public.featured_placement_events for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- error logs
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'error_logs' and policyname = 'service-role-error-logs') then
    execute 'create policy "service-role-error-logs" on public.error_logs for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- error alerts
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'error_alerts' and policyname = 'service-role-error-alerts') then
    execute 'create policy "service-role-error-alerts" on public.error_alerts for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- error alert events
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'error_alert_events' and policyname = 'service-role-error-alert-events') then
    execute 'create policy "service-role-error-alert-events" on public.error_alert_events for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- ai review decisions
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_review_decisions' and policyname = 'service-role-ai-review-decisions') then
    execute 'create policy "service-role-ai-review-decisions" on public.ai_review_decisions for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- ai evaluation runs
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_evaluation_runs' and policyname = 'service-role-ai-evaluation-runs') then
    execute 'create policy "service-role-ai-evaluation-runs" on public.ai_evaluation_runs for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- triage logs
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'triage_logs' and policyname = 'service-role-triage-logs') then
    execute 'create policy "service-role-triage-logs" on public.triage_logs for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- triage events
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'triage_events' and policyname = 'service-role-triage-events') then
    execute 'create policy "service-role-triage-events" on public.triage_events for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- emergency resources
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'emergency_resources' and policyname = 'service-role-emergency-resources') then
    execute 'create policy "service-role-emergency-resources" on public.emergency_resources for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- council contacts
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'council_contacts' and policyname = 'service-role-council-contacts') then
    execute 'create policy "service-role-council-contacts" on public.council_contacts for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- featured placements + queue
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'featured_placements' and policyname = 'service-role-featured-placements') then
    execute 'create policy "service-role-featured-placements" on public.featured_placements for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'featured_placement_queue' and policyname = 'service-role-featured-placement-queue') then
    execute 'create policy "service-role-featured-placement-queue" on public.featured_placement_queue for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  -- webhook events
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'webhook_events' and policyname = 'service-role-webhook-events') then
    execute 'create policy "service-role-webhook-events" on public.webhook_events for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;
end $$;
