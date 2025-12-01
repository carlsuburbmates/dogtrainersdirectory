#!/usr/bin/env bash
set -euo pipefail

# Admin/ops helper: apply schema/data to a remote Postgres using an admin-style connection string.
# Purpose: Advanced/ops-only helper. This script reads SUPABASE_CONNECTION_STRING from environment (or .env.local)
# and attempts to psql -f. It is intended for use against remote dev/staging projects by trusted operators.
# Safety: For production, a human must pass --allow-prod and ensure a database backup exists; this prevents accidental
# writes to production without explicit operator intent. This helper is optional — CI workflows apply migrations remotely
# using `supabase/migrations/` and should be preferred for repeatable applies.
# Usage: ./scripts/try_remote_apply.sh [--allow-prod]

ALLOW_PROD=false
while [[ "$1" =~ ^- && ! "$1" == "-" ]]; do case $1 in
  --allow-prod ) ALLOW_PROD=true ;;
  * ) break ;;
esac; shift; done

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

# Determine production/preview/local hosts from .env.* (if present) and prevent accidental production runs
PROD_HOST=$(grep -E '^SUPABASE_URL=' .env.production 2>/dev/null | cut -d'=' -f2- | sed 's|https://||' | sed 's|/||') || true
PREVIEW_HOST=$(grep -E '^SUPABASE_URL=' .env.preview 2>/dev/null | cut -d'=' -f2- | sed 's|https://||' | sed 's|/||') || true
LOCAL_HOST=$(grep -E '^SUPABASE_URL=' .env.local 2>/dev/null | cut -d'=' -f2- | sed 's|https://||' | sed 's|/||') || true

CONN_HOST=$(python - <<PY
import sys,urllib.parse as u
c='''${CONN}'''
try:
  parsed=u.urlparse(c)
  print(parsed.hostname or '')
except Exception:
  print('')
PY
) || true

if [[ -n "$PROD_HOST" && -n "$CONN_HOST" && "$CONN_HOST" == "$PROD_HOST" && "$ALLOW_PROD" != "true" ]]; then
  echo "Refusing to apply remote schema to production host ($PROD_HOST) without --allow-prod." >&2
  exit 2
fi

# Refuse if connection string points at an obvious remote host and --allow-prod isn't set
if [[ -n "$CONN_HOST" && "$CONN_HOST" != "127.0.0.1" && "$CONN_HOST" != "localhost" && "$ALLOW_PROD" != "true" && -n "$PROD_HOST" && "$CONN_HOST" =~ ".*supabase.*" ]]; then
  echo "Detected a hosted Supabase connection ($CONN_HOST) — ensure this is intended. For production host applies include --allow-prod and a backup. Aborting." >&2
  exit 2
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
