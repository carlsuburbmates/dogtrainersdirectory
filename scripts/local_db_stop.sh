#!/usr/bin/env bash
set -eo pipefail

# Optional/advanced helper: stop and remove the local test Postgres container
# Purpose: For advanced contributors who started a local Postgres container
# using `scripts/local_db_start_apply.sh` and want to clean it up.
# NOTE: This helper is optional — most contributors use a remote Supabase dev/staging project
# and do not need Docker or this script.

CONTAINER_NAME="dtd_local_pg"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Stopping and removing ${CONTAINER_NAME}..."
  docker rm -f ${CONTAINER_NAME} || true
  echo "Removed ${CONTAINER_NAME}."
else
  echo "Local container ${CONTAINER_NAME} not found."
fi
