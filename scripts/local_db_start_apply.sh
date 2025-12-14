#!/usr/bin/env bash
set -eo pipefail

# Optional/advanced helper to run a local Postgres container and apply schema + seeds
# Usage:
#   ./scripts/local_db_start_apply.sh [--reset] [--no-seed] [POSTGRES_PASSWORD] [PG_PORT]
# Defaults: POSTGRES_PASSWORD=local_pass  PG_PORT=5433
# Purpose: Optional tool for advanced contributors wanting a disposable local Postgres
# instance for migration testing or offline experiments.
# NOT required for normal development — this repo defaults to using a remote Supabase
# dev/staging project (see README.md and DOCS/SUPABASE-QUICKSTART.md).
# Safety: the script will refuse to run if SUPABASE_CONNECTION_STRING appears to
# point at a remote host (non-localhost) or matches a production host found in
# `.env.production`, `.env.preview` or `.env.local`. Do NOT use this script to target production.

RESET=false
NO_SEED=false
SEED_ONLY=false

while [[ "$1" =~ ^- && ! "$1" == "-" ]]; do case $1 in
  --reset ) RESET=true ;;
  --no-seed ) NO_SEED=true ;;
  --seed-only ) SEED_ONLY=true ;;
  * ) break ;;
esac; shift; done

PG_PASS=${1:-local_pass}
PG_PORT=${2:-5433}
CONTAINER_NAME="dtd_local_pg"

echo "Target: local Postgres container '${CONTAINER_NAME}' on 127.0.0.1:${PG_PORT}"

# Basic safety: ensure we are not pointed at production via SUPABASE_CONNECTION_STRING
# We'll refuse to run if a remote host is detected in the connection string or if
# it matches a production host provided in .env.* files.
PROD_HOST=$(grep -E '^SUPABASE_URL=' .env.production 2>/dev/null | cut -d'=' -f2- | sed 's|https://||' | sed 's|/||') || true
PREVIEW_HOST=$(grep -E '^SUPABASE_URL=' .env.preview 2>/dev/null | cut -d'=' -f2- | sed 's|https://||' | sed 's|/||') || true
LOCAL_HOST=$(grep -E '^SUPABASE_URL=' .env.local 2>/dev/null | cut -d'=' -f2- | sed 's|https://||' | sed 's|/||') || true

if [[ -n "$SUPABASE_CONNECTION_STRING" ]]; then
  CONN_HOST=$(python - <<PY
import sys, urllib.parse as u
c='''${SUPABASE_CONNECTION_STRING}'''
try:
  p=u.urlparse(c)
  print(p.hostname or '')
except Exception:
  print('')
PY
) || true

  if [[ -n "$CONN_HOST" && "$CONN_HOST" != "127.0.0.1" && "$CONN_HOST" != "localhost" ]]; then
    # Disallow connection strings pointing to non-local hosts for this script
    echo "Refusing to run against remote SUPABASE_CONNECTION_STRING host ($CONN_HOST). This helper is local-only." >&2
    exit 2
  fi

  if [[ -n "$PROD_HOST" && -n "$CONN_HOST" && "$CONN_HOST" =~ "$PROD_HOST" ]]; then
    echo "Refusing to run — SUPABASE_CONNECTION_STRING points at production host ($PROD_HOST)." >&2
    exit 2
  fi
  if [[ -n "$PREVIEW_HOST" && -n "$CONN_HOST" && "$CONN_HOST" =~ "$PREVIEW_HOST" ]]; then
    echo "Refusing to run — SUPABASE_CONNECTION_STRING points at preview/staging host ($PREVIEW_HOST)." >&2
    exit 2
  fi
fi

# Also refuse if SUPABASE_URL from .env.local points at something non-local (for safety):
if [[ -n "$LOCAL_HOST" && "$LOCAL_HOST" != "127.0.0.1" && "$LOCAL_HOST" != "localhost" ]]; then
  echo "Warning: .env.local SUPABASE_URL points at a non-local host ($LOCAL_HOST). This script will refuse to continue unless you unset SUPABASE_CONNECTION_STRING or run with a local-only config." >&2
  # don't exit — only warn; we check connection string explicitly above
fi

# Pull image and reset container when requested
docker pull postgres:15-alpine

if $RESET; then
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "--reset: removing existing container ${CONTAINER_NAME}"
    docker rm -f ${CONTAINER_NAME} >/dev/null 2>&1 || true
  fi
fi

# Start container if not already running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Container ${CONTAINER_NAME} is already running. Skipping start."
else
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Container ${CONTAINER_NAME} exists but is stopped. Starting..."
    docker start ${CONTAINER_NAME} >/dev/null
  else
    echo "Starting local Postgres container (${CONTAINER_NAME}) on port ${PG_PORT}..."
    docker run --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=${PG_PASS} -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p ${PG_PORT}:5432 -d postgres:15-alpine
  fi
fi

# Wait for Postgres to accept connections
echo "Waiting for Postgres to be ready..."
for i in {1..30}; do
  if PGPASSWORD="${PG_PASS}" psql -h 127.0.0.1 -p ${PG_PORT} -U postgres -d postgres -c "select 1" >/dev/null 2>&1; then
    echo "Postgres ready"
    break
  fi
  sleep 1
  echo -n '.'
  if [ $i -eq 30 ]; then
    echo "\nPostgres didn't come up in time — check Docker and ports." >&2
    exit 1
  fi
done

# Apply schema and seed files
MIGRATIONS_DIR="supabase/migrations"
SCHEMA_FILE="supabase/schema.sql"
SEED_FILE="supabase/data-import.sql"

# If seeding-only, confirm container is running and apply seeds only
if [ "$SEED_ONLY" = true ]; then
  echo "--seed-only specified — applying seeds only to local DB at 127.0.0.1:${PG_PORT}"
  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Local container ${CONTAINER_NAME} is not running; start it first with ./scripts/local_db_start_apply.sh" >&2
    exit 1
  fi
  if [ -f "$SEED_FILE" ]; then
    echo "Applying seed: $SEED_FILE"
    PGPASSWORD="${PG_PASS}" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -f "$SEED_FILE" || {
      echo "Seed apply reported errors — check output above." >&2
    }
  else
    echo "Seed file not found — skipping.";
  fi
  echo "Seed-only run finished."
  exit 0
fi

# Prefer applying migrations first (if any exist). Otherwise fall back to schema.sql
if [ -d "$MIGRATIONS_DIR" ] && ls "$MIGRATIONS_DIR"/*.sql >/dev/null 2>&1; then
  echo "Found SQL migrations in $MIGRATIONS_DIR — applying in lexical order"
  for f in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    echo "Applying migration $f"
    MIGRATION_OUTPUT=$(PGPASSWORD="${PG_PASS}" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -f "$f" 2>&1)
    MIGRATION_EXIT=$?
    if [ $MIGRATION_EXIT -ne 0 ]; then
      # Check if error is due to idempotent operations (already exists)
      if echo "$MIGRATION_OUTPUT" | grep -qiE "already exists|duplicate key value|relation .* already exists|column .* already exists"; then
        echo "Warning: Migration $f reported 'already exists' or duplicate errors. Continuing. Output:"
        echo "$MIGRATION_OUTPUT"
      else
        echo "Migration $f reported errors — aborting. Check output below." >&2
        echo "$MIGRATION_OUTPUT" >&2
        exit 1
      fi
    fi
  done
else
  # Fallback to applying schema snapshot
  if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Schema file $SCHEMA_FILE not found in repo — aborting." >&2
    exit 1
  fi
  echo "Applying schema: $SCHEMA_FILE to local DB (127.0.0.1:${PG_PORT})"
  PGPASSWORD="${PG_PASS}" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -f "$SCHEMA_FILE" || {
    echo "Schema apply reported errors — check output above. Continuing so you can inspect the DB." >&2
  }
fi

if [ "$NO_SEED" = false ]; then
  if [ -f "$SEED_FILE" ]; then
    echo "Applying seed: $SEED_FILE"
    PGPASSWORD="${PG_PASS}" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -f "$SEED_FILE" || {
      echo "Seed apply reported errors — check output above." >&2
    }
  else
    echo "Seed file not found — skipping.";
  fi
else
  echo "--no-seed specified — skipping seed application."
fi

echo "Done. Verify with ./scripts/local_db_verify.sh ${PG_PASS} ${PG_PORT}"
