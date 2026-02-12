# Deployment - Vercel, Cron, Environments

**Status:** Canonical (Tier-1)
**Version:** v1.1
**Last Updated:** 2026-02-13

## 1. Hosting
- Deploy on Vercel using Next.js build.
- Operational procedures and scripts live in `DOCS/SSOT/08_OPS_RUNBOOK.md`.

## 2. Vercel cron schedule (canonical)
From `vercel.json`:
- `/api/emergency/verify` - `0 0 * * *`
- `/api/emergency/triage/weekly` - `0 0 * * 1`
- `/api/admin/ops-digest` - `0 23 * * *`
- `/api/admin/moderation/run` - `*/10 * * * *`
- `/api/admin/featured/expire` - `0 2 * * *`

## 3. Build and verification commands
From `package.json` and CI:
- `npm run build`
- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run docs:guard`
- `npm run ssot:refresh`

## 4. Environment variable groups (canonical)
### 4.1 Stripe
- `STRIPE_PRICE_FEATURED` (server)
- `STRIPE_SECRET_KEY` (server)
- `STRIPE_WEBHOOK_SECRET` (server)

### 4.2 Supabase
- `NEXT_PUBLIC_SUPABASE_URL` (client + server)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client + server)
- `SUPABASE_CONNECTION_STRING` (ops; prefer session pooler)
- `SUPABASE_PGCRYPTO_KEY` (server)
- `SUPABASE_SERVICE_ROLE_KEY` (server + edge functions)
- `SUPABASE_URL` (server + edge functions)

### 4.3 AI modes
- `AI_GLOBAL_MODE` (server + admin UI)
- `DIGEST_AI_MODE` (server + admin UI)
- `MODERATION_AI_MODE` (server + admin UI)
- `TRIAGE_AI_MODE` (server + admin UI)
- `VERIFICATION_AI_MODE` (server + admin UI)

### 4.4 ABN and ABR
- `ABN_FALLBACK_MAX_RATE_24H` (staging/prod checks)
- `ABN_FALLBACK_MIN_SAMPLE_24H` (staging/prod checks)
- `ABR_GUID` (server)
- `AUTO_APPLY` (server)

### 4.5 Admin and ops alerts
- `ALERT_WEBHOOK_URL` (server)
- `ALERTS_EMAIL_FROM` (ops script)
- `ALERTS_EMAIL_TO` (ops script)
- `ALERTS_SLACK_WEBHOOK_URL` (ops script)
- `ALERTS_STATE_FILE` (ops script)
- `RESEND_API_KEY` (server + ops script)

## 5. Public env exposure
- Only `NEXT_PUBLIC_*` values may be exposed client-side.
- Secrets must never be put in `NEXT_PUBLIC_*` variables.

## 6. Edge Functions deployment
- Function inventory is generated at `DOCS/SSOT/_generated/edge_functions.md`.
- Deploy via `scripts/deploy_supabase_functions.sh`.
- Public functions used in browser flows may require `--no-verify-jwt`; this is handled by the deploy script.
