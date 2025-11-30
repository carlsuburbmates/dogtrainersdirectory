#!/usr/bin/env bash
set -euo pipefail

# Try applying the schema/data to a remote Postgres using an admin-style connection string.
# It will read SUPABASE_CONNECTION_STRING from environment (or .env.local) and attempt to psql -f.
# If the TCP connection is blocked it will print safe next steps (Supabase Dashboard SQL editor or local Docker method).

# Usage: ./scripts/try_remote_apply.sh

source .env.local 2>/dev/null || true

CONN=${SUPABASE_CONNECTION_STRING:-}
if [[ -z "$CONN" ]]; then
  echo "SUPABASE_CONNECTION_STRING not set in env or .env.local. Please set it first or run against local DB."
  echo "Example: export SUPABASE_CONNECTION_STRING='postgresql://user:pass@host:5432/postgres'"
  exit 1
fi

SCHEMA_FILE="supabase/schema.sql"
SEED_FILE="supabase/data-import.sql"

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "Schema file not found at $SCHEMA_FILE" >&2
  exit 1
fi

# Add sslmode=require if not present
if [[ "$CONN" != *"sslmode="* ]]; then
  CONN="$CONN?sslmode=require"
fi

echo "Testing remote connectivity to Postgres using SUPABASE_CONNECTION_STRING..."
if ! psql "$CONN" -c "select 1" >/dev/null 2>&1; then
  echo "Could not connect to the remote Postgres host using the provided connection string." >&2
  echo "Common causes: your network can't reach the hosted DB; Supabase may refuse direct admin connections from outside their allowed IPs.\n"
  echo "Two safe options:"
  echo "1) Use the Supabase Dashboard SQL editor (recommended) and paste in supabase/schema.sql and supabase/data-import.sql."
  echo "2) Run the helper locally (./scripts/local_db_start_apply.sh) or provide a temporary admin connection that allows external TCP connections."
  exit 1
fi

# If we can connect, apply schema
echo "Remote DB reachable — applying schema file: $SCHEMA_FILE"
psql "$CONN" -f "$SCHEMA_FILE" || echo "Schema apply finished with some errors (see output)."

if [[ -f "$SEED_FILE" ]]; then
  echo "Applying seed file: $SEED_FILE"
  psql "$CONN" -f "$SEED_FILE" || echo "Seed apply finished with some errors (see output)."
fi

echo "Schema & seed run complete — please verify in Supabase Dashboard or using psql."
