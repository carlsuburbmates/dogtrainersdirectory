# dogtrainersdirectory.com.au

Docs-first, AI-assisted directory connecting Melbourne dog owners to trainers, behaviour consultants, and emergency resources across 28 councils. Built on Next.js 14 App Router, Supabase (Postgres/Auth/Functions), and Stripe-ready (monetization deferred).

## Status
- Pre-build: authoritative specs live in `/DOCS`
- Scope: Melbourne metro only, suburb-first UX, age-first triage
- Monetization: deferred (Stripe plans documented, not active)
- Policy: No uptime/delivery/quality guarantees; best-effort, with clear disclaimers

## Core Features (per SSOT)
- Age-first triage (age → issue → suburb), locked enums (ages, 13 issues, 5 service types)
- Suburb-to-council mapping (28 councils, 138 suburb entries)
- ABN verification (GUID-based, ≥85% match), verified badge
- Emergency routing (medical vets, shelters, crisis trainers)
- Admin/moderation queues (reviews, profiles), automation hooks
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
Prereqs: `nvm install 24 && nvm use 24`, Supabase CLI, Stripe CLI (for later), Yarn/PNPM/NPM.

```bash
# install deps (once code exists)
npm install

# start Supabase locally
supabase start

# run dev server (once app exists)
npm run dev

# Stripe webhook testing (when monetization enabled)
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
