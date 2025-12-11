create extension if not exists "pgcrypto";

create table if not exists public.latency_metrics (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  route text not null,
  duration_ms integer not null,
  status_code integer,
  success boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.latency_metrics is 'Request latency telemetry for critical flows (search, emergency verification, health endpoints, ABN).';

create index if not exists latency_metrics_area_created_idx
  on public.latency_metrics (area, created_at desc);

create index if not exists latency_metrics_route_created_idx
  on public.latency_metrics (route, created_at desc);
