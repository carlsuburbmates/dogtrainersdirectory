# Local Postgres dev + apply schema (for contributors)

This repository includes the project schema and seed SQL in `supabase/schema.sql` and `supabase/data-import.sql`.

If you can't run the schema directly on the hosted Supabase (for example: firewall/whitelist prevents direct admin connections) you can run a local Postgres instance and apply the SQL files locally for development. These scripts are simple helpers using Docker.

Files
- `scripts/local_db_start_apply.sh` — start a local Postgres container and apply `supabase/schema.sql` + `supabase/data-import.sql`.
- `scripts/local_db_verify.sh` — run a few checks and show counts for common tables.
- `scripts/local_db_stop.sh` — stop and remove the local container.

Usage
1. Ensure Docker is installed and running on your machine.
2. From the repo root, run:

```bash
./scripts/local_db_start_apply.sh [POSTGRES_PASSWORD] [PG_PORT]
# e.g. ./scripts/local_db_start_apply.sh local_pass 5433
```

3. Verify schema + seed applied:

```bash
./scripts/local_db_verify.sh [POSTGRES_PASSWORD] [PG_PORT]
```

4. Stop the local DB when finished:

```bash
./scripts/local_db_stop.sh
```

Notes
- The helper uses `postgres:15-alpine` and `sslmode=disable` for the local connection.
- Some Supabase-specific extensions or Postgres features used in the hosted project may not be available locally. If the schema includes extensions, the local image needs the appropriate extensions installed — adjust or replace the Docker tag accordingly.
- Use this for local development and testing if the remote Supabase admin host isn't accessible or if you prefer a disposable local instance.
