# DNS & Environment Readiness Checks

> **SSOT – Canonical Source of Truth**
> Scope: DNS + environment readiness verification process
> Status: Active · Last reviewed: 2025-12-15

These steps provide an auditable checklist for validating DNS records and environment variables prior to any launch or major change. Use this doc together with `DOCS/VERCEL_ENV.md`, `DOCS/LAUNCH_READY_CHECKLIST.md`, and the `scripts/check_env_ready.sh` helper.

**Canonical setup**

- Canonical production domain: dogtrainersdirectory.com.au (served via Vercel)
- Staging model: Vercel Preview deployments (no `staging.` subdomain). Readiness is proven via:
  - `vercel env list` showing populated Preview/Development env vars
  - `npm run verify:launch` (includes smoke, e2e, env, DNS, and health checks)

---

## 1. Required Domains & DNS Targets

We operate a single-domain model by default. The apex (root) domain must resolve and be served by Vercel. `www` is supported but optional — if present it should point to Vercel via CNAME.

| Domain | Purpose | Policy |
| --- | --- | --- |
| `dogtrainersdirectory.com.au` | Production marketing + app (apex) | MUST resolve and be served by Vercel. A/ALIAS/registrar flattening is acceptable — any valid A or AAAA records or a Vercel CNAME/ALIAS constitute PASS. Capture evidence with the commands below. |
| `www.dogtrainersdirectory.com.au` | Optional www host | OPTIONAL. If configured, should be a CNAME to `cname.vercel-dns.com.` (or the Vercel-managed value shown in the Vercel Domains page). If absent, runs still PASS. |

### Evidence commands (capture these exact outputs)

Run and save the outputs below into `DOCS/launch_runs/` for each launch run (use a timestamp in the filename):

```bash
# Apex records (A, AAAA, CNAME)
dig dogtrainersdirectory.com.au A +short
dig dogtrainersdirectory.com.au AAAA +short
dig dogtrainersdirectory.com.au CNAME +short

# Optional www CNAME (run even if optional)
dig www.dogtrainersdirectory.com.au CNAME +short

# TLS + HTTP routing check
curl -I https://dogtrainersdirectory.com.au
```

Notes:
- Do NOT rely on a specific Vercel IP hardcoded in the harness; registrars may use ALIAS/flattening. The harness treats any non-empty A/AAAA response or the Vercel CNAME as PASS for the apex domain.
- If `www` is absent, the DNS check will still PASS (the harness will record that `www` is optional and missing).

---

## 2. Environment Variable Matrix

Reference values live in `DOCS/VERCEL_ENV.md`. Below is the “must exist before launch” matrix (unchanged).

(omitted here for brevity — see the original file for full variable matrix)

---

## 3. Manual Go/No-Go Steps

1. Capture DNS evidence using the commands above and store the file under `DOCS/launch_runs/dns-evidence-<YYYYMMDD-HHMM>.txt`.
2. Run `./scripts/check_env_ready.sh <env>` and store the output under `DOCS/launch_runs/`.
3. Run the full `./scripts/preprod_verify.sh` (includes env check) and attach output to the launch log.
4. Run `npm run verify:launch` which will include DNS evidence capture and write the run artifact under `DOCS/launch_runs/`.

Keep this document updated whenever DNS targets change, new domains are added, or new environment variables become mandatory.
