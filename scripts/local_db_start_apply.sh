#!/usr/bin/env bash
set -eo pipefail

# Simple helper to run a local Postgres container and apply schema + seeds
# Usage: ./scripts/local_db_start_apply.sh [POSTGRES_PASSWORD] [PG_PORT]
# Defaults: POSTGRES_PASSWORD=local_pass  PG_PORT=5433

PG_PASS=${1:-local_pass}
PG_PORT=${2:-5433}
CONTAINER_NAME="dtd_local_pg"

echo "Starting local Postgres container (${CONTAINER_NAME}) on port ${PG_PORT}..."

docker pull postgres:15-alpine

# If container exists, stop/remove it first
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Container ${CONTAINER_NAME} exists — removing..."
  docker rm -f ${CONTAINER_NAME} >/dev/null 2>&1 || true
fi

docker run --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=${PG_PASS} -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p ${PG_PORT}:5432 -d postgres:15-alpine

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
SCHEMA_FILE="supabase/schema.sql"
SEED_FILE="supabase/data-import.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Schema file $SCHEMA_FILE not found in repo — aborting." >&2
  exit 1
fi

echo "Applying schema: $SCHEMA_FILE"
PGPASSWORD="${PG_PASS}" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -f "$SCHEMA_FILE" || {
  echo "Schema apply reported errors — check output above. Continuing so you can inspect the DB." >&2
}

if [ -f "$SEED_FILE" ]; then
  echo "Applying seed: $SEED_FILE"
  PGPASSWORD="${PG_PASS}" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -f "$SEED_FILE" || {
    echo "Seed apply reported errors — check output above." >&2
  }
else
  echo "Seed file not found — skipping.";
fi

echo "Done. Verify with ./scripts/local_db_verify.sh ${PG_PASS} ${PG_PORT}"
