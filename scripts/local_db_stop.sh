#!/usr/bin/env bash
set -eo pipefail

CONTAINER_NAME="dtd_local_pg"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Stopping and removing ${CONTAINER_NAME}..."
  docker rm -f ${CONTAINER_NAME} || true
  echo "Removed ${CONTAINER_NAME}."
else
  echo "Local container ${CONTAINER_NAME} not found."
fi
