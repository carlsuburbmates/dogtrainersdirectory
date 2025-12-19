<!-- Copilot / AI agent instructions for dogtrainersdirectory.com.au -->
# AI Agent Onboarding: dogtrainersdirectory.com.au

**Purpose:** Hyperlocal dog trainer directory for Melbourne (28 councils, 138 suburbs).  
**Stack:** Next.js 14 App Router, React 19, TypeScript, Supabase (Postgres + Auth + Edge Functions), Stripe (monetization, deferred).  
**Node:** v24 (Active LTS, mandatory).

---

## Start Here: The Five Key Docs

**Read these BEFORE any code change:**

1. `DOCS/blueprint_ssot_v1.1.md` – Master spec: locked taxonomies (ages, 13 behavior issues, 5 service types, regions), "age-first" UX invariant, 28 councils + 138 suburbs, ABN verification rules (≥85% auto-match).
2. `DOCS/IMPLEMENTATION_REALITY_MAP.md` – Truth table of what works now (frontend flows, APIs, automations, scripts). Specifies CONFIRMED-WORKING vs UNKNOWN for rapid triage.
3. `DOCS/LAUNCH_READY_CHECKLIST.md` – Go/no-go gates: `npm run verify:launch` (AI-ready FAIL=0), environment checks, emergency APIs, ABN fallback metrics.
4. `DOCS/MONETIZATION_ROLLOUT_PLAN.md` – Stripe webhook contract, payment audit schema, feature-flag guards (`FEATURE_MONETIZATION_ENABLED`), Playwright E2E bypass (`E2E_TEST_MODE`).
5. `DOCS/operator-runbook.md` – Ops procedures: ABN allowlist generation, controlled batch runs, cron job triggers, alert escalation.

Cross-check these whenever planning UX, API, or data changes. If contradictions exist, update the SSOT first (RFC → merge → implement code).

---

## Architecture Essentials

### Frontend (Locked Flows — Read Phase 2 Completion Report)

**Home & Search** (`src/app/page.tsx`, `src/app/search/`)  
- Age-first triage enforced: age select → issue multi-select → suburb search → results.
- Uses locked enums from `src/types/database.ts`: `AgeSpecialty`, `BehaviorIssue`, `ServiceType`.
- Calls `/api/triage` (RPC wrapper) → `search_trainers` Postgres function.

**Directory Browse** (`src/app/directory/page.tsx`)  
- Displays `SearchResult` with `is_featured` and `abn_verified` metadata.
- No client-side filtering; all filtering is server-side or RPC.

**Emergency Triage** (`src/app/emergency`, `src/components/triage/EmergencyGate.tsx`)  
- Server-rendered shell + minimal client controls.
- Maps medical/behavior inputs only to SSOT-approved issues (no free-text).
- Calls `/api/emergency/triage` → `medicalDetector.ts` for LLM fallback.

**Trainer Profile** (`src/app/trainers/[id]/page.tsx`)  
- Server-renders business details + reviews.
- Note: legacy slug profile (`src/app/trainer/[slug]`) was **removed in Phase 4** — all links now point to `/trainers/[id]`.

**Admin Dashboards** (`src/app/admin/{page,ai-health,cron-health}`)  
- Real-time health status, telemetry overrides, ABN fallback stats, latency metrics.
- `AdminStatusStrip.tsx` injects cron/ABN heartbeat into every admin page footer.

**Monetization Upgrade** (`src/app/promote/page.tsx`)  
- Feature-flagged: dark unless `FEATURE_MONETIZATION_ENABLED` (server) AND `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED` (client).
- Playwright E2E mode (`E2E_TEST_MODE=true`) stubs Stripe calls for testing without real keys.

### Backend (APIs, Automations, Verification)

**Search & Triage RPC** (`src/lib/api.ts`, `/api/triage`)  
- Calls Postgres `search_trainers(lat, lon, radius, age, issue, suburb, is_featured)` function.
- Results include `is_featured`, `abn_verified`, verification status.

**ABN Verification** (`src/lib/abr.ts`, `/api/abn/verify`)  
- Canonical parser for ABR API responses (JSON + SOAP fallback).
- Name match ≥~85% + ABNStatus='Active' → verified badge.
- Fallback events logged to `abn_fallback_events` table; metrics exposed in `/api/admin/abn/fallback-stats`.

**Emergency APIs** (`src/app/api/emergency/*`)  
- `/api/emergency/triage` – detects medical/behavior emergencies, calls LLM if needed, routes to crisis trainers or vets.
- `/api/emergency/verify` – cron job that re-verifies emergency resource contacts (quarterly, fallible on API errors).
- `/api/emergency/triage/weekly` – aggregates triage stats for ops weekly bulletin.

**Stripe Webhooks** (`src/app/api/webhooks/stripe/route.ts`)  
- Verifies signature (critical: never skip).
- Idempotent handler: dedupes events, upserts `business_subscription_status`, logs to `payment_audit`.
- Returns 2xx as soon as DB succeeds (async failures logged as `sync_error`).

**Moderation & AI** (`src/lib/moderation.ts`, `src/lib/llm.ts`, `/api/admin/queues`)  
- AI flags reviews/profiles only; humans approve/reject.
- LLM provider configurable: `LLM_PROVIDER=zai` (Z.AI) or `openai`. Fallback to deterministic rules on LLM unavailability.
- False positives tracked for transparency updates.

### Data & Validation

**Taxonomies** (locked enums, never add free-text)  
- `AgeSpecialty`: `puppies_0_6m`, `adolescent_6_18m`, `adult_18m_7y`, `senior_7y_plus`, `rescue_dogs`
- `BehaviorIssue`: 13 values (pulling_on_lead, separation_anxiety, excessive_barking, … socialisation)
- `ServiceType`: 5 values (Puppy training, Obedience training, Behaviour consultations, Group classes, Private training)
- `ResourceType`: trainer, behaviour_consultant, emergency_vet, urgent_care, emergency_shelter
- `Region`: Inner City, Northern, Eastern, South Eastern, Western (auto-derived from suburb)

**Geography** (`DOCS/suburbs_councils_mapping.csv`)  
- 138 suburb rows, 28 unique councils.
- Never expose LGA acronyms in UI; always derive council/region from suburb selection.
- CSV is immutable; any change requires RFC + FILE_MANIFEST update + CI drift check.

**Verification Status** (computed, not free-text)  
- ABN verified: `ABNStatus='Active' && name_match >= 0.85`
- Unclaimed trainer: new Businesses are marked `claimed=false` until trainer confirms email.
- Soft-delete only: `is_deleted=true` flag, never hard-delete.

---

## Development Workflow

### Quick Start

```bash
nvm install 24 && nvm use 24
npm ci                          # Use remote Supabase dev/staging (default)
npm run dev                     # Start Next.js at :3000
```

### Verification & QA

```bash
npm run type-check              # tsc --noEmit (strict mode)
npm run lint                    # eslint . (via eslint.config.mjs)
npm run smoke                   # Vitest unit tests (trainer profiles, search, emergency, admin, error logging)
npm run test                    # Full Vitest suite
npm run test:watch              # Dev mode
npm run e2e                     # Playwright E2E (search, emergency, monetization, admin)
npm run verify:launch           # AI Launch Gate: type-check → smoke → lint → doc-divergence → env-ready
```

**Pre-prod verification:**  
```bash
ENV_TARGET=staging ./scripts/preprod_verify.sh    # Validates staging env
ENV_TARGET=prod ./scripts/preprod_verify.sh       # Validates prod env (operator only)
```

**ABN scripts:**  
```bash
npm run allowlist:staging                         # Generate staging allowlist from CSV
npm run allowlist:prod                            # Generate prod allowlist from CSV
npm run abn:batch:staging                         # Dry-run against staging allowlist
npm run abn:batch:staging:apply                   # Apply with AUTO_APPLY=true
```

### Local Database (Optional, Advanced)

For isolated migration testing:
```bash
npm run db:start                 # Start Supabase emulator, apply migrations, seed
npm run db:seed                  # Seed only (no reset)
npm run dev:local                # Run app against local Supabase
```

---

## Critical Rules & Constraints

1. **Phase 2 is locked.** UI (`src/app/page.tsx`, `src/app/search/`), helpers (`src/lib/triage.ts`), and RPC (`search_trainers`) must NOT revert to "radius only" behavior. See `DOCS/PHASE_2_FINAL_COMPLETION_REPORT.md` for QA evidence.

2. **Taxonomy enums are immutable.** Never add free-text categories for age, issues, or service types. Instead, propose RFC to blueprint if genuinely missing.

3. **"Age-first" is non-negotiable.** All search flows must collect age/stage before other filters. Product invariant.

4. **ABN rules are strict.** Auto-match ≥~85% + ABNStatus='Active' ONLY. Anything else → flag for manual review. Maintain yearly re-verification jobs.

5. **No hard-deletes for Businesses.** Use `is_deleted=true` flag and store verification audit records. Compliance requirement.

6. **Monetization is feature-flagged.** Both `FEATURE_MONETIZATION_ENABLED` (server) and `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED` (client) must be set; dark by default. Keep hidden until master-plan metrics met (≥50 claimed trainers, stable ABN rate, review volume).

7. **Stripe webhooks are idempotent.** Dedup events, return 2xx on DB success, log async failures as sync_error. Always verify signature.

8. **AI flags only.** Humans approve/reject reviews and profiles. Track false positives; add transparency copy on UX changes.

9. **Emergency verification is quarterly.** Re-verify vet/shelter contacts every 3 months; highlight records >90 days old in admin tools.

10. **Doc divergence blocks CI.** `npm run verify:launch` fails if SSOT docs drift from code. Keep schema, migrations, and docs in sync.

---

## Integration & External Dependencies

### ABR (Australian Business Register) API
- Endpoint: `GET /abr/abn/{ABN}?businessName={name}`
- Credential: GUID (store in `ABR_GUID` secret, not in repo)
- Parser: `src/lib/abr.ts` handles JSON + SOAP fallback
- Fallback tracking: `abn_fallback_events` table + `/api/admin/abn/fallback-stats` dashboard

### Stripe (Webhooks & Subscriptions)
- Webhook endpoint: `/api/webhooks/stripe/route.ts` (always verify signature)
- Test locally: `stripe listen --forward-to http://localhost:4243/api/webhooks/stripe-dtd` (custom harness at port 4243, not :3000)
- E2E bypass: `E2E_TEST_MODE=true` env var stubs real Stripe calls for Playwright
- Metadata contract: See `DOCS/MONETIZATION_ROLLOUT_PLAN.md` (required fields for featured placements, subscriptions)

### LLM Provider (Z.AI or OpenAI)
- Default: `LLM_PROVIDER=zai` (Z.AI) with `ZAI_API_KEY` and `ZAI_BASE_URL=https://api.z.ai/api/paas/v4`
- Fallback: `LLM_PROVIDER=openai` with `OPENAI_API_KEY` and `OPENAI_BASE_URL`
- Timeouts & retries configured in `src/lib/llm.ts`; graceful fallback to deterministic rules on unavailability
- Used for emergency triage LLM mode, moderation flags, weekly digest summaries

### Supabase (Postgres + Auth + Edge Functions)
- Default dev/staging: remote Supabase project (no Docker required)
- Configure `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_CONNECTION_STRING`
- Local emulation: `supabase start` (optional, for isolated testing)
- Migrations: `supabase/migrations/*` (apply with Supabase CLI or GitHub Actions)
- Schema snapshot: `supabase/schema.sql` (kept in sync by CI check "Schema vs migrations")

---

## Common Patterns & Gotchas

### Enum Validation
All enum values use runtime validators:
```ts
// In src/types/database.ts
export const isValidAgeSpecialty = (value: string): value is AgeSpecialty => {
  return ['puppies_0_6m', 'adolescent_6_18m', ...].includes(value)
}
export const validateAgeSpecialty = (value: string): AgeSpecialty => {
  if (!isValidAgeSpecialty(value)) throw new Error(`Invalid age: ${value}`)
  return value
}
// Use validateAgeSpecialty() when converting untrusted input; is* variants for type guards.
```

### Error Logging & Context
Error context now lives under `extra` payload (see `src/lib/errorLog.ts`):
```ts
logError('ABR lookup failed', {
  extra: { abn: abr_record.abn, matchScore: 0.82, reason: 'name_mismatch' }
})
```

### Feature Flags (Monetization Example)
```ts
// Server-side check (Next.js env)
if (process.env.FEATURE_MONETIZATION_ENABLED !== '1') {
  return { notFound: true }
}
// Client-side check (React)
if (process.env.NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED !== '1') {
  return <PromoteDisabled />
}
```

### Supabase Admin Client (Service Role)
Use sparingly; server-side only:
```ts
import { supabaseAdmin } from '@/lib/supabase'
// Only in Node.js contexts (API routes, scripts); never expose to client
const result = await supabaseAdmin.from('businesses').select('*')
```

---

## Common Tasks & Commands

**Search for references to a constant or function:**  
```bash
grep -r "search_trainers\|BehaviorIssue" src/ DOCS/
```

**Check schema against migrations:**  
CI job `.github/workflows/verify-launch.yml` runs this automatically; manual check:
```bash
supabase db pull  # Syncs remote schema to supabase/schema.sql
git diff supabase/schema.sql
```

**Audit ABN verification records:**  
```bash
# Local Supabase
SUPABASE_CONNECTION_STRING="..." psql \
  -c "SELECT abn, verification_status, name_match_score, last_verified_at FROM businesses WHERE abn IS NOT NULL ORDER BY last_verified_at DESC LIMIT 20;"
```

**Check for doc divergence locally:**  
```bash
python3 scripts/check_docs_divergence.py --base-ref origin/main
```

---

## When You Get Stuck

1. **Spec questions?** Start at `DOCS/blueprint_ssot_v1.1.md` (domain model, UX rules).
2. **Implementation status unclear?** Check `DOCS/IMPLEMENTATION_REALITY_MAP.md` (CONFIRMED-WORKING vs UNKNOWN grid).
3. **Launch gates?** See `DOCS/LAUNCH_READY_CHECKLIST.md` (AI-ready vs Operator-only).
4. **ABN workflow?** See `DOCS/automation/ABN-ABR-GUID_automation/` (contract, parsing, allowlists, batch runs).
5. **Monetization contract?** See `DOCS/MONETIZATION_ROLLOUT_PLAN.md` (Stripe webhook, product scope, metadata).
6. **Emergency ops?** See `DOCS/automation/OPS_RUNBOOK_EMERGENCY_VERIFICATION.md` and `operator-runbook.md`.

**Secrets & credentials:** Intentionally absent from repo. Contact maintainer for ABR GUID, Stripe keys, LLM keys, Supabase connection strings.

**CI safety:** Never commit Stripe secret keys, webhook signing secrets. Scan pattern: `sk_live_|sk_test_|whsec_`. Use `.env.local` (git-ignored) locally; CI secrets manager in production.
