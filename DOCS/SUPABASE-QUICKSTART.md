This short guide explains how this project uses Supabase in remote dev/staging and production environments, how schema changes should move from migrations -> CI -> production, and when local Docker-based testing is an optional advanced workflow.

Important: Treat `supabase/migrations/` as the canonical source of schema truth for CI and production. `supabase/schema.sql` and seeds are provided as helpful snapshots — they are intended for optional local testing only. Do NOT apply `schema.sql` directly to staging/production — use migrations.

## Recommended (default) developer workflow — remote Supabase dev/staging (no Docker required)

This repository uses a remote Supabase dev/staging project as the primary development environment. Docker/local Postgres is NOT required for normal contributor workflows.

Get started (remote dev only):

1. Create or reuse a remote Supabase project in the Supabase cloud (dev or staging).
2. Make sure Supabase Auth is enabled — the remote project provides `auth.users` so you don't need local emulation for auth.
3. Create a `.env.local` in the project root and configure the following environment variables (DO NOT commit `.env.local`):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - (Optional) SUPABASE_CONNECTION_STRING — only needed for some admin scripts or CI tasks.
4. Install dependencies and start the dev server locally (the app will talk to the remote Supabase project):

```bash
npm install
npm run dev
```

Why remote dev is recommended:
- No local services required — fast onboarding and less resource usage.
- Uses the same Supabase managed services (Auth, Edge Functions, Storage) as staging/production for accurate testing.
- Easier for teams — a shared dev/staging project makes integration tests and real data flows simpler.

## Schema changes / CI behaviour (remote-first)

### Migrations & Archives

For a short reference to which migration files are active vs archived, see `DOCS/db/MIGRATIONS_INDEX.md`. In short:

- Keep incremental schema changes in `supabase/migrations/` so CI can pick them up via `supabase db push` / `supabase db migrate`.
- Use `supabase/migrations_archive/` for large seeds and full-schema exports (these are **not** picked up automatically). Review archived SQL before applying manually.



- Write and commit small, incremental migration files into `supabase/migrations/`.
- CI deploys migrations to the chosen environment (staging/production) using `SUPABASE_CONNECTION_STRING_*` secrets; the `deploy-migrations.yml` workflow takes a backup and applies migrations in lexical order.
- Never apply `supabase/schema.sql` in CI or production.

## Advanced (optional): local Postgres / offline migration testing with Docker

If you are an advanced contributor or need an isolated offline environment (for example to stress-test migrations, run migration idempotency checks, or run ABN scripts against fake data), the repo includes helper scripts and a schema snapshot for running a local Postgres instance with Docker. These helpers are optional and NOT required for normal development.

Advanced/local helpers (optional):
- `supabase/schema.sql` — a snapshot of the canonical schema for local experiments.
- `supabase/data-import.sql` — seed/example data for local testing.
- `scripts/local_db_start_apply.sh` — advanced helper that starts a local Postgres container and applies `schema.sql` + seeds.
- `scripts/local_db_stop.sh` — advanced helper to stop/remove the local test container.
- `scripts/test_apply_migrations.sh` — optional helper that starts a local Postgres container, creates a minimal `auth.users` stub, and applies migrations in order.

When you might use the Docker helpers (optional):
- Testing migration edge-cases before committing them to `supabase/migrations/`.
- Developing migration transformations that are destructive (you can do them on a disposable local DB first).
- Running ABN scripts or other maintenance commands against synthetic/local data without touching the shared dev/staging project.

## ABN verification workflows (ops & CI)

Key scripts:
- `/scripts/abn_recheck.py` — scheduled re-check of `abn_verifications` rows (CI job `.github/workflows/abn-recheck.yml`).
  - Uses either `SUPABASE_CONNECTION_STRING` or `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
  - Supports `--dry-run` (recommended default for scheduled runs) and `AUTO_APPLY` for controlled writes.
- `/scripts/abn_controlled_batch.py` — ops-only batch tool for manual one-off writes (dry-run by default, `--apply` to write and requires `AUTO_APPLY` + a service-role key).

Workflow safety:
- CI defaults to `staging` and uses dry-run where appropriate. Production writes require manual confirmation and create a DB backup artifact before applying changes.

## Where to read more
- Advanced/local helper quickstart: `supabase/LOCAL_SETUP.md`
- Supabase CLI instructions (optional): `supabase/README.md`
- Vercel & environment matrix: `DOCS/VERCEL_ENV.md`