# Control Decisions And Handoffs

**Status:** Active log  
**Owner:** Main control chat session  
**Last Updated:** 2026-03-01

## Decision log
| Date | ID | Decision | Reason | Impact |
|---|---|---|---|---|
| 2026-02-25 | D-100 | Main control chat governs all active sessions | establish one coordination authority | prevents conflicting work streams |
| 2026-02-25 | D-101 | Single branch only (`main`) with write locks | user-defined workflow | avoids branch drift and merge confusion |
| 2026-02-25 | D-102 | Operational truth: running backend contracts, then SSOT reconciliation in same cycle | unblock frontend/backend sync and remove persistent doc drift | aligns implementation and docs cleanly |
| 2026-02-25 | D-103 | Frontend session ID registered: `019c396e-e834-7472-9063-53c74c12b078` | explicit ownership and traceability | controlled handoff + lane accountability |
| 2026-02-25 | D-104 | Backend handoff `S-210` accepted with compatibility deltas | enable frontend to proceed once, without rework | frontend aligns to confirmed contract aliases |
| 2026-02-25 | D-105 | Frontend handoff `S-200` accepted | confirms caller alignment to backend deltas (`q/page`, metadata alias handling) | frontend/backend sync complete for active surfaces |
| 2026-02-25 | D-106 | Unified main-lane gates passed on combined changeset | validates merged lane state before next step | marks `S-220` and `S-230` complete |
| 2026-02-25 | D-107 | Track Playwright search spec drift as explicit follow-up | targeted e2e failed due legacy expectations, not compile/runtime break | new task `S-240` opened |
| 2026-02-25 | D-108 | Frontend handoff `S-240` accepted | Playwright search spec now matches canonical `q/page` search flow | closes cross-lane verification gap |
| 2026-03-01 | D-109 | `BC-101` accepted as complete | search auto-load now runs through a stable page-based executor and does not loop page-one requests | next active task is `BC-102` |
| 2026-03-01 | D-110 | `BC-102` and `BC-103` accepted as complete | search filter enums now resolve from shared SSOT taxonomies, and onboarding rejects invalid normalized payloads before database writes | Build Completion is closed and `PH-201` is now the active priority |
| 2026-03-01 | D-111 | `PH-201` accepted as complete | request alias parsing and dual metadata compatibility are now enforced by unit tests instead of relying on route memory | next active task is `PH-202` |
| 2026-03-01 | D-112 | `PH-202` accepted as complete | live Supabase schema now matches the repo’s required incremental migrations and remote-backed smoke runs without skips | Production Hardening is closed and `MO-301` is now the active priority |

## Lane handoff log
| Date | Lane | Task ID | Files | Verification | Result | Next |
|---|---|---|---|---|---|---|
| 2026-02-25 | main-control | G-100/G-110 | `DOCS/SSOT/_generated/CONTROL_*` | `npm run docs:guard` | pass | `S-200` frontend alignment |
| 2026-02-25 | backend | S-210 | `src/app/api/public/search/route.ts`, `src/app/api/public/autocomplete/route.ts`, `src/app/api/emergency/resources/route.ts`, `src/app/api/onboarding/route.ts`, `src/app/api/stripe/create-checkout-session/route.ts`, `supabase/functions/suburbs/index.ts` | `npm run type-check`, `npm run lint`, `npm test` | pass (with explicit compatibility deltas) | `S-200` frontend alignment |
| 2026-02-25 | frontend | S-200 | `src/app/search/page.tsx`, `src/components/SearchAutocomplete.tsx` | `npm run type-check`, `npm run lint`, targeted playwright (`search-and-trainer`) | pass for type/lint; targeted e2e failed due legacy spec drift | `S-240` update e2e spec |
| 2026-02-25 | main-control | S-220/S-230 | SSOT reconciliation check + unified verification | `npm run type-check`, `npm run lint`, `npm run test`, `npm run docs:guard`, `npm run ssot:refresh` | pass (smoke warnings only due unresolved Supabase DNS) | execute `S-240` |
| 2026-02-25 | frontend | S-240 | `tests/e2e/search-and-trainer.spec.ts` | `npx playwright test tests/e2e/search-and-trainer.spec.ts` | pass (1 passed) | consolidation / commit prep |
| 2026-03-01 | main-control | BC-101 | `src/app/search/page.tsx`, `tests/e2e/search-and-trainer.spec.ts`, `DOCS/SSOT/WORKPLAN.md`, `DOCS/SSOT/_generated/CONTROL_BACKLOG.md` | `npm run type-check`, `npx playwright test tests/e2e/search-and-trainer.spec.ts`, `npm run docs:guard` | pass | execute `BC-102` |
| 2026-03-01 | main-control | BC-102/BC-103 | `src/app/search/page.tsx`, `src/app/api/onboarding/route.ts`, `src/lib/services/onboardingPayload.ts`, `tests/unit/onboarding-payload.test.ts`, `DOCS/SSOT/WORKPLAN.md`, `DOCS/SSOT/_generated/CONTROL_BACKLOG.md` | `npm run type-check`, `npm run lint`, `npm run test`, `npx playwright test tests/e2e/search-and-trainer.spec.ts`, `npm run docs:guard` | pass | execute `PH-201` |
| 2026-03-01 | main-control | PH-201 | `src/app/api/public/search/route.ts`, `src/app/api/stripe/create-checkout-session/route.ts`, `src/lib/services/publicSearchContract.ts`, `src/lib/services/checkoutPayload.ts`, `tests/unit/public-search-contract.test.ts`, `tests/unit/checkout-payload.test.ts`, `DOCS/SSOT/WORKPLAN.md`, `DOCS/SSOT/_generated/CONTROL_BACKLOG.md` | `npm run type-check`, `npm run lint`, `npm run test`, `npm run docs:guard` | pass | execute `PH-202` |
| 2026-03-01 | backend | PH-202 | `.env.local (local-only)`, `supabase/schema.sql` | remote `psql` apply for `20251209093000`, `20260203171000`, `20260203182000`; `supabase migration repair` for `20260203171000` + `20260203182000`; `npm run schema:refresh`; `./scripts/remote_db_info.sh`; `npm run smoke` | pass (remote-backed smoke `6/6`) | execute `MO-301` |

## Required handoff template (for all sessions)
1. `Task ID:`
2. `Files touched:`
3. `Changes completed:`
4. `Verification run:`
5. `Blockers or risks:`
6. `Next intended change:`
