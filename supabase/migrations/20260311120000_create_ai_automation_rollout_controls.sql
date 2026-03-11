create table if not exists public.ai_automation_rollout_controls (
    id uuid primary key default gen_random_uuid(),
    workflow text not null unique,
    rollout_state text not null,
    reason text,
    review_owner text,
    approved_by text,
    updated_by_user_id text,
    last_reviewed_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint ai_automation_rollout_controls_workflow_check check (
        workflow in (
            'triage',
            'moderation',
            'verification',
            'ops_digest',
            'onboarding',
            'business_listing_quality',
            'scaffold_review_guidance'
        )
    ),
    constraint ai_automation_rollout_controls_state_check check (
        rollout_state in (
            'disabled',
            'shadow',
            'shadow_only',
            'shadow_live_ready',
            'controlled_live',
            'paused_after_review'
        )
    )
);

create table if not exists public.ai_automation_rollout_events (
    id uuid primary key default gen_random_uuid(),
    workflow text not null,
    from_rollout_state text,
    to_rollout_state text not null,
    reason text not null,
    review_owner text,
    approved_by text,
    acted_by_user_id text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    constraint ai_automation_rollout_events_workflow_check check (
        workflow in (
            'triage',
            'moderation',
            'verification',
            'ops_digest',
            'onboarding',
            'business_listing_quality',
            'scaffold_review_guidance'
        )
    ),
    constraint ai_automation_rollout_events_from_state_check check (
        from_rollout_state is null or from_rollout_state in (
            'disabled',
            'shadow',
            'shadow_only',
            'shadow_live_ready',
            'controlled_live',
            'paused_after_review'
        )
    ),
    constraint ai_automation_rollout_events_to_state_check check (
        to_rollout_state in (
            'disabled',
            'shadow',
            'shadow_only',
            'shadow_live_ready',
            'controlled_live',
            'paused_after_review'
        )
    )
);

create index if not exists ai_automation_rollout_events_workflow_idx
    on public.ai_automation_rollout_events (workflow, created_at desc);

alter table public.ai_automation_rollout_controls enable row level security;
alter table public.ai_automation_rollout_events enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'ai_automation_rollout_controls'
          and policyname = 'service-role-ai-automation-rollout-controls'
    ) then
        execute 'create policy "service-role-ai-automation-rollout-controls"
          on public.ai_automation_rollout_controls
          for all
          using (auth.role() = ''service_role'')
          with check (auth.role() = ''service_role'')';
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'ai_automation_rollout_events'
          and policyname = 'service-role-ai-automation-rollout-events'
    ) then
        execute 'create policy "service-role-ai-automation-rollout-events"
          on public.ai_automation_rollout_events
          for all
          using (auth.role() = ''service_role'')
          with check (auth.role() = ''service_role'')';
    end if;
end $$;
