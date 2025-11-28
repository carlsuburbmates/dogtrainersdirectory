# Automation Checklist (aligned to phases)

Use this to wire automation tasks into `DOCS/ai_agent_execution_v2_corrected.md` during build. Update as phases complete.

## Phase 1: Backend/Data Foundations
- [ ] CI: enforce CSV counts (28 councils, 138 suburbs) and enum validation
- [ ] Add distance calculation test (Fitzroy→Brighton ~10.5 km)
- [ ] Set up logging/metrics sinks (Supabase Logflare/Sentry) and error alert hooks
- [ ] Stripe: create test Product/Price for $20 AUD featured slot (test & live), add metadata conventions (trainer_id, lga_id)
- [ ] Stripe: implement Checkout session server route + client stub for Phase 1 purchases
- [ ] Webhooks: add secure webhook endpoint(s) with signature verification and event id persistence (idempotency)
- [ ] Local dev harness: document and use the dedicated webhook test server `webhook/server_dtd.py` (port 4243, /api/webhooks/stripe-dtd) to avoid collisions with other local projects (avoid localhost:3000 tunnels)
- [ ] Tests: add integration tests that simulate Stripe CLI events (checkout.session.completed, payment_intent.succeeded) and assert webhook handling logic

## Phase 2: Triage & Search
- [ ] Instrument emergency triage classifier (branch counts, latency)
- [ ] Add disclaimer copy hooks (no SLA, best-effort) to UI
- [ ] Wire observability for search latency/errors; daily digest email

## Phase 3: Profiles & Directory
- [ ] Build moderation queues (reviews/profiles) with AI-flag + human-approve pattern
- [ ] Auto-clean/lint profile submissions (phones, missing enums)
- [ ] Surface transparency copy on reviews and profiles

## Phase 4: Onboarding & ABN (manual-only, no scraper)
- [ ] ABN fallback: auto-email + upload flow + OCR/auto-retry; daily batch review view
- [ ] Self-serve “match to ABR name” button for trainers
- [ ] Single-operator dashboard card for ABN backlog/aging

## Phase 5: Emergency & Admin
- [ ] Single-operator mode dashboard aggregating KPIs, alerts, replays (webhooks/DLQ)
- [ ] DLQ/replay UI for Stripe/webhooks/jobs (idempotent re-run)
- [ ] Emergency roster freshness: highlight >90-day-old entries; quarterly verify script
 - [ ] CI/Secrets: add CI checks to ensure STRIPE keys or webhook signing secrets are not committed to the repo; fail CI if found
 - [ ] Webhook reliability: add monitoring that fails builds or creates alerts when webhook delivery errors exceed threshold (e.g., >1% failed deliveries over 24 hours)

## Post-Launch (Flagged/Deferred)
- [ ] Scraper behind feature flag; QA sample ≥10 listings/run; confidence metrics
- [ ] Monetization flag disabled until Phase 4+ criteria met (≥50 claimed trainers, stable ABN verifications)
- [ ] Weekly automated audits: SSOT immutability, CSV checksum, ABN re-verification schedule
