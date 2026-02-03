-- Search telemetry table for tracking API performance and usage
-- Used to monitor search latency, success rates, and user patterns

create table if not exists public.search_telemetry (
    id uuid primary key default gen_random_uuid() not null,
    operation text not null, -- 'search_suburbs', 'triage_search', etc.
    suburb_id int references public.suburbs(id),
    suburb_name text, -- Store suburb name for easier analysis
    result_count int not null default 0,
    latency_ms int not null, -- Response time in milliseconds
    success boolean not null default true,
    error text, -- Error message if operation failed
    timestamp timestamptz not null default now()
);

-- Indexes for performance and common queries
create index if not exists idx_search_telemetry_timestamp on public.search_telemetry(timestamp desc);
create index if not exists idx_search_telemetry_operation on public.search_telemetry(operation);
create index if not exists idx_search_telemetry_success on public.search_telemetry(success, timestamp desc);
create index if not exists idx_search_telemetry_suburb on public.search_telemetry(suburb_id, timestamp desc);
create index if not exists idx_search_telemetry_latency on public.search_telemetry(latency_ms, timestamp desc);

-- Row level security
alter table public.search_telemetry enable row level security;

-- Only service role can write telemetry
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'search_telemetry'
          and policyname = 'Service role full access to search telemetry'
    ) then
        execute 'create policy "Service role full access to search telemetry" on public.search_telemetry
          for all using (auth.role() = ''service_role'')
          with check (auth.role() = ''service_role'')';
    end if;
end $$;

-- Grant necessary permissions
grant usage on schema public to service_role, authenticated, anon;
grant select, insert, update on public.search_telemetry to service_role;

-- Function to calculate P50/P95 latency for a time window
create or replace function public.get_search_latency_stats(
    hours_back int default 24,
    operation_filter text default null
)
returns table (
    p50_latency float,
    p95_latency float,
    avg_latency float,
    total_operations bigint,
    success_rate decimal(5,2)
) as $$
declare
    min_timestamp timestamptz := now() - (hours_back || ' hours')::interval;
begin
    return query
    select
        percentile_cont(0.5) within group (order by latency_ms) as p50_latency,
        percentile_cont(0.95) within group (order by latency_ms) as p95_latency,
        round(avg(latency_ms)::numeric, 2) as avg_latency,
        count(*)::bigint as total_operations,
        round(100.0 * count(nullif(success, false)) / count(*), 2) as success_rate
    from public.search_telemetry
    where timestamp >= min_timestamp
        and (operation_filter is null or operation = operation_filter);
end;
$$ language plpgsql stable security definer;

-- Row level security for the function
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'search_telemetry'
          and policyname = 'Allow authenticated access to latency stats'
    ) then
        execute 'create policy "Allow authenticated access to latency stats" on public.search_telemetry
          for select using (auth.role() = ''authenticated'')';
    end if;
end $$;

grant execute on function public.get_search_latency_stats to authenticated, service_role;
