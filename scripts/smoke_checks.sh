#!/usr/bin/env bash
set -euo pipefail

# Smoke checks - lightweight integration tests to confirm basic DB health
# Requires SUPABASE_CONNECTION_STRING in env

if [[ -z "${SUPABASE_CONNECTION_STRING:-}" ]]; then
  echo "SUPABASE_CONNECTION_STRING is not set. Set it to your postgres connection string (include password)." >&2
  exit 2
fi

PSQL="psql \"${SUPABASE_CONNECTION_STRING}\" -tAc"

echo "Running smoke checks against database..."

errors=0

run_check() {
  local sql="$1"; local name="$2";
  echo -n "Checking ${name}... "
  out=$(${PSQL} "${sql}") || { echo "(psql failed)"; errors=$((errors+1)); return; }
  out=$(echo "$out" | tr -d '[:space:]')
  echo "$out"
  if [[ -z "$out" ]]; then
    echo "FAIL: ${name} returned empty" >&2
    errors=$((errors+1))
  fi
}

run_check "SELECT 1;" "select_1"
run_check "SELECT count(*) FROM profiles;" "profiles_count"
run_check "SELECT count(*) FROM businesses;" "businesses_count"

if [[ $errors -gt 0 ]]; then
  echo "Smoke checks found ${errors} errors." >&2
  exit 1
fi

echo "Smoke checks passed."
exit 0
