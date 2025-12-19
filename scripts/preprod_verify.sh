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
DOCS_DIVERGENCE_SCRIPT="$ROOT_DIR/../dtd-docs-private/scripts/check_docs_divergence.py"
if [[ -f "$DOCS_DIVERGENCE_SCRIPT" ]]; then
  run_step "Doc Divergence Detector" python3 "$DOCS_DIVERGENCE_SCRIPT" --base-ref origin/master
else
  echo "[FAIL] Doc Divergence Detector (missing docs repo at ../dtd-docs-private)"
  failures=$((failures + 1))
fi
run_step "Env Ready Check" ./scripts/check_env_ready.sh "${ENV_TARGET:-production}"

if [[ "$failures" -eq 0 ]]; then
  echo "All verification steps passed."
  exit 0
else
  echo "${failures} verification step(s) failed. See logs above."
  exit 1
fi
