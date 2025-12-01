#!/usr/bin/env bash
# scripts/vercel-env-import.sh
# Interactive helper to import environment variables from .env.local into Vercel
# Safety-first: defaults to DRY_RUN unless you pass --apply

set -euo pipefail
SCRIPT_NAME=$(basename "$0")
ENV_FILE=${ENV_FILE:-.env.local}
DRY_RUN=true
VERCEL_PROJECT=${VERCEL_PROJECT:-}

usage() {
  cat <<EOF
Usage: $SCRIPT_NAME [--apply] [--project <vercel-project>]

Options:
  --apply            Actually run 'vercel env add' to push values. Otherwise this is a dry run (safe).
  --project <name>   Vercel project name or ID (if empty you'll be prompted for each run).
  --envs <list>      Comma separated default environments to propose (defaults: production,preview)
  --help             Show this message

Notes:
- This script reads ${ENV_FILE} and will prompt before adding each variable.
- By default it won't make remote changes. Use --apply to perform the Vercel CLI calls.
- Do NOT run this on an environment where you can't protect secrets in the shell history.
EOF
  exit 1
}

# parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) DRY_RUN=false; shift ;;
    --project) VERCEL_PROJECT="$2"; shift 2 ;;
    --envs) DEFAULT_ENVS="$2"; shift 2 ;;
    --help) usage ;;
    *) echo "Unknown arg: $1"; usage ;;
  esac
done

DEFAULT_ENVS=${DEFAULT_ENVS:-production,preview}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file $ENV_FILE not found. Create one or set ENV_FILE=path" >&2
  exit 1
fi

# read .env file and parse keys
# Read non-comment, non-empty lines from ENV_FILE into lines array (portable for older bash)
lines=()
while IFS= read -r line || [[ -n "$line" ]]; do
  lines+=("$line")
done < <(grep -v '^\\s*#' "$ENV_FILE" | sed -E 's/\\r$//' | sed '/^\\s*$/d')

if [[ ${#lines[@]} -eq 0 ]]; then
  echo "No variables found in $ENV_FILE" && exit 0
fi

# gather var names and values into arrays
names=()
values=()
for line in "${lines[@]}"; do
  if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    val="${BASH_REMATCH[2]}"
    # remove surrounding quotes if present
    if [[ "$val" =~ ^\".*\"$ || "$val" =~ ^\'.*\'$ ]]; then
      val=${val:1:${#val}-2}
    fi
    names+=("$key")
    values+=("$val")
  fi
done

count=${#names[@]}

echo "Found $count env var(s) in $ENV_FILE"

# helper: classify
is_public() {
  [[ "$1" =~ ^NEXT_PUBLIC_ ]] && return 0 || return 1
}

ask_yes_no() {
  local prompt="$1" default_answer="$2"
  local ans
  while true; do
    read -rp "$prompt [y/n]: " ans
    ans_lower=$(echo "$ans" | tr '[:upper:]' '[:lower:]')
    case "$ans_lower" in
      y|yes) return 0 ;;
      n|no) return 1 ;;
      '')
        if [[ "$default_answer" == "y" ]]; then return 0; else return 1; fi
        ;;
      *) echo "Please answer y or n" ;;
    esac
  done
}

# If not dry-run, verify vercel is available
if [[ "$DRY_RUN" == "false" ]]; then
  if ! command -v vercel &>/dev/null; then
    echo "Error: vercel CLI not found on PATH. Install and login before --apply" >&2
    exit 1
  fi
  echo "Vercel CLI detected. Project override: ${VERCEL_PROJECT:-(none)}"
fi

# iterate
for i in "${!names[@]}"; do
  name=${names[$i]}
  value=${values[$i]}
  ## For safety: detect placeholder/empty values and skip
  if [[ -z "$value" ]]; then
    echo "Skipping $name — value is empty in $ENV_FILE"
    continue
  fi

  # classify
  if is_public "$name"; then
    scope="public (client)"
    suggested_envs="production,preview,development"
  else
    scope="secret (server-only)"
    suggested_envs="production,preview"
  fi

  echo "\nFound: $name — $scope"
  echo "  Suggested environments: $suggested_envs"

  if ! ask_yes_no "Add $name to Vercel?" y; then
    echo "Skipped $name"
    continue
  fi

  read -rp "Choose environments to add to (comma-separated) [default: ${DEFAULT_ENVS}]: " chosen
  chosen=${chosen:-$DEFAULT_ENVS}
  IFS=',' read -ra envList <<< "$chosen"

  for env in "${envList[@]}"; do
    env=$(echo "$env" | tr -d '[:space:]')
    if [[ -z "$env" ]]; then
      continue
    fi

    echo "Preparing: add $name -> $env"

    if [[ "$DRY_RUN" == "true" ]]; then
      echo "DRY RUN: would run: vercel env add $name $env (value hidden)"
    else
      # Use the Vercel CLI to add the variable. We avoid echoing the secret to stdout.
      # For server-only keys, add the --sensitive flag.
      SENSITIVE_FLAG=""
      if ! is_public "$name"; then
        SENSITIVE_FLAG="--sensitive"
      fi

      # Optionally add --force if VERCEL_FORCE=true
      FORCE_FLAG=""
      if [[ "${VERCEL_FORCE:-}" == "true" ]]; then
        FORCE_FLAG="--force"
      fi

      if [[ -n "$VERCEL_PROJECT" ]]; then
        echo "Adding $name to $env for project: $VERCEL_PROJECT"
        vercel env add "$name" "$env" $SENSITIVE_FLAG $FORCE_FLAG --project "$VERCEL_PROJECT" <<EOF
${value}
EOF
      else
        echo "Adding $name to $env (project prompt by CLI)"
        vercel env add "$name" "$env" $SENSITIVE_FLAG $FORCE_FLAG <<EOF
${value}
EOF
      fi
    fi
  done

  echo "$name processed."

done

echo "\nDone — processed all found variables from $ENV_FILE"
if [[ "$DRY_RUN" == "true" ]]; then
  echo "Tip: re-run with --apply to actually push to Vercel (and ensure you're logged in)."
fi

exit 0
