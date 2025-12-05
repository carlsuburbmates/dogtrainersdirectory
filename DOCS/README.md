# Documentation index

This repository keeps authoritative design and operational documents under DOCS/. High-value files are kept in the root of DOCS for visibility, with topic-specific subfolders for automation, AI and DB/migrations.

Key canonical files (single-source-of-truth):

- `DOCS/blueprint_ssot_v1.1.md` — product blueprint, taxonomies, and geography SSOT (Immutable unless via RFC).
- `DOCS/FILE_MANIFEST.md` — catalogue of key docs and their purpose.

## Canonical docs (SSOT)
These files are the single source of truth (SSOT) for the project and should only be changed following the documented governance and approval process (see `DOCS/PLAN_REVIEW.md`):

- `DOCS/blueprint_ssot_v1.1.md` — Product & systems SSOT.
- `DOCS/FILE_MANIFEST.md` — Authoritative file catalogue (SSOT for doc mapping).
- `DOCS/PLAN_REVIEW.md` — Current plan and phase status (SSOT for roadmaps).
- `DOCS/PHASE_1_FINAL_COMPLETION_REPORT.md` … `DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md` — Immutable phase completion evidence (SSOT audit trail).
- `DOCS/automation/automation-checklist.md` — Ops & automation runbook (SSOT for operational steps).
- `DOCS/automation/automation_secrets.md` — Ops secret handling guidance (SSOT policy document).
- `DOCS/automation/REMOTE_DB_MIGRATIONS.md` — Remote DB runbook and safe apply (SSOT for migration runbook).
- `DOCS/automation/ABN-ABR-GUID_automation/` — ABN rollout & ABR lookups (SSOT for ABN/allowlist ops).
- `DOCS/ai/ai_agent_execution_v2_corrected.md` — AI agent playbook (SSOT for AI agent flows).
- `DOCS/ai/ai_automation_assessment.md` — AI assessment (SSOT strategic assessment).
- `DOCS/db/MIGRATIONS_INDEX.md` — Canonical migrations index (SSOT for which migrations are active/archived).
- `supabase/schema.sql` — Canonical schema snapshot (referenced in `DOCS/db/MIGRATIONS_INDEX.md`).

These files are intentionally limited in number — treat them as "locked" documents and follow the change process documented in `DOCS/PLAN_REVIEW.md` before modifying them.

Subfolders (high-level):

- `DOCS/automation/` — automation runbooks, cron/runbook secrets, ABN/Stripe rollouts, and operational checklists.
- `DOCS/ai/` — AI agent playbooks and AI execution guides (phase prompts and agent checklists).
- `DOCS/db/` — database-related guides and a migrations index (see `DOCS/db/MIGRATIONS_INDEX.md`).
- `DOCS/_legacy/` — archived or superseded documentation kept for traceability. Files here should include a short note when moved.

Quick links:
- DOCS blueprint: `DOCS/blueprint_ssot_v1.1.md`
- Manifest: `DOCS/FILE_MANIFEST.md`
- Automation checklist: `DOCS/automation/automation-checklist.md` (moved)
- AI agent playbook: `DOCS/ai/ai_agent_execution_v2_corrected.md` (moved)
- Migrations index: `DOCS/db/MIGRATIONS_INDEX.md` (added)

This index is intentionally short — see the manifest and the per-folder README files for more detail.
