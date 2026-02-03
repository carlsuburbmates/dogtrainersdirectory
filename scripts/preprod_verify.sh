#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

failures=0

run_step() {
  local label="$1"
  shift
  echo "========================================"
  echo "Running ${label}"
  if "$@"; then
    echo "[PASS] ${label}"
  else
    echo "[FAIL] ${label}"
    failures=$((failures + 1))
  fi
}

run_step "Type Check" npm run type-check
run_step "Smoke Tests" npm run smoke
run_step "Lint" npm run lint
run_step "Docs Guard" npm run docs:guard
run_step "Env Ready Check" ./scripts/check_env_ready.sh "${ENV_TARGET:-production}"

if [[ "$failures" -eq 0 ]]; then
  echo "All verification steps passed."
  exit 0
else
  echo "${failures} verification step(s) failed. See logs above."
  exit 1
fi
