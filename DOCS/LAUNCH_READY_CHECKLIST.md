> **SSOT – Canonical Source of Truth**
> Scope: Launch go/no-go checklist
> Status: Active · Last reviewed: 2025-12-09

# Launch-Ready Checklist

Use this page for the final production go/no-go review. All items below must be explicitly confirmed (✔) with links to evidence (screenshots, logs, or CLI output). Keep historical runs in this file so that launch decisions are auditable.

## Required Checks

1. **Pre-production verification**
   - ✔ `scripts/preprod_verify.sh` run with all PASS banners (type-check, smoke, lint, Doc Divergence, Env Ready).
   - ✔ `ENV_TARGET=<env> ./scripts/preprod_verify.sh` used when staging vs production targets differ.
   - Evidence: attach recent console log + commit hash.
2. **Emergency APIs & dashboards**
   - ✔ `/api/emergency/triage`, `/api/emergency/verify`, `/api/emergency/triage/weekly` respond 200 locally/staging.
   - ✔ `/admin/ai-health` and `/admin/cron-health` dashboards load without error, showing current metrics.
3. **ABN fallback metrics**
   - ✔ ABN fallback rate (24h) in admin dashboard ≤ agreed threshold (document threshold + current %).
   - ✔ ABN fallback events log writes to `abn_fallback_events` (inspect latest entries).
4. **Environment consistency**
   - ✔ DNS matches `DOCS/DNS_ENV_READY_CHECKS.md` (record dig/curl output).
   - ✔ `./scripts/check_env_ready.sh <env>` PASS with logs stored in `DOCS/launch_runs/`.
   - ✔ `.env` / Vercel / Supabase secrets aligned (ABR GUID, SUPABASE keys, Stripe secrets, LLM keys).
5. **Telemetry overrides**
   - ✔ Override toggle tested for each service (telemetry, ABN recheck, emergency cron) and auto-expiry (≤2h) observed.
   - ✔ Status strip reflects override state + clears when override removed/expired.
6. **Alert evaluation & delivery**
   - ✔ `/api/admin/alerts/snapshot` inspected (no suppressed alerts hiding critical failures) or documented follow-up.
   - ✔ `npx tsx scripts/run_alerts_email.ts --dry-run` prints expected recipients + payload; production run only when ready (email + Slack configured).
7. **Playwright E2E coverage**
   - ✔ `npm run e2e` (or `./scripts/preprod_e2e.sh`) recorded PASS for search → trainer, emergency controls, admin dashboards, and alert snapshot. Baselines updated intentionally via `npm run e2e -- --update-snapshots`.
8. **Smoke suite coverage**
   - ✔ `npm run smoke` green covering trainers search/profile, emergency triage/verify/weekly, admin dashboards, and error logging payloads.
   - ✔ Update `DOCS/IMPLEMENTATION_REALITY_MAP.md` if coverage changes.
9. **Documentation guards**
   - ✔ Doc Divergence Detector green (`python3 scripts/check_docs_divergence.py --base-ref origin/main`).
   - ✔ SSOT docs reviewed after any config change (README, README_DEVELOPMENT, blueprint, OPS telemetry, this checklist).
10. **Monetization readiness (Phase 9B – staging only)**
    - Feature flag in staging: `FEATURE_MONETIZATION_ENABLED=1`, `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=1` (for test runs only).
    - Payment tables: `payment_audit` and `business_subscription_status` created and migrated in staging.
    - Phase 9B staging drill: **COMPLETED 2025-12-11** (Stripe test payment, webhook replay, DB verification, admin dashboard checks).
    - Evidence archived in: `DOCS/launch_runs/launch-staging-20251211-monetization-preflight.md`.
    - Production safety: `FEATURE_MONETIZATION_ENABLED=0` and `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=0` in production (monetization OFF).
    - Production gates: NOT MET (blocked behind ≥ 50 claimed trainers, ≥ 85% ABN verification, and governance approval).
11. **Production DNS + secrets (final gate)**
    - ✔ `DOCS/PRODUCTION_DNS_PLAN.md` matches actual DNS (`dig +short`, `dig TXT`, `vercel dns ls`) and evidence stored in `DOCS/launch_runs/launch-production-*.md`.
    - ✔ Vercel Production env populated and `scripts/check_env_ready.sh production` PASS (attach console log).
    - ✔ `TARGET_ENV=production ./scripts/preprod_verify.sh` PASS (or list remaining blockers) with logs stored in the production launch-run entry.

When all items are green, include reviewer name, timestamp, and commit hash. If any criteria fail, record failure reason and remediation plan before re-running the checklist.

---

## Phase 9B Staging Hardening Runbook

**For detailed step-by-step operations guidance, see `DOCS/automation/PHASE_9B_STAGING_HARDENING_RUNBOOK.md`**

This runbook provides the authoritative checklist and procedures for:
- Verifying preconditions (staging infra, Stripe test keys, production safety)
- Populating staging environment variables
- Running environment validators
- Applying migrations
- Conducting the Stripe test payment drill
- Verifying database state and admin dashboard
- Updating all SSOT documents with evidence

---

## Launch Run Template (`DOCS/launch_runs/launch-YYYYMMDD-HHMM.md`)

```
# Launch Run – <env> – <timestamp>
- Commit: <hash/link>
- Operator(s):

## Preprod Verification
- scripts/preprod_verify.sh output: (attach log excerpt)
- scripts/check_env_ready.sh target(s): (production/staging) PASS

## DNS & Env
- DNS verification notes (reference DOCS/DNS_ENV_READY_CHECKS.md)
- Critical env diff (if any)

## Telemetry Snapshot
- ABN fallback rate (24h): xx% (x/y)
- Overrides active: (list or “none”)
- Emergency cron last success / failure:
- AI telemetry status:

## Decision
- ✅ Launch approved / 🚫 Blocked
- Notes / follow-ups
```

Store each completed run under `DOCS/launch_runs/` for traceability.
