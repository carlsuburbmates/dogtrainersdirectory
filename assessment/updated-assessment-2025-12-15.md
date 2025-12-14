# Updated Assessment & Prioritised Remediation (2025-12-15)

Scope: Synthesises the SSOT and verification docs to produce a baseline assessment and prioritized remediation list for launch readiness.

## Status Summary
- Core product flows (age-first triage, search, directory, emergency triage) are implemented and largely confirmed.
- Build & type-check, admin telemetry, and many backend endpoints are confirmed; some API/automation gaps remain (ABN re-check, some RPCs, LLM wrapper).
- Launch gating (DNS, production secrets, telemetry evidence, operator-only items) remains operator-controlled per `DOCS/LAUNCH_READY_CHECKLIST.md`.

## High-Priority (Blockers)
1. Env & DNS verification
   - Run `scripts/check_env_ready.sh production` and capture logs; verify DNS per `DOCS/PRODUCTION_DNS_PLAN.md`.
   - Owner: Ops. Est: 1–2h.
2. ABN verification pipeline dry-run
   - Dry-run `.github/workflows/abn-recheck.yml` and `scripts/abn_recheck.py` in staging; confirm telemetry for `abn_fallback_events`.
   - Owner: Backend/Ops. Est: 1–3h.
3. Supabase pgcrypto decryption warning
   - Investigate build-time pgcrypto warning; validate `SUPABASE_PGCRYPTO_KEY` and run a staging RPC decryption test.
   - Owner: Backend. Est: 1–2h.
4. Doc divergence & preflight
   - Run `python3 scripts/check_docs_divergence.py --base-ref origin/main` and `scripts/preprod_verify.sh` end-to-end; store artifacts in `DOCS/launch_runs/`.
   - Owner: Dev/CI. Est: 30–60m.

## Medium-Priority
1. ABN fallback upload UX or operator path
   - Provide admin/manual ABN upload UI or documented ops flow for fallback cases (~15%). Est: 4–8h.
2. Trainer dashboard auth & route dedup
   - Replace `DUMMY_BUSINESS_ID` with session-based auth; canonicalise `/trainers/[id]` vs `/trainer/[slug]` and add redirects. Est: 1–3h.
3. Onboarding `SuburbAutocomplete` fix
   - Replace numeric suburb input with `SuburbAutocomplete`. Est: 10–30m.

## Low-Priority / Post-Launch
- Featured slot purchase UI (only if monetization required now). Est: 1–2 days.
- Profile edit form (defer post-launch). Est: 4–8h.

## Technical Debt & Ops
- DB migrations parity check vs remote (run `supabase db diff --linked`). Est: 2–4h.
- LLM provider wrapper test in staging. Est: 1h.
- Playwright E2E run and snapshot validation. Est: 1–3h.

## Quick Wins
- `npm run smoke` locally and save logs to `DOCS/launch_runs/` (30m).
- Replace `DUMMY_BUSINESS_ID` (20–30m).
- Onboarding UI fix (10–30m).

## Acceptance Criteria
- Attach CLI/build/test evidence to `DOCS/launch_runs/<run>.md`.
- `scripts/preprod_verify.sh` and `python3 scripts/check_docs_divergence.py --base-ref origin/main` executed and PASS (or documented operator exceptions).
- ABN fallback rate and `abn_fallback_events` evidence captured.

