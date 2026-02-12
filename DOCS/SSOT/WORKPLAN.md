# Workplan (SSOT Sync) - DTD

**Status:** Canonical process (Tier-1)
**Owner:** Repo maintainers + agent
**WIP limit:** 1 active task at a time

This file is the single tasklist for syncing **frontend <-> backend <-> database <-> SSOT**.
Anything not listed here is **not worked on** (to prevent drift).

## Rules
- Every change must map to a task ID below.
- If a new issue is discovered, add it as a new task at the bottom (no inline fixes).
- Definition of done must be explicit and testable.

## Current State (as of 2026-02-12)
- Canonical repo path: `/Users/carlg/Documents/AI-Coding/New project/dogtrainersdirectorylocal`
- Working tree currently has uncommitted changes (see `git status`).

## Task List

### P0 - Stabilise Current Changes

**P0-001: Make the current working tree commit-ready**
- Scope: Only files already touched in the current working tree.
- Definition of done:
  - `npm run type-check` passes.
  - `npm run lint` passes.
  - `npm test` passes, or any failing tests are made deterministic without live-network dependencies (documented).
  - If SSOT docs were touched, `npm run docs:guard` passes.
  - No changes outside this task.
- Notes:
  - If tests require live Supabase connectivity, convert to mocks/fixtures or gated env checks.

### P1 - Hybrid SSOT (Policy + Generated Snapshots)

**P1-010: Add generated SSOT snapshots (first pass)**
- Goal: Stop drift by making implementation-derived facts generated.
- Definition of done:
  - Add `DOCS/SSOT/_generated/` with committed markdown snapshots.
  - Add `npm run ssot:refresh` (or equivalent) that regenerates snapshots.
  - CI runs refresh and fails if repo is dirty.
- Snapshots (minimum):
  - `DOCS/SSOT/_generated/routes.md` (from `src/app/**/page.tsx` + redirects + middleware)
  - `DOCS/SSOT/_generated/api.md` (from `src/app/api/**/route.ts`)
  - `DOCS/SSOT/_generated/edge_functions.md` (from `supabase/functions/**`)
  - `DOCS/SSOT/_generated/schema.md` (from migrations/schema.sql; choose one source)

**P1-011: Refactor Tier-1 docs to reference generated snapshots**
- Goal: Keep Tier-1 docs as policy/intent, not duplicated inventories.
- Definition of done:
  - `04_API_CONTRACTS.md`, `05_ROUTES_AND_NAV.md`, `09_DEPLOYMENT.md` link to `_generated/*` where appropriate.
  - Remove duplicated lists that are now generated (without changing Tier-0/Tier-1 meaning).

### P2 - Remaining Product Gaps (After Stabilisation + SSOT Enforcement)

**P2-020: Remove placeholder UX in core public journey**
- Definition of done:
  - `/triage -> /search -> /trainers/[id]` works end-to-end with consistent filters.
  - No `window.alert` placeholders in core pages.
  - All footer links resolve (no dead routes).

**P2-021: Operational visibility completeness**
- Definition of done:
  - `/admin/ai-health` uses real metrics where tables exist; otherwise shows "not instrumented yet" (no implied real-time data).

## Execution Log
- 2026-02-13: `P1-011` completed by refactoring `04_API_CONTRACTS.md`, `05_ROUTES_AND_NAV.md`, and `09_DEPLOYMENT.md` to reference `DOCS/SSOT/_generated/*` and remove duplicated endpoint/route inventories.
- 2026-02-13: `P2-020` verified complete in implementation review. Checks passed: `/triage -> /search -> /trainers/[id]` path present; no `window.alert` placeholders in core journey pages; footer legal links resolve to implemented pages.
