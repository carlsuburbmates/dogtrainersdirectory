# Ops Runbook — Post-launch Operations (Reality)

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Operating model (canonical)
Ops is **pull-based**:
- Status strip / dashboards show state
- Queues are action surfaces
There is **no support inbox** concept in code.

## 2. Admin surfaces (canonical)
- `/admin` — overview
- `/admin/ai-health` — AI mode + health visibility
- `/admin/cron-health` — cron monitoring
- `/admin/errors` — error monitoring
- `/admin/reviews` — moderation queues
- `/admin/triage` — triage monitoring

## 3. Key admin API capabilities (examples)
- Moderation run loop: `/api/admin/moderation/run` (cron every 10 minutes)
- Ops digest: `/api/admin/ops-digest` (daily)
- Monetisation resync/overview: `/api/admin/monetization/*`
- DLQ replay: `/api/admin/dlq/replay`

## 4. Known gaps / risks (from bundle)
- Admin auth is inconsistent across `/api/admin/**` endpoints (some TODO/no checks). Treat as a launch risk: tighten auth.
- No background worker framework is present; cron + request-driven work are primary.

## 5. Verification harnesses
- `scripts/verify_launch.ts` — launch gate checks
- `scripts/verify_phase9b.ts` — monetisation + build/test harness

## 6. Alerts
Env-driven alerts exist for email/Slack/webhook (see `ENV_VARS_INVENTORY.md` and `OPS_REALITY.md`).
