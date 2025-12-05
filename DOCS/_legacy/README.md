# DOCS/_legacy — archived/superseded documentation

This folder holds documentation artifacts that are intentionally kept for traceability and historical context but are **not** the active, canonical docs used day-to-day. Files under `_legacy` are read-only artifacts and should not be modified unless they are being promoted back to active DOCS via the documented governance process.

Why these live here
- Old prompts, early-phase playbooks, and webhook test harness copies were moved during the DOCS reorganisation to keep the active docs clean and discoverable.
- Items in this folder are retained for audit / archaeology purposes only.

Current groups and notes

- Old webhook harness & earlier webhook notes — moved into the automation subfolder or removed if obsolete during reorg. See `DOCS/automation/` for current webhook and Stripe runbooks.

- Old AI prompt files (phase1/phase2) — removed from root and consolidated into `DOCS/ai/` when the AI playbooks were modernised.

- Placeholder or exported SQL snapshots (kept in `supabase/migrations_archive/`):
  - `supabase/migrations_archive/20251129095232_remote_schema.sql` — this file is an empty placeholder schema export. We keep it in the migrations archive for traceability; it is NOT an active migration and should not be applied to live databases without manual review.

If you find a doc that should be promoted back into the active DOCS tree, open a PR that updates `DOCS/PLAN_REVIEW.md` and adds the justification and reviewer(s) in the PR description.
