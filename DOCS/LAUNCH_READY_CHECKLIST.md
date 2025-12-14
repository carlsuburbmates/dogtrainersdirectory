> **SSOT – Canonical Source of Truth**
> Scope: Launch go/no-go checklist
> Status: Active · Last reviewed: 2025-12-15

# Launch-Ready Checklist

Use this page for the final production go/no-go review. All items below must be explicitly confirmed (✔) with links to evidence (screenshots, logs, or CLI output). Keep historical runs in this file so that launch decisions are auditable.

## Readiness Definitions

### AI ready (verification harness gate)
AI ready is achieved when:
- `npm run verify:launch` exits 0 AND FAIL = 0.
- WARN may be present only for items that are explicitly Operator-only or MCP-only; DNS should PASS by default for our single-domain Vercel setup.
- SKIP entries exist only for items tagged Operator-only or MCP-only.

### Launch ready (operator/MCP gate)
Launch ready is achieved only after:
- Every Operator-only checklist item has evidence captured (screenshots/logs) and recorded in the launch run.
- Every MCP-only item has been validated via the configured MCP/browser workflow with evidence.
- Governance/approval gates (legal, finance, product) are documented in the launch run entry.

- [ ] AI verification system complete when: verify:launch PASS with FAIL = 0; operator-only checks may remain SKIPPED.

## Required Checks

1. **Pre-production verification**
   - ✔ `scripts/preprod_verify.sh` run with all PASS banners (type-check, smoke, lint, Doc Divergence, Env Ready). *(AI-verified by `verify:launch`)*
   - ✔ `ENV_TARGET=<env> ./scripts/preprod_verify.sh` used when staging vs production targets differ. *(AI-verified by `verify:launch` for staging; production run remains operator-controlled)*
   - Evidence: attach recent console log + commit hash.
2. **Emergency APIs & dashboards**
   - ✔ `/api/emergency/triage`, `/api/emergency/verify`, `/api/emergency/triage/weekly` respond 200 locally/staging. *(AI-verified by `verify:launch`)*
   - ✔ `/admin/ai-health` and `/admin/cron-health` dashboards load without error, showing current metrics. *(AI-verified by `verify:launch`)*
3. **ABN fallback metrics**
   - ✔ ABN fallback rate (24h) in admin dashboard ≤ agreed threshold (document threshold + current %). *(AI-verified by `verify:launch`)*
   - ✔ ABN fallback events log writes to `abn_fallback_events` (inspect latest entries). *(AI-verified by `verify:launch`)*
4. **Environment consistency**
   - ✔ DNS matches `DOCS/DNS_ENV_READY_CHECKS.md` (record dig/curl output). *(AI-verified by `verify:launch`)*
   - ✔ `./scripts/check_env_ready.sh <env>` PASS with logs stored in `DOCS/launch_runs/`. *(AI-verified by `verify:launch`)*
   - ✔ `.env` / Vercel / Supabase secrets aligned (ABR GUID, SUPABASE keys, Stripe secrets, LLM keys). *(Operator-only – requires secure secret inventory & Vercel UI review)*

(remaining checklist items unchanged — keep original content for other checks)
