#!/usr/bin/env bash
set -euo pipefail

# Refresh `supabase/schema.sql` from the live database.
#
# Why this exists:
# - Supabase is currently on Postgres 17.
# - `pg_dump` must match (or be newer than) the server major version.
# - Many macOS machines have older `pg_dump` in PATH (e.g. Postgres 14).
#
# Usage:
#   SUPABASE_CONNECTION_STRING="postgresql://..." ./scripts/refresh_schema.sh
#
# Notes:
# - This is schema-only; it deliberately excludes data.
# - The recommended connection string is the Supabase *session pooler* URL to
#   avoid IPv6-only direct hosts.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

source .env.local 2>/dev/null || true

CONN="${SUPABASE_CONNECTION_STRING:-}"
if [[ -z "$CONN" ]]; then
  echo "SUPABASE_CONNECTION_STRING is not set (env or .env.local)." >&2
  exit 1
fi

# Add sslmode=require if not present.
if [[ "$CONN" != *"sslmode="* ]]; then
  CONN="$CONN?sslmode=require"
fi

SCHEMA_OUT="supabase/schema.sql"

pick_pg_dump() {
  if [[ -x "/opt/homebrew/opt/postgresql@17/bin/pg_dump" ]]; then
    echo "/opt/homebrew/opt/postgresql@17/bin/pg_dump"
    return 0
  fi

  if command -v pg_dump >/dev/null 2>&1; then
    # Try to read the major version from `pg_dump --version` output.
    local ver
    ver="$(pg_dump --version | awk '{print $NF}' | cut -d. -f1 || true)"
    if [[ "$ver" =~ ^[0-9]+$ ]] && [[ "$ver" -ge 17 ]]; then
      echo "pg_dump"
      return 0
    fi
  fi

  if command -v docker >/dev/null 2>&1; then
    echo "docker"
    return 0
  fi

  return 1
}

PG_DUMP_BIN="$(pick_pg_dump)" || {
  echo "Could not find a Postgres 17+ compatible pg_dump binary." >&2
  echo "Fix options:" >&2
  echo "1) Install Postgres 17 client tools (macOS/Homebrew): brew install postgresql@17" >&2
  echo "2) Install Docker Desktop and re-run (this script can use a Postgres 17 container)." >&2
  exit 1
}

echo "Refreshing ${SCHEMA_OUT} from remote DB..."

if [[ "$PG_DUMP_BIN" == "docker" ]]; then
  # Use the official Postgres 17 image to ensure `pg_dump` compatibility.
  docker run --rm -i postgres:17-alpine pg_dump \
    --schema-only \
    --no-owner \
    --no-privileges \
    --quote-all-identifiers \
    "$CONN" >"$SCHEMA_OUT"
else
  "$PG_DUMP_BIN" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --quote-all-identifiers \
    "$CONN" >"$SCHEMA_OUT"
fi

echo "Done: ${SCHEMA_OUT}"

