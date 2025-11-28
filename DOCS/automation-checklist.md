# Automation Checklist (aligned to phases)

Use this to wire automation tasks into `DOCS/ai_agent_execution_v2_corrected.md` during build. Update as phases complete.

## Phase 1: Backend/Data Foundations
- [ ] CI: enforce CSV counts (28 councils, 138 suburbs) and enum validation
- [ ] Add distance calculation test (Fitzroy→Brighton ~10.5 km)
- [ ] Set up logging/metrics sinks (Supabase Logflare/Sentry) and error alert hooks

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

## Post-Launch (Flagged/Deferred)
- [ ] Scraper behind feature flag; QA sample ≥10 listings/run; confidence metrics
- [ ] Monetization flag disabled until Phase 4+ criteria met (≥50 claimed trainers, stable ABN verifications)
- [ ] Weekly automated audits: SSOT immutability, CSV checksum, ABN re-verification schedule
