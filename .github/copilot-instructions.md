<!-- Copilot / AI agent instructions for quick onboarding -->
# Quick guide for AI coding agents — dogtrainersdirectory.com.au

Focus: be precise and make only changes that align with the single-source-of-truth docs contained in /DOCS. When in doubt, prefer preserving canonical files (blueprint_ssot_v1.1.md, suburbs_councils_mapping.csv, implementation/*).

Core summary
- Purpose: hyperlocal trainer directory for 28 Melbourne councils (see `blueprint_ssot_v1.1.md`).
- Stack (official / repo-aligned): **Next.js 14 App Router**, **Node.js v24 (Active LTS)** for dev/CI/prod, and **React at the latest stable version supported by Next.js** (React 19 once GA). Supabase (Postgres + Edge Functions + CLI) is the canonical backend; treat Supabase DB as the only source of persisted state.
- Phase 2 (triage + filtering) is **complete and locked**. The UI (`src/app/page.tsx`, `src/app/search/page.tsx`), shared helpers (`src/lib/triage.ts`), and RPC (`search_trainers`) must not be rewritten back to the pre-fix “radius only” implementation. Reference `DOCS/PHASE_2_FINAL_COMPLETION_REPORT.md` for the accepted behavior and QA evidence.

High-value files to read first
- `DOCS/blueprint_ssot_v1.1.md` — architecture, domain model, taxonomies, and UX rules.
- `DOCS/automation/ABN-ABR-GUID_automation/abn_stripe_legal_integration_v5.md` — ABN verification, Stripe webhooks, and payment flows (includes example endpoints and DB table shapes).
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
- Stripe: webhook-driven flows — expect webhook endpoints that create/renew featured_placements and subscriptions; **always verify signatures**, return a 2xx as soon as persistence succeeds, and make handlers idempotent. Test locally with the Stripe CLI (`stripe listen`) before deploying. See webhook flow and sample events in `DOCS/automation/ABN-ABR-GUID_automation/abn_stripe_legal_integration_v5.md`.
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
