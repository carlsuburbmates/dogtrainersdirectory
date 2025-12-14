<!-- Copilot / AI agent instructions for quick onboarding -->
# Quick guide for AI coding agents — dogtrainersdirectory.com.au

Focus: be precise and make only changes that align with the single-source-of-truth docs contained in /DOCS. When in doubt, prefer preserving canonical files (blueprint_ssot_v1.1.md, suburbs_councils_mapping.csv, implementation/*).

Core summary
- Purpose: hyperlocal trainer directory for 28 Melbourne councils (see `DOCS/blueprint_ssot_v1.1.md`).
- Stack (official / repo-aligned): **Next.js 14 App Router**, **Node.js v24 (Active LTS)** for dev/CI/prod, and **React at the latest stable version supported by Next.js** (React 19 once GA). Supabase (Postgres + Edge Functions + CLI) is the canonical backend; treat Supabase DB as the only source of persisted state.
- Phase 2 (triage + filtering) is **complete and locked**. The UI (`src/app/page.tsx`, `src/app/search/page.tsx`), shared helpers (`src/lib/triage.ts`), and RPC (`search_trainers`) must not be rewritten back to the pre-fix “radius only” implementation. Reference `DOCS/PHASE_2_FINAL_COMPLETION_REPORT.md` for the accepted behavior and QA evidence.

Key references (always read before touching UX or data)
1. `DOCS/blueprint_ssot_v1.1.md` – master SSOT for personas, domain model, taxonomies, UX invariants. Last full review: 2025-12-09.
2. `DOCS/IMPLEMENTATION_REALITY_MAP.md` – current implementation truth table (frontend/backend/automation status, verification methods). Updated as of the latest verify run.
3. `DOCS/FRONTEND_VERIFICATION_FINDINGS.md` – screen-by-screen audit of the current UI, including known gaps and UX decisions.
4. `DOCS/LAUNCH_READY_CHECKLIST.md` – defines AI-ready vs Launch-ready states and tracks go/no-go evidence.
5. `README.md` (root) – project overview, setup, scripts, CI expectations.

Always cross-check those documents when planning a change; if a change contradicts them, update the SSOT first (usually via an RFC) before editing code.

How to start any task
1. Re-read the five key docs above to confirm scope and current status.
2. Identify the relevant runbook/spec in `DOCS/` (e.g., monetization, emergency ops, automation).
3. For code tasks, follow the standard workflow:
   - `nvm install 24 && nvm use 24`
   - `npm ci` (or `npm install` locally)
   - Run `npm run lint`, `npm run test`, `npm run smoke`, or `npm run verify:launch` depending on change scope.
   - Record evidence in `DOCS/launch_runs/launch-<env>-<date>-*.md` when the work impacts readiness.
4. For design/UX investigations, start from `DOCS/blueprint_ssot_v1.1.md` and validate against `DOCS/FRONTEND_VERIFICATION_FINDINGS.md` before proposing changes.
5. Always capture manual/Operator-only actions in the launch checklist and runbooks.

Core workflows & CI gates
- **AI Launch Gate**: `npm run verify:launch` (local + CI). Emits `VERIFY_LAUNCH_RESULT: PASS=… WARN=… SKIP=… FAIL=… EXIT=…`. Harness writes artifacts under `DOCS/launch_runs/launch-prod-YYYYMMDD-ai-preflight.*` and enforces DB/telemetry/env checks.
- **CI Workflow**: `.github/workflows/verify-launch.yml` runs on PRs (strict) and supports manual `workflow_dispatch` with optional `accept_dns_warn` input (sets `VERIFY_LAUNCH_ACCEPT_DNS_WARN=1`).
- **Pre-production verification**: `scripts/preprod_verify.sh` (type-check → smoke → lint → doc divergence → env check). Use `ENV_TARGET=<env>` when validating staging vs production.
- **Doc divergence**: `python3 scripts/check_docs_divergence.py --base-ref origin/main` ensures SSOT docs stay in sync with code.
- **Launch readiness updates**: When readying production, update `DOCS/LAUNCH_READY_CHECKLIST.md` and append to the relevant `DOCS/launch_runs/...` entry.

High-value files to read first
- `DOCS/blueprint_ssot_v1.1.md` — architecture, domain model, taxonomies, and UX rules.
- `DOCS/MONETIZATION_ROLLOUT_PLAN.md` — Stripe monetization SSOT (product scope, metadata contract, webhook/legal requirements).
- `DOCS/implementation/master_plan.md` — rollout phases, priorities, and constraints.
- `suburbs_councils_mapping.csv` — authoritative geographic dataset (used for seeding and lookup).

Project-specific patterns & constraints (do not change unless spec updates)
- Taxonomies are locked enums (age/stage, 13 behaviour issues, service types). Never add free-text categories instead of enum values.
- "Age-first" UX: all search flows must collect age/stage before other filters (this is a product invariant in the blueprint).
- Geography: users select suburbs only; council/region must be derived from the CSV mapping — never expose LGA acronyms in UI.
- Verification: ABN verification flows are automatic via ABR API. Accept name matches >=~85% as verified; otherwise flag for manual review (see ABN doc for tolerance and DB schema examples).
- Data hygiene: no hard-deletes for Businesses; prefer soft-delete flags and store verification audit records as described in ABN doc.

-Integration & infra notes (discoverable here — secrets are not in repo)
- ABR (ATO) API: example usage shown in ABN doc: GET /abr/abn/{ABN}?businessName={name}. A GUID credential is required (not in repo).
- Stripe: webhook-driven flows — expect webhook endpoints that create/renew featured placements and future subscriptions; **always verify signatures**, return a 2xx as soon as persistence succeeds, and make handlers idempotent. Test locally with the Stripe CLI (`stripe listen`) before deploying. See flow + sample events in `DOCS/MONETIZATION_ROLLOUT_PLAN.md`.
- DeepAgent / LLM orchestration: design references exist in the docs (webhook parsing, LLM-triggered workflows). Confirm runtime endpoints and secrets with maintainers.

-Practical dev tasks & commands (docs-driven)
- Regenerate PDFs from markdown (docs mention pandoc):
  - `pandoc DOCS/blueprint_ssot_v1.1.md -o blueprint_ssot_v1.1.pdf`
- Quick data checks for CSV:
  - `wc -l DOCS/suburbs_councils_mapping.csv` # expect header + 138 rows
  - `cut -d',' -f2 DOCS/suburbs_councils_mapping.csv | sort -u | wc -l` # expect header + 28 councils

- ABN allowlists & ops helpers:
  - `DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.staging.csv` & `DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.prod.csv` are CSV templates to maintain curated allowlists for controlled writes
  - `scripts/generate_allowlist.py` converts the CSV to `scripts/controlled_abn_list.{staging,prod}.json` and validates entries
  - convenient npm scripts are available: `npm run allowlist:staging|prod`, `npm run abn:batch:staging|prod` (dry-run), `npm run abn:batch:staging:apply|prod:apply` (applies changes with AUTO_APPLY and service-role)

- Recommended development setup — REMOTE-FIRST (default):
  - Use Node.js v24 everywhere:
    - `nvm install 24 && nvm use 24`
  - Next.js 14 App Router + TypeScript (matching blueprint expectations).
  - Default workflow: use a remote Supabase dev/staging project for local app development (this provides Auth, Edge Functions, and Storage without needing to run local services). Configure `.env.local` to point at the remote project.
  - Optional/local (advanced): Start Supabase locally for functions/DB tests using the Supabase CLI if you specifically need local emulation:
    - `supabase start`
  - Test Stripe webhooks locally with the Stripe CLI (optional):
    - Prefer using the repo's dedicated webhook dev harness so you don't accidentally forward events to another local project (for example something bound to :3000). The repo provides `webhook/server_dtd.py` which defaults to port **4243** and endpoint `/api/webhooks/stripe-dtd`.
    - Example (recommended for dogtrainersdirectory development):
      - `stripe listen --forward-to http://localhost:4243/api/webhooks/stripe-dtd`

- Linting: `npm run lint` now invokes the ESLint CLI directly (`eslint .` via `eslint.config.mjs`) because `next lint` was removed in Next.js 16.
- CI safety: The `Check schema vs migrations` PR check applies every migration to a scratch Postgres and diffs `supabase/schema.sql`. Keep the snapshot aligned with migrations before opening PRs.
Risk & governance reminders
- Treat `DOCS/blueprint_ssot_v1.1.md`, `DOCS/suburbs_councils_mapping.csv`, and `DOCS/FILE_MANIFEST.md` as immutable; any geography change needs an approved RFC plus manifest note, and CI should fail if council/suburb counts drift.
- Phase 2+ ingestion (web scrapers, bulk imports) must remain behind feature flags with QA sampling (≥10 scaffolded listings/run) until accuracy >95% and product sign-off.
- Keep Stripe/monetization features dark until master-plan metrics are met (≥50 claimed trainers, stable ABN verification rate, review volume). Reference the master plan before exposing paid UI.
- AI moderation only flags—humans approve/reject reviews and profiles. Track false positives and add transparency copy when touching moderation flows.
- Maintain the ≥85% ABN auto-match rule, review mismatches within 24 hours, log ABR responses, and schedule yearly re-verification jobs.
- Assign ownership for emergency vet/shelter data; verify contacts quarterly via `/api/emergency/verify` + admin queue surfacing, and highlight records older than 90 days in admin tooling before relying on them in UX.

When you need to change something
- If a change affects product invariants (taxonomies, age-first rules, geography mapping), update `DOCS/blueprint_ssot_v1.1.md` or `implementation/master_plan.md` first — those are the SSOT.
- If you must change CSV data, document the change in FILE_MANIFEST.md and ensure the mapping remains consistent with the blueprint.
- Add tests or data migrations where relevant (e.g., migration enforcing enum values, ABN verification audit retention).

If you can't find infra details
- Secrets, credentials, and runtime endpoints are intentionally absent — contact a repo maintainer or check the deployment repository/environment for: ABR GUID, Stripe keys, DeepAgent webhook URL, and any Supabase/DB connection info.
 - Secrets, credentials, and runtime endpoints are intentionally absent — contact a repo maintainer or check the deployment repository/environment for: ABR GUID, Stripe keys, DeepAgent webhook URL, and any Supabase/DB connection info.
 - CI/security guardrail: Do NOT commit Stripe secret keys or webhook signing secrets. CI should include a secrets-scan (fail on `sk_live_|sk_test_|whsec_` patterns) — developers should store secrets in CI secrets manager or local `.env` files excluded from the repo.

Follow-up: ask maintainers if you'd like a runnable example app or seed scripts; current repo contains authoritative design & data only.


-----------------


important note: .env.local have complete secrets so source out from here if needed:
NEXT_PUBLIC_SUPABASE_URL=https://xqytwtmdilipxnjetvoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Server-side / admin only (DO NOT commit real values)
# SUPABASE_SERVICE_ROLE_KEY gives admin/postgres access and should be kept secret.
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_CONNECTION_STRING=
SUPABASE_PGCRYPTO_KEY=2
PGCRYPTO_KEY

# ABR (ABN) Lookup
ABR_GUID=


# Optional LLM / AI keys (leave blank if you don't use AI features locally)
LLM_PROVIDER=zai
ZAI_API_KEY=
OPENAI_API_KEY=
LLM_DEFAULT_MODEL=glm-4.6   # or ""glm-4.6"" if you prefer

# infrastructure / features
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=p
RESEND_API_KEY=
SENTRY_DSN=

# Optional ops / safety toggles
AUTO_APPLY=false
SCRAPER_ENABLED=true  # Toggle Phase 2 scraper + QA automation

SUPABASE_URL=https://xqytwtmdilipxnjetvoe.supabase.co



# Observability (optional)
LOGFLARE_API_KEY=
LOGFLARE_SOURCE_ID=

# AI provider (if using AI agents)
# Which provider to use by default: ""zai"" or ""openai""

# Z.AI general API (production automation)
ZAI_BASE_URL=https://api.z.ai/api/paas/v4

# Optional: OpenAI backup (not required yet)
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL_ID=gpt-4.1-mini

# Misc references
# GitHub: https://github.com/carlsuburbmates/dogtrainersdirectory
# Sentry token (full permissions): sntryu_...

CRON_SECRET=
GITHUB_CI_SHARED_SECRET=
# Stripe Test Products & Prices (Created: 2025-12-11)
STRIPE_PRICE_FEATURED=
STRIPE_PRICE_PRO=
FEATURE_MONETIZATION_ENABLED=1
NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=1

# Alert Configuration
ALERTS_EMAIL_TO=ops@dogtrainersdirectory.com.au
ALERTS_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/test-webhook-url
