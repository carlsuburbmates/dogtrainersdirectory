# DOCS Consolidation Plan

Purpose
- Centralize and simplify `DOCS/` so there's one canonical source of truth (SSOT) per topic and fewer overlapping files. This plan proposes non-destructive changes (create merged artifacts, move originals to `_archive/`).

Scope
- Inventory, canonicalization, merge recommendations, archiving, and a safe PR plan. No automated deletion on `main`.

Principles
- Keep 1 SSOT per topic (architecture, release/runbooks, monetization, env/secrets, onboarding).
- Move phase reports and legacy notes into a single `PHASES_ARCHIVE.md` unless still actively referenced.
- Avoid proliferating new docs; prefer merging/annotating existing ones.
- All changes go to feature branches and PRs with human review required for merges.

Canonical documents (recommended)
- `blueprint_ssot_v1.1.md` — Architecture & UX invariants (keep as SSOT)
- `README.md` (in DOCS/) — Docs index & navigation
- `SUPABASE-QUICKSTART.md` — DB & local dev quickstart
- `MONETIZATION_ROLLOUT_PLAN.md` — Stripe/monetization SSOT
- `LAUNCH_READY_CHECKLIST.md` — Launch readiness source
- `PRODUCTION_ENV_MIGRATION.md` / `VERCEL_ENV.md` — deployment/env contract (consider merging)

Candidates for merge/archives
- Merge `PHASE_1_FINAL_COMPLETION_REPORT.md` … `PHASE_5_FINAL_COMPLETION_REPORT.md` into `PHASES_SUMMARY.md` under `implementation/` with per-phase anchors; move originals to `_archive/phases/`.
- Move `WEEK_3_*`, `WEEK4_*`, `WEEK4_IMPLEMENTATION_SUMMARY.md` into `_archive/weekly-reports/` unless active.
- Consolidate ops/runbooks: `OPS_TELEMETRY_ENHANCEMENTS.md`, `PRIORITY_3_ERROR_LOGGING_SPEC.md`, `LAUNCH_RUNS/` into `implementation/runbooks/ops.md` (draft) and archive originals.
- Keep `DOCS/STRIPE/` as-is if it contains implementation examples; add an index link from `MONETIZATION_ROLLOUT_PLAN.md`.

Minimal new files (non-destructive)
- `DOCS/FILE_MANIFEST.md` — listing canonical docs, their purpose, and location.
- `DOCS/_archive/` — store moved legacy files (do not delete originals until review).

Process (safe, non-destructive)
1. Create branch `automation/docs-consolidation`.
2. Add `DOCS/DOCS_CONSOLIDATION_PLAN.md` (this file) and `DOCS/FILE_MANIFEST.md` (template).
3. Create draft merged files in `automation/docs-consolidation` (e.g., `PHASES_SUMMARY.md`) while leaving originals in place.
4. Open PR `automation/docs-consolidation` with checklist: review merged drafts, verify no missing references, tests (link checks), then move originals to `DOCS/_archive/` in a follow-up PR if approved.
5. Do not delete or overwrite any original file on `main` without explicit human approval.

Checklist for PR reviewers
- Confirm merged content is accurate and searchable.
- Verify no lost links in site/docs nav.
- Approve archive moves only after historical validation.

Next steps (automated agent action taken)
- This plan file has been added to `DOCS/` on branch `automation/docs-consolidation`. Create the PR for review; after approval, agent can create merged artifacts and archive originals.

