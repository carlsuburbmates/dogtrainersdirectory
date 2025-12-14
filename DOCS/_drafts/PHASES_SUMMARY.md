# Phases Summary (Draft)

Purpose: concise status per implementation phase and immediate next steps for local sign-off.

- Phase 1 — Core (DB, Auth, Schema): COMPLETE
  - Notes: migrations present; RLS + policies verified.

- Phase 2 — Triage & Search: COMPLETE
  - Notes: Age-first triage implemented; triage wizard and homepage verified.

- Phase 3 — Directory & Profiles: COMPLETE
  - Notes: Directory browse, trainer profiles, and verified badges implemented.

- Phase 4 — Onboarding & ABN Verification: PARTIAL
  - Next steps: run ABN re-check dry-run in staging; confirm `abn_fallback_events` telemetry and fallback rate within thresholds.

- Phase 5 — Emergency Ops & Admin: COMPLETE
  - Notes: Emergency triage, verification endpoint, cron and admin dashboards confirmed.

- Phase 6 — Scraper / Data Ingestion: DEFERRED / FEATURE-FLAGGED
  - Notes: Scraper mapping to enums exists; runbook and QA sampling required before enabling.

- Phase 7 — Monetization (Stripe): DEFERRED
  - Next steps: validate staging Stripe drill, confirm `payment_audit` and resync, keep production flags OFF until governance gates.

Immediate local checklist:
1. Run `npm run smoke` and `scripts/preprod_verify.sh`; attach logs to `DOCS/launch_runs/`.
2. Verify DNS warnings (if any) and capture evidence for `DOCS/PRODUCTION_DNS_PLAN.md`.
3. Complete ABN re-check dry-run in staging and iterate until fallback rate ≤ threshold.

Contact points:
- Product/SSOT: @product-owner
- Engineering/Implementation: @eng-owner
- Ops/Launch: @ops-owner
