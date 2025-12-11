# Automation Checklist (aligned to phases)

“This checklist tracks implementation status for Phases 1–5 and Automation Phases A–F in DOCS/ai/ai_agent_execution_v2_corrected.md.”

## Phase 1: Backend/Data Foundations
- [x] CI: enforce CSV counts (28 councils, 138 suburbs) and enum validation
- [x] Add distance calculation test (Fitzroy→Brighton ~10.5 km)
- [x] Set up logging/metrics sinks (Supabase Logflare/Sentry) and error alert hooks
- [x] Stripe: create test Product/Price for Featured Placement (test mode), add metadata conventions (trainer_id, business_id, lga_id, tier)
- [x] Stripe: implement Checkout session server route + client stub for Phase 9a purchases (feature-flagged)
- [x] Webhooks: add secure webhook endpoint(s) with signature verification and event id persistence (idempotency)
- [x] Local dev harness: document and use the dedicated webhook test server `webhook/server_dtd.py` (port 4243, /api/webhooks/stripe-dtd) to avoid collisions
- [x] Tests: add integration tests that simulate Stripe CLI events (checkout.session.completed, customer.subscription.*, invoice.payment_failed) with Playwright + Vitest coverage

## Phase 2: Triage & Search
_Status:_ Core triage + filtering experience shipped (see `DOCS/PHASE_2_FINAL_COMPLETION_REPORT.md`). Remaining tasks focus on telemetry and UX polish.
- [x] Instrument emergency triage classifier (branch counts, latency)
- [x] Add disclaimer copy hooks (no SLA, best-effort) to UI
- [ ] Wire observability for search latency/errors; daily digest email

## Phase 3: Profiles & Directory
_Status:_ Core directory + profile experiences shipped (see `DOCS/PHASE_3_FINAL_COMPLETION_REPORT.md`). Remaining tasks focus on moderation tooling.
- [x] Build moderation queues (reviews/profiles) with AI-flag + human-approve pattern
- [ ] Auto-clean/lint profile submissions (phones, missing enums)
- [ ] Surface transparency copy on reviews and profiles

## Phase 4: Onboarding & ABN (manual-only, no scraper)
_Status:_ Manual onboarding UI + ABN verification API shipped (see `DOCS/PHASE_4_FINAL_COMPLETION_REPORT.md`). Remaining items focus on ops tooling and fallbacks.
- [ ] ABN fallback: auto-email + upload flow + OCR/auto-retry; daily batch review view
- [ ] Self-serve “match to ABR name” button for trainers
- [ ] Single-operator dashboard card for ABN backlog/aging

## Phase 5: Emergency & Admin
- [x] Single-operator mode dashboard aggregating KPIs, alerts, replays (webhooks/DLQ)
- [ ] DLQ/replay UI for Stripe/webhooks/jobs (idempotent re-run)
- [x] Emergency roster freshness: highlight >90-day-old entries; quarterly verify script
- [ ] Cron wiring: schedule `/api/emergency/verify` daily + `/api/emergency/triage/weekly` (Monday 00:05 AEST) via Vercel/Supabase scheduler and document env secrets

### Candidate scheduled jobs (phase 5 ops)
- Daily Ops Digest (ready): POST `/api/admin/ops-digest` — schedule daily (example Cron: `0 23 * * *` UTC). This route calls the LLM adapter and persists `daily_ops_digests` when available.
- Daily Emergency Verification (now scheduled): POST `/api/emergency/verify` — runs daily via Vercel Cron to refresh emergency resource verification results. The route is hardened for cron usage and uses SUPABASE_SERVICE_ROLE_KEY and best-effort writes to `emergency_resource_verification_runs` and `emergency_resource_verification_events`.
- Weekly Emergency Triage Summary (now scheduled): POST `/api/emergency/triage/weekly` — runs weekly (Monday) to aggregate triage metrics into `emergency_triage_weekly_metrics` and returns a short LLM-written summary when AI is enabled.

> Note: The `ops-digest` cron has been added to `vercel.json` as a daily job, and `verify`/`triage/weekly` are also now scheduled. All scheduled jobs rely on Phase 5 tables being present in the database and `SUPABASE_SERVICE_ROLE_KEY` configured in production.

## Phase 10+: Operational Hardening (deferred)
- [ ] **DEFERRED** Stripe: DLQ + replay UI for failed webhook events (admin dashboard) — post-Phase 9c beta confirmation
- [ ] **DEFERRED** Stripe: per-council featured slot management & cap enforcement (business logic + admin UI) — post-Phase 9c beta confirmation
- [ ] **DEFERRED** CI/Secrets: add CI checks to ensure STRIPE keys or webhook signing secrets are not committed to the repo; fail CI if found — pre-Phase 9d prod rollout
- [ ] **DEFERRED** Webhook reliability: add monitoring that fails builds or creates alerts when webhook delivery errors exceed threshold (e.g., >1% failed deliveries over 24 hours) — Phase 10+ ops hardening



## Post-Launch (Flagged/Deferred)
- [x] Scraper behind feature flag `SCRAPER_ENABLED`; QA sample ≥10 listings/run and feature-gated rollout documented to keep scraping disabled until explicitly allowed in production. Confidence metrics live in `qa_run_log.json` for every batch.
- [x] AI-assisted QA for scraper: LLM compares scraped fields to source URLs/screenshots, enforces enums, flags dupes (ABN/phone/email/name+address), and fails batch if accuracy <95% or required contact fields missing, with results persisted in `qa_run_log.json` and audited against `DOCS/PHASE_1_FINAL_COMPLETION_REPORT.md`.
- [x] Human gate for flagged items; keep scraped entries unverified/unclaimed and monetization off until QA passes, with Resend notifications triggered from `/api/admin/scaffolded` approvals (see `.env.local` Resend API key for the notification webhook).
- [x] QA runner script: input (scraped JSON + source URLs/screenshots), steps (LLM field compare, enum enforcement, contact validation, dedupe), outputs (per-listing verdicts, batch accuracy, reasons), storage (run log `qa_run_log.json` with a `runs` array, sample sets, scores, duplicate buckets, and approval audit trail).
- [ ] Monetization flag disabled until Phase 4+ criteria met (≥50 claimed trainers, stable ABN verifications)
- [ ] Weekly automated audits: SSOT immutability, CSV checksum, ABN re-verification schedule
- [ ] **DEFERRED** Implement ABN fallback + re-verification automation (Automation Phase D) — Phase 5 priority
- [ ] **DEFERRED** Implement scraper backfill + AI QA (Automation Phase E) — post-Phase 9c decision