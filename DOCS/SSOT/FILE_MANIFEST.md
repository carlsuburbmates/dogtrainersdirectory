# File Manifest — Canonical Post-launch Docs

**Status:** Canonical (Tier-1)  
**Version:** v1.2  
**Last Updated:** 2026-03-29

## 1. Authority tiers
- **Tier-0:** Blueprint SSOT (`00_BLUEPRINT_SSOT.md`)
- **Tier-1:** Canonical support and process docs in this folder
- **Pointer-only:** `README.md`, `README_DEVELOPMENT.md`, `supabase/LOCAL_SETUP.md` (summaries only; no contracts or procedures)
- **Tier-2+:** Non-canonical (design notes, drafts, historical) — not included here by design

## 2. Canonical set (must read)
- `00_BLUEPRINT_SSOT.md` (Tier-0)
- `01_SYSTEM_MODEL.md`
- `02_ARCHITECTURE.md`
- `03_DATA_CONTRACTS.md`
- `04_API_CONTRACTS.md`
- `05_ROUTES_AND_NAV.md`
- `06_MONETISATION.md`
- `07_AI_AUTOMATION.md`
- `08_OPS_RUNBOOK.md`
- `09_DEPLOYMENT.md`
- `10_SECURITY_AND_PRIVACY.md`
- `11_PRODUCT_CONTEXT.md`
- `12_DESIGN_SYSTEM.md`
- `FILE_MANIFEST.md`
- `CHANGE_PROTOCOL.md`
- `WORKPLAN.md`

## 3. Derived and generated references
- `DOCS/SSOT/_generated/*` are derived inventories and control snapshots.
- Generated files support implementation review and drift checks, but do not override Tier-0 or Tier-1 contract documents.

## 4. Exclusions (explicit)
The following are intentionally excluded from the post-launch canonical set:
- weekly/phase implementation diaries
- raw test output logs
- legacy rollout plans superseded by launch reality
- incident dumps (unless converted into a runbook entry)
