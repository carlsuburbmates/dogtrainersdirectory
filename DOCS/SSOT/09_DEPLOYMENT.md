# Deployment — Vercel, Cron, Environments

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Hosting
- Deployed on Vercel using Next.js build.
- Operational procedures and scripts live in `08_OPS_RUNBOOK.md`.

## 2. Vercel cron schedule (canonical)
From `vercel.json`:
- `/api/emergency/verify` — `0 0 * * *`
- `/api/emergency/triage/weekly` — `0 0 * * 1`
- `/api/admin/ops-digest` — `0 23 * * *`
- `/api/admin/moderation/run` — `*/10 * * * *`
- `/api/admin/featured/expire` — `0 2 * * *`

## 3. Build/test commands (canonical)
From `package.json`:
- `npm run build`
- `npm test`
- `npm run type-check`
- `npm run lint`

## 4. Environment variable groups (canonical)
### 4.1 Stripe
- `STRIPE_PRICE_FEATURED` — Stripe Price ID for featured placements. (server)
- `STRIPE_SECRET_KEY` — Stripe API secret key. (server)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret. (server)

### 4.2 Supabase
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL. (client + server)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key. (client + server)
- `SUPABASE_CONNECTION_STRING` — Postgres connection for ops scripts (recommended: **session pooler** string to avoid IPv6-only direct hosts). (ops)
- `SUPABASE_PGCRYPTO_KEY` — Encryption/decryption key used with `encrypt_sensitive`/`decrypt_sensitive`. Server-only. (server)
- `SUPABASE_SERVICE_ROLE_KEY` — Service-role key for admin DB access. (server + edge functions)
- `SUPABASE_URL` — Supabase URL for server-side logging / edge functions. (server + edge function)

### 4.3 AI modes
- `AI_GLOBAL_MODE` — Global AI automation mode (disabled/shadow/live). (server + admin UI)
- `DIGEST_AI_MODE` — Override AI mode for digest generation. (server + admin UI)
- `MODERATION_AI_MODE` — Override AI mode for review moderation. (server + admin UI)
- `TRIAGE_AI_MODE` — Override AI mode for emergency triage. (server + admin UI)
- `VERIFICATION_AI_MODE` — Override AI mode for resource verification. (server + admin UI)

### 4.4 ABN / ABR
- `ABN_FALLBACK_MAX_RATE_24H` — Launch gate threshold for ABN fallback rate (max allowed rate). (staging/prod checks)
- `ABN_FALLBACK_MIN_SAMPLE_24H` — Minimum sample size for ABN fallback rate check. (staging/prod checks)
- `ABR_GUID` — ABR API GUID for ABN lookup. (server)
- `AUTO_APPLY` — Enables auto-write of ABN verification results. (server)

### 4.5 Admin/ops alerts
- `ALERT_WEBHOOK_URL` — Optional webhook for error alert notifications. (server)
- `ALERTS_EMAIL_FROM` — Sender for ops alert emails. (ops script)
- `ALERTS_EMAIL_TO` — Comma-separated recipients for ops alert emails. (ops script)
- `ALERTS_SLACK_WEBHOOK_URL` — Slack webhook for ops alerts. (ops script)
- `ALERTS_STATE_FILE` — Path to alert delivery state file. (ops script)
- `RESEND_API_KEY` — Email delivery via Resend. (server + ops script)


## 5. Public env exposure
Only `NEXT_PUBLIC_*` vars are exposed to the client. Do not leak secrets via `NEXT_PUBLIC_*`.

## 6. Supabase Edge Functions
This repo invokes Supabase Edge Functions directly from the browser via `supabase-js` (anon key) for:
- Suburb search (`suburbs`)
- Triage search (`triage`) (legacy; prefer `/api/public/search` for canonical results where possible)

### 6.1 Deploy (manual)
1. `supabase login`
2. Ensure `NEXT_PUBLIC_SUPABASE_URL` is set (or set `SUPABASE_PROJECT_REF` explicitly).
3. Deploy:
   - `./scripts/deploy_supabase_functions.sh suburbs`
   - `./scripts/deploy_supabase_functions.sh triage` (if still used)

### 6.2 JWT verification
These functions are called without an authenticated user session in most public flows. Ensure JWT verification is disabled (the deploy script uses `--no-verify-jwt`).
