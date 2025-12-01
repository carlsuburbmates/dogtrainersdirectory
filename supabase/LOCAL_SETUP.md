# Supabase setup — remote-first developer Quickstart (no Docker required)

This repository assumes a remote Supabase dev/staging project is used by default for development. Docker/local Postgres is available as an advanced, optional path for contributors who need isolated offline testing.

Important: the primary, recommended flow is "remote-first" — no Docker required for normal development.

Files you will use (remote-first)
- `.env.local` — set these keys for a remote dev/staging Supabase project (do NOT commit this file):
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - (Optional) SUPABASE_CONNECTION_STRING — used by some admin scripts and CI when needed.

Quick start (remote dev / default)
1) Create or reuse a Supabase project for development/staging in the Supabase cloud.
2) Configure `.env.local` with the keys above (do not commit).
3) Install deps and run the app locally; the app will talk to the remote Supabase project over HTTPS:

```bash
npm install
npm run dev
```

Notes & safety
- This remote path provides the full Supabase service surface (auth, functions, storage) without needing Docker locally.
- Keep sensitive values (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_CONNECTION_STRING) in secure storage and never commit them.

Advanced (optional): local Postgres / offline migration testing with Docker

If you require an isolated local Postgres for tough migration-edge testing or for running scripts against synthetic data, this repo contains helper scripts and schema snapshots — these are optional and for advanced contributors only.

Optional Docker/local helpers (advanced only):
- `scripts/local_db_start_apply.sh` — advanced helper: start/reuse a local Postgres container and apply `supabase/schema.sql` + `supabase/data-import.sql`. Supports `--reset`, `--no-seed`, and `--seed-only`.
- `scripts/local_db_stop.sh` — advanced helper to stop and remove the local test container.
- `scripts/test_apply_migrations.sh` — optional helper that starts a local Postgres container, creates a minimal `auth.users` stub, and applies migrations in order.

If you'd prefer to run a local Supabase emulator for full parity (auth/functions/storage), use the Supabase CLI approach documented in `supabase/README.md` (optional).