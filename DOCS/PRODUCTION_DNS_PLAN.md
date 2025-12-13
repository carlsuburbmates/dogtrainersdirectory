> **SSOT – Canonical Source of Truth**
> Scope: Production DNS cutover plan for dogtrainersdirectory.com.au
> Status: Draft · Last reviewed: 2025-12-11

# Production DNS Plan

This document lists the DNS changes required to move Dog Trainers Directory from staging to the live production domain. No DNS updates are performed inside the repo; this file captures the intended state, validation commands, and risk notes so ops can execute the change safely.

## Required Records

| Record | Hostname | Type | Target | Notes |
| --- | --- | --- | --- | --- |
| Primary app | `dogtrainersdirectory.com.au` | A / ALIAS | `76.76.21.21` (Vercel edge) | Root domain routed to Vercel. Use ALIAS/ANAME if registrar supports it; fallback to A record per Vercel guidance. |
| WWW alias | `www.dogtrainersdirectory.com.au` | CNAME | `cname.vercel-dns.com.` | Canonical CNAME for Vercel-managed domains. |
| Email MX | `dogtrainersdirectory.com.au` | MX | `aspmx.l.google.com.` (and secondary MX as per Google Workspace) | Mirror existing staging MX list (typically Google Workspace: priority 1-5). |
| SPF | `dogtrainersdirectory.com.au` | TXT | `v=spf1 include:_spf.google.com include:sendgrid.net ~all` | Include providers used for notifications/alerts; adjust per ops guidance. |
| DKIM | `google._domainkey.dogtrainersdirectory.com.au` | TXT | `v=DKIM1; k=rsa; p=<google-public-key>` | Carry over DKIM selectors used in staging (Google/Resend/etc.). |
| DMARC | `_dmarc.dogtrainersdirectory.com.au` | TXT | `v=DMARC1; p=quarantine; rua=mailto:dmarc@dogtrainersdirectory.com.au` | Keep policy aligned with staging; adjust enforcement level before launch if required. |
| Alert webhook host (optional) | `alerts.dogtrainersdirectory.com.au` | CNAME | Slack/third-party target | Only if alerts need custom domain; typically not required. |

Preview/staging is handled entirely via Vercel Preview deployments (unique URLs per PR / branch). No `staging.` subdomain is required; ensure preview env vars are accurate via `vercel env list` and artifacted `npm run verify:launch` runs.

> Update the table with exact values once Vercel DNS and email providers confirm final targets. For MX/SPF/DKIM/DMARC copy the existing production-approved configs from the staging registrar to avoid regressions.

## Validation Commands

Run these commands before and after DNS changes:

```bash
# Resolve root + www
DIG_DOMAIN=dogtrainersdirectory.com.au
dig +short "$DIG_DOMAIN"
dig +short www."$DIG_DOMAIN"

# Check TXT/SPF/DMARC
dig TXT "$DIG_DOMAIN"
dig TXT _dmarc."$DIG_DOMAIN"
dig TXT google._domainkey."$DIG_DOMAIN"

# Vercel DNS listing (requires Vercel CLI login)
vercel dns ls dogtrainersdirectory
```

Document the command output (especially the final `dig` + `vercel dns ls`) in `DOCS/launch_runs/launch-production-YYYYMMDD-<description>.md` when the changes are applied.

## Risk & Rollback Notes

- **Propagation window:** DNS TTLs should be set low (300s) ahead of cutover to reduce propagation delays. Expect up to 24h for global caching, though Vercel changes typically take effect within minutes.
- **Fallback behaviour:** Keep a healthy Vercel Preview deployment available (and document the URL inside the launch run) until production DNS + environment verification succeed. If a rollback is required, point traffic back to the previous production deployment in Vercel and disable monetization flags until resolved.
- **Certificate issuance:** Vercel automatically provisions certificates once DNS validation succeeds. Monitor the Vercel dashboard for certificate status before sending traffic.
- **Email deliverability:** Changes to MX/SPF/DKIM/DMARC must be coordinated with whoever manages outbound email (Resend/Gmail). Update DMARC report recipients if ops requires separate monitoring.

## Status Tracking

| Item | Status | Notes |
| --- | --- | --- |
| Root + WWW records point at Vercel | Pending | Awaiting ops confirmation. |
| MX/SPF/DKIM/DMARC mirrored from staging | Pending | Verify no regressions with Google Workspace / Resend. |
| `vercel dns ls dogtrainersdirectory` matches table above | Pending | Capture CLI output and attach to launch run entry. |
| Launch-run log | `.md` entry under `DOCS/launch_runs/` | Create `launch-production-YYYYMMDD-dns-cutover.md` once screenshots/logs are available. |

Once ops shares DNS screenshots / CLI output, update this document with timestamps, and link to the launch-run entry.
