> **SSOT – Canonical Source of Truth**
> Scope: DNS + environment readiness verification process
> Status: Active · Last reviewed: 2025-12-09

# DNS & Environment Readiness Checks

These steps provide an auditable checklist for validating DNS records and environment variables prior to any launch or major change. Use this doc together with `DOCS/VERCEL_ENV.md`, `DOCS/LAUNCH_READY_CHECKLIST.md`, and the `scripts/check_env_ready.sh` helper.

---

## 1. Required Domains & DNS Targets

| Domain | Purpose | Expected target | Verification steps |
| --- | --- | --- | --- |
| `dogtrainersdirectory.com.au` | Production marketing + app | Vercel edge (CNAME `cname.vercel-dns.com.`) | `dig +short dogtrainersdirectory.com.au CNAME` must resolve to Vercel. Verify TLS + route via `curl -I https://dogtrainersdirectory.com.au`. |
| `app.dogtrainersdirectory.com.au` | Production app alias | Vercel edge | `vercel dns ls carlsuburbmates/dogtrainersdirectory` should list the CNAME. |
| `staging.dogtrainersdirectory.com.au` | Staging preview | Vercel preview deployment | Confirm `dig staging...` points to Vercel and the deployment is accessible. |

**Manual DNS verification**

```bash
# Production root
dig +short dogtrainersdirectory.com.au CNAME
# Staging alias
dig +short staging.dogtrainersdirectory.com.au CNAME
# TLS + HTTP routing check
curl -I https://dogtrainersdirectory.com.au
```

If any record does not point to Vercel, fix in DNS provider and re-run before launch.

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
