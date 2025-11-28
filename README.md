# dogtrainersdirectory.com.au

Docs-first, AI-assisted directory connecting Melbourne dog owners to trainers, behaviour consultants, and emergency resources across 28 councils. Built on Next.js 14 App Router, Supabase (Postgres/Auth/Functions/Storage), and Stripe-ready (monetization deferred) with strong disclaimers (no SLAs).

## Status
- Pre-build; authoritative specs live in `/DOCS`
- Scope: Melbourne metro only; suburb-first UX; age-first triage with locked enums
- Monetization: Deferred until Phase 4+ criteria are met
- Policy: No uptime/delivery/quality guarantees; best-effort only with explicit disclaimers

## Core Features (per SSOT)
- Age-first triage (age → issue → suburb), locked enums (ages, 13 issues, 5 service types)
- Suburb-to-council mapping (28 councils, 138 suburb rows with postcode/lat/lon)
- ABN verification (GUID-based, ≥85% match), verified badge
- Emergency routing (medical vets, shelters, crisis trainers)
- Admin/moderation queues (reviews, profiles) with automation hooks
- Stripe webhooks design for featured slots + subscriptions (post-launch)

## Stack
- Next.js 14 (App Router), React (latest supported), TypeScript recommended
- Node.js v24 (dev/CI/prod)
- Supabase (Postgres, Auth, Edge Functions, Storage)
- Stripe (webhooks, idempotent handlers) — disabled until go-live criteria met
- Optional: Sentry or Logflare for observability; Resend/BYO SMTP for email; OpenAI/Anthropic for AI agent flows

## Data Sources
- `DOCS/blueprint_ssot_v1.1.md` — product/UX rules, taxonomies, geography
- `DOCS/suburbs_councils_mapping.csv` — 28 councils, 138 suburb rows with postcode/lat/lon
- `DOCS/abn_stripe_legal_integration_v5.md` — ABN + Stripe flows
- `DOCS/implementation/master_plan.md` — phased rollout, governance
- `DOCS/ai_agent_execution_v2_corrected.md` — phase prompts/checklists

## Getting Started (local)
Prereqs: `nvm install 24 && nvm use 24`, Supabase CLI, Stripe CLI (later), Yarn/PNPM/NPM.

```bash
# install deps (once code exists)
npm install

# start Supabase locally
supabase start

# run dev server (once app exists)
npm run dev

# Stripe webhook testing (when monetization enabled)
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

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
- Build single-operator mode dashboard aggregating KPIs, alerts, and action buttons in one view (admin).
- Add CI checks for CSV counts/enums and distance calculations.
- Wire automation checklist (see `docs/automation-checklist.md`) into phase prompts.

## Governance & Disclaimers
- No SLAs: no uptime/delivery/quality guarantees; best-effort only.
- Monetization stays off until Phase 4+ criteria (≥50 claimed trainers, stable ABN verifications).
- Emergency data requires periodic verification; prefer automation over manual calls.
- AI moderation: AI flags, human approves; transparency copy required in UI.
```
