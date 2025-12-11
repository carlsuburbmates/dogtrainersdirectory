# Vercel environment variables — Project: dogtrainersdirectory (sanitized)

This document lists the environment variables used in the repo and recommended Vercel environment targets. DO NOT store live secrets in the repository. The examples below are sanitized placeholders — use values from your secure vault or `.env.local` when running the import script.

## Supabase-related environment variables (required)

| Name | What it is | Where to set (Local / Staging / Production) | Used by |
|------|------------|----------------------------------------------|--------|
| NEXT_PUBLIC_SUPABASE_URL | Public Supabase URL used by client SDKs and Edge Functions | Local `.env.local` / Vercel Preview / Vercel Production | Next.js client, Edge Functions, frontend SDKs |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public anon key used by browser clients | Local `.env.local` / Vercel Preview / Vercel Production | Next.js client, integrations that run in-browser |
| SUPABASE_URL | Canonical Supabase URL for server runtime | Local `.env.local` / Vercel Preview / Vercel Production | Next.js server runtime, Edge Functions, server helpers |
| SUPABASE_SERVICE_ROLE_KEY | Admin service-role key (sensitive — server-only) | Local `.env.local` (trusted devs only) / GitHub Actions staging secret / Vercel Preview (sensitive) / Vercel Production (sensitive) | Server-only operations: ABN scripts, migrations helpers, admin endpoints — NEVER exposed to browser |
| SUPABASE_CONNECTION_STRING | Admin Postgres connection string used for migrations & backups | Local `.env.local` (trusted devs) / GitHub Actions staging secret / GitHub Actions production secret (required for CI-driven migrations & backups) | CI workflows (migrations, backups), ops scripts (db migrations, backups) — **server/admin usage only** |

Notes:
- Use distinct secrets for staging vs production in both Vercel and GitHub Actions (e.g. SUPABASE_CONNECTION_STRING_STAGING, SUPABASE_CONNECTION_STRING_PROD) so CI and runtime never cross targets accidentally.
- For CI, store connection strings & service-role keys in GitHub Actions secrets and never log them. CI workflows should select the correct secret per target environment.
- For local development, developers should prefer `NEXT_PUBLIC_*` and local anon keys in `.env.local`. Only trusted contributors should set `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_CONNECTION_STRING` in their local env (do not commit these files).

---

*Quick mapping summary (one line per environment):*
- Local dev: `.env.local` — mainly frontend keys (`NEXT_PUBLIC_*`); service-role/connection-string only for trusted local testing.
- Staging/Preview: Vercel preview envs + GitHub Actions staging secrets — used for integration tests and staging canaries.
- Production: Vercel Production envs + GitHub Actions production secrets — only sensitive keys belong here and CI applies migrations/backups against this target.

---


Notes:
- Put public values (NEXT_PUBLIC_*) in both local `.env.local` and Vercel so the runtime client and functions have parity.
- Put highly sensitive credentials (service role, connection string) ONLY in secure locations (Vercel environment variables for production/preview and GitHub Actions repository secrets). Never commit these to the repo.
- For CI workflows we recommend using distinct secrets for staging vs production (e.g., SUPABASE_CONNECTION_STRING_STAGING and SUPABASE_SERVICE_ROLE_KEY_STAGING). Ensure the `Deploy database migrations` workflow selects the appropriate secret per target.

## Optional / Observability / AI
- SENTRY_DSN — Errors monitoring (Production, Preview)
- LOGFLARE_API_KEY, LOGFLARE_SOURCE_ID — Logging (Production, Preview)
- OPENAI_API_KEY, ANTHROPIC_API_KEY — AI providers when used (server only)
- ALERTS_EMAIL_TO — Comma-separated list of ops recipients for alert emails (Preview + Production)
- ALERTS_EMAIL_FROM — Optional override for alert email sender (defaults to `Ops Alerts <ops@dogtrainersdirectory.com.au>`)
- ALERTS_SLACK_WEBHOOK_URL — Incoming webhook to receive alert summaries in Slack (Preview + Production)
- Stripe / Monetization:
  | Name | What it is | Where to set | Used by |
  | --- | --- | --- | --- |
  | STRIPE_SECRET_KEY | Server-side Stripe key for Checkout + webhook events | Local `.env.local` (trusted), Vercel Preview & Production | `/api/stripe/create-checkout-session`, `/api/webhooks/stripe` |
  | STRIPE_WEBHOOK_SECRET | Signing secret for Stripe webhooks | Local `.env.local`, Vercel Preview & Production | `/api/webhooks/stripe` |
  | STRIPE_PRICE_FEATURED | Price ID for Featured Placement ($20 AUD / 30-day placement, FIFO queue) | Local `.env.local`, Vercel Preview & Production | Checkout session creation |
  | STRIPE_PRICE_PRO | (DEFERRED) Reserved for Phase 5+ subscription tiers | Local `.env.local`, Vercel Preview & Production | Do not enable until Phase 4+ gates met (≥50 trainers, 85%+ ABN verify) |
  | FEATURE_MONETIZATION_ENABLED | Server feature flag (`1`/`0`) | Local `.env.local`, Vercel Preview & Production | Enables monetization backend routes |
  | NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED | Client feature flag (`1`/`0`) | Local `.env.local`, Vercel Preview & Production | Shows “Promote my listing” UI when enabled |

## Behavioral flags / toggles
- AUTO_APPLY
  - Purpose: Safety toggle used by the ABN verification flow and scripts
  - Where: Preview/Development (default false in Production unless specifically enabled)
  - Example: "true" or "false"

---

## How to import (recommended)
1. Inspect your `.env.local` — confirm values and rotate any leaked keys before importing.
2. Use the interactive script at `scripts/vercel-env-import.sh` which runs in dry-run mode by default. Example:

```bash
# dry-run (safe): will only show what will be performed
./scripts/vercel-env-import.sh

# real run (make sure you're logged in to vercel and confirm point of project):
./scripts/vercel-env-import.sh --apply --project <your-vercel-project>
```

3. The script will prompt for each variable and which environment (production/preview/development) you want it in.

## When to rotate keys
- If a secret appears in a public repo or shared log: rotate immediately and update Vercel.
- After a team membership change or CI credential compromise.

## Notes
- The repo keeps sensitive values out of code where possible; treat `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_CONNECTION_STRING`, `STRIPE_*`, and `ABR_GUID` as high-sensitivity.

---

If you'd like, I can now run the import script for you (dry-run or --apply). Tell me if you want a dry-run first, or to apply directly to Production and/or Preview and which Vercel project name to target.
