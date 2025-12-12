-- Create ops_overrides table for telemetry override toggles
create table if not exists public.ops_overrides (
    id uuid primary key default gen_random_uuid(),
    service text not null,
    status text not null,
    reason text,
    expires_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ops_overrides_service_idx on public.ops_overrides (service);
create index if not exists ops_overrides_expires_idx on public.ops_overrides (expires_at);

alter table public.ops_overrides enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'ops_overrides'
          and policyname = 'service-role-ops-overrides'
    ) then
        execute 'create policy "service-role-ops-overrides" on public.ops_overrides
          for all
          using (auth.role() = ''service_role'')
          with check (auth.role() = ''service_role'')';
    end if;
end $$;
