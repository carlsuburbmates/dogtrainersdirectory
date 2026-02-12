#!/usr/bin/env bash
set -euo pipefail

# Deploy Supabase Edge Functions used by the public UI.
#
# This repo calls Edge Functions from the browser via supabase-js (anon key). For these functions,
# you must disable JWT verification at deploy time (or in Supabase dashboard), otherwise unauthenticated
# calls will be rejected.

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install it first: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"

if [[ -z "${PROJECT_REF}" ]]; then
  if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
    host="$(echo "${NEXT_PUBLIC_SUPABASE_URL}" | sed -E 's#^https?://##' | cut -d/ -f1)"
    PROJECT_REF="${host%%.*}"
  fi
fi

if [[ -z "${PROJECT_REF}" ]]; then
  echo "Missing project ref. Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL." >&2
  exit 1
fi

FUNCTIONS=("${@:-suburbs}")

echo "Deploying functions to project ref: ${PROJECT_REF}"

for fn in "${FUNCTIONS[@]}"; do
  echo "- Deploying ${fn} (no JWT verification)"
  supabase functions deploy "${fn}" --project-ref "${PROJECT_REF}" --no-verify-jwt
done

echo "Done. Verify in Supabase dashboard that function secrets are set (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SUPABASE_PGCRYPTO_KEY as needed)."
