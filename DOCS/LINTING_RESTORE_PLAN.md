> **SSOT – Canonical Source of Truth**
> Scope: ESLint re-enablement roadmap
> Status: Active · Last reviewed: 2025-12-09

# Linting Restoration Plan

## Current State (L2 – CI enforced)
- `npm run lint` runs `eslint .` locally **and** is now wired into `.github/workflows/lint.yml`, which blocks pull requests (required check: “Lint (ESLint)”).
- Rule surface remains unchanged from L1; no cosmetic rules were added. Violations are treated as hard failures (`--max-warnings=0` implicit because the config already emits none).
- Tooling status is recorded in `DOCS/IMPLEMENTATION_REALITY_MAP.md` and the change log so reviewers know lint is a required CI gate again.

## L1 Baseline (captured 2025-12-09)
- **Command**: `eslint .`
- **Findings**: 6 errors / 7 warnings.
- **Top rule clusters**:
  1. `react-hooks/set-state-in-effect` (admin health dashboards, reviews placeholder, search hydration).
  2. `import/no-anonymous-default-export` (config files, abr helpers).
  3. `react-hooks/rules-of-hooks` (conditional `useMemo` in search results).
  4. `react-hooks/exhaustive-deps` (admin error dashboard).
  5. `react/no-unescaped-entities` (search empty-state copy).
- Low-signal warnings (`unused eslint-disable`) were also noted and scheduled for cleanup during this pass.

## Target State
Bring linting back in three contained phases without destabilising emergency ops:

1. **L0 – Config Introduced, No Enforcement (complete)**
   - No-op lint script + documentation only.

2. **L1 – Partial Enforcement (current phase)**
   - `npm run lint` calls `eslint .` locally.
   - Emergency/UI-critical files cleaned (admin health dashboards, search/directory/profile, Stripe webhook deps, error logging helpers).
   - No `_legacy` exclusions added; violations were fixed or justified inline.

3. **L2 – CI Gate (final phase)**
   - Once warning count is manageable, remove the no-op script, enforce lint locally, and wire `npm run lint` into CI (Doc Divergence workflow or dedicated lint job).
   - Lock `--max-warnings=0` and update SSOT docs to reflect that lint is a required gate again.

## Next Actions
- Maintain `eslint .` as the local lint script and keep a running tally of remaining rule suppressions (none outstanding after this sweep).
- Continue addressing any new `react-hooks/*` violations as they appear in emergency/admin/directory flows.
- Update `DOCS/IMPLEMENTATION_REALITY_MAP.md` whenever we advance to L2 (CI gate) or expand the rule surface.

## L1 Progress Snapshot (post-cleanup – 2025-12-09)
- **Command**: `npm run lint` → `eslint .`
- **Result**: 0 errors / 0 warnings after the targeted fixes.
- **Files touched**: admin AI health + cron dashboards, admin reviews placeholder, admin error dashboard, search results client, ABN verify route, ABR helpers, config files.
- **Rule clusters resolved**: `react-hooks/set-state-in-effect`, `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `react/no-unescaped-entities`, `import/no-anonymous-default-export`, `no-unused-vars` (eslint-disable cleanup).
- **Scope**: Entire repo except standard ignores; `_legacy` folders remain linted so regressions are visible if they are touched again.
