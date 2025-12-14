# DOCS File Manifest (Draft)

Purpose: non-destructive manifest listing authoritative docs, owners, and intended canonical files. These drafts live in `DOCS/_drafts/` until local review and sign-off.

Canonical documents (owner / short purpose):
- `DOCS/blueprint_ssot_v1.1.md` — Product: Single Source of Truth (taxonomies, age-first rules, journeys).
- `DOCS/suburbs_councils_mapping.csv` — Data: Authoritative suburb→council mapping (28 councils).
- `DOCS/IMPLEMENTATION_REALITY_MAP.md` — Engineering: Implementation status matrix and verification notes.
- `DOCS/FRONTEND_VERIFICATION_FINDINGS.md` — Frontend: UI verification and priority fixes.
- `DOCS/LAUNCH_READY_CHECKLIST.md` — Ops/Product: Launch go/no-go checklist and runbook.
- `DOCS/MONETIZATION_ROLLOUT_PLAN.md` — Product/Finance: Stripe and monetization contract.
- `DOCS/PRODUCTION_DNS_PLAN.md` — Ops: DNS records, verification commands, and evidence checklist.
- `DOCS/automation/` — Ops/Engineering: scripts, cron, and automation runbooks.
- `README.md` (root) — Engineering: developer setup and stack overview.

Local-draft files in this folder:
- `DOCS/_drafts/FILE_MANIFEST.md` (this file)
- `DOCS/_drafts/PHASES_SUMMARY.md` — condensed phase status and next steps
- `DOCS/_drafts/REVIEW_CHECKLIST.md` — one-page checklist for local sign-off

Promotion & ownership guidelines
- To promote a draft to canonical:
  1. Update this manifest to mark the promoted file and owner.
  2. Record `PromotedBy`, `PromotedAt` (ISO timestamp) and attach verification artifacts in `DOCS/launch_runs/`.
  3. Commit promotion on branch `n1` and push; if you want CI verification before promotion, run `scripts/preprod_verify.sh` locally and attach logs.
- Ownership: always list a primary owner (team or person) next to each canonical doc in this manifest.

Notes:
- Drafts in `_drafts/` are safe to edit and will be promoted only after local sign-off.
- Keep the canonical docs untouched unless you intend to promote a replacement. Update this manifest first, then replace the canonical file.
