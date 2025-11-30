#!/usr/bin/env bash
set -euo pipefail

# Quick remote DB check using SUPABASE_CONNECTION_STRING in .env.local or env
# Usage: ./scripts/remote_db_info.sh

source .env.local 2>/dev/null || true
CONN=${SUPABASE_CONNECTION_STRING:-}
if [[ -z "$CONN" ]]; then
  echo "SUPABASE_CONNECTION_STRING not found in env or .env.local — set it and re-run." >&2
  exit 1
fi
if [[ "$CONN" != *"sslmode="* ]]; then
  CONN="$CONN?sslmode=require"
fi

echo "Testing remote connection..."
if ! psql "$CONN" -c "select 1" >/dev/null 2>&1; then
  echo "Unable to reach remote DB. As before, this environment may block direct admin connections."
  exit 1
fi

echo "Listing public relations:\n"
psql "$CONN" -c "\dt public.*"

# Optional sample checks — adjust table names if schema changes
declare -a CHECK_TABLES=("businesses" "trainers" "reviews")
for t in "${CHECK_TABLES[@]}"; do
  echo "\nChecking table: ${t}"
  psql "$CONN" -c "select count(*) as cnt from ${t};" || echo "Table ${t} not present or query failed.";
done

echo "Done."
