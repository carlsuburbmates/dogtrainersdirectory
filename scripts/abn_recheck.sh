#!/usr/bin/env bash
set -euo pipefail

# ABN re-check script
# Requires these env vars (CI or local):
#  - SUPABASE_CONNECTION_STRING (postgres connection string)
#  - ABR_API_KEY (the ABR API key) or ABR_GUID for older GUID auth

if [[ -z "${SUPABASE_CONNECTION_STRING:-}" ]]; then
  echo "SUPABASE_CONNECTION_STRING not set" >&2
  exit 2
fi
if [[ -z "${ABR_API_KEY:-}" && -z "${ABR_GUID:-}" ]]; then
  echo "ABR_API_KEY or ABR_GUID required for ABR lookups" >&2
  exit 2
fi

PSQL="psql \"${SUPABASE_CONNECTION_STRING}\" -tAc"

echo "Fetching ABN verification rows to re-check..."
# Find rows needing recheck: pending or manual_review and created within last 30 days
rows=$(${PSQL} "SELECT id, abn, business_name FROM abn_verifications WHERE status IN ('pending','manual_review') AND created_at >= now() - interval '30 days' LIMIT 50;")

#!/usr/bin/env bash
set -euo pipefail

# Wrapper for Python ABN re-check implementation.
# Kept as a minimal shim for backwards compatibility.

if [[ -z "${SUPABASE_CONNECTION_STRING:-}" ]]; then
  echo "SUPABASE_CONNECTION_STRING not set" >&2
  exit 2
fi

if [[ -z "${ABR_API_KEY:-}" && -z "${ABR_GUID:-}" ]]; then
  echo "ABR_API_KEY or ABR_GUID required for ABR lookups" >&2
  exit 2
fi

python3 scripts/abn_recheck.py "$@"
