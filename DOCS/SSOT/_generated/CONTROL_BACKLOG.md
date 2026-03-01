# Control Backlog (Cross-Session Sync)

**Status:** Active  
**Owner:** Main control chat session  
**Last Updated:** 2026-03-01

## Board rules
- This file tracks session execution against `DOCS/SSOT/WORKPLAN.md`; it is not a second product backlog.
- Exactly one active product implementation item should be `in_progress`.
- Product items must map directly to the active roadmap IDs in `WORKPLAN.md`.
- Completion requires evidence logged in `CONTROL_DECISIONS.md`.

## Task board
| ID | Category | Title | Status | Lane | Maps To | Done Criteria |
|---|---|---|---|---|---|---|
| G-100 | Governance | Reapply control governance pack | completed | main-control | control scope | control files exist in `DOCS/SSOT/_generated` |
| G-110 | Governance | Register active lane ownership | completed | main-control | control scope | frontend/backend/main lane scopes documented |
| BC-104 | Build Completion | Keep canonical roadmap current | completed | main-control | `WORKPLAN` `BC-104` | roadmap and tracker reflect the same phased plan |
| BC-101 | Build Completion | Fix search page pagination initialization bug | completed | frontend | `WORKPLAN` `BC-101` | URL auto-search starts at page `1` and load-more advances correctly |
| BC-102 | Build Completion | Refactor search filters to shared taxonomy constants | completed | frontend | `WORKPLAN` `BC-102` | search UI derives options from shared taxonomies |
| BC-103 | Build Completion | Harden onboarding validation after alias normalization | completed | backend | `WORKPLAN` `BC-103` | normalized required fields fail fast with deterministic `400`s |
| PH-201 | Production Hardening | Add contract/regression tests for alias handling and metadata | in_progress | main-control | `WORKPLAN` `PH-201` | compatibility behavior is covered by tests |
| PH-202 | Production Hardening | Restore real Supabase remote-path validation | pending | backend | `WORKPLAN` `PH-202` | remote-backed smoke paths run without DNS fallback skips |
| MO-301 | Market Optimization | Add funnel and latency instrumentation | pending | main-control | `WORKPLAN` `MO-301` | core commercial flow metrics are captured |
| MO-302 | Market Optimization | Establish baseline performance and conversion metrics | pending | main-control | `WORKPLAN` `MO-302` | baseline report exists for future optimization |

## Recently completed sync cycle (archived)
- `S-200`: frontend callers aligned to backend contracts
- `S-210`: backend contracts confirmed and widened with compatibility aliases
- `S-220`: SSOT reconciled to implementation without drift
- `S-230`: unified verification pass completed on `main`
- `S-240`: Playwright search e2e aligned to canonical flow

## Active lane ownership map
- `frontend` lane (`019c396e-e834-7472-9063-53c74c12b078`)
  - owned paths: `src/app/triage/**`, `src/app/search/**`, `src/components/SearchAutocomplete.tsx`, `src/components/ui/SuburbAutocomplete.tsx`
- `backend` lane (active backend session)
  - owned paths: `src/app/api/**`, `src/lib/api.ts`, `supabase/functions/**`
- `main-control` lane (this session)
  - owned paths: `DOCS/SSOT/**` and final sync verification only

## Intake row template
`| <ID> | <Category> | <Title> | pending | <Lane> | <WORKPLAN map> | <Measurable done criteria> |`
