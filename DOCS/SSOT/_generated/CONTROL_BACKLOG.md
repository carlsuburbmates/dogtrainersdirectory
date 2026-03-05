# Control Backlog (Cross-Session Sync)

**Status:** Active  
**Owner:** Main control chat session  
**Last Updated:** 2026-03-06

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
| PH-201 | Production Hardening | Add contract/regression tests for alias handling and metadata | completed | main-control | `WORKPLAN` `PH-201` | compatibility behavior is covered by tests |
| PH-202 | Production Hardening | Restore real Supabase remote-path validation | completed | backend | `WORKPLAN` `PH-202` | remote-backed smoke paths run without DNS fallback skips |
| MO-301 | Market Optimization | Add funnel and latency instrumentation | completed | main-control | `WORKPLAN` `MO-301` | core commercial flow metrics are captured |
| MO-302 | Market Optimization | Establish baseline performance and conversion metrics | completed | main-control | `WORKPLAN` `MO-302` | baseline report exists for future optimization |
| PH-203 | Production Hardening | Restore emergency triage write compatibility with live schema | completed | backend | `WORKPLAN` `PH-203` | live triage submissions stop failing on `emergency_triage_logs` inserts |
| PH-204 | Production Hardening | Restore live public directory RPC availability | completed | backend | `WORKPLAN` `PH-204` | `search_trainers` and `get_trainer_profile` are callable in the live project again |
| PH-205 | Production Hardening | Restore minimum live directory data for end-to-end verification | completed | backend | `WORKPLAN` `PH-205` | live search returns at least one real business and `/trainers/<id>` renders via RPC |
| MO-303 | Market Optimization | Run external market scan and create the next optimization backlog | completed | main-control | `WORKPLAN` `MO-303` | market findings are converted into a prioritized optimization backlog |
| WC-301 | Website Completion | Complete the public UI/UX foundation | completed | main-control | `WORKPLAN` `WC-301` | the public experience is visually and interactionally complete enough for trust and conversion work |
| MO-304 | Website Completion | Increase public trust density on search and trainer profiles | completed | main-control | `WORKPLAN` `MO-304` | public trust signals are materially stronger before contact |
| MO-305 | Market Optimization | Build suburb and service landing-page coverage for local SEO | completed | main-control | `WORKPLAN` `MO-305` | DTD gains a repeatable local landing and metadata strategy |
| MO-306 | Website Completion | Reduce buyer friction with clearer primary conversion actions | completed | main-control | `WORKPLAN` `MO-306` | results and profiles expose a clear measurable primary CTA |
| MO-307 | Market Optimization | Expand live directory inventory depth beyond the verification fixture | completed | backend | `WORKPLAN` `MO-307` | live directory depth is no longer a one-record environment |
| MO-308 | Market Optimization | Repackage business-side monetisation around visible ROI | completed | main-control | `WORKPLAN` `MO-308` | featured placement has clear public-facing value and business messaging |
| PH-206 | Production Hardening | Restore green admin monetisation E2E verification | completed | main-control | `WORKPLAN` `PH-206` | admin monetisation flow is verifiable again in Playwright without timeout |
| PC-401 | Product Completion Recovery | Repair featured-placement monetisation to true end-to-end completeness | completed | main-control | `WORKPLAN` `PC-401` | promote checkout and admin monetisation state are truly functional in real mode |
| PC-402 | Product Completion Recovery | Unify triage emergency escalation logic | completed | frontend | `WORKPLAN` `PC-402` | triage and `EmergencyGate` share one canonical emergency mapping |
| PC-403 | Product Completion Recovery | Remove dead operator actions and broken internal affordances | completed | main-control | `WORKPLAN` `PC-403` | operator UI no longer exposes dead links to raw APIs |
| PC-404 | Product Completion Recovery | Add recovery paths for failure states | completed | frontend | `WORKPLAN` `PC-404` | core hard-stop dead ends now provide useful next-step recovery |
| PC-405 | Product Completion Recovery | Separate admin IA and chrome from the public shell | completed | main-control | `WORKPLAN` `PC-405` | admin routes render inside an operator-specific shell |
| PC-406 | Product Completion Recovery | Clean credibility and consistency debt | completed | main-control | `WORKPLAN` `PC-406` | legal dates, admin origin logic, and compatibility redirect context are aligned |
| PC-407 | Product Completion Recovery | Stabilise admin latency summaries for zero-volume windows | completed | backend | `WORKPLAN` `PC-407` | zero-volume latency windows return a stable no-data summary instead of `500` |
| NX-101 | Public Experience And State Refinement | Make triage suburb state URL-canonical and rehydratable | completed | frontend + backend | `WORKPLAN` `NX-101` | triage deep links and refresh restore suburb selection from canonical `suburbId` state without relying on snapshot fields as source of truth |
| NX-102 | Public Experience And State Refinement | Remove internal builder language from public UI | completed | frontend | `WORKPLAN` `NX-102` | public copy stops exposing phase labels and implementation wording |
| NX-103 | Public Experience And State Refinement | Hide developer-facing location controls from public search | completed | frontend | `WORKPLAN` `NX-103` | public `/search` no longer exposes lat/lng debug inputs |
| NX-104 | Public Experience And State Refinement | Improve public empty states on search and directory | completed | frontend | `WORKPLAN` `NX-104` | empty states provide actionable recovery paths instead of placeholder copy |
| NX-105 | Public Experience And State Refinement | Reduce instruction density while preserving product differentiation | completed | frontend | `WORKPLAN` `NX-105` | home and search copy become concise without losing DTD's differentiators |
| NX-106 | Public Experience And State Refinement | Make search treat `suburbId` as authoritative over location snapshots | completed | backend | `WORKPLAN` `NX-106` | search no longer depends on mutable snapshot fields for correctness when `suburbId` exists |
| DS-301 | Design System Enforcement | Establish token-driven public shell foundation | completed | frontend | `WORKPLAN` `DS-301` | core public routes share one token-driven shell baseline and readable Living Field foundation |
| DS-302 | Design System Enforcement | Standardise search interaction model (intent capsule + filter sheet) | completed | frontend | `WORKPLAN` `DS-302` | `/search` uses compact intent context and sheet-based secondary filters without contract drift |
| DS-303 | Design System Enforcement | Convert onboarding to progressive disclosure flow | completed | frontend | `WORKPLAN` `DS-303` | onboarding is staged with clear progress and preserved validation/API compatibility |
| DS-304 | Design System Enforcement | Enforce primitive discipline across public surfaces | completed | frontend | `WORKPLAN` `DS-304` | public pages use canonical primitives for reusable state and content blocks |
| DS-305 | Design System Enforcement | Calibrate emergency page to calm, urgent-first hierarchy | completed | frontend | `WORKPLAN` `DS-305` | emergency experience prioritises urgent actions while keeping safety guidance clear and non-overwhelming |
| DS-399 | Design System Enforcement | Run post-Phase 7 product experience checkpoint (`AUD-002` lite) | completed | main-control | `WORKPLAN` `DS-399` | focused post-phase audit confirms DS work improved UX quality without drifting from product/workflow goals |
| SH-401 | Experience Stability Hardening | Split directory error vs empty states | completed | frontend | `WORKPLAN` `SH-401` | `/directory` distinguishes fetch failures from true zero-inventory and exposes explicit recovery actions |
| SH-402 | Experience Stability Hardening | Harden admin queue loading against partial endpoint failure | completed | frontend + backend | `WORKPLAN` `SH-402` | `/admin` queue widgets degrade independently with stable endpoint error envelopes |
| SH-403 | Experience Stability Hardening | Align `/triage` to design-system shell and primitives | completed | frontend | `WORKPLAN` `SH-403` | `/triage` matches canonical token/primitives baseline without logic/contract drift |
| SH-404 | Experience Stability Hardening | Add explicit recovery actions to `/search` error state | completed | frontend | `WORKPLAN` `SH-404` | search error state includes direct retry and alternate recovery action |
| SH-405 | Experience Stability Hardening | Enforce 44px touch-target baseline on primary journey actions | in_progress | frontend | `WORKPLAN` `SH-405` | primary journey actions satisfy minimum touch-target baseline |
| SH-406 | Experience Stability Hardening | Remove implementation-language leakage in onboarding review copy | pending | frontend | `WORKPLAN` `SH-406` | onboarding review copy is outcome-based and non-technical |

## Current status
- `AUD-001` reopened Product Completion Recovery from verified audit findings.
- Product Completion Recovery is complete.
- Public Experience And State Refinement is complete.
- Design System Enforcement is complete.
- The next active slice is Experience Stability Hardening.
- `DOCS/SSOT/12_DESIGN_SYSTEM.md` governs the public UX tasks in this slice; it is not a separate implementation task.
- `DS-301` is an enforcement gate; `DS-302` to `DS-305` must not start until `DS-301` is accepted.
- Phase 7 non-goals are locked: no new routes, no API/schema changes, no monetisation-model changes, no SEO scope expansion.
- Current active priority: `SH-405`.

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
