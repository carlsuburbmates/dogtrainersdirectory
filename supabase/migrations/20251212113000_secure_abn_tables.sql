-- Enforce RLS on abn_verifications for sensitive ABN data
alter table if exists public.abn_verifications enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'abn_verifications'
          and policyname = 'service-role-abn-verifications'
    ) then
        execute 'create policy "service-role-abn-verifications" on public.abn_verifications
          for all
          using (auth.role() = ''service_role'')
          with check (auth.role() = ''service_role'')';
    end if;
end $$;
