# Vercel environment variables — Project: dogtrainersdirectory (sanitized)

This document lists the environment variables used in the repo and recommended Vercel environment targets. DO NOT store live secrets in the repository. The examples below are sanitized placeholders — use values from your secure vault or `.env.local` when running the import script.

## Public (client-exposed)
- NEXT_PUBLIC_SUPABASE_URL
  - Purpose: Supabase instance URL for client SDKs
  - Where: Production, Preview, Development
  - Example: https://xyzabc.supabase.co

- NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Purpose: Public anon key for client usage
  - Where: Production, Preview, Development
  - Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## Server-only / Secrets (must not be public)
- SUPABASE_SERVICE_ROLE_KEY
  - Purpose: Supabase service role (admin) key — server only
  - Where: Production, Preview
  - Warning: Rotate immediately if accidentally leaked

- SUPABASE_URL
  - Purpose: Canonical Supabase URL used by some server scripts
  - Where: Production, Preview

- SUPABASE_CONNECTION_STRING
  - Purpose: Admin Postgres connection string (used by maintenance scripts)
  - Where: Production (and Preview staging if needed)
  - Warning: Keep off dev machines that sync to public services without access restrictions

- PGCRYPTO_KEY
  - Purpose: Encryption key for server-side helpers
  - Where: Production, Preview

- ABR_GUID
  - Purpose: ABR API GUID used for ABN verification
  - Where: Production, Preview

- STRIPE_SECRET_KEY
  - Purpose: Stripe secret key for payments (sk_test or sk_live)
  - Where: Production, Preview (for testing only)
  - Warning: Use test keys in Preview — never test live keys in preview or public forks

- STRIPE_WEBHOOK_SECRET
  - Purpose: Stripe webhook signing secret for verifying events
  - Where: Production, Preview (the webhook servers must read this server-side)

- RESEND_API_KEY / SMTP_HOST / SMTP_USER / SMTP_PASS
  - Purpose: Email delivery credentials. Use either RESEND_API_KEY (preferred) or SMTP_* fields
  - Where: Production, Preview

## Optional / Observability / AI
- SENTRY_DSN — Errors monitoring (Production, Preview)
- LOGFLARE_API_KEY, LOGFLARE_SOURCE_ID — Logging (Production, Preview)
- OPENAI_API_KEY, ANTHROPIC_API_KEY — AI providers when used (server only)

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