> **SSOT – Canonical Source of Truth**
> Scope: Production environment secret migration plan
> Status: Draft · Last reviewed: 2025-12-11

# Production Environment Migration Plan

This document guides the hand-off of production secrets/DNS configuration from staging to the final Dog Trainers Directory deployment. No secrets live in the repo—use your secure vault (1Password, Doppler, AWS Secrets Manager, etc.) and Vercel Project settings when applying the steps below.

## 1. Required Production Environment Variables

Use `config/env_required.json`, `DOCS/VERCEL_ENV.md`, and monetization/telemetry specs as the source of truth. The table below groups variables by category; ensure *production-specific* values exist before flipping DNS.

### Supabase / Database
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_CONNECTION_STRING`

### Monetization / Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_FEATURED`
- `STRIPE_PRICE_PRO` (placeholder for future tiers)
- `FEATURE_MONETIZATION_ENABLED` (set to `0` until launch)
- `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED` (set to `0` until launch)

### ABN / OPS / AI
- `ABR_GUID`
- `ABR_API_KEY` / `ABN_GUID_SECRET` (if applicable)
- `LLM_DEFAULT_MODEL`
- `ZAI_API_KEY`, `ZAI_BASE_URL`
- `AUTO_APPLY` (keep `false` unless authorised)

### Alerts / Telemetry
- `ALERTS_EMAIL_TO`
- `ALERTS_EMAIL_FROM` (optional)
- `ALERTS_SLACK_WEBHOOK_URL`
- `RESEND_API_KEY`
- Any Logflare/Sentry DSNs in use (`LOGFLARE_API_KEY`, `LOGFLARE_SOURCE_ID`, `SENTRY_DSN`)

### Miscellaneous / Scripts
- `SUPABASE_PGCRYPTO_KEY`
- `SUPABASE_CONNECTION_STRING` (for CI migrations)
- `TARGET_ENV` (used when running CLI scripts locally)

> For the canonical list, run `jq` against `config/env_required.json` or consult `scripts/check_env_ready.sh`.

## 2. Where to Store Secrets

1. **Vercel Production Environment**
   - Navigate to Vercel → Project → Settings → Environment Variables → Production.
   - Paste encrypted values from vault; avoid reusing staging keys.
   - For secrets required in Preview/Development (e.g., NEXT_PUBLIC_*), ensure those scopes are set as well.

2. **GitHub Actions (CI)**
   - Store `SUPABASE_CONNECTION_STRING_PROD`, `SUPABASE_SERVICE_ROLE_KEY_PROD`, and Stripe webhook secrets under repository secrets.
   - Workflows that run migrations/backups must reference the `*_PROD` namespace to prevent cross-target contamination.

3. **Developer Machines**
   - Only trusted operators should keep production secrets locally. Use `.env.production` (gitignored) if a local script must target prod and destroy after use.

## 3. Validation Commands

Run these once secrets are in place:

```bash
# Confirm env manifest satisfied for production target
TARGET_ENV=production scripts/check_env_ready.sh production

# Run the full verification gate (type check, smoke, lint, doc divergence, env)
TARGET_ENV=production ./scripts/preprod_verify.sh

# Additional: run a production build locally
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Record console output (PASS/FAIL, missing vars) inside `DOCS/launch_runs/launch-production-YYYYMMDD-preflight.md` when performing the checks.

## 4. Safe Secret Rotation Strategy

1. **Prepare new values** in a secure vault; never overwrite existing secrets until the new ones are tested.
2. **Stage the change** by adding the new secret under a temporary name (e.g., `STRIPE_SECRET_KEY_ROLLING`).
3. **Update Vercel / CI** to point at the new secret. Confirm preview builds and staging environments run as expected.
4. **Run verification scripts** (`./scripts/preprod_verify.sh`, `npm run e2e`) against the environment now using the new secret.
5. **Cut over** by replacing the old secret variable name with the new value.
6. **Re-run checks** and capture logs in the launch-run entry.
7. **Revoke old secrets** (Stripe dashboard, Supabase, etc.) once the change is stable.

## 5. Operational Hand-off Checklist

| Step | Description | Owner | Status |
| --- | --- | --- | --- |
| Env manifest import | Populate Vercel Production env via CLI or dashboard | Ops | Pending |
| Supabase linked migration (`supabase db push --linked`) | Ensures prod DB schema includes payment tables | Ops | Pending |
| Stripe webhook + secret verification | Confirm new webhook URL and secret are live | Ops | Pending |
| `scripts/check_env_ready.sh production` | Attach console log to launch-run entry | Ops | Pending |
| `TARGET_ENV=production ./scripts/preprod_verify.sh` | Attach console log; confirm PASS or note missing vars | Ops | Pending |

Once all boxes are checked and evidence stored under `DOCS/launch_runs/launch-production-*.md`, production readiness is approved from the repo’s perspective.
