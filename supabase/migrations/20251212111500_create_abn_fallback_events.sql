-- Create ABN fallback event log for telemetry + alerting
create table if not exists public.abn_fallback_events (
    id uuid primary key default gen_random_uuid(),
    business_id bigint references public.businesses(id) on delete set null,
    reason text not null,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists abn_fallback_events_created_at_idx on public.abn_fallback_events (created_at desc);
create index if not exists abn_fallback_events_business_id_idx on public.abn_fallback_events (business_id);

alter table public.abn_fallback_events enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'abn_fallback_events'
          and policyname = 'service-role-abn-fallback-events'
    ) then
        execute 'create policy "service-role-abn-fallback-events" on public.abn_fallback_events
          for all
          using (auth.role() = ''service_role'')
          with check (auth.role() = ''service_role'')';
    end if;
end $$;
