#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV=${1:-production}
MANIFEST="config/env_required.json"

echo "========================================"
echo "Running Env Ready Check (target: ${TARGET_ENV})"

if [[ ! -f "$MANIFEST" ]]; then
  echo "[FAIL] Env Ready Check"
  echo "Manifest $MANIFEST not found."
  exit 1
fi

REQUIRED_VARS=$(python3 <<'PY'
import json, os, sys
manifest_path = os.environ.get('MANIFEST_PATH', 'config/env_required.json')
target = os.environ.get('TARGET_ENV', 'production')
with open(manifest_path, 'r', encoding='utf-8') as f:
    data = json.load(f)
common = data.get('common', [])
target_list = data.get(target, [])
if target_list is None:
    target_list = []
# de-duplicate while preserving order
seen = set()
ordered = []
for name in list(common) + list(target_list):
    if name not in seen:
        ordered.append(name)
        seen.add(name)
print('\n'.join(ordered))
PY
)

missing=()
for var in $REQUIRED_VARS; do
  value="${!var-}"
  if [[ -z "$value" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing environment variables:"
  for var in "${missing[@]}"; do
    echo "  - $var"
  done
  echo "[FAIL] Env Ready Check"
  exit 1
else
  echo "All required variables are set."
  echo "[PASS] Env Ready Check"
fi
