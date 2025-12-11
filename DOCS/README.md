# Documentation index

This repository keeps authoritative design and operational documents under DOCS/. High-value files stay near the root for quick discovery, with topic-specific subfolders for automation, AI, and database governance.

## Canonical SSOT Documents
The following files are the actively maintained sources of truth. Each carries an SSOT badge and changes must follow the governance steps in `DOCS/PLAN_REVIEW.md`.

- [`../README.md`](../README.md) — Product overview, scope, status, and platform-level commitments.
- [`../README_DEVELOPMENT.md`](../README_DEVELOPMENT.md) — Development workflow, environment setup, lint/type-check guidance, and remote Supabase practices.
- [`DOCS/blueprint_ssot_v1.1.md`](blueprint_ssot_v1.1.md) — Product blueprint covering domain model, enums, geography, and UX rules.
- [`DOCS/PLAN_REVIEW.md`](PLAN_REVIEW.md) — Approved implementation plan, phase readiness, and decision log.
- [`DOCS/FRONTEND_VERIFICATION_FINDINGS.md`](FRONTEND_VERIFICATION_FINDINGS.md) — Verified frontend status and required follow-ups.
- [`DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md`](automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md) — Canonical ABN lookup contract and implementation guidance.
- [`DOCS/automation/ABN-ABR-GUID_automation/ABN-Rollout-Checklist.md`](automation/ABN-ABR-GUID_automation/ABN-Rollout-Checklist.md) — Operational checklist for ABN rollout across staging and production.
- [`DOCS/automation/ABN-ABR-GUID_automation/ABN-Release-Notes.md`](automation/ABN-ABR-GUID_automation/ABN-Release-Notes.md) — Release notes capturing the ABN verification changes and required migrations.
- [`DOCS/OPS_TELEMETRY_ENHANCEMENTS.md`](OPS_TELEMETRY_ENHANCEMENTS.md) — Source of truth for performance/telemetry coverage, gaps, and the pre-prod verification workflow.
- [`DOCS/LAUNCH_READY_CHECKLIST.md`](LAUNCH_READY_CHECKLIST.md) — Mandatory go/no-go list covering pre-prod verification, telemetry status, ABN fallback thresholds, DNS/env audits, and doc guardrails.
- [`DOCS/MONETIZATION_ROLLOUT_PLAN.md`](MONETIZATION_ROLLOUT_PLAN.md) — Feature-flagged Stripe rollout plan covering schema changes, checkout/webhook/admin flows, telemetry, and launch gates.

## Archived / Conflicting Documents
These files now live under `_legacy_conflicts` for historical reference only. They carry archive banners and **must not** be used for new development work.

- [`DOCS/_legacy_conflicts/FILE_MANIFEST.md`](_legacy_conflicts/FILE_MANIFEST.md) — Legacy file manifest describing a previous cleanup snapshot.
- [`DOCS/_legacy_conflicts/FRONTEND_IMPLEMENTATION_GAP_ANALYSIS.md`](_legacy_conflicts/FRONTEND_IMPLEMENTATION_GAP_ANALYSIS.md) — Superseded gap analysis that contradicts verified frontend findings.
- [`DOCS/_legacy_conflicts/webhook_README_DTD.md`](_legacy_conflicts/webhook_README_DTD.md) — Older local webhook harness instructions replaced by current automation docs.
- [`DOCS/_legacy_conflicts/README_STRIPE_WEBHOOK.md`](_legacy_conflicts/README_STRIPE_WEBHOOK.md) — Duplicate webhook harness guidance retained for traceability.

## Doc Divergence Detector CI
The **Doc Divergence Detector** GitHub Actions workflow enforces the SSOT and archive banners. Every canonical file must include the SSOT badge, archived documents must include the archive warning, and any new or modified `DOCS/*.md` file must opt into one of those states or include the explicit opt-out comment `<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->` for neutral indices/changelogs.

## Reality & Deprecation Tracking
- [`DOCS/IMPLEMENTATION_REALITY_MAP.md`](IMPLEMENTATION_REALITY_MAP.md) captures the current verification status of frontend flows, APIs, automations, and data scripts. Only items validated via real commands/tests are marked as CONFIRMED-WORKING.
- [`DOCS/DEPRECATION_STAGING.md`](DEPRECATION_STAGING.md) lists routes/scripts flagged as legacy or placeholder components. Items stay there until governance sign-off authorises remediation or removal.
- [`DOCS/LINTING_RESTORE_PLAN.md`](LINTING_RESTORE_PLAN.md) documents the phased ESLint restoration approach (currently at L1 – lint executes locally but is not a CI gate yet).
- [`DOCS/OPS_TELEMETRY_ENHANCEMENTS.md`](OPS_TELEMETRY_ENHANCEMENTS.md) enumerates telemetry gaps (latency, failed lookups, ABN fallbacks, UI error boundaries) and the incremental fixes scheduled for production readiness.

## Folder guide

- `DOCS/automation/` — automation runbooks, cron/runbook secrets, ABN/Stripe rollouts, and operational checklists.
- `DOCS/ai/` — AI agent playbooks and AI execution guides (phase prompts and agent checklists).
- `DOCS/db/` — database-related guides and a migrations index (see `DOCS/db/MIGRATIONS_INDEX.md`).
- `DOCS/_legacy/` — archived or superseded documentation kept for traceability. Files here should include a short note when moved.
- `DOCS/_legacy_conflicts/` — quarantined conflicting/obsolete docs called out above; retained only for historical reference.

Quick links:
- DOCS blueprint: `DOCS/blueprint_ssot_v1.1.md`
- Automation checklist: `DOCS/automation/automation-checklist.md`
- AI agent playbook: `DOCS/ai/ai_agent_execution_v2_corrected.md`
- Migrations index: `DOCS/db/MIGRATIONS_INDEX.md`

This index is intentionally short — consult the canonical list above for SSOT content and the folder guide for topic discovery.
