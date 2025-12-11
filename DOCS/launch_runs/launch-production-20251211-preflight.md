# Launch Run – production – 2025-12-11 Preflight
- Commit: <pending Phase 10 completion>
- Operator(s): Ops / Infra (TBD)

## Preprod Verification
- `TARGET_ENV=production ./scripts/preprod_verify.sh` → **TODO** (requires production secrets + DNS cutover)
- `scripts/check_env_ready.sh production` → **TODO** (run after Vercel secrets populated)

## DNS & Env
- DNS verification notes: _Pending – record `dig +short dogtrainersdirectory.com.au`, `dig +short www.dogtrainersdirectory.com.au`, and `vercel dns ls` once ops updates records._
- Critical env diff: _Populate SUPABASE_* (prod), STRIPE_* prod keys, ABR_GUID, ALERTS_EMAIL_TO/SLACK, RESEND_API_KEY, etc., before running env check._

## Telemetry Snapshot
- ABN fallback rate (24h): _Pending production traffic_
- Overrides active: _Pending_
- Emergency cron last success / failure: _Pending_
- AI telemetry status: _Pending_

## DNS Checklist
- [ ] Root + WWW records point to Vercel (document TTL + targets)
- [ ] MX/SPF/DKIM/DMARC verified via `dig`
- [ ] Vercel DNS CLI output stored alongside screenshots/log links

## Env Checklist
- [ ] Vercel Production env populated via secure vault/export
- [ ] `scripts/check_env_ready.sh production` PASS (attach console log)
- [ ] Supabase service-role / connection string validated via `supabase db diff --linked`

## Decision
- 🚫 Blocked (awaiting production DNS + secret migration)
- Notes: Entry created per Phase 10 requirements; fill in once ops completes DNS + env setup.
