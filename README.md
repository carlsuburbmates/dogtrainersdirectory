# dogtrainersdirectory.com.au

Docs home: `DOCS/README.md` — single place to discover authoritative design, automation runbooks, DB/migration index, and AI playbooks.



Docs-first, AI-assisted directory connecting Melbourne dog owners to trainers, behaviour consultants, and emergency resources across 28 councils. Built on Next.js 16 App Router, Supabase (Postgres/Auth/Functions/Storage), and Stripe-ready (monetization deferred) with strong disclaimers (no SLAs).

## Status
- Phases 1–5 delivered (database/auth, triage/search, directory/profiles, manual onboarding with ABN verification, emergency ops + admin dashboard). Monetization and web-scraper automation remain deferred until post-launch criteria are met.
- Scope: Melbourne metro only; suburb-first UX; age-first triage with locked enums
- Monetization: Deferred until Phase 4+ criteria are met
- Policy: No uptime/delivery/quality guarantees; best-effort only with explicit disclaimers

## Core Features (per SSOT)
- Age-first triage (age → issue → suburb), locked enums (ages, 13 issues, 5 service types)
- Suburb-to-council mapping (28 councils, 138 suburb rows with postcode/lat/lon)
- ABN verification (GUID-based, canonical contract, ≥85% auto-match), verified badge
- Manual trainer onboarding (multi-step form, suburb autocomplete, ABN verification + email invite)
- Emergency routing (medical vets, shelters, crisis trainers) with AI-assisted triage + logging
- Admin/moderation queues (reviews, profiles, emergency verification) with automation hooks, Ops digest, and AI-based review gating
- Stripe webhooks design for featured slots + subscriptions (post-launch)

### ABN verification — quick overview
This project implements a single canonical ABN/ABR verification behaviour across all code paths (onboarding, API verification endpoint, scheduled re-check job, and ops-only controlled batch). The authoritative source is the ABR API and we only mark an ABN as "verified" when:

- ABN exists in the ABR response AND
- ABNStatus === "Active"

Full developer and runbook guidance is in `DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md` (contract + parsing rules). Key operational artefacts are:

- CSV templates (for ops): `DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.staging.csv` and `DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.prod.csv` — use these to maintain curated allowlists for controlled batch runs.
- Generator script: `scripts/generate_allowlist.py` — reads CSV templates, validates rows, and writes `scripts/controlled_abn_list.staging.json` or `scripts/controlled_abn_list.prod.json`.
- Example (archived): `scripts/examples/controlled_abn_list.example.json`. Generated allowlists are git-ignored and should be produced by the generator when needed.
- Controlled batch runner: `scripts/abn_controlled_batch.py` — intended for ops-only manual or one-off write runs (dry-run by default). Use the `--apply` flag plus environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `ABR_GUID`, and `SUPABASE_CONNECTION_STRING`) to perform writes.
- Scheduled re-check automation: `.github/workflows/abn-recheck.yml` & `scripts/abn_recheck.py` (dry-run gated by AUTO_APPLY). The re-check job can be configured to automatically apply changes in production only after careful staging sign-off.

Convenience npm scripts (wrappers) have been added so maintainers can quickly generate allowlists and run dry-run/apply workflows:

- `npm run allowlist:staging` — generate `scripts/controlled_abn_list.staging.json` from `DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.staging.csv`
- `npm run allowlist:prod` — generate `scripts/controlled_abn_list.prod.json` from `DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.prod.csv`
- `npm run abn:batch:staging` — dry-run against `scripts/controlled_abn_list.staging.json`
- `npm run abn:batch:staging:apply` — apply with AUTO_APPLY=true (use only after sign-off)
- `npm run abn:batch:prod` — dry-run against `scripts/controlled_abn_list.prod.json`
- `npm run abn:batch:prod:apply` — apply with AUTO_APPLY=true (production apply requires service-role and backups)

See `DOCS/ABN-Rollout-Checklist.md` for a full, conservative staging → production runbook with safety checks, DB queries, and monitoring guidance.

## Stack
- Next.js 16 (App Router), React (latest supported), TypeScript recommended
- Node.js v24 (dev/CI/prod)
- Supabase (Postgres, Auth, Edge Functions, Storage)
- Stripe (webhooks, idempotent handlers) — disabled until go-live criteria met
- Optional: Sentry or Logflare for observability; Resend/BYO SMTP for email; OpenAI/Anthropic for AI agent flows

## Data Sources
- `DOCS/blueprint_ssot_v1.1.md` — product/UX rules, taxonomies, geography
- `DOCS/suburbs_councils_mapping.csv` — 28 councils, 138 suburb rows with postcode/lat/lon
- `DOCS/automation/ABN-ABR-GUID_automation/abn_stripe_legal_integration_v5.md` — ABN + Stripe flows
- `DOCS/implementation/master_plan.md` — phased rollout, governance
- `DOCS/ai/ai_agent_execution_v2_corrected.md` — phase prompts/checklists

## Getting started (remote Supabase — default)
Prereqs: `nvm install 24 && nvm use 24`, Yarn/PNPM/NPM.

This repository uses a remote Supabase dev/staging project as the default development environment. Docker/local Postgres is optional and intended for advanced testing only.

1. Create or reuse a Supabase project in the Supabase cloud for dev/staging.
2. Configure `.env.local` (do not commit) with these values:

> NOTE: `.env.local` is a persistent local file — do not delete it or commit it. Use `.env.example` as a template and the repo helper `scripts/safe_copy_env.sh` to create `.env.local` without overwriting any existing values.

**Optional (recommended):** enable the local pre-commit hook to avoid accidentally adding `.env.local` to commits by running:

```bash
# enable hooks for this repo (one-time per-machine):
 git config core.hooksPath .githooks
```

The repo also contains a CI check that rejects PRs containing `.env.local` or other env files.
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - (Optional) SUPABASE_CONNECTION_STRING — only required for certain admin scripts.

Run the app locally (no Docker required):

```bash
npm install
npm run dev
```

Lint/QA helpers (Next.js 16 removed `next lint`):

```
npm run lint        # ESLint flat config via eslint.config.mjs
npm run type-check  # tsc --noEmit
```

Advanced/optional — local emulation (Docker / Supabase CLI)

If you specifically need an isolated local dev environment for migration testing or to run the full Supabase emulator (auth/functions/storage), use one of the optional approaches below.

- Supabase CLI (preferred for full parity): `supabase start` (see `supabase/README.md`)
- Lightweight Docker helpers: `scripts/local_db_start_apply.sh` and `scripts/test_apply_migrations.sh` (see `supabase/LOCAL_SETUP.md`)

## Env / Supabase config
Create `.env.local` (and `.env` for Supabase functions) with:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role>          # server-side only

# ABN / Verification
ABR_GUID=9c72aac8-8cfc-4a77-b4c9-18aa308669ed     # server-side only

# Stripe (deferred until monetization on)
STRIPE_SECRET_KEY=<stripe-secret>
STRIPE_WEBHOOK_SECRET=<whsec_...>

# Email (choose one)
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
# or Resend
RESEND_API_KEY=<resend-key>

# Observability (optional)
SENTRY_DSN=<dsn>       # or LOGFLARE_API_KEY/URL

# AI provider (if using AI agents)
OPENAI_API_KEY=<key>   # or ANTHROPIC_API_KEY=<key>
```

## TODO
- Wire Vercel/Supabase cron to hit `/api/emergency/verify` daily and `/api/emergency/triage/weekly` weekly (currently invoked manually).
- Add CI checks for CSV counts/enums and distance calculations.
- Formalise ops runbooks for AI review moderation and emergency verification alerts (see `DOCS/automation/automation-checklist.md`).

## Maintainer checklist — rolling schema changes into migrations
When you need to change the database schema follow these steps to keep `supabase/migrations/` canonical and avoid drift:

1. Create a new timestamped migration file in `supabase/migrations/` (e.g. `YYYYMMDDHHMMSS_add_new_column.sql`) with *idempotent* SQL where possible (use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`). Avoid destructive `DROP` statements unless coordinated with ops.
2. Test the migration locally or in a disposable dev/staging project:
   - For quick isolated checks (advanced): use `scripts/test_apply_migrations.sh` to run on a temporary local Postgres container (optional).
   - For full parity: spin up a remote dev/staging Supabase project, set `.env.local` to point to it, and run CI or `psql` against the remote `SUPABASE_CONNECTION_STRING` (use caution).
3. Verify migrations apply in order and do not introduce incompatibilities; use the CI pre-merge check `Check schema vs migrations` which will ensure `supabase/schema.sql` matches the migrations-applied DB.
4. If desired, update `supabase/schema.sql` snapshot using a schema-only dump from a DB that has migrations applied (e.g., `pg_dump -s --no-owner --no-privileges`) and confirm with the pre-merge check.
5. Commit the migration file and tests; open a PR and wait for the CI pre-merge `Check schema vs migrations` to pass before merging.

Notes:
- Never rely on `supabase/schema.sql` as the primary apply path in CI/production — use `supabase/migrations/`.
- If you must perform a destructive change, coordinate with the ops team and use a carefully staged migration with backups in CI.

## Governance & Disclaimers
- No SLAs: no uptime/delivery/quality guarantees; best-effort only.
- Monetization stays off until Phase 4+ criteria (≥50 claimed trainers, stable ABN verifications).
- Emergency data requires periodic verification; prefer automation over manual calls.
- AI moderation: AI flags, human approves; transparency copy required in UI.
