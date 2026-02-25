# Control Backlog (Cross-Session Sync)

**Status:** Active  
**Owner:** Main control chat session  
**Last Updated:** 2026-02-25

## Board rules
- Exactly one item is `in_progress`.
- Product items must map to `DOCS/SSOT/WORKPLAN.md`.
- Completion requires evidence logged in `CONTROL_DECISIONS.md`.

## Task board
| ID | Category | Title | Status | Lane | Maps To | Done Criteria |
|---|---|---|---|---|---|---|
| G-100 | Governance | Reapply control governance pack | completed | main-control | control scope | control files exist in `DOCS/SSOT/_generated` |
| G-110 | Governance | Register active lane ownership | completed | main-control | control scope | frontend/backend/main lane scopes documented |
| S-200 | Sync | Frontend callers align to backend contracts | completed | frontend | `WORKPLAN` parity objective | no caller uses non-existent endpoints or mismatched payloads |
| S-210 | Sync | Backend confirms canonical request/response contract | completed | backend | `WORKPLAN` parity objective | backend handoff confirms contract stability or explicit contract deltas |
| S-220 | Sync | Reconcile SSOT to implementation without drift | completed | main-control | Tier-0/Tier-1 sync rule | SSOT text and generated snapshots match implementation |
| S-230 | Sync | Unified verification pass on `main` | completed | main-control | `P0-001` | type-check, lint, tests, docs guard, ssot refresh pass |
| S-240 | Sync | Align Playwright search e2e with canonical flow | completed | frontend | `WORKPLAN` parity objective | `tests/e2e/search-and-trainer.spec.ts` matches current `/search` behavior and passes |

## Active lane ownership map
- `frontend` lane (`019c396e-e834-7472-9063-53c74c12b078`)
  - owned paths: `src/app/triage/**`, `src/app/search/**`, `src/components/SearchAutocomplete.tsx`, `src/components/ui/SuburbAutocomplete.tsx`
- `backend` lane (active backend session)
  - owned paths: `src/app/api/**`, `src/lib/api.ts`, `supabase/functions/**`
- `main-control` lane (this session)
  - owned paths: `DOCS/SSOT/**` and final sync verification only

## Intake row template
`| <ID> | <Category> | <Title> | pending | <Lane> | <WORKPLAN map> | <Measurable done criteria> |`
