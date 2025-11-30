#!/usr/bin/env bash
set -euo pipefail

# Data quality checks run against SUPABASE_CONNECTION_STRING.
# Exit non-zero if significant problems are found.

if [[ -z "${SUPABASE_CONNECTION_STRING:-}" ]]; then
  echo "SUPABASE_CONNECTION_STRING is not set. Set it to your postgres connection string (include password)." >&2
  exit 2
fi

PSQL="psql \"${SUPABASE_CONNECTION_STRING}\" -tAc"

echo "Running data-quality checks against database..."

errors=0

check() {
  local sql="$1"
  local label="$2"
  local threshold=${3:-0}
  echo -n "Checking ${label}... "
  val=$(${PSQL} "${sql}") || { echo "(psql failed)"; errors=$((errors+1)); return; }
  val=$(echo "$val" | tr -d '[:space:]')
  if [[ -z "$val" ]]; then val=0; fi
  echo "$val"
  if [[ ${val:-0} -gt $threshold ]]; then
    echo "FAIL: ${label} -> ${val} (threshold ${threshold})" >&2
    errors=$((errors+1))
  fi
}

# 1) Orphan businesses missing profile but not scaffolded
check "SELECT count(*) FROM businesses WHERE profile_id IS NULL AND is_scaffolded = false;" "orphan_businesses_without_profile" 0

# 2) Scaffolded businesses missing suburb
check "SELECT count(*) FROM businesses WHERE is_scaffolded = true AND suburb_id IS NULL;" "scaffolded_without_suburb" 0

# 3) ABN verifications pending older than 30 days
check "SELECT count(*) FROM abn_verifications WHERE status = 'pending' AND created_at < now() - interval '30 days';" "stale_abn_pending" 0

# 4) Duplicate ABN entries
duplicates=$(${PSQL} "SELECT count(*) FROM (SELECT abn FROM abn_verifications GROUP BY abn HAVING COUNT(*) > 1) t;")
duplicates=$(echo "$duplicates" | tr -d '[:space:]')
echo "duplicate_abn_count: ${duplicates}"
if [[ ${duplicates:-0} -gt 0 ]]; then echo "FAIL: duplicate ABN present -> ${duplicates}" >&2; errors=$((errors+1)); fi

# 5) Suburbs without council mapping
check "SELECT count(*) FROM suburbs WHERE council_id IS NULL;" "suburbs_missing_council" 0

if [[ $errors -gt 0 ]]; then
  echo "Data-quality checks found ${errors} issues." >&2
  exit 1
fi

echo "All data-quality checks passed."
exit 0
