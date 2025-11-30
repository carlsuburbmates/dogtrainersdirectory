#!/usr/bin/env bash
set -euo pipefail

# Convenient helper to set required GitHub Actions repository secrets using the
# GitHub CLI (gh). This reduces manual UI work: run it locally once and it will
# store the values in your repository's secrets.
#
# Preconditions:
# - You must have the GitHub CLI installed (https://cli.github.com/)
# - You must be authenticated with gh and have admin access to the repository
#
# Usage (interactive):
#   ./scripts/setup_github_secrets.sh
# Usage (arguments):
#   ./scripts/setup_github_secrets.sh --supabase-url 'postgresql://user:pass@host:5432/postgres' --abr-guid 'GUID' --auto-apply 'true'

REPO="${GITHUB_REPOSITORY:-$(git remote get-url origin 2>/dev/null || true)}"

check_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "gh CLI not found. Install it from https://cli.github.com/ and authenticate (gh auth login)" >&2
    exit 2
  fi
}

usage(){
  cat <<EOF
Usage: $0 [--supabase-conn STR] [--abr-guid GUID] [--abr-key KEY] [--auto-apply true|false]
Interactive mode when no args are provided.
This script will create repository secrets using 'gh secret set'.
EOF
}

check_gh

ARGS=$(getopt -o h --long supabase-conn:,abr-guid:,abr-key:,auto-apply: -n "setup_github_secrets.sh" -- "$@") || { usage; exit 1; }
eval set -- "$ARGS"

SUPABASE_CONN=""
ABR_GUID=""
ABR_KEY=""
AUTO_APPLY=""

while true; do
  case "$1" in
    --supabase-conn) SUPABASE_CONN="$2"; shift 2;;
    --abr-guid) ABR_GUID="$2"; shift 2;;
    --abr-key) ABR_KEY="$2"; shift 2;;
    --auto-apply) AUTO_APPLY="$2"; shift 2;;
    --) shift; break;;
    -h) usage; exit 0;;
  esac
done

if [[ -z "${SUPABASE_CONN}" ]]; then
  read -rp "SUPABASE_CONNECTION_STRING (postgres url, required): " SUPABASE_CONN
fi

if [[ -z "${ABR_GUID}" && -z "${ABR_KEY}" ]]; then
  read -rp "ABR_GUID (or press Enter to use ABR_API_KEY): " ABR_GUID
  if [[ -z "${ABR_GUID}" ]]; then
    read -rp "ABR_API_KEY: " ABR_KEY
  fi
fi

if [[ -z "${AUTO_APPLY}" ]]; then
  read -rp "Enable auto-apply? (true/false) [default false]: " AUTO_APPLY
  AUTO_APPLY=${AUTO_APPLY:-false}
fi

echo "Target repo: $REPO"
if [[ "$REPO" == "" ]]; then
  echo "Could not determine repository. Set GITHUB_REPOSITORY or run from a git repo with origin." >&2
  exit 2
fi

echo "Creating secrets in repository (you will be asked to confirm via gh)"

echo "Setting SUPABASE_CONNECTION_STRING..."
printf "%s" "$SUPABASE_CONN" | gh secret set SUPABASE_CONNECTION_STRING --repo "$REPO"

if [[ -n "$ABR_KEY" ]]; then
  echo "Setting ABR_API_KEY..."
  printf "%s" "$ABR_KEY" | gh secret set ABR_API_KEY --repo "$REPO"
fi
if [[ -n "$ABR_GUID" ]]; then
  echo "Setting ABR_GUID..."
  printf "%s" "$ABR_GUID" | gh secret set ABR_GUID --repo "$REPO"
fi

echo "Setting AUTO_APPLY to '$AUTO_APPLY' (set to true to enable writing)"
printf "%s" "$AUTO_APPLY" | gh secret set AUTO_APPLY --repo "$REPO"

echo "Done. Please review the GitHub repository secrets UI to confirm values." 
echo "Reminder: ensure supabase/migrations/20251130000001_add_abn_matched_json.sql has been applied (or run the 'Deploy database migrations' workflow) before enabling AUTO_APPLY=true."
