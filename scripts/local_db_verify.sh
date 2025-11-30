#!/usr/bin/env bash
set -euo pipefail

PG_PASS=${1:-local_pass}
PG_PORT=${2:-5433}

echo "Listing relations in postgres (public schema):"
PGPASSWORD="$PG_PASS" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -c "\dt public.*"

# Run a couple of sanity checks — looks for commonly expected tables and shows counts
TABLES=(businesses trainers reviews users)
for t in "${TABLES[@]}"; do
  echo "\nChecking if table '$t' exists and count (if present):"
  PGPASSWORD="$PG_PASS" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -c "select table_name from information_schema.tables where table_schema='public' and table_name='${t}';"
  if PGPASSWORD="$PG_PASS" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -tAc "select count(*) from ${t}" 2>/dev/null; then
    count=$(PGPASSWORD="$PG_PASS" psql "postgresql://postgres:${PG_PASS}@127.0.0.1:${PG_PORT}/postgres?sslmode=disable" -tAc "select count(*) from ${t}" 2>/dev/null || echo "N/A")
    echo "${t} rows: ${count}"
  else
    echo "Table ${t} not present or not accessible"
  fi
done

echo "Done. You can stop the local DB with: ./scripts/local_db_stop.sh"