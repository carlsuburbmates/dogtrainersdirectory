> **SSOT – Canonical Source of Truth**
> Scope: DNS + environment readiness verification process
> Status: Active · Last reviewed: 2025-12-13

# DNS & Environment Readiness Checks

These steps provide an auditable checklist for validating DNS records and environment variables prior to any launch or major change. Use this doc together with `DOCS/VERCEL_ENV.md`, `DOCS/LAUNCH_READY_CHECKLIST.md`, and the `scripts/check_env_ready.sh` helper.

**Canonical setup**

- Canonical production domain: `dogtrainersdirectory.com.au` (served via Vercel)
- Staging model: Vercel Preview deployments (no `staging.` subdomain). Readiness is proven via:
  - `vercel env list` showing populated Preview/Development env vars
  - `npm run verify:launch` (includes smoke, e2e, env, DNS, and health checks)
  - Preview deployment URLs when screenshots or demo links are required (optional evidence captured per run)

---

## 1. Required Domains & DNS Targets

| Domain | Purpose | Expected target | Verification steps |
| --- | --- | --- | --- |
| `dogtrainersdirectory.com.au` | Production marketing + app | Vercel apex alias → IPv4 (typically `76.76.21.21`) or registrar-provided ALIAS result | `dig +short dogtrainersdirectory.com.au` (A/ALIAS) should resolve to the Vercel-managed IPv4(s) documented in the launch run. Capture `curl -I https://dogtrainersdirectory.com.au` to prove TLS + routing. |
| `app.dogtrainersdirectory.com.au` | Production app alias | Vercel edge | `vercel dns ls carlsuburbmates/dogtrainersdirectory` should list the CNAME. |

Staging/preview deployments **do not** have a dedicated DNS entry. Instead, confirm preview environments via Vercel (`vercel env list`, deployment URLs) alongside the automated `npm run verify:launch` run.

> If the apex is proxied by the registrar and therefore does not expose the Vercel ALIAS directly, operators must capture `dig` + `curl` output in the launch run and set `VERIFY_LAUNCH_ACCEPT_DNS_WARN=1` when running `npm run verify:launch` to acknowledge the manual verification.

**Manual DNS verification**

```bash
# Production root
dig +short dogtrainersdirectory.com.au
# Optional: confirm alias records if used
dig +short app.dogtrainersdirectory.com.au CNAME
# TLS + HTTP routing check
curl -I https://dogtrainersdirectory.com.au
```

If any record does not point to Vercel, fix in DNS provider and re-run before launch. When you must rely on registrar-specific ALIAS proxies, include the captured `dig` + `curl` output in the launch run and set `VERIFY_LAUNCH_ACCEPT_DNS_WARN=1` for that run so the harness records the acceptance.

---

## 2. Environment Variable Matrix

Reference values live in `DOCS/VERCEL_ENV.md`. Below is the “must exist before launch” matrix.

| Variable | Description | Environments | Required | Notes |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL | Local, Preview, Production | Yes | Matches Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Local, Preview, Production | Yes | Rotate if leaked. |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key | Preview, Production (server only) | Yes | Never expose to client. |
| `SUPABASE_CONNECTION_STRING` | Postgres connection string | CI (staging/prod), local trusted devs | Yes | Used by migrations/backups. |
| `SUPABASE_PGCRYPTO_KEY` | RPC encryption key | Preview, Production | Yes | Required for `search_trainers`. |
| `ABR_GUID` | ABN/ABR API GUID | Preview, Production | Yes | Without it ABN verification fails. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe integration | Production (secret key), Preview (test key) | Yes (prod), Optional (preview) | Monetisation deferred but keys must be present for webhook health. |
| `RESEND_API_KEY` or email provider | Email dispatch | Production (required), Preview (optional) | Prod required | Update documentation if switching provider. |
| `ZAI_API_KEY`, `ZAI_BASE_URL`, `LLM_DEFAULT_MODEL` | LLM provider | Preview, Production (depending on ops mode) | Required when AI mode active | See `DOCS/OPS_TELEMETRY_ENHANCEMENTS.md`. |
| `ENABLE_ERROR_LOGGING` / `ENVIRONMENT` | Logging toggles | All envs | Optional but recommended | Documented in `PRIORITY_3_ERROR_LOGGING_SPEC.md`. |

### Optional/Nice-to-Have

- `SENTRY_DSN`, `LOGFLARE_*` — recommended for production observability, but launches may proceed without if error logging is otherwise verified.
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — only required if fallback providers are enabled.

---

## 3. Automated Env Readiness Script

Use `scripts/check_env_ready.sh` to confirm all required keys exist for the target environment. The script reads `config/env_required.json` (maintained in version control) and checks for non-empty values.

### Usage

```bash
# Default target = production
./scripts/check_env_ready.sh

# Explicit target (development | staging | production)
ENV_TARGET=staging ./scripts/check_env_ready.sh staging
```

Output format:

```
========================================
Running Env Ready Check (target: production)
Missing variables:
  - SUPABASE_SERVICE_ROLE_KEY
  - ABR_GUID
[FAIL] Env Ready Check
```

If everything is present:

```
========================================
Running Env Ready Check (target: production)
All required variables are set.
[PASS] Env Ready Check
```

The script is wired into `scripts/preprod_verify.sh` so launches cannot pass if required keys are absent.

---

## 4. Manual Go/No-Go Steps

1. Confirm DNS via the commands above (document outputs or screenshots).
2. Run `./scripts/check_env_ready.sh <env>` for each environment involved in the launch (staging + production). Store logs under `DOCS/launch_runs/`.
3. Run the full `./scripts/preprod_verify.sh` (includes env check) and attach output to the launch log.
4. Fill out `DOCS/LAUNCH_READY_CHECKLIST.md` for the run, referencing this doc for DNS/env sign-off.

Keep this document updated whenever DNS targets change, new domains are added, or new environment variables become mandatory.
