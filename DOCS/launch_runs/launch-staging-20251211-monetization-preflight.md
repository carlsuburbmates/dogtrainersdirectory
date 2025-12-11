# Launch Run – staging – 2025-12-11 Monetization Preflight
- Commit: <pending after Phase 9B>
- Operator(s): Ops / Monetization readiness (TBD)

## Preprod Verification
- `ENV_TARGET=staging ./scripts/preprod_verify.sh` → **TODO** (requires staging secrets)
- `scripts/check_env_ready.sh staging` → **TODO** (populate Stripe + Supabase keys captured in config/env_required.json)

## DNS & Env
- DNS verification notes: _Pending – rerun `dig staging.dogtrainersdirectory.com.au CNAME` once new Stripe webhook URL is live._
- Critical env diff: _Populate STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_FEATURED, STRIPE_PRICE_PRO, RESEND_API_KEY, SUPABASE_* (staging variants) before rerunning env check._

## Telemetry Snapshot
- ABN fallback rate (24h): _Pending staging drill_
- Overrides active: _None (expected)_
- Emergency cron last success / failure: _Pending staging cron run_
- AI telemetry status: _Pending staging health API_

## Monetization Drill Checklist
- [ ] Create Stripe Checkout Session (test mode) and complete payment
- [ ] Replay Stripe webhook via CLI; capture CLI output
- [ ] Verify `payment_audit` + `business_subscription_status` rows (include Supabase console links)
- [ ] Screenshot `/admin` → MONETIZATION tab showing subscription health OK
- [ ] Confirm `/api/admin/alerts/snapshot` contains no monetization alerts (or document overrides)
- [ ] Attach latency metric sample for `monetization_api`

## Decision
- 🚫 Blocked (awaiting staging credentials + Stripe drill)
- Notes: This entry reserves the log slot for Phase 9B. Once ops completes the staging rehearsal, update this file with evidence and flip the decision to ✅.
