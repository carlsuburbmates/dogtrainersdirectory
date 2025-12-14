# Launch Workflow — n1 (canonical)

## Goals
- Single branch `n1` for local-first development and automated Vercel deploys.
- `npm run verify:launch` is the canonical automation gate for AI-ready validation.
- Drafts live under `DOCS/_drafts/`; promotion to canonical docs is an explicit operator action.
- Capture DNS evidence and write all run artifacts to `DOCS/launch_runs/`.

## Current state
- Single-domain model: apex `dogtrainersdirectory.com.au` served by Vercel. `www` optional.
- Verification harness updated to treat apex A/ALIAS as PASS and to capture DNS dig outputs.

## Step plan
1. ABN dry-run: run DB checks and `checkAbnFallbackMetrics` via `npm run verify:launch` (ensure sample size or mark SKIP).
2. pgcrypto warning check: confirm `SUPABASE_PGCRYPTO_KEY` present and decrypt path validated.
3. DNS evidence capture: run `dig` commands and record outputs (harness writes `dns-evidence-<ts>.txt`).
4. Secrets alignment: run `./scripts/check_env_ready.sh <env>` and store output.
5. `npm run verify:launch` as single automation gate (exit 0, FAIL=0 to be AI-ready).
6. Push `n1` → Vercel auto deploy; capture Vercel deployment logs and add to `DOCS/launch_runs/` if needed.
7. Promote drafts from `DOCS/_drafts/` to canonical docs and update manifest.
8. Operator-only gates: Stripe live drills, legal/finance sign-offs, secret rotations — these remain manual and tracked.

## Artifacts
- `DOCS/launch_runs/launch-prod-<YYYYMMDD>-ai-preflight.md` and `.json` (auto-written by harness).
- `DOCS/launch_runs/dns-evidence-<YYYYMMDD-HHMM>.txt` (dig outputs captured).
- `DOCS/_drafts/FILE_MANIFEST.md` (local drafts manifest).

## Acceptance criteria
- `npm run verify:launch` exits 0 and FAIL=0 (WARN allowed only for operator/MCP SKIPs).
- DNS check is PASS without `VERIFY_LAUNCH_ACCEPT_DNS_WARN` for apex domain.
- Docs updated: `DOCS/DNS_ENV_READY_CHECKS.md`, `DOCS/LAUNCH_READY_CHECKLIST.md` reflect single-domain policy.
- Evidence artifacts are present in `DOCS/launch_runs/` and committed on branch `n1`.

