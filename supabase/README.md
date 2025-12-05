# Supabase local dev with the Supabase CLI

This README explains how to use the Supabase CLI as an alternative to the lightweight Docker + psql helpers in `supabase/LOCAL_SETUP.md`.

Why use the CLI?
- `supabase start` provides a local emulation of Supabase services (Postgres DB, Auth, Storage, Edge Functions). Use this when you need feature parity with hosted Supabase (auth flows, functions, local emulation).
- The CLI can manage migrations in `supabase/migrations/` and connect to the local DB so it's a natural choice when testing migrations locally.

Prerequisites
- Node.js 24 (as recommended in the repo) or a system package manager that the Supabase CLI supports.
- Docker installed and running (the CLI uses a Docker-based local dev stack).

Install the Supabase CLI
- macOS / Homebrew:

  brew install supabase/tap/supabase

- NPM (global install):

  npm i -g supabase

- See the official installer if you prefer another method: https://supabase.com/docs/guides/cli

Start a local Supabase stack for this project
1. From the repository root, initialize the CLI (if you haven't already):

```bash
supabase login        # optional: store an access token for working with remote projects
supabase init         # optional: creates .supabase and local settings (only do once)
```

2. Start the local stack (runs Postgres + Auth + Storage + Functions emulation):

```bash
supabase start
```

3. Confirm the local DB is running and get connection string (the CLI will show it) — you can also view `.supabase/config.toml` for local port mappings.

Apply migrations to the local Supabase database
- The repo keeps canonical DDL in `supabase/migrations/`. To apply those to the local dev DB, use the CLI and the migrations commands.

1) Check the current migration status:

```bash
supabase migrations status
```

2) Apply pending migrations to the local DB:

```bash
supabase migrations apply
```

If the CLI on your platform does not support `migrations apply`, you can apply them with psql against the CLI-provided local DB connection string. Example:

```bash
# get the connection string from the running local stack (supabase start output or .supabase/config.toml)
PGCONN=<local_connection_string>
psql "$PGCONN" -f supabase/migrations/000001_initial.sql
# repeat or loop through the files in chronological order
```

Notes / best practices
- For local development prefer the Supabase CLI when you need local services (auth, functions, storage). Use the repo `scripts/local_db_start_apply.sh` for a lightweight Postgres-only experience (faster, fewer resources).
- Never apply migrations from `supabase/schema.sql` — the canonical source for runtime applies (CI, production) is `supabase/migrations/`.
- Keep migrations small and incremental. When changing DB structure, create a new migration file (timestamped) and commit it to `supabase/migrations/` so CI can run it.

Troubleshooting
- If `supabase start` fails, check Docker is running and that no local ports conflict.
- If migrations fail due to extensions, use a compatible Postgres image / ensure the extension is available locally.

If you'd like, I can add a short example of using `supabase start` + `supabase migrations apply` in `supabase/LOCAL_SETUP.md` — I will also add a short link there.