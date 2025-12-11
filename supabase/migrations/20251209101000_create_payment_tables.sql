create table if not exists public.payment_audit (
  id uuid primary key default gen_random_uuid(),
  business_id bigint references public.businesses(id) on delete set null,
  plan_id text not null,
  event_type text not null,
  status text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  metadata jsonb default '{}'::jsonb,
  originating_route text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists payment_audit_business_idx on public.payment_audit (business_id);
create index if not exists payment_audit_event_idx on public.payment_audit (event_type, created_at);

create table if not exists public.business_subscription_status (
  business_id bigint primary key references public.businesses(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  last_event_received timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.payment_audit is 'Immutable audit log for Stripe monetization events.';
comment on table public.business_subscription_status is 'Tracks the latest subscription status per business.';
