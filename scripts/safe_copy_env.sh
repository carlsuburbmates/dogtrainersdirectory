#!/usr/bin/env bash
set -euo pipefail

SRC=${1:-.env.example}
DST=${2:-.env.local}

if [ ! -f "$SRC" ]; then
  echo "Source file $SRC does not exist. Create .env.local manually or run this after creating $SRC" >&2
  exit 1
fi

if [ -f "$DST" ]; then
  echo "$DST already exists — leaving it intact to avoid overwriting local secrets."
  echo "If you really want to replace it, run: cp $SRC $DST (CAUTION: this will overwrite local values)"
  exit 0
fi

cp "$SRC" "$DST"
chmod 600 "$DST" || true
echo "Copied $SRC → $DST (no overwrite; safe)."
