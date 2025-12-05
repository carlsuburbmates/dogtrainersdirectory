# Dog Trainers Directory - Development Setup Guide

Documentation home: `DOCS/README.md` — use this as your starting point for automation runbooks, DB/migrations docs, and AI agent instructions.



## Quick Start

This guide will help you set up the development environment for the Dog Trainers Directory project.

## Prerequisites

- Node.js 24 (Active LTS — matches deployment/runtime)
- npm or yarn
- Git
- Supabase account (free tier is sufficient for development)

## 1. Environment Setup (remote-first)

We recommend using a remote Supabase dev/staging project as the default development environment — Docker/local Postgres is available as an advanced option but not required for normal contributor workflows.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dogtrainersdirectory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (point to remote dev/staging Supabase)**
   ```bash
   # Create your local env safely

Use the safe helper to create `.env.local` without overwriting an existing file:

```bash
scripts/safe_copy_env.sh
# or
./scripts/safe_copy_env.sh .env.example .env.local
```

> IMPORTANT: `.env.local` is a persistent, local-only file (never commit it). Treat it as your per-machine configuration — do not delete or overwrite it during routine edits. If your .env.local is missing, restore it from `.env.example` using the script above.

### Optional (recommended): enable local git hooks

We provide a small local pre-commit hook at `.githooks/pre-commit` which prevents staging/committing `.env.local`. To enable on your machine:

```bash
# set hooks path for this repo (one-time per-machine):
git config core.hooksPath .githooks
```

This is a local convenience to reduce accidental commits of local env files. CI will also reject PRs that include `.env.local` automatically (see `.github/workflows/prevent-generated-files.yml`).
   ```

   Edit `.env.local` with your actual values (do NOT commit this file):

> NOTE: A full `next build` requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to be set in `.env.local`. Server-side admin features and some API routes also expect `SUPABASE_SERVICE_ROLE_KEY` when used. If you only need local development (`npm run dev`) against a remote Supabase instance, populate the public keys and you should be able to run the app.

   ### LLM configuration (optional)
   If you plan to enable AI-backed automations (digest, triage, moderation), add these variables to your `.env.local`.

   - LLM_PROVIDER — which provider to use by default: `zai` (recommended) or `openai`.
   - ZAI_API_KEY — API key for Z.AI (automation / ops). When using Z.AI, set ZAI_BASE_URL to `https://api.z.ai/api/paas/v4`.
   - LLM_DEFAULT_MODEL — the preferred Z.AI model (e.g. `glm-4.5-air`).
   - OPENAI_API_KEY — (optional) a backup OpenAI key if you prefer OpenAI as a fallback provider.

   Notes:
   - The app uses a single adapter (`src/lib/llm.ts`) and reads `LLM_PROVIDER` at startup; change the provider and keys in your `.env.local` to switch providers.
   - The repo also uses a separate Z.AI "coding" endpoint (`https://api.z.ai/api/coding/paas/v4`) in some offline tooling; the application itself uses the general `paas/v4` base path for automations.

   - Create a remote Supabase project at https://supabase.com (dev or staging)
   - Copy the Project URL and Anon Key from Settings > API
   - Generate a Service Role Key from Settings > API
   - Get ABR GUID from Australian Business Register (for ABN workflows)
   - Optional (admin tasks / CI): SUPABASE_CONNECTION_STRING — secure secret for migrations and backups

4. **Recommended remote DB / dashboard approach (default — no Docker required)**

   For normal development, prefer using the remote dev/staging project. That gives you full parity with hosted services (Auth, Edge Functions, Storage) without running local services.

   - Use the Supabase dashboard SQL editor or CI-driven migrations for schema changes — DO NOT treat `supabase/schema.sql` as a primary CI apply path. Instead, create incremental migrations under `supabase/migrations/` and let CI apply them.

   Example: run the app locally against the remote project (no Docker):
   ```bash
   npm run dev
   ```

   Note: Default developer workflow is remote-first — `npm run dev` starts Next.js and connects to your configured remote Supabase project.

   If you explicitly want a local Postgres container (advanced), start it with:

   ```bash
   npm run db:start
   ```

   You can also run the local convenience flow (start DB then dev server):

   ```bash
   npm run dev:local
   ```

### Advanced (optional): local Postgres / offline testing (Docker)

If you cannot connect to the remote Supabase service (for example due to corporate firewall rules) or you want to test migration edge-cases offline, the repo includes helper scripts for running a disposable local Postgres instance. These are OPTIONAL and intended for advanced use.

- Start a disposable local Postgres and apply schema & seeds (Docker required):

```bash
# optional, advanced-only
./scripts/local_db_start_apply.sh [POSTGRES_PASSWORD] [PG_PORT]
# example: ./scripts/local_db_start_apply.sh local_pass 5433
```

- Verify the local DB (optional):

```bash
./scripts/local_db_verify.sh [POSTGRES_PASSWORD] [PG_PORT]
```

- Stop the local DB (optional):

```bash
./scripts/local_db_stop.sh
```

- Admin/ops helper: attempt a remote apply using `SUPABASE_CONNECTION_STRING` (advanced/operator use only):

```bash
./scripts/try_remote_apply.sh
```

If you cannot connect to hosted admin endpoints, use the Supabase Dashboard SQL editor to run schema + seeds there.

Notes:
- The preferred, default workflow uses a remote Supabase dev/staging project; only advanced contributors should use local Docker helpers.
- Rely on `supabase/migrations/` + the `Check schema vs migrations` PR check to keep schemas in sync.

Pre-import validation (CI)

We added a validator that runs automatically on PRs and pushes that touch `supabase/schema.sql` or `supabase/data-import.sql`. The validator checks for common issues (NULL postcodes, invalid region enum values) and fails CI if problems are found.

Locally you can run the validator with:

```bash
npm run validate-import
# or
python3 scripts/validate_import.py
```

## 2. Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 3. Project Structure

```
src/
├── app/                    # Next.js 16 App Router pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (age-first triage)
├── components/              # Reusable React components
├── lib/                     # Utility libraries
│   └── supabase.ts          # Supabase client configuration
└── types/                   # TypeScript type definitions
    └── database.ts          # Database schema types

supabase/
├── schema.sql              # Complete database schema
└── data-import.sql          # Geographic data import
```

## 4. Key Features Implemented

### ✅ Completed (Phases 1–5)
- Next.js 16 with TypeScript/Tailwind + Supabase Auth/Edge Functions wiring
- Database schema with locked enums + enriched suburb data (28 councils / 138 suburbs)
- Age-first triage interface + suburb autocomplete/distance filters backed by the `search_trainers` RPC
- Directory browse + trainer profile pages with featured badge surfacing and search autocomplete
- Manual trainer onboarding + ABN verification (Phase 4)
- Emergency help flows (medical vets, stray shelters, crisis trainers) with AI-assisted triage logging + weekly accuracy summaries
- Emergency resource dataset (50+ entries) with council contacts, verification timestamps/statuses, and scheduled verification job endpoint (`/api/emergency/verify`)
- Admin dashboard upgrades: moderation queues, emergency verification queue, Emergency Triage watchlist, and the AI-generated “Daily Ops Digest” fed by `/api/admin/overview`
- AI moderation for reviews — auto-approve safe feedback, auto-reject obvious spam, log borderline cases with explanations in `ai_review_decisions`

### 🚧 Deferred / Next
- Stripe webhook infrastructure & monetization flows (stay dark until go-live criteria)
- Web scraper & onboarding automation (Phase 2+ per SSOT)
- Additional CI automation (CSV/enums, Haversine regression tests)

> **Lint note:** `npm run lint` now runs the ESLint CLI directly (`eslint .` via `eslint.config.mjs`) — `next lint` was removed upstream in Next.js 16.

## Automation & schedulers

- `/api/emergency/verify` — runs the emergency resource verification sweep (phone + website). Wire this to Vercel Cron or Supabase Scheduler daily; the endpoint writes to `emergency_resource_verification_runs` + `emergency_resource_verification_events`.
- `/api/emergency/triage/weekly` — aggregates `emergency_triage_logs` into `emergency_triage_weekly_metrics`. Schedule weekly (Mon 00:05 AEST recommended).
- `/api/admin/overview` — generates/stores the Daily Ops Digest (LLM-backed) and exposes KPIs for the admin dashboard. Optionally hit this via cron each morning to refresh summaries before humans log in.

> To fully enable emergency automation & ops digest persistence on a remote Supabase instance, apply the Phase 5 migration (`supabase/migrations/20250208103000_phase5_emergency_automation.sql`). See `DOCS/automation/REMOTE_DB_MIGRATIONS.md` for safe, step-by-step instructions.

---

## ABN verification — developer & ops workflow
The project implements a canonical ABN/ABR verification flow (see `DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md`). Key principles: we only mark an ABN as `verified` when ABN exists in the ABR response and `ABNStatus === 'Active'`. All writes are gated and we persist raw/parsed `matched_json` for auditability.

Core developer files and scripts
- `DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.staging.csv`, `DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.prod.csv` — CSV templates for ops-controlled allowlists.
- `scripts/generate_allowlist.py` — validate CSVs and write `scripts/controlled_abn_list.{staging,prod}.json`. Example (archived) at `scripts/examples/controlled_abn_list.example.json`. Generated files are git-ignored; use the generator when needed.
- `scripts/abn_controlled_batch.py` — ops-only controlled batch runner (dry-run default; `--apply` required to write). Requires `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_CONNECTION_STRING` and `ABR_GUID` environment variables for applied runs.
- `scripts/abn_recheck.py` — scheduled re-check implementation used by `.github/workflows/abn-recheck.yml`.

Quick dev & ops commands
```bash
# generate allowlist JSON from the CSV template
npm run allowlist:staging

# dry-run the controlled batch (staging)
npm run abn:batch:staging

# one-off apply (staging) — MUST use service role + backups
AUTO_APPLY=true SUPABASE_CONNECTION_STRING="<staging_conn>" \
  SUPABASE_SERVICE_ROLE_KEY="<staging_srk>" ABR_GUID="<staging_guid>" \
  npm run abn:batch:staging:apply

# tests
npm test
python3 scripts/test_abn_recheck.py -q
```

Safety & governance
- The roll-out checklist in `DOCS/ABN-Rollout-Checklist.md` is your canonical runbook for staging→production.
- Always run dry-runs first and use small selected allowlists for tests.
- Keep `AUTO_APPLY` off in scheduled runs until you're ready to gradually enable writes in production (monitor for 48–72 hours after enabling).


## 5. Development Workflow

1. **Feature Development**
   - Create feature branches from `main`
   - Follow the Phase 1 implementation plan
   - Test locally before committing

2. **Database Changes**
   - Update `supabase/schema.sql` for schema changes
   - Test changes in local development
   - Document migration steps

3. **Code Quality**
   ```bash
   npm run lint          # Check code style
   npm run type-check     # Verify TypeScript types
   ```

   > **Note:** Vitest suites (`*.test.ts*` / `*.spec.ts*`) are excluded from the TypeScript project until their helper typings are refactored. `npm run type-check` covers application/runtime code only.

## 6. Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npm run type-check
```

## 7. Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `ABR_GUID` | Australian Business Register GUID | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key (infrastructure only) | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | No |

## 8. Supabase Configuration

### Database Schema
The complete schema is defined in `supabase/schema.sql` with:
- Locked enums for ages, issues, services, and resources
- Row Level Security (RLS) policies
- Haversine distance function
- Optimized indexes

### Key Tables
- `councils` (28 records)
- `suburbs` (138 records)
- `profiles` (user profiles)
- `businesses` (trainer businesses)
- `trainer_specializations` (age specialties)
- `trainer_behavior_issues` (behavior issues)
- `trainer_services` (service types)
- `reviews` (customer reviews)
- `emergency_resources` (emergency services)

## 9. Feature Flags

The application uses feature flags to control Phase 1 scope:

```typescript
const FEATURE_FLAGS = {
  SCRAPER_ENABLED: false,           // Deferred to Phase 2
  MONETIZATION_UI_ENABLED: false,   // Deferred to Phase 4+
  AI_MODERATION_ENABLED: false,     // Optional in Phase 1
  PREMIUM_PROFILES_ENABLED: false  // Deferred to Phase 1.5+
}

> **Phase 2 scraper note:** When you’re ready to run the Phase 2 scraper/QA pipeline, set `SCRAPER_ENABLED=true` in your `.env.local` (or export the env var). Both `scripts/run_phase2_scraper.py` and `scripts/apply_phase2_scaffolded.py` refuse to generate new data unless this flag is truthy, so nothing is inserted or encrypted unless the flag is intentionally enabled.
```

## 10. Performance Targets

- Profile pages: <1s load time
- Directory pages: <2s load time  
- Suburb autocomplete: <200ms response

## 11. Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Supabase URL and keys in `.env.local`
   - Check Supabase project status
   - Ensure RLS policies are correctly applied

2. **TypeScript Errors**
   - Run `npm run type-check`
   - Check database types in `src/types/database.ts`
   - Ensure Supabase client is properly configured

3. **Styling Issues**
   - Verify Tailwind CSS is properly configured
   - Check `tailwind.config.js` for correct content paths
   - Ensure CSS imports are working

### Getting Help

1. Check the Phase 1 Implementation Plan: `PHASE1_IMPLEMENTATION_PLAN.md`
2. Review database schema: `supabase/schema.sql`
3. Consult project documentation in `DOCS/` directory

## 12. Next Steps

After completing the basic setup:

1. **Database & Auth** (Week 1)
   - Set up Supabase authentication
   - Configure Row Level Security policies
   - Test database connections

2. **Core APIs** (Week 2)
   - Implement triage API endpoint
   - Build search functionality
   - Create trainer profile APIs

3. **User Interface** (Week 3-4)
   - Complete dog owner journey
   - Build trainer onboarding
   - Create admin dashboard

4. **Integration** (Week 5-8)
   - ABN verification system
   - Stripe webhook infrastructure
   - Testing and documentation

## 13. Contributing Guidelines

1. Follow the existing code patterns and TypeScript types
2. Ensure all database operations use the defined enums
3. Test all new features with the geographic data
4. Update documentation when adding new features
5. Keep feature flags updated for Phase 1 scope

---

**Note**: This is a Phase 1 implementation focused on manual trainer onboarding and core directory functionality. Advanced features like scraping and monetization are deferred to later phases.

## PGCrypto decryption key (server-side only)

If you wish to enable database-side PGP decryption at runtime, set a server-only env var  to the symmetric key used to encrypt PGP payloads. This key is only read by server-side code / functions and is never committed into the repo.

Note: we intentionally don't store keys in plaintext in the repository — set this in your host or CI secret store.

### Enabling DB-side PGP decryption (SUPABASE_PGCRYPTO_KEY)

We added a small refactor to pass an explicit decryption key from server into DB RPCs (search_trainers, get_trainer_profile, etc.). To enable decryption on staging or production, set the same symmetric key used when data was encrypted into the following places:

- Vercel / Host for server-side & API routes: Set `SUPABASE_PGCRYPTO_KEY` as a server-only environment variable.
- Supabase Functions (Edge): set `SUPABASE_PGCRYPTO_KEY` in the functions secrets and redeploy the function.

Examples:

Vercel (interactive):
```bash
vercel env add SUPABASE_PGCRYPTO_KEY production
# then redeploy using your normal flow
```

Supabase Functions (CLI):
```bash
supabase secrets set SUPABASE_PGCRYPTO_KEY="${YOUR_KEY}"
supabase functions deploy triage
```

Quick local verification:
```bash
export SUPABASE_CONNECTION_STRING="postgres://..."
export SUPABASE_PGCRYPTO_KEY="your_key_here"
node scripts/verify_decryption.js
```

Integration tests (CI/local):
- The repo now contains a vitest integration test at `src/tests/integration/decrypt.integration.test.ts`.
- This test is skipped unless both `SUPABASE_CONNECTION_STRING` and `SUPABASE_PGCRYPTO_KEY` are present in the environment. It uses `pg` to insert an encrypted test record, validates `get_trainer_profile(id, p_key)` returns decrypted fields, and validates `get_trainer_profile(id, NULL)` returns NULL.
