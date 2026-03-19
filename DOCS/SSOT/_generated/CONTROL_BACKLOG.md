# Control Backlog (Cross-Session Sync)

**Status:** Active  
**Owner:** Main control chat session  
**Last Updated:** 2026-03-17

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
| SH-405 | Experience Stability Hardening | Enforce 44px touch-target baseline on primary journey actions | completed | frontend | `WORKPLAN` `SH-405` | primary journey actions satisfy minimum touch-target baseline |
| SH-406 | Experience Stability Hardening | Remove implementation-language leakage in onboarding review copy | completed | frontend | `WORKPLAN` `SH-406` | onboarding review copy is outcome-based and non-technical |
| IX-501 | Integrity And SSOT Realignment | Lock down unsafe test and analytics surfaces | completed | backend | `WORKPLAN` `IX-501` | unsafe `/api/test/**` routes are operator-only outside E2E mode and `/api/trainer/dashboard` no longer fabricates analytics |
| IX-502 | Integrity And SSOT Realignment | Restore triage browser coverage and SSOT tooling sync | completed | backend + main-control | `WORKPLAN` `IX-502` | `/triage` browser coverage is present, SSOT refresh parses quoted schema correctly, and SSOT docs/generated inventories are resynchronised |
| IX-503 | Integrity And SSOT Realignment | Align `/search` display locality to canonical suburb state | completed | frontend | `WORKPLAN` `IX-503` | `/search` shows and resubmits canonical locality from `suburbId` rather than stale snapshot fields when canonical suburb state is available |
| RT-601 | Runtime Resilience | Prevent `/directory` from crashing on missing server-side Supabase env | completed | backend | `WORKPLAN` `RT-601` | `/directory` renders its bounded unavailable state instead of a server-render `500` when the Supabase admin client cannot initialise |
| RT-602 | Runtime Resilience | Harden remaining public SSR pages against uncaught Supabase admin-client failures | completed | backend | `WORKPLAN` `RT-602` | `/promote` and `/trainers/[id]` degrade to bounded UI states instead of global app errors when their first Supabase admin-client access fails |
| RT-603 | Runtime Resilience | Audit indirect public helper paths and stabilise lint output handling | completed | backend + main-control | `WORKPLAN` `RT-603` | indirect public SSR helper paths in scope are confirmed safe and `npm run lint` no longer depends on Playwright having created `test-results/` |
| AA-701 | AI Automation Definition And Rollout | Define the AI Automation programme canonically in SSOT | completed | main-control | `WORKPLAN` `AA-701` | `07_AI_AUTOMATION.md` defines actor scope, classes, safety model, auditability, non-goals, and rollout backlog |
| AA-702 | AI Automation Definition And Rollout | Establish the automation control and audit substrate | completed | backend + main-control | `WORKPLAN` `AA-702` | workflow mode resolution, audit trail, kill switches, and admin visibility exist before new actor-facing automation goes live |
| AA-703 | AI Automation Definition And Rollout | Align operator automation families to the canonical control model | completed | backend + main-control | `WORKPLAN` `AA-703` | moderation, verification, and digest workflows use shared modes, approval boundaries, and audit/rollback rules |
| AA-704 | AI Automation Definition And Rollout | Roll owner triage-to-search advisory automation in shadow mode | completed | frontend + backend | `WORKPLAN` `AA-704` | owner advisory guidance is auditable and shadow-only with no route or record side effects |
| AA-705 | AI Automation Definition And Rollout | Roll business onboarding assistance in shadow mode | completed | frontend + backend | `WORKPLAN` `AA-705` | business guidance stays draft-only and cannot publish listings or change monetisation state |
| AA-706 | AI Automation Definition And Rollout | Roll business listing-quality guidance in shadow mode | completed | frontend + backend | `WORKPLAN` `AA-706` | listing-quality guidance stays audit-only on the authenticated `/account/business/**` business-owned management surface, backed by deterministic profile maintenance, and does not change publication, verification, or monetisation outcomes |
| AA-706B | AI Automation Definition And Rollout | Roll operator scaffolded listing review guidance in shadow mode | completed | backend + main-control | `WORKPLAN` `AA-706B` | scaffold-review guidance stays operator-side, shadow-only, and does not change publication, verification, or monetisation outcomes |
| AS-801 | Supervised Automation Operations | Define the supervised automation rollout model canonically | completed | main-control | `WORKPLAN` `AS-801` | rollout states, dashboard-first supervision rules, approval rubric, and first controlled-live candidate policy are canonical before new control-plane implementation |
| AS-802 | Supervised Automation Operations | Establish the supervised rollout registry and control model | completed | backend + main-control | `WORKPLAN` `AS-802` | rollout state is represented separately from raw mode and shadow-capped workflows cannot be treated as live-ready |
| AS-803 | Supervised Automation Operations | Extend `/admin/ai-health` into the supervised rollout surface | completed | frontend + backend + main-control | `WORKPLAN` `AS-803` | operator supervision shows truthful rollout state, readiness, and rollback guidance per workflow family |
| AS-804 | Supervised Automation Operations | Add operator pause/disable and selective-enable controls | completed | backend + main-control | `WORKPLAN` `AS-804` | operators can pause or disable live-capable workflows safely and auditably without bypassing admin boundaries |
| AS-805 | Supervised Automation Operations | Add rollout verification and first controlled-live execution support | completed | backend + main-control | `WORKPLAN` `AS-805` | focused verification exists and the first controlled-live candidate can be exercised through the new control model |
| AC-901 | Controlled Live Proof And Burden Baseline | Prove `ops_digest` controlled-live readiness and rank operator burden | completed | main-control | `WORKPLAN` `AC-901` | completes the first bounded controlled-live proof review, records the initial burden ranking, and does not auto-enable `ops_digest` when evidence is insufficient |
| AC-902 | Controlled Live Proof And Burden Baseline | Capture `ops_digest` evidence and harden rollout-registry truthfulness | completed | backend + main-control | `WORKPLAN` `AC-902` | removes rollout-registry truthfulness blockers and makes non-reviewable digest fallback output explicit instead of counting it as evidence |
| AC-903 | Controlled Live Proof And Burden Baseline | Collect `ops_digest` shadow evidence and reopen live-readiness review | completed | backend + main-control | `WORKPLAN` `AC-903` | validly reports the service-role-backed evidence blocker when the local checkout cannot collect qualifying persisted shadow runs |
| AC-903B | Controlled Live Proof And Burden Baseline | Run service-role-backed digest evidence collection and reopen readiness review | completed | backend + main-control | `WORKPLAN` `AC-903B` | collects the seven-run distinct persisted shadow evidence window in a reviewable environment and confirms rollout visibility stays truthful during collection |
| AC-904 | Controlled Live Proof And Burden Baseline | Refine `ops_digest` evidence from calendar days to distinct reviewable runs | completed | backend + main-control | `WORKPLAN` `AC-904` | removes the calendar-day bottleneck without lowering the evidence bar, keeps cached reads from looking like new evidence, and preserves bounded non-live proof rules |
| AC-905 | Controlled Live Proof And Burden Baseline | Renew `ops_digest` readiness review against the completed evidence window | completed | main-control | `WORKPLAN` `AC-905` | confirms `ops_digest` is ready for bounded controlled-live approval under the distinct-run proof model, while recording that the current proof window validates deterministic fallback safety rather than successful upstream LLM output quality |
| AC-906 | Controlled Live Proof And Burden Baseline | Mark `ops_digest` ready for first controlled-live promotion decision | completed | backend + main-control | `WORKPLAN` `AC-906` | writes the explicit `shadow_live_ready` rollout state, owner, and approval reason without promoting `ops_digest` to `controlled_live` |
| AC-907 | Controlled Live Proof And Burden Baseline | Make the first controlled-live promotion decision for `ops_digest` | completed | main-control | `WORKPLAN` `AC-907` | records the explicit reject/defer decision: `ops_digest` stays below `controlled_live` until successful upstream LLM shadow output is proven, because current qualifying evidence is deterministic fallback only |
| AC-908 | Controlled Live Proof And Burden Baseline | Restore `ops_digest` upstream LLM path and collect successful-output shadow proof | completed | backend + main-control | `WORKPLAN` `AC-908` | fixes the upstream LLM request path, preserves fallback truth, and collects successful persisted shadow rows that remove the implementation-side blocker from `AC-907` |
| AC-909 | Controlled Live Proof And Burden Baseline | Review successful-output shadow proof and decide the first promotion gate | completed | main-control | `WORKPLAN` `AC-909` | approves the first bounded promotion gate because successful upstream shadow rows now exist in addition to the earlier fallback-safe proof, while carrying forward the low-activity caveat into the later observation window |
| AC-910 | Controlled Live Proof And Burden Baseline | Promote `ops_digest` from `shadow_live_ready` to `controlled_live` | completed | backend + main-control | `WORKPLAN` `AC-910` | writes the first bounded `controlled_live` promotion for `ops_digest`, persists approver and caveat metadata, and leaves the live observation window as a separate task |
| AC-911 | Controlled Live Proof And Burden Baseline | Observe the first bounded `controlled_live` window for `ops_digest` | completed | backend + main-control | `WORKPLAN` `AC-911` | captures the first live observation packet, verifies live-path truthfulness and rollback via pause, and leaves the post-observation state decision as a separate task |
| AC-912 | Controlled Live Proof And Burden Baseline | Review the first live observation packet and decide the post-observation rollout state | completed | main-control | `WORKPLAN` `AC-912` | accepts the first live observation packet and approves a later explicit resume-to-`controlled_live` execution task, while keeping the low-activity caveat explicit |
| AC-913A | Controlled Live Proof And Burden Baseline | Add the canonical paused-review resume path for `ops_digest` | completed | backend + main-control | `WORKPLAN` `AC-913A` | closes the rollout transition contract gap so an approved `paused_after_review -> controlled_live` resume can be executed through the canonical mutation path |
| AC-913 | Controlled Live Proof And Burden Baseline | Resume `ops_digest` from `paused_after_review` to bounded `controlled_live` | completed | backend + main-control | `WORKPLAN` `AC-913` | reruns the canonical resume write for `ops_digest`, restores truthful bounded live runtime state, and preserves the low-activity caveat in control and event metadata |
| AC-914 | Controlled Live Proof And Burden Baseline | Observe the resumed bounded `controlled_live` window for `ops_digest` | completed | backend + main-control | `WORKPLAN` `AC-914` | captures the next bounded live observation packet after the approved resume, verifies live-path truthfulness, and leaves the later keep-live review separate |
| AC-915 | Controlled Live Proof And Burden Baseline | Review the resumed live observation packet and decide the steady-state rollout posture for `ops_digest` | completed | main-control | `WORKPLAN` `AC-915` | keeps `ops_digest` in bounded `controlled_live` because the resumed-live packet remained truthful, bounded, and reversible, while preserving the low-activity caveat in the steady-state decision record |
| AO-912 | Operator Burden Reduction | Compress verification and ABN exception burden into one bounded operator loop | completed | backend + frontend + main-control | `WORKPLAN` `AO-912` | unifies ABN manual reviews, verification exceptions, and recent fallback context into one bounded weekly operator loop with explicit next-safe-action guidance and no automatic protected-state change |
| AO-911 | Operator Burden Reduction | Make review moderation weekly exception review actionable | completed | backend + frontend + main-control | `WORKPLAN` `AO-911` | turns `/admin/reviews` into an ordered weekly moderation loop with explicit next-safe-action guidance while keeping draft, shadow, and final moderation states visibly distinct and operator-approved |
| AO-913 | Operator Burden Reduction | Surface scaffold-review guidance at decision time while keeping approval operator-owned | completed | backend + frontend + main-control | `WORKPLAN` `AO-913` | surfaces scaffold-review shadow guidance directly on the existing operator decision surface with checklist and next-safe-action context while keeping approval and rejection explicit operator actions |
| AO-914 | Operator Burden Reduction | Re-align admin to exceptions-first and reduce dashboard noise | in_progress | backend + frontend + main-control | `WORKPLAN` `AO-914` | reduces weekly operator scanning burden by making `/admin` prioritise actionable exception loops and direct links to the resolving queue or action without widening protected state changes |

## Current status
- `AUD-001` reopened Product Completion Recovery from verified audit findings.
- Product Completion Recovery is complete.
- Public Experience And State Refinement is complete.
- Design System Enforcement is complete.
- Experience Stability Hardening is complete.
- Integrity And SSOT Realignment is complete.
- Runtime Resilience is complete.
- AI Automation Definition And Rollout is complete for the current planned slice.
- Supervised Automation Operations is complete for the current planned slice.
- Controlled Live Proof And Burden Baseline is complete for the current planned slice.
- Phase 14 - Operator Burden Reduction is now open as the next governed delivery slice.
- `AS-801` to `AS-805` are complete for the current Phase 12 control-plane slice.
- `DOCS/SSOT/12_DESIGN_SYSTEM.md` governs the public UX tasks in this slice; it is not a separate implementation task.
- `DS-301` is an enforcement gate; `DS-302` to `DS-305` must not start until `DS-301` is accepted.
- Phase 7 non-goals are locked: no new routes, no API/schema changes, no monetisation-model changes, no SEO scope expansion.
- Current active priority: `AO-914`.

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
