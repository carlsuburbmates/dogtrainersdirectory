#!/usr/bin/env bash
set -eo pipefail

# Optional/advanced test helper: start a fresh local Postgres container and apply all migrations in order
# Usage: ./scripts/test_apply_migrations.sh [PG_PASS] [PG_PORT]
# Default: PG_PASS=test_pass PG_PORT=55433
# Purpose: Optional tool for advanced contributors to test migration ordering and idempotency
# against a disposable local Postgres instance. This is not required for normal development (remote-first).
PG_PASS=${1:-test_pass}
PG_PORT=${2:-55433}
CONTAINER=dtd_migration_test_pg

echo "Preparing to run migrations against a temporary local Postgres container: ${CONTAINER} (127.0.0.1:${PG_PORT})"

# Ensure docker is running
if ! docker info >/dev/null 2>&1; then
  echo "Docker does not appear to be running. Start Docker Desktop or ensure the Docker daemon is available." >&2
  exit 2
fi

# Tear down any existing test container
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Removing existing container ${CONTAINER}"
  docker rm -f ${CONTAINER} >/dev/null || true
fi

# Start a new Postgres container
docker run --name ${CONTAINER} -e POSTGRES_PASSWORD=${PG_PASS} -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p ${PG_PORT}:5432 -d postgres:15-alpine

# Wait for Postgres to be ready
echo "Waiting for Postgres to accept connections..."
for i in {1..30}; do
  if PGPASSWORD="${PG_PASS}" psql -h 127.0.0.1 -p ${PG_PORT} -U postgres -d postgres -c "select 1" >/dev/null 2>&1; then
    echo "Postgres ready"
    break
  fi
  sleep 1
  echo -n '.'
  if [ $i -eq 30 ]; then
    echo "\nPostgres did not start in time" >&2
    docker logs ${CONTAINER} || true
    exit 1
  fi
done

# Create a minimal auth.users stub so foreign keys that reference auth.users succeed.
PGCONN="postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable"
echo "Creating minimal auth schema and users table to satisfy FK references"
PGPASSWORD=${PG_PASS} psql "${PGCONN}" -v ON_ERROR_STOP=1 <<SQL
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
SQL

# Apply migrations (in lexical order)
set +e
errors=0
for f in $(ls supabase/migrations/*.sql | sort); do
  echo "\n--- Applying migration: $f ---"
  if ! PGPASSWORD=${PG_PASS} psql "${PGCONN}" -v ON_ERROR_STOP=1 -f "$f"; then
    echo "Migration failed: $f" >&2
    errors=$((errors+1))
  fi
done
set -e

if [ "$errors" -ne 0 ]; then
  echo "DONE — migrations completed with ${errors} errors" >&2
  docker logs ${CONTAINER} --tail 200 || true
  exit 1
fi

# Quick sanity checks
echo "Running quick sanity checks: list tables in public and auth schemas"
PGPASSWORD=${PG_PASS} psql "${PGCONN}" -c "\dt public.*" || true
PGPASSWORD=${PG_PASS} psql "${PGCONN}" -c "\dt auth.*" || true

echo "All migrations applied with no errors. You can now inspect the DB at ${PGCONN}"

echo "Cleanup: leaving container running for local inspection. Run ./scripts/local_db_stop.sh to remove it when done." 

exit 0
