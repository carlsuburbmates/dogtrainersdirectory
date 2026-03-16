do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.daily_ops_digests'::regclass
      and contype = 'u'
      and conname = 'daily_ops_digests_digest_date_key'
  ) then
    alter table public.daily_ops_digests
      drop constraint daily_ops_digests_digest_date_key;
  end if;
end $$;

create index if not exists daily_ops_digests_digest_date_created_idx
  on public.daily_ops_digests (digest_date desc, created_at desc);
