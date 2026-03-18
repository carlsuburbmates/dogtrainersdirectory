# Workplan (Product Delivery Roadmap) - DTD

**Status:** Canonical process (Tier-1)
**Owner:** Repo maintainers + agent
**WIP limit:** 1 active task at a time

This file is the single product backlog for finishing, hardening, and optimizing **frontend <-> backend <-> database <-> SSOT** as one unified application.
Anything not listed here is **not worked on** (to prevent drift).

## Rules
- Every change must map to a task ID below.
- Keep exactly one active product priority at a time.
- If a new issue is discovered, add it to the correct phase at the bottom (no inline fixes).
- Definition of done must be explicit and testable.

## Current State (as of 2026-03-13)
- Canonical repo path: `/Users/carlg/Documents/AI-Coding/New project/dogtrainersdirectorylocal`
- Local `main` is kept synced to `origin/main` between task commits; the `MO-302 -> PH-205` recovery cycle is complete.
- Cross-layer sync is complete: frontend callers, backend contracts, edge functions, SSOT refresh, and targeted Playwright coverage are aligned.
- Build Completion is complete.
- Production Hardening is complete.
- `PH-203` is now complete and the live triage write path is restored.
- `PH-204` is now complete and the live public directory RPC layer is restored.
- `PH-205` is now complete and the live project has a minimum controlled directory dataset for true end-to-end verification.
- Market instrumentation baseline is now in place.
- Market baseline is now documented from a controlled engineering sample against the live-backed environment.
- External competitor scan is complete and the next completion + optimization backlog is now defined from sourced market evidence.
- The public UI/UX foundation is complete, the first search-landing SEO slice is in place on the canonical `/search` route, and the live directory now has a controlled comparison baseline beyond the single verification fixture.
- The first business-side monetisation packaging pass is complete on `/promote`, and the admin monetisation E2E path is restored and green.
- `AUD-001` confirmed that the product is only partially complete: the core public experience is mostly usable, but urgent triage escalation logic is inconsistent and several operator/failure states still expose dead ends.
- Product Completion Recovery is now reopened from the audit findings; no new optimisation work should start until the recovery slice is closed.
- `PC-401` is now complete and the featured-placement flow is safely gated, schema-aligned, and operationally recoverable.
- `PC-402` is now complete and triage emergency escalation now uses one canonical issue-to-flow mapping.
- `PC-403` is now complete and the authenticated admin UI no longer exposes raw API or test-endpoint links as operator actions.
- `PC-404` is now complete and missing trainer profiles now provide explicit recovery paths instead of hard-stop dead ends.
- `PC-405` is now complete and `/admin/**` routes render inside a dedicated operator shell instead of the public marketing chrome.
- `PC-406` is now complete and the remaining credibility/consistency debt from `AUD-001` is closed.
- `PC-407` is now complete and `/api/admin/latency` returns a stable no-data summary for zero-volume windows instead of `500`.
- Product Completion Recovery is now complete for the current application-layer audited scope.
- The post-recovery public refinement slice (public language cleanup, search UX decluttering, triage suburb-state hardening) is complete.
- `DOCS/SSOT/12_DESIGN_SYSTEM.md` is now the canonical design-system reference and acts as a governing constraint for the public refinement tasks in this slice.
- Public Experience And State Refinement is complete.
- Design System Enforcement is complete.
- Experience Stability Hardening is complete.
- Integrity And SSOT Realignment is complete.
- Runtime Resilience is complete.
- `AA-701` is now complete and `DOCS/SSOT/07_AI_AUTOMATION.md` defines the canonical cross-actor AI Automation programme for DTD.
- AI Automation Definition And Rollout is complete for the current governed delivery slice.
- `AA-702` is now complete and the shared AI Automation control and audit substrate is in place for the currently connected workflow families.
- `AA-704` is now complete and owner triage-to-search advisory automation records shadow-only audit traces without changing the visible public handoff.
- `AA-705` is now complete and business onboarding assistance records shadow-only advisory traces without changing submission, publication, verification, or billing outcomes.
- `AA-706` is now complete and the first truthful business-owned post-onboarding management slice exists at `/account/business/**`, with deterministic profile maintenance and shadow-only listing-quality guidance bound to that surface.
- `AA-706B` is now complete and the existing operator scaffold-review queue path has shadow-only guidance traces without changing queue, approval, publication, verification, featured/spotlight, billing, or ranking outcomes.
- `AS-801` is now complete and the supervised automation rollout model is canonically defined before any new control-plane implementation work.
- Supervised Automation Operations is complete for the current planned slice.
- Phase 13 - Controlled Live Proof And Burden Baseline is now open as the next governed delivery slice.
- `AC-901` is now complete as a controlled-live proof review: `ops_digest` is not yet ready for bounded live approval because there is no qualifying shadow evidence window and rollout-registry truthfulness still needs hardening.
- `AC-902` is now complete and rollout-registry read failure plus non-reviewable `ops_digest` evidence paths are surfaced truthfully instead of collapsing into ordinary implicit `shadow` state.
- `AC-903` is now complete as a blocked operational evidence-collection step: this local checkout cannot collect qualifying persisted `ops_digest` shadow evidence because `SUPABASE_SERVICE_ROLE_KEY` is not configured.
- `AC-903B` is now complete: the service-role-backed digest path produced the full qualifying `ops_digest` shadow evidence window and rollout visibility remained truthful during collection.
- `AC-904` completed by refining the `ops_digest` evidence model so controlled-live proof depends on `7` distinct reviewable shadow runs rather than `7` separate calendar days, while keeping the proof bounded and reconstructable.
- `AC-905` is now complete: `ops_digest` is ready for bounded controlled-live approval because the qualifying reviewable shadow evidence window is complete, rollout visibility is truthful, and rollback controls remain explicit, but the current proof window validates deterministic fallback safety rather than successful upstream LLM output quality.
- `AC-906` is now complete: `ops_digest` has an explicit persisted rollout state of `shadow_live_ready`, with a named review owner and approval reason, while `finalRuntimeMode` remains `shadow`.
- `AC-907` is now complete: the first `controlled_live` promotion decision is deferred because approving live use now would pre-authorise upstream AI output that still has no successful shadow proof; all qualifying evidence rows remain `generated_by='deterministic'`.
- `AC-908` is now complete: the upstream `ops_digest` LLM path is restored, successful upstream shadow rows now exist (`generated_by='zai'`), and cached re-read semantics remain truthful.
- `AC-909` is now complete: the first bounded promotion gate is approved because `ops_digest` now has both fallback-safe proof and successful upstream shadow proof, although the successful-output packet still comes from low-activity snapshots and that caveat must remain visible during live observation.
- `AC-910` is now complete: `ops_digest` has been explicitly promoted from `shadow_live_ready` to `controlled_live`, with persisted approval metadata, append-only rollout-event history, and truthful live runtime resolution.
- `AC-911` is now complete: the first bounded live observation window succeeded, captured a truthful live LLM digest row, verified cached re-read semantics, and ended in `paused_after_review` after the planned primary rollback drill.
- `AC-912` is now complete: main-control accepted the first live observation packet and approved a later explicit resume-to-`controlled_live` execution task, while keeping the low-activity output caveat explicit.
- `AC-913A` is now complete: the canonical rollout transition contract now allows the reviewed `ops_digest` resume from `paused_after_review` to `controlled_live` without creating a generic paused-to-live loophole.
- `AC-913` is now complete: `ops_digest` has been explicitly resumed from `paused_after_review` to `controlled_live`, with persisted approval metadata, append-only event history, and truthful live runtime resolution.
- `AC-914` is now complete: the resumed bounded live observation window produced a truthful persisted live LLM digest row, preserved cached re-read truth, and left `ops_digest` live without any new rollout-state mutation.
- `AC-915` is now complete: main-control keeps `ops_digest` in bounded `controlled_live` because both live observation packets remained truthful, bounded, and reversible, while the low-activity output caveat stays explicit.
- Controlled Live Proof And Burden Baseline is complete for the current planned slice.
- Phase 14 - Operator Burden Reduction is now open as the next governed delivery slice.
- `AO-912` is now complete: `/admin` now presents one bounded weekly verification and ABN exception loop with explicit next-safe-action guidance, while final ABN and verification outcomes remain operator-approved.
- `AO-911` is now complete: `/admin/reviews` now runs as an ordered weekly moderation loop with explicit next-safe-action guidance, while draft, shadow, and final moderation states remain visibly distinct and operator-approved.
- Current top priority: `AO-913`.
- The current delivery sequence is:
  1. Build Completion
  2. Production Hardening
  3. Website Completion
  4. Market Optimization
  5. Product Completion Recovery
  6. Public Experience And State Refinement
  7. Design System Enforcement
  8. Experience Stability Hardening
  9. Integrity And SSOT Realignment
  10. Runtime Resilience
  11. AI Automation Definition And Rollout
  12. Supervised Automation Operations
  13. Controlled Live Proof And Burden Baseline
  14. Operator Burden Reduction

## Completed Foundation Milestones

- `P0-001`: Commit-ready baseline completed.
- `P1-010`: Generated SSOT snapshots added and drift enforcement enabled.
- `P1-011`: Tier-1 docs refactored to reference generated inventories.
- `P2-020`: Core public journey aligned (`/triage -> /search -> /trainers/[id]`).
- `P2-021`: Admin AI health instrumentation clarified and stabilized.

## Active Roadmap

### Phase 1 - Build Completion

**BC-101: Fix search page pagination initialization bug (completed 2026-03-01)**
- Purpose: remove the remaining pagination defect in `/search` after moving to page-based query semantics.
- Definition of done:
  - URL-driven auto-search starts on page `1`, not page `0`.
  - First "Load more" request advances to page `2` and does not repeat page `1`.
  - Add or update regression coverage for pagination behavior.

**BC-102: Refactor search filters to shared taxonomy constants (completed 2026-03-01)**
- Purpose: remove duplicated enum lists in the core search UI.
- Definition of done:
  - Search filter options derive from shared taxonomy constants or a single shared adapter.
  - No duplicated age/behavior/service enum lists remain in the core search UI.
  - Frontend labels remain aligned to `DOCS/SSOT/03_DATA_CONTRACTS.md`.

**BC-103: Harden onboarding validation after alias normalization (completed 2026-03-01)**
- Purpose: make onboarding fail fast and deterministically after payload alias normalization.
- Definition of done:
  - Normalized `suburbId` and `primaryService` are validated before database writes.
  - Invalid normalized payloads return deterministic `400` responses.
  - Add tests or equivalent coverage for alias handling and required-field enforcement.

**BC-104: Keep `WORKPLAN.md` current with active priorities (completed 2026-02-28)**
- Purpose: keep one canonical product roadmap and prevent parallel backlog drift.
- Definition of done:
  - This file reflects the current phased roadmap and current top priority.
  - Completed milestones remain visible without competing with active tasks.

### Phase 2 - Production Hardening

**PH-201: Add contract/regression tests for alias handling and metadata (completed 2026-03-01)**
- Purpose: lock compatibility behavior in code, not only in live memory.
- Definition of done:
  - Add regression coverage for backend alias handling (`q/query`, `page/offset`, request body aliases).
  - Add response-shape assertions for dual metadata compatibility (`hasMore` and `has_more`).
  - Coverage includes the highest-risk public contracts and checkout/onboarding paths.

**PH-202: Restore real Supabase remote-path validation (completed 2026-03-01)**
- Purpose: move from fallback-safe local verification to real environment validation.
- Definition of done:
  - `.env.local` points to a valid, DNS-resolvable Supabase project.
  - Smoke tests exercise remote-backed paths without skip/fallback warnings.
  - Remote crypto and alert-dependent checks are verified against a live project.

### Phase 3 - Website Completion

**WC-301: Complete the public UI/UX foundation (completed 2026-03-02)**
- Purpose: finish the public-facing product experience so the site is credible before broader optimization work.
- Definition of done:
  - Core public surfaces (`/`, `/triage`, `/search`, `/directory`, `/trainers/[id]`, `/emergency`, `/promote`) feel intentional, cohesive, and complete on desktop and mobile.
  - The visual hierarchy, CTA hierarchy, and information density support trust and action without relying on placeholder patterns.
  - The next trust/conversion tasks (`MO-304` and `MO-306`) can build on a stable, clearly defined UI foundation instead of compensating for unfinished UX.

**MO-304: Increase public trust density on search and trainer profiles (completed 2026-03-02)**
- Purpose: close the largest visible trust gap between DTD and market leaders.
- Definition of done:
  - Search results and trainer profiles surface stronger proof signals (for example: credentials, vetting state, review evidence, and clearer trust framing).
  - Trust signals are sourced from canonical data fields or explicit new schema-backed fields, not static copy.
  - The public user can distinguish why a listing is trustworthy before contacting the trainer.

**MO-306: Reduce buyer friction with clearer primary conversion actions (completed 2026-03-02)**
- Purpose: make the post-discovery next step as obvious and low-friction as the strongest competitors.
- Definition of done:
  - Search and trainer profile surfaces expose a clear primary next action (contact, enquiry, booking, or equivalent handoff).
  - The chosen CTA path is consistent from results to profile and measurable in telemetry.
  - Conversion friction is reduced without breaking the triage-first differentiation.

### Phase 4 - Market Optimization

**MO-301: Add funnel and latency instrumentation for core commercial flows (completed 2026-03-01)**
- Purpose: make product optimization measurable before market work starts.
- Definition of done:
  - Instrument the core flow: `triage -> search -> trainer profile -> promote checkout`.
  - Capture drop-off and latency signals in canonical telemetry paths.
  - Metrics are accessible for operational review and later market comparison.

**MO-302: Establish baseline performance and conversion metrics (completed 2026-03-01)**
- Purpose: create a measurable baseline before any growth or positioning work.
- Definition of done:
  - Record baseline latency, search responsiveness, and core conversion behavior.
  - Record known friction points in the current build.
  - Baseline is documented in canonical docs/runbooks so future optimization is comparable.

**MO-303: Run external market scan and create the next optimization backlog (completed 2026-03-02)**
- Purpose: turn the now-stable live baseline into a deliberate optimization plan instead of ad-hoc feature work.
- Definition of done:
  - Compare the current build against a defined competitor set and direct market expectations.
  - Record gaps across positioning, UX, trust signals, monetisation, and conversion flow.
  - Produce a prioritized optimization backlog that maps market findings to concrete implementation tasks.
  - Keep findings and the resulting backlog in canonical SSOT documents.

**MO-305: Build suburb and service landing-page coverage for local SEO (completed 2026-03-02)**
- Purpose: match the location/service discovery patterns used by strong directory and local trainer competitors.
- Definition of done:
  - DTD has a defined landing-page strategy for suburb/region and service-specific discovery.
  - Search metadata and structured data stop relying on placeholder location/pricing values for core search surfaces.
  - The routing and content strategy is explicit enough to support repeatable SEO and local discovery work.

**MO-307: Expand live directory inventory depth beyond the verification fixture (completed 2026-03-02)**
- Purpose: move from a technically verified live directory to a market-comparable discovery surface.
- Definition of done:
  - The live project contains more than the single controlled verification listing.
  - Coverage strategy for real listings (controlled imports, onboarding, or vetted seed path) is explicit.
  - Search depth and geography are sufficient to validate the discovery experience beyond a one-record environment.

**MO-308: Repackage business-side monetisation around visible ROI (completed 2026-03-03)**
- Purpose: align the featured-placement offer with the trust and conversion expectations seen in competitor flows.
- Definition of done:
  - The business-side promotion proposition clearly explains what extra visibility or conversion benefit is purchased.
  - Featured placement is reflected in public discovery surfaces with visible differentiation.
  - Monetisation messaging and product packaging are coherent with the public trust and conversion model.

### Phase 2 Follow-on Recovery (opened by `MO-302`)

**PH-203: Restore emergency triage write compatibility with live schema (completed 2026-03-01)**
- Purpose: fix the live `POST /api/emergency/triage` failure uncovered during the first controlled funnel baseline.
- Definition of done:
  - `POST /api/emergency/triage` no longer returns `500` for normal non-emergency submissions.
  - The route writes a schema-compatible payload into `public.emergency_triage_logs`.
  - Add regression coverage for the insert payload shape or a dedicated compatibility helper.

**PH-204: Restore live public directory RPC availability (completed 2026-03-01)**
- Purpose: re-enable the core public directory flow on the live Supabase project.
- Definition of done:
  - `public.search_trainers(...)` exists and is callable by the current search route contract.
  - `public.get_trainer_profile(...)` exists and is callable by the current trainer profile page contract.
  - `GET /api/public/search` and `GET /trainers/[id]` no longer rely on error/fallback behavior for standard live-backed requests.
  - Verify the remote PostgREST/API surface recognizes the restored RPCs.

**PH-205: Restore minimum live directory data for end-to-end verification (completed 2026-03-01)**
- Purpose: re-establish enough live business data to validate the restored directory RPC path end-to-end.
- Definition of done:
  - The live project contains at least one valid active business row with the required linked suburb/council and trainer relation data.
  - `GET /api/public/search?q=<known-term>&limit=1` can return at least one live-backed result for a controlled verification query.
  - `GET /trainers/<valid_business_id>` renders from `get_trainer_profile(...)` without falling back to the test/session fallback path.
  - The verification data source is intentional and documented (seed/import path or controlled fixture source).

**PH-206: Restore green admin monetisation E2E verification (completed 2026-03-03)**
- Purpose: close the remaining verification gap left after the first `MO-308` monetisation packaging pass.
- Definition of done:
  - `tests/e2e/monetization.spec.ts` no longer times out on the `/admin` monetisation path.
  - The admin monetisation navigation/assertion path is aligned to the current UI instead of a stale selector or stale assumption.
  - The promote-specific public assertions remain green after the admin test path is repaired.

### Phase 5 - Product Completion Recovery (opened by `AUD-001`)

**PC-401: Repair featured-placement monetisation to true end-to-end completeness (completed 2026-03-04)**
- Purpose: close the highest-severity product-completion gap by making the business-side revenue path actually work in real, non-stubbed conditions.
- Definition of done:
  - `/promote` does not expose a live upgrade CTA unless checkout can actually start with the required Stripe configuration.
  - The Stripe checkout path works in real mode or fails with an intentional, terminal, user-facing state instead of a broken CTA loop.
  - `/api/admin/monetization/overview` matches the real schema contract and returns usable data instead of a `500`.
  - The admin monetisation tab shows a terminal error state and recovery path when data fails, never a perpetual loading placeholder.

**PC-402: Unify triage emergency escalation logic (completed 2026-03-04)**
- Purpose: make every escalation-worthy triage issue follow one canonical emergency decision path.
- Definition of done:
  - The same issue mapping drives both the triage gate trigger and the `EmergencyGate` branch selection.
  - No supported issue can be classified as emergency-worthy in one layer but bypass the gate in another.
  - Regression coverage exists for each mapped emergency issue branch.

**PC-403: Remove dead operator actions and broken internal affordances (completed 2026-03-04)**
- Purpose: eliminate visible operator dead ends that make the authenticated experience feel unfinished.
- Definition of done:
  - `/admin/triage` no longer exposes a CTA that opens a raw API endpoint and yields a `405`.
  - Any remaining operator-facing test links are either converted into real tools or removed from production-like UI.
  - Admin utility actions resolve to valid pages or valid bounded actions only.

**PC-404: Add recovery paths for failure states (completed 2026-03-04)**
- Purpose: stop core user journeys from ending in hard dead ends when data is missing or a URL is stale.
- Definition of done:
  - Missing trainer profiles provide clear recovery actions back to search, directory, or home.
  - High-risk empty/error states in the core public journey provide at least one meaningful next step.
  - Recovery actions preserve useful context where practical.

**PC-405: Separate admin IA and chrome from the public shell (completed 2026-03-04)**
- Purpose: make the authenticated operator experience structurally distinct from the public marketing shell.
- Definition of done:
  - `/admin/**` routes render inside an operator-specific shell.
  - Public acquisition CTAs and public footer chrome are not shown on admin routes.
  - Admin navigation reflects operator tasks rather than public-site discovery goals.

**PC-406: Clean credibility and consistency debt (completed 2026-03-04)**
- Purpose: close the lower-severity but credibility-damaging gaps surfaced by the audit.
- Definition of done:
  - Legal pages use explicit revision dates rather than render-time dates.
  - Internal admin overview fetches use same-origin logic (or a request-derived origin) instead of hidden fallback hosts.
  - Compatibility redirects preserve query-string context where that context is still meaningful.

**PC-407: Stabilise admin latency summaries for zero-volume windows (completed 2026-03-04)**
- Purpose: stop the operator telemetry surface from throwing avoidable server errors when there is no data in the selected window.
- Definition of done:
  - `/api/admin/latency` returns a stable empty-state summary when the selected window has zero rows.
  - Zero-volume windows do not trigger SQL `division by zero` errors.
  - Admin overview and any admin latency surfaces can render a no-data state without logging a route failure.

### Phase 6 - Public Experience And State Refinement

**Phase rule**
- `NX-102` to `NX-105` must comply with `DOCS/SSOT/12_DESIGN_SYSTEM.md`.
- Public refinement work in this phase should not introduce new visual patterns or debug-oriented controls outside the canonical design-system rules.

**NX-101: Make triage suburb state URL-canonical and rehydratable (completed 2026-03-05)**
- Purpose: remove the split source of truth between triage URL params and in-memory suburb selection.
- Definition of done:
  - `suburbId` is the canonical location identity in the triage URL.
  - If the current frontend cannot rehydrate from `suburbId` alone, the required supporting lookup path is added in the same task (for example: frontend service helper and, if needed, a backend suburb-by-id lookup path).
  - `/triage` rehydrates `selectedSuburb` from `suburbId` on load or URL change.
  - `/triage?step=location&suburbId=<id>&radius=<n>` restores the selected suburb without forcing re-selection.
  - `/triage?step=location&radius=<n>` still correctly presents the location step as incomplete.
  - Location snapshot fields may be used as display/cache hints only; they must not become the authoritative source of truth.
  - Add regression coverage for deep link, refresh, and back/forward behaviour.

**NX-102: Remove internal builder language from public UI (completed 2026-03-05)**
- Purpose: stop public pages from reading like product notes or implementation labels.
- Definition of done:
  - Public-facing pages no longer expose labels such as phase markers, internal routing terminology, or manual-process notes.
  - This task is limited to label and copy replacement/removal, not broader layout restructuring.
  - Headings and supporting copy use user-facing benefit language rather than system-description language.
  - Changes cover the current high-signal public surfaces: `/`, `/search`, `/directory`, and `/onboarding`.

**NX-103: Hide developer-facing location controls from public search (completed 2026-03-05)**
- Purpose: remove technical controls that make the search experience feel like a debug tool.
- Definition of done:
  - Normal public users do not see latitude/longitude inputs on `/search`.
  - Search still functions through suburb selection and the existing distance filters.
  - Any retained debug controls use an already-defined non-public development or test path; this task must not introduce a new undocumented public env toggle.
  - The visible search control set follows the design-system goal of compact, calm, mobile-first filtering.

**NX-104: Improve public empty states on search and directory (completed 2026-03-05)**
- Purpose: replace placeholder-like empty states with useful recovery and supply-side actions.
- Definition of done:
  - `/directory` empty state provides a useful explanation and at least one actionable next step.
  - Zero-result states on `/search` suggest specific recovery actions (for example: broaden distance, remove a filter, change suburb).
  - Empty states use the canonical empty-state pattern defined in `DOCS/SSOT/12_DESIGN_SYSTEM.md`.

**NX-105: Reduce instruction density while preserving product differentiation (completed 2026-03-05)**
- Purpose: keep DTD's triage/locality differentiation without making public pages read like manuals.
- Definition of done:
  - This task follows `NX-102` and focuses on restructuring or removing long instructional sections, not on relabelling already-correct copy.
  - Home and search surfaces reduce long instructional blocks in favour of concise benefit-first copy.
  - The UI still clearly communicates DTD's triage, locality, and emergency-aware differentiation.
  - Guidance is short, purposeful, and secondary to the main action path.
  - Home restores one dominant public entry path, with secondary paths demoted in line with the design-system layout rules.

**NX-106: Make search treat `suburbId` as authoritative over location snapshots (completed 2026-03-05)**
- Purpose: prevent location drift between URL snapshots and the actual selected suburb record.
- Definition of done:
  - Search correctness does not depend on `suburbName`, `postcode`, `lat`, or `lng` URL fields when `suburbId` is present.
  - When both `suburbId` and location snapshot fields are present, `suburbId` wins.
  - Any remaining location snapshot fields are treated as cache/display only, not source of truth.

### Phase 7 - Design System Enforcement

**Phase rule**
- All public UI changes in this phase must comply with `DOCS/SSOT/12_DESIGN_SYSTEM.md`.
- No ad-hoc visual patterns may be added to public surfaces; compose from canonical primitives and tokens.
- `DS-301` is an enforcement gate. `DS-302` to `DS-305` must not start until `DS-301` is explicitly accepted.

**Phase 7 non-goals**
- No new public routes or IA expansion.
- No API contract, schema, or migration changes.
- No monetisation packaging or pricing-model changes.
- No SEO scope expansion beyond already-approved route behaviour.

**Phase verification standard**
- Every `DS-*` implementation task must run: `npm run type-check`, `npm run lint`, `npm run test`.
- Every `DS-*` task touching public UI must include visual QA evidence on `/`, `/search`, `/onboarding`, and `/emergency` (desktop + mobile where the task affects layout/interaction).

**DS-301: Establish token-driven public shell foundation (completed 2026-03-05)**
- Purpose: make the public experience visually consistent and deterministic across all core routes before further page-level polish.
- Definition of done:
  - Core public routes share one token-driven shell baseline for colour, type scale, spacing, radii, and elevation.
  - The global "Living Field" environment is applied consistently without reducing readability of interactive content.
  - Motion rules respect `prefers-reduced-motion` across shell-level transitions and ambient effects.
  - A canonical token mapping is defined and applied (design token names to concrete CSS variables/classes used by the implementation).
  - A canonical primitive inventory is enforced for public UI (allowed primitives and bounded exceptions are explicit).
  - An anti-generic checklist is passed with objective criteria (avoid template hero/grid patterns, avoid default SaaS styling, preserve DTD-specific visual identity).
  - Baseline visual snapshots for `/`, `/search`, `/onboarding`, and `/emergency` are captured to prevent style drift in `DS-302` to `DS-305`.
  - The resulting shell baseline is stable enough for `DS-302` to `DS-305` to build on without reworking fundamentals.

**DS-302: Standardise search interaction model (intent capsule + filter sheet) (completed 2026-03-05)**
- Purpose: align `/search` to the canonical mobile-first interaction model with lower cognitive load.
- Definition of done:
  - `/search` exposes a compact intent summary (`Intent Capsule`) as the primary filter context.
  - Non-primary filters are moved into a filter sheet interaction instead of always-open dense control blocks.
  - The search UI continues to honour the canonical backend contract and existing URL-compatible behaviour.
  - Filter interactions remain keyboard accessible and touch-friendly.

**DS-303: Convert onboarding to progressive disclosure flow (completed 2026-03-05)**
- Purpose: reduce onboarding intimidation while preserving data quality and contract correctness.
- Definition of done:
  - `/onboarding` is organised into a staged flow (step-based or equivalent progressive disclosure) with clear progress.
  - Required fields remain explicit and validated at the correct stage boundaries.
  - Existing API contract compatibility is preserved (including current alias-normalisation expectations).
  - The page no longer presents a single overwhelming long-form wall as the primary UX.

**DS-304: Enforce primitive discipline across public surfaces (completed 2026-03-05)**
- Purpose: remove one-off content blocks and visual drift by standardising on canonical UI primitives.
- Definition of done:
  - Public pages use canonical primitives for cards, chips, badges, dividers, sheets, and state blocks (empty/loading/error).
  - One-off explanatory or decorative blocks that do not map to primitives are removed or refactored.
  - Empty/loading/error states on core public routes present consistent tone, structure, and action hierarchy.
  - Public UI remains coherent without introducing new undocumented components.

**DS-305: Calibrate emergency page to calm, urgent-first hierarchy (completed 2026-03-05)**
- Purpose: keep emergency guidance clear and urgent without overwhelming distressed users.
- Definition of done:
  - `/emergency` presents a clear urgent-first hierarchy with fast access to primary emergency actions.
  - Legal safety guidance remains present but does not dominate primary actions or form controls.
  - The emergency resource and triage inputs are simplified into a clearer progression.
  - The resulting UX remains compliant with the design-system tone (`calm`, `credible`, `authoritative`) and accessibility guardrails.

**DS-399: Run post-Phase 7 product experience checkpoint**
- Purpose: verify that Design System Enforcement improved quality without drifting from product and workflow goals.
- Definition of done:
  - A focused `AUD-002` lite checkpoint is run against public experience layers (architecture alignment, interface consistency, workflow clarity, conversion friction, and failure-state recovery).
  - Findings are severity-ranked and mapped to either follow-up backlog items or explicit acceptance.
  - No new optimisation phase starts until this checkpoint is complete.

### Phase 8 - Experience Stability Hardening

**Phase rule**
- This phase is a targeted closure pass for residual quality gaps found in `DS-399` (`AUD-002` lite).
- Keep one active implementation item at a time in this exact order (`SH-401` -> `SH-406`).
- No schema/migration or route-family expansion is allowed in this phase.

**SH-401: Split directory error vs empty states (completed 2026-03-06)**
- Purpose: prevent backend failures from appearing as zero inventory.
- Definition of done:
  - `/directory` distinguishes fetch failure from legitimate no-listing states.
  - Fetch failures show a terminal error state with explicit retry + recovery CTA(s).
  - Legitimate empty inventory keeps the existing supply/demand CTAs.

**SH-402: Harden admin queue loading against partial endpoint failure (completed 2026-03-06)**
- Purpose: stop one failing queue endpoint from collapsing `/admin` queue visibility.
- Definition of done:
  - `/api/admin/scaffolded` and related queue endpoints return stable JSON error envelopes.
  - `/admin` isolates per-endpoint failure and keeps other queue widgets visible.
  - Operator-facing error states are explicit and recoverable.

**SH-403: Align `/triage` to design-system shell and primitives (completed 2026-03-06)**
- Purpose: remove primary-journey visual drift left after Phase 7.
- Definition of done:
  - `/triage` uses the same token-driven shell baseline as other public core routes.
  - Triage sections use canonical primitives for state/content blocks.
  - Existing triage logic and URL-state contracts are preserved.

**SH-404: Add explicit recovery actions to `/search` error state (completed 2026-03-06)**
- Purpose: make failure recovery immediate and consistent with DS state-card rules.
- Definition of done:
  - `/search` error `StateCard` includes explicit retry and one alternate next-step CTA.
  - Existing surrounding controls remain unchanged.
  - No search contract changes.

**SH-405: Enforce 44px touch-target baseline on primary journey actions (completed 2026-03-06)**
- Purpose: close remaining mobile ergonomics/accessibility drift.
- Definition of done:
  - Primary journey actions meet a minimum 44px touch target.
  - `Button` sizing or call-site classes are aligned without visual regressions.
  - Accessibility checks remain green.

**SH-406: Remove implementation-language leakage in onboarding review copy (completed 2026-03-06)**
- Purpose: keep public/business-facing copy outcome-based and non-technical.
- Definition of done:
  - Onboarding review copy no longer references payload mechanics or internal flow details.
  - Messaging explains user outcome and next step in plain language.
  - No onboarding API contract changes.

### Phase 9 - Integrity And SSOT Realignment

**Phase rule**
- This phase closes cross-layer integrity drift that remained after the main product and UX completion slices.
- Keep one active implementation item at a time in this exact order (`IX-501` -> `IX-502`).
- Behaviour, coverage, and SSOT must be resynchronised in one delivery cycle before the roadmap can return to awaiting prioritisation.

**IX-501: Lock down unsafe test and analytics surfaces (completed 2026-03-06)**
- Purpose: remove public write/side-effect risk and stop fake analytics from presenting as truth.
- Definition of done:
  - Unsafe `/api/test/**` routes are operator-only outside explicit `E2E_TEST_MODE`.
  - `/api/test/seed-review` writes a schema-compatible pending review only.
  - `/api/trainer/dashboard` no longer returns fabricated business analytics.

**IX-502: Restore triage browser coverage and SSOT tooling sync (completed 2026-03-06)**
- Purpose: bring browser verification, SSOT generation, and contract/security docs back into sync with current code.
- Definition of done:
  - Playwright covers the canonical `/triage` journey, including normal handoff and one emergency branch.
  - `scripts/ssot_refresh.py` correctly parses the current quoted `supabase/schema.sql`.
  - `npm run ssot:refresh` produces accurate generated inventories again.
  - SSOT contract/security/route docs reflect the current implementation.

**IX-503: Align `/search` display locality to canonical suburb state (completed 2026-03-06)**
- Purpose: remove the remaining mismatch between canonical `suburbId` authority and the search page's displayed locality hints.
- Definition of done:
  - When `suburbId` is present, `/search` rehydrates the suburb record and uses it for displayed location state.
  - Stale snapshot fields in the URL no longer override visible locality labels or outgoing search request locality when canonical suburb state is available.
  - Browser regression coverage exists for canonical suburb rehydration on `/search`.

### Phase 10 - Runtime Resilience

**Phase rule**
- This phase closes runtime-only failure paths that bypass the intended bounded UI error states.
- Keep implementation narrow and avoid feature expansion.

**RT-601: Prevent `/directory` from crashing on missing server-side Supabase env (completed 2026-03-06)**
- Purpose: make the local/runtime failure path render the existing bounded directory unavailable state instead of a global application error.
- Definition of done:
  - Missing server-side Supabase env no longer causes `/directory` to crash with a server-render `500`.
  - `/directory` reaches its bounded failure `StateCard` when the live query cannot even start.
  - The successful live-data path remains unchanged.

**RT-602: Harden remaining public SSR pages against uncaught Supabase admin-client failures (completed 2026-03-07)**
- Purpose: extend the bounded-failure rule from `/directory` to the other public server-rendered pages that directly depend on `supabaseAdmin`.
- Definition of done:
  - `/promote` does not crash into a global app error when server-side Supabase admin-client initialisation fails.
  - `/trainers/[id]` renders a bounded unavailable state instead of a global app error when the profile or reviews load fails at the server layer.
  - Existing successful live-data paths remain unchanged.

**RT-603: Audit indirect public helper paths and stabilise lint output handling (completed 2026-03-07)**
- Purpose: confirm there are no remaining indirect public SSR helper chains that bypass bounded failure UI, and remove the tooling dependency on Playwright creating `test-results/` before lint can pass.
- Definition of done:
  - Indirect public server-side helper paths used by public pages are audited and any unsafe runtime crash paths are fixed.
  - If no additional unsafe helper chains are found, the audit result is explicitly recorded without unnecessary runtime-code changes.
  - `npm run lint` passes regardless of whether `test-results/` exists yet.

### Phase 11 - AI Automation Definition And Rollout

**Phase rule**
- This phase is governed by `DOCS/SSOT/07_AI_AUTOMATION.md`.
- Start with shared control, audit, and approval infrastructure before expanding actor-facing automation.
- Keep one active item at a time in the listed order.
- No task in this phase may change route families, schema, pricing, checkout mode, or featured/spotlight behaviour unless separately approved in SSOT.
- Any write-capable automation task must update the relevant contract, deployment, and security SSOT in the same change.

**AA-701: Define the AI Automation programme canonically in SSOT (completed 2026-03-07)**
- Purpose: redefine AI Automation as a DTD programme across dog owner, business, and admin/operator workflows before implementation work resumes.
- Definition of done:
  - `DOCS/SSOT/07_AI_AUTOMATION.md` defines actor scope, automation classes, safety model, mode handling, auditability, and non-goals in DTD-specific terms.
  - `WORKPLAN.md` opens a bounded rollout phase with ordered follow-up work.
  - Control docs reflect one active next priority after the definition slice closes.

**AA-702: Establish the automation control and audit substrate (completed 2026-03-07)**
- Purpose: implement the shared mode-resolution, kill-switch, and audit envelope required before new actor-facing automation can be trusted.
- Definition of done:
  - Global and per-workflow AI mode resolution is centralised and reusable across the in-scope workflow families.
  - Effective mode, kill-switch state, and degraded-state visibility are exposed on the operator AI-health surface for the workflow families that are wired to the substrate.
  - Structured audit events exist for shadow and live runs, including actor class, workflow family, approval state, and resulting record references.
  - Shadow mode can record evaluable traces without changing final public, business, moderation, verification, or monetisation outcomes.

**AA-703: Align operator automation families to the canonical control model (completed 2026-03-07)**
- Purpose: bring the existing operator-side AI families under one approval, audit, and rollback model before any broader rollout.
- Definition of done:
  - Moderation, verification, and digest workflows all use the shared mode-resolution and kill-switch substrate.
  - Operator-visible AI outputs clearly distinguish advisory, draft, and final approved states.
  - Externally meaningful outcomes still require operator approval and leave a reconstructable audit trail.
  - Rollback and disable procedures are explicit for each operator workflow family in scope.

**AA-704: Roll owner triage-to-search advisory automation in shadow mode (completed 2026-03-07)**
- Purpose: evaluate owner-facing automation on the core DTD public journey without changing route behaviour or writing final product state.
- Definition of done:
  - Owner-side AI output for triage-to-search handoff runs in `shadow` mode only.
  - The workflow records auditable traces tied to the owner journey and effective mode.
  - No search intent, ranking, contact action, or emergency escalation path is silently changed by the shadow run.
  - The existing deterministic `/triage -> /search` journey remains the user-visible truth.

**AA-705: Roll business onboarding assistance in shadow mode (completed 2026-03-07)**
- Purpose: evaluate business-facing assistive automation on the listing-entry path without changing publication or monetisation behaviour.
- Definition of done:
  - AI assistance for onboarding and listing-quality guidance runs in `shadow` mode only.
  - Suggested outputs remain draft-only and do not auto-submit, auto-publish, or claim verification.
  - Featured-placement, billing, and spotlight state remain fully outside the automation scope.
  - Audit traces capture the suggested guidance and no-write final outcome.

**AA-706: Roll business listing-quality guidance in shadow mode (completed 2026-03-11)**
- Purpose: implement the first truthful business-owned post-onboarding `/account/business/**` management slice and evaluate business-facing listing-quality and trust-signal guidance there without changing publication, verification, or monetisation state.
- Definition of done:
  - Listing-quality guidance runs in `shadow` mode only on the implemented `/account/business/**` business-owned management surface, not on onboarding, `/promote`, or any `/admin/**` path.
  - The route family is authenticated and business-owned: it is accessible only to the business actor managing that record, and it is distinct from operator/admin workflows.
  - The slice includes a deterministic business-owned profile-maintenance contract and completeness model before any AI guidance is attached.
  - Suggested guidance remains audit-only and does not edit a public listing or verification record.
  - Operator visibility, if surfaced, is explicit that the workflow is non-publishing and non-billing.
  - No featured, spotlight, checkout, or ranking outcome is changed by the shadow run.

**AA-706B: Roll operator scaffolded listing review guidance in shadow mode (completed 2026-03-10)**
- Purpose: evaluate operator-side scaffolded listing review guidance on the existing scaffold-review queue path without changing publication, verification, or monetisation state.
- Definition of done:
  - Guidance runs in `shadow` mode only on the existing operator scaffold-review workflow path.
  - Suggested guidance remains advisory or audit-only and does not change scaffold approval, publication, verification, featured or spotlight state, billing, or ranking.
  - Operator visibility, if surfaced, is explicit that the workflow is operator-side and non-outcome-changing.
  - The task is not labelled business-facing, because the route and approving actor are operator-side.

### Phase 12 - Supervised Automation Operations

**Phase rule**
- This phase is setup/control work only.
- It must not introduce new product automation features.
- It must not widen billing, publication, verification, moderation, ranking, or owner/business live automation boundaries without a separate Tier-0/Tier-1 SSOT change.

**AS-801: Define the supervised automation rollout model canonically (completed 2026-03-11)**
- Purpose: strengthen AI Automation canon so DTD has one explicit rollout-state model, supervision model, and approval rubric before any new control-plane implementation begins.
- Definition of done:
  - Canonical SSOT distinguishes `disabled`, `shadow`, `live`, `shadow_only`, `shadow_live_ready`, `controlled_live`, and `paused_after_review`.
  - The dashboard-first supervision model, evidence rubric, and rollback triggers are explicit in SSOT.
  - The first controlled-live candidate policy is defined canonically without changing implementation.

**AS-802: Establish the supervised rollout registry and control model (completed 2026-03-11)**
- Purpose: add the implementation substrate needed to represent rollout state separately from raw env mode and to keep shadow-capped workflows bounded.
- Definition of done:
  - DTD has one canonical implementation path for workflow rollout state separate from raw env mode.
  - Workflows capped as shadow-only cannot be represented as live-ready or live in the control surface.
  - The control model can represent `paused_after_review` without changing route/API/schema semantics beyond what SSOT allows.

**AS-803: Extend `/admin/ai-health` into the supervised rollout surface (completed 2026-03-11)**
- Purpose: make the existing AI health surface the truthful operator cockpit for rollout readiness and rollback state.
- Definition of done:
  - `/admin/ai-health` shows effective mode, rollout state, shadow-cap status, review readiness, risk/error/disagreement signals, and rollback/disable guidance per workflow family.
  - Shadow traces and actor-visible live outcomes are reported distinctly and truthfully.
  - The surface remains dashboard-first, mobile-friendly, and low-noise.

**AS-804: Add operator pause/disable and selective-enable controls (completed 2026-03-11)**
- Purpose: let operators pause or disable live-capable workflows safely and auditably without editing application logic.
- Definition of done:
  - Operators have bounded, auditable controls for pause/disable and any canonically allowed selective enablement.
  - The controls preserve admin auth boundaries and do not bypass existing approval rules.
  - Shadow-only workflows cannot be selectively enabled beyond their canonical ceiling.

**AS-805: Add rollout verification and first controlled-live execution support (completed 2026-03-11)**
- Purpose: prove the new supervision/control layer works before any broader live automation move is considered.
- Definition of done:
  - Focused verification covers rollout-state resolution, truthful supervision rendering, and rollback/disable behaviour.
  - The first controlled-live candidate policy is executable through the new supervision/control model.
  - No owner-facing or business-facing workflow moves toward live use unless the supervision prerequisites are satisfied and canon explicitly permits it.

### Phase 13 - Controlled Live Proof And Burden Baseline

**Phase rule**
- This phase is a controlled-live proof and planning baseline only.
- It must not automatically activate any workflow family.
- Any move of `ops_digest` toward `controlled_live` requires explicit operator review and acceptance under the supervised rollout rubric.

**AC-901: Prove `ops_digest` controlled-live readiness and rank operator burden**
- Primary purpose: establish controlled-live proof for `ops_digest` under the supervised rollout model without changing billing, publication, verification, moderation, ranking, or owner/business workflow outcomes.
- Secondary output: produce a workflow-family operator-burden ranking to plan the next workload-reduction phase for a one-man operator doing weekly exception review.
- Definition of done:
  - The task defines the controlled-live proof checklist and evidence expectations for `ops_digest` without enabling it automatically.
  - The task defines the operator-burden ranking rubric and records the initial ranked list of workflow families based on observed exception pressure and review effort.
  - Roadmap and control state remain coherent: exactly one active priority and no premature completion state.

**AC-902: Capture `ops_digest` evidence and harden rollout-registry truthfulness**
- Purpose: remove the exact blockers identified by `AC-901` so a later bounded controlled-live approval review can be truthful and evidence-backed.
- Definition of done:
  - A service-role-backed environment can persist and read rollout-control state for review without silently collapsing to an implicit rollout state when registry reads fail.
  - At least `7` distinct real `ops_digest` shadow runs are captured so the controlled-live evidence threshold can be evaluated truthfully.
  - `/admin/ai-health` surfaces rollout-registry read failure explicitly instead of presenting an ordinary implicit `shadow` state.
  - No workflow is automatically promoted to `controlled_live` in this task.

**AC-903: Collect `ops_digest` shadow evidence and reopen live-readiness review**
- Purpose: collect the real persisted `ops_digest` shadow evidence window required for a later bounded controlled-live approval decision.
- Definition of done:
  - At least `7` distinct persisted `daily_ops_digests` shadow runs exist in a service-role-backed environment.
  - `/admin/ai-health` reflects persisted rollout state rather than a registry-unavailable fallback during evidence review.
  - The evidence window is summarised clearly enough for a renewed explicit main-control approval or rejection decision.
  - `ops_digest` is not automatically activated to `controlled_live` in this task.

**AC-903B: Run service-role-backed digest evidence collection and reopen readiness review**
- Purpose: execute the real service-role-backed `ops_digest` shadow evidence path and then reopen the bounded readiness review with a qualifying evidence window.
- Definition of done:
  - A service-role-backed environment executes the real `POST /api/admin/ops-digest?force=true` path enough times to produce at least `7` distinct persisted `daily_ops_digests` rows with `ai_mode='shadow'`.
  - Persisted rollout-control state is reviewable during the evidence window, not merely a registry-unavailable fallback.
  - The renewed readiness review packet clearly states whether `ops_digest` is now ready or still blocked, without activating it automatically.

**AC-904: Refine `ops_digest` evidence from calendar days to distinct reviewable runs**
- Purpose: remove the artificial calendar-day bottleneck from the first controlled-live proof without lowering the evidence bar or widening `ops_digest` authority.
- Definition of done:
  - Canonical SSOT defines `ops_digest` proof as `7` distinct persisted reviewable shadow runs rather than `7` separate digest dates.
  - `daily_ops_digests` can persist multiple reviewable `ops_digest` rows for the same `digest_date` when they are separate forced review runs.
  - The digest execution path truthfully distinguishes:
    - a new distinct reviewable run
    - a cached re-read of existing evidence
    - a non-reviewable fallback result
  - No workflow is automatically promoted to `controlled_live` in this task.

**AC-905: Renew `ops_digest` readiness review against the completed evidence window**
- Purpose: reassess `ops_digest` for bounded controlled-live approval now that the qualifying reviewable shadow evidence window exists.
- Definition of done:
  - The readiness review uses the completed `ops_digest` evidence window rather than a hypothetical or partial one.
  - The review explicitly concludes either:
    - `ready for controlled-live approval`, or
    - `not ready`, with the exact remaining blocker.
  - The review confirms rollout visibility, rollback guidance, and approval boundaries still hold under the completed evidence window.
  - `ops_digest` is not automatically activated to `controlled_live` in this task.

**AC-906: Mark `ops_digest` ready for first controlled-live promotion decision**
- Purpose: record the explicit main-control approval that `ops_digest` may move from implicit `shadow` to explicit `shadow_live_ready`, while still keeping the first `controlled_live` promotion as a separate later decision.
- Definition of done:
  - Rollout registry state for `ops_digest` moves from implicit default `shadow` to explicit `shadow_live_ready` with a named review owner and approval reason.
  - `/admin/ai-health` and rollout events reflect the explicit ready-for-review state truthfully.
  - The control record states clearly that the approval is based on bounded deterministic fallback safety and control-plane correctness, not successful upstream LLM output quality.
  - `ops_digest` is not activated to `controlled_live` in this task.

**AC-907: Make the first controlled-live promotion decision for `ops_digest`**
- Purpose: perform the explicit main-control accept/reject decision on whether `ops_digest` should move from `shadow_live_ready` to `controlled_live`.
- Definition of done:
  - The decision explicitly concludes one of:
    - approve a first bounded `controlled_live` promotion, or
    - reject/defer promotion, with the exact reason recorded.
  - The decision weighs the already-accepted caveat that current proof covers deterministic fallback safety and control-plane correctness, but not successful upstream LLM digest quality.
  - No rollout-state change is performed in this task; any approved promotion is executed by a separate later task.
  - Roadmap and control state remain coherent with exactly one active priority.

**AC-908: Restore `ops_digest` upstream LLM path and collect successful-output shadow proof**
- Purpose: remove the remaining blocker identified by `AC-907` by restoring successful upstream LLM output for `ops_digest` and capturing a bounded review packet that proves live AI output quality separately from deterministic fallback safety.
- Definition of done:
  - The current upstream `404` root cause for `ops_digest` is identified and fixed, or another exact blocker is reported truthfully.
  - At least `3` distinct persisted reviewable `ops_digest` shadow runs complete with successful upstream LLM output, clearly distinguishable from deterministic fallback rows.
  - The renewed shadow evidence packet explains the difference between:
    - successful upstream LLM digest rows
    - deterministic fallback rows
    - cached re-reads
  - `ops_digest` remains below `controlled_live` in this task.

**AC-909: Review successful-output shadow proof and decide the first promotion gate**
- Purpose: reassess `ops_digest` now that successful upstream LLM shadow rows exist, and decide whether the blocker from `AC-907` is removed.
- Definition of done:
  - The review explicitly concludes one of:
    - approve the first bounded `controlled_live` promotion, or
    - defer again, with the exact blocker recorded.
  - The review uses both:
    - the fallback-safe proof already accepted in `AC-905`
    - the successful upstream shadow-output proof captured in `AC-908`
  - The review records any residual quality caveat that should remain visible during a later observation window.
  - No rollout-state change is performed in this task.

**AC-910: Promote `ops_digest` from `shadow_live_ready` to `controlled_live`**
- Purpose: perform the first explicit bounded rollout-state promotion for `ops_digest` after the approved promotion gate in `AC-909`.
- Definition of done:
  - The persisted rollout-control state for `ops_digest` changes from `shadow_live_ready` to `controlled_live`.
  - Append-only rollout-event history records the promotion with named approver and reason.
  - Runtime resolution and `/admin/ai-health` reflect `controlled_live` truthfully.
  - The recorded promotion reason includes the remaining low-activity caveat so the first observation window stays focused.
  - No other workflow family is promoted or widened in this task.

**AC-911: Observe the first bounded `controlled_live` window for `ops_digest`**
- Purpose: confirm the first live `ops_digest` window remains advisory, truthful, and reversible after the explicit `controlled_live` promotion in `AC-910`.
- Definition of done:
  - The observation packet captures one bounded live digest run with truthful runtime, rollout, and persistence evidence.
  - The packet proves the promoted rollout-control row and latest rollout-event row are visible and reconstructable before the live run review.
  - A primary rollback drill (`Pause`) is executed and verified, with `Disable` reserved for contingency or an optional second drill.
  - Live-path output, cached re-read behaviour, and post-pause disabled behaviour are all recorded truthfully.
  - The low-activity output caveat remains visible throughout the observation window.
  - No judgement about keeping or pausing live use is made in this task; that remains a separate decision step.

**AC-912: Review the first live observation packet and decide the post-observation rollout state**
- Purpose: review the `AC-911` packet and decide whether `ops_digest` should remain paused, return to `shadow`, or move toward a later explicit resume-to-`controlled_live` write.
- Definition of done:
  - Main-control reviews the full `AC-911` packet, including the live row proof, cached re-read truth, rollback drill, and post-pause behaviour.
  - The review explicitly concludes one of:
    - keep `paused_after_review`,
    - return `ops_digest` to `shadow`,
    - or approve a later explicit resume-to-`controlled_live` execution task.
  - The low-activity output caveat remains explicit in the decision record.
  - No direct rollout-state mutation is performed in this review task itself.

**AC-913: Resume `ops_digest` from `paused_after_review` to bounded `controlled_live`**
- Purpose: perform the explicit post-review resume write for `ops_digest` after the approved `AC-912` decision, without widening any other workflow.
- Definition of done:
  - The persisted rollout-control state for `ops_digest` changes from `paused_after_review` to `controlled_live`.
  - Append-only rollout-event history records the resume action with named approver and reason.
  - Runtime resolution and `/admin/ai-health` again reflect `controlled_live` truthfully.
  - The recorded resume reason carries forward the low-activity output caveat and the requirement for continued bounded observation.
  - No other workflow family is changed in this task.

**AC-913A: Add the canonical paused-review resume path for `ops_digest`**
- Purpose: close the contract gap discovered in `AC-913` so an approved `ops_digest` can legally move from `paused_after_review` back to bounded `controlled_live` through the canonical mutation path.
- Definition of done:
  - `src/lib/ai-rollouts.ts` and any SSOT/API contract text needed for coherence explicitly allow the reviewed `paused_after_review -> controlled_live` resume path for `ops_digest`.
  - The resume path preserves the same approval, audit, and append-only event requirements as the initial `shadow_live_ready -> controlled_live` promotion.
  - Runtime resolution and `/admin/ai-health` remain truthful for both `paused_after_review` and resumed `controlled_live`.
  - No one-off DB write path or boundary bypass is introduced.
  - `AC-913` can be rerun cleanly through the canonical mutation path after this task.

**AC-914: Observe the resumed bounded `controlled_live` window for `ops_digest`**
- Purpose: capture the next bounded live observation packet for `ops_digest` after the approved resume in `AC-913`, so continued live use is validated beyond the earlier rollback-drill window.
- Definition of done:
  - One bounded resumed-live digest run is captured with truthful runtime, rollout, and persistence evidence.
  - Cached re-read truth remains preserved for the resumed live row.
  - The observation records whether the resumed live cycle still behaves safely and advisories remain bounded to the operator surface.
  - The low-activity output caveat remains explicit in the packet.
  - No keep-live vs pause-after-review decision is made in this task; that remains a separate later review.

**AC-915: Review the resumed live observation packet and decide the steady-state rollout posture for `ops_digest`**
- Purpose: review the `AC-914` packet and decide whether `ops_digest` should remain in `controlled_live`, return to `paused_after_review`, or move back below live.
- Definition of done:
  - Main-control reviews the resumed-live packet, including live row proof, cached re-read truth, and current live rollout state.
  - The review explicitly concludes one of:
    - keep `controlled_live`,
    - return `ops_digest` to `paused_after_review` via a later execution task,
    - or move it back to `shadow` via a later execution task.
  - The low-activity output caveat remains explicit in the decision record.
  - No rollout-state mutation is performed in this review task itself.

### Phase 14 - Operator Burden Reduction

**Phase rule**
- This phase reduces weekly operator exception burden without widening owner, business, moderation, verification, ranking, billing, or publication automation authority.
- Any AI contribution in this phase remains bounded to advisory or internal-draft operator support unless a later SSOT task explicitly widens that boundary.
- Admin truth surfaces must stay explicit about whether output is advisory, drafted, approved, paused, disabled, or live.

**AO-912: Compress verification and ABN exception burden into one bounded operator loop**
- Purpose: reduce weekly operator effort on verification and ABN-support exceptions by surfacing one bounded admin loop with clear next-safe-action guidance while keeping final verification state operator-approved.
- Definition of done:
  - Verification and ABN-support exceptions are surfaced in one coherent operator loop rather than fragmented admin checks.
  - Any AI assistance remains advisory or internal draft only; no verification, ABN trust, or admin-access state is auto-changed.
  - The loop makes per-record next-safe action explicit enough for a one-man weekly exception review cadence.
  - `/admin/ai-health` and related audit traces continue to report the workflow truthfully, including advisory-vs-approved state and pause/disable visibility.

**AO-911: Make review moderation weekly exception review actionable**
- Purpose: reduce weekly moderation burden by surfacing one coherent operator loop with explicit next-safe-action guidance while keeping final moderation outcomes operator-approved.
- Definition of done:
  - Review moderation exceptions are surfaced in one coherent weekly operator loop rather than a raw pending queue alone.
  - Any AI contribution remains advisory or internal draft only; no review is auto-approved or auto-rejected.
  - The loop makes the next safe moderation action explicit enough for the weekly exception-review cadence.
  - `/admin/ai-health` and related audit traces continue to report draft-versus-approved state truthfully, including pause/disable visibility.

**AO-913: Surface scaffold-review guidance at decision time while keeping approval operator-owned**
- Purpose: reduce scaffold-review burden by showing bounded assistive guidance at the point of decision while keeping approval and rejection as explicit operator actions.
- Definition of done:
  - Scaffold-review guidance is visible at decision time on the existing operator surface rather than buried in background traces alone.
  - Guidance remains assistive only; scaffold approval or rejection still requires explicit operator action.
  - Audit traces and `/admin/ai-health` remain truthful about advisory output versus final operator-approved action.
  - No business-facing, publication, verification, monetisation, or ranking boundary is widened in this task.

## Execution Log
- 2026-03-19: `AO-911` completed by turning `/admin/reviews` into an explicit weekly moderation loop with ordered queue priority, visible stage labels (`Reject-ready draft`, `Approve-ready draft`, `Shadow review`, `Manual check`, `Completed`), and per-item `Next safe action` guidance derived from the existing moderation recommendation metadata. Final moderation outcomes remain explicit operator actions through the existing admin route, `/admin/ai-health` truth semantics were unchanged, and `AO-913` is now the active priority so scaffold-review burden is reduced next without breaking the agreed Phase 14 order.
- 2026-03-19: `AO-912` completed by compressing the existing ABN manual review queue, verification exceptions, and recent ABN fallback context into one bounded `Verification & ABN Weekly Loop` on `/admin`, backed by a unified `/api/admin/queues` payload with deterministic next-safe-action guidance. No verification, ABN trust, admin-access, publication, ranking, billing, moderation, or business-owned profile state was auto-changed, and the Tier-1 API/runbook text now matches the loop. `AO-911` is now the active priority so review moderation burden is reduced next without breaking the agreed Phase 14 ordering.
- 2026-03-18: `AC-915` completed as the steady-state live review decision for `ops_digest`. Main-control keeps `ops_digest` in bounded `controlled_live` because the first and resumed live observation packets both showed truthful live LLM output, truthful cached re-read behaviour, and a proven pause path without any approval-boundary breach. The low-activity output caveat remains explicit, and the operator-facing note that `emergency_accuracy_pct=0` warrants investigation remains review material rather than a contract breach. Phase 13 is now complete for the current planned slice, and `AO-912` is the next active priority to reduce weekly verification and ABN exception burden.
- 2026-03-18: `AC-914` completed as the resumed bounded live observation window for `ops_digest`. The packet captured a truthful persisted live LLM digest row (`id=32`, `ai_mode='live'`, `generated_by='zai'`, `decision_source='llm'`), preserved cached re-read truth on the same row, and left the workflow live without any new rollout-state mutation. The low-activity output caveat remains explicit, including the operator-facing note that emergency classifier accuracy at `0%` warrants review but is not itself a contract breach. `AC-915` is now the active priority to decide the steady-state rollout posture for `ops_digest`.
- 2026-03-18: `AC-913` completed by rerunning the canonical resume write after `AC-913A` aligned the rollout transition contract. `ops_digest` moved from `paused_after_review` back to `controlled_live`, the resume event history is append-only and reconstructable, and runtime truth is now live again with the low-activity caveat preserved in control metadata. `AC-914` is now the active priority to observe the resumed bounded live window before any later keep-live review.
- 2026-03-18: `AC-913A` completed by narrowing the rollout transition contract so `ops_digest` may resume from `paused_after_review` back to bounded `controlled_live` through the canonical mutation path, while preserving the existing approval, audit, and append-only event requirements. The fix remains scoped to the current `ops_digest` cycle, runtime/admin truth stayed coherent, and `AC-913` is now the active priority again for the actual resume write.
- 2026-03-18: `AC-913` completed as a blocked execution attempt. The requested resume from `paused_after_review` to `controlled_live` was rejected by the canonical mutation contract with `409` because `src/lib/ai-rollouts.ts` currently only permits `controlled_live` when the existing rollout state is `shadow_live_ready`. No rollout state changed, runtime truth remained explicit (`rolloutState='paused_after_review'`, `finalRuntimeMode='disabled'`), and `AC-913A` is now the active priority to close this contract gap before any later resume attempt.
- 2026-03-18: `AC-912` completed as the post-observation review decision. Main-control accepted the `AC-911` packet because it proved truthful live output, truthful cached re-read behaviour, a successful primary rollback drill, and bounded disabled behaviour after pause. The remaining low-activity output caveat is still material, but it is not a blocker for continued bounded live use given the operator-only advisory scope and the proven pause path. `AC-913` is now the active priority to execute the explicit resume from `paused_after_review` back to `controlled_live`.
- 2026-03-18: `AC-911` completed as the first bounded live observation window for `ops_digest`. The packet captured a truthful live LLM digest row (`id=30`, `ai_mode='live'`, `generated_by='zai'`, `decision_source='llm'`), confirmed cached re-read truth on the same row, and then executed the planned primary rollback drill to `paused_after_review`. The post-pause forced run remained truthful and bounded (`id=31`, `ai_mode='disabled'`, deterministic advisory output, no masquerading as successful AI output). `AC-912` is now the active priority to review this observation packet and decide the post-observation rollout state.
- 2026-03-18: `AC-910` completed by writing the explicit rollout transition for `ops_digest` from `shadow_live_ready` to `controlled_live` through the canonical rollout-control mutation path. Persisted control metadata now records `approved_by='main-control'`, the `AC-909` approval basis, and the remaining low-activity caveat; runtime resolution is truthful (`rolloutStateSource=persisted_control`, `rolloutState=controlled_live`, `finalRuntimeMode=live`). `AC-911` is now the active priority to observe the first bounded live window before any keep-live or pause decision.
- 2026-03-18: `AC-909` completed as an approval decision. Main-control accepted the first bounded promotion gate for `ops_digest` because the workflow now has both the earlier fallback-safe proof and multiple successful upstream shadow rows (`generated_by='zai'`) with truthful cached re-read semantics. One residual caveat remains: the successful-output packet comes from low-activity snapshots, so the first live observation window must continue to watch output usefulness and operator trust closely. `AC-910` is now the active priority to write the first explicit `controlled_live` promotion.
- 2026-03-18: `AC-908` completed by fixing the Z.AI request path in `src/lib/llm.ts`, preserving deterministic fallback behaviour, and collecting multiple successful persisted `ops_digest` shadow rows with `generated_by='zai'`. The blocker from `AC-907` is now removed at the implementation/evidence layer, and `AC-909` is now the active priority to decide the first promotion gate.
- 2026-03-18: `AC-907` completed as a defer decision, not an approval. Main-control rejected the first `controlled_live` promotion for `ops_digest` at this time because every qualifying shadow row remains `generated_by='deterministic'`, so approving `controlled_live` now would silently pre-authorise upstream AI output that still has no successful shadow proof. `AC-908` is now the active priority to restore the upstream LLM path and collect successful-output shadow evidence before any later promotion decision.
- 2026-03-17: `AC-906` completed by writing an explicit persisted rollout state of `shadow_live_ready` for `ops_digest`, with `review_owner='main-control'`, append-only rollout event history, and truthful runtime resolution (`rolloutStateSource=persisted_control`, `rolloutState=shadow_live_ready`, `finalRuntimeMode=shadow`). The deterministic-fallback caveat remains unchanged. `AC-907` is now the active priority for the first explicit promotion decision.
- 2026-03-17: `AC-905` completed as a renewed bounded readiness review. `ops_digest` is now `ready for controlled-live approval` because the distinct-run evidence threshold is met, rollout visibility remains truthful, and rollback/disable controls stay explicit and bounded. The review also recorded one material caveat: the qualifying evidence window proves deterministic fallback safety and control-plane correctness, but it does not prove successful upstream LLM digest quality because all reviewed runs fell back after upstream `404`. `AC-906` is now the active priority to record the explicit `shadow_live_ready` approval without auto-promoting to `controlled_live`.
- 2026-03-17: `AC-903B` completed after the service-role-backed digest path produced `7` distinct persisted `daily_ops_digests` shadow rows and rollout visibility remained truthful (`rolloutRegistryStatus=available`, `finalRuntimeMode=shadow`) during evidence collection. `AC-905` is now the active priority to renew the bounded readiness review without auto-activating `ops_digest`.
- 2026-03-17: `AC-904` completed by changing the `ops_digest` proof model from `7` calendar-day shadow rows to `7` distinct persisted reviewable shadow runs. `daily_ops_digests` now supports multiple separately reconstructable runs for the same `digest_date`, and cached digest reads no longer present themselves as new evidence.
- 2026-03-13: `AC-903` completed as a blocked operational evidence-collection step. The local checkout remained truthful and bounded, but it cannot collect qualifying `ops_digest` evidence because `SUPABASE_SERVICE_ROLE_KEY` is not configured, so forced digest runs remain non-persisted and non-reviewable. `AC-903B` is now the active priority to run the evidence path in a service-role-backed environment and then reopen the bounded readiness review.
- 2026-03-13: `AC-902` completed by removing the two truthfulness blockers from `AC-901`. Rollout-registry read failure is now surfaced explicitly in runtime resolution and `/admin/ai-health`, non-persisted digest fallback runs no longer masquerade as reviewable evidence, and `POST /api/admin/ops-digest` now distinguishes persisted reviewable runs from non-reviewable fallback output. `AC-903` is now the active priority to collect the real seven-run `ops_digest` shadow evidence window before any later bounded live-readiness review.
- 2026-03-13: `AC-901` completed as a controlled-live proof review. The verdict is `not ready`: accessible `daily_ops_digests` evidence was `0/7` required reviewable shadow runs at the time, so `ops_digest` could not move toward bounded live approval yet. The review also produced the first workflow-family operator-burden ranking and a narrow truthfulness fix on `/admin/ai-health` so workflow audit connectivity no longer renders as connected when a per-workflow audit query fails. `AC-902` is now the active priority to capture real digest evidence and harden rollout-registry truthfulness before any later live-approval review.
- 2026-03-12: Opened `Phase 13 - Controlled Live Proof And Burden Baseline` and set `AC-901` as the single active priority. This is a task-opening step only; it does not automatically activate `ops_digest` or widen any automation boundary.
- 2026-03-11: `AS-802` to `AS-805` completed as one bounded Phase 12 control-plane slice. DTD now has schema-backed rollout controls and append-only rollout events, rollout-aware runtime resolution layered on top of the env ceiling, admin rollout control APIs, `/admin/ai-health` as the canonical supervision surface, bounded operator pause/disable/ready-for-review/controlled-live controls, and focused verification including admin browser coverage. `ops_digest` is the only controlled-live candidate supported by the implementation, and no owner-facing or business-facing workflow gained a live path. Supervised Automation Operations is now complete for the current planned slice and the roadmap returns to awaiting the next prioritisation cycle.
- 2026-03-11: `AS-801` completed. AI Automation canon now distinguishes runtime mode from rollout state, defines the dashboard-first supervision model and approval/evidence rubric for controlled live use, and opens `Phase 12 - Supervised Automation Operations` with `AS-802` as the active priority. No implementation surfaces or approval boundaries were widened in this docs-only task.
- 2026-03-11: `AA-706` accepted as complete after correction. The generated SSOT inventories now include `/account/business`, `/account/business/[businessId]`, and `PATCH /api/account/business/[businessId]`, so the implemented route/API surface is in sync with canon. The first truthful business-owned post-onboarding management slice is now complete, with deterministic profile maintenance and shadow-only listing-quality guidance on the owned save path. AI Automation Definition And Rollout is now complete for the current planned slice and the roadmap returns to awaiting prioritisation.
- 2026-03-11: `AA-706-CORRECTION` refreshed `DOCS/SSOT/_generated/routes.md` and `DOCS/SSOT/_generated/api.md` so the new `/account/business/**` route family and `PATCH /api/account/business/[businessId]` are present in generated SSOT inventory. Control state was restored to the truthful unaccepted position: `AA-706` remains the single active priority pending main-control acceptance, and the roadmap does not advance to awaiting prioritisation yet.
- 2026-03-10: `AA-706` completed by implementing `/account/business` and `/account/business/[businessId]` as the first truthful business-owned post-onboarding management slice, adding the bounded `PATCH /api/account/business/[businessId]` owned-record update contract, and attaching deterministic completeness scoring plus shadow-only listing-quality audit traces on the business-owned save path. Publication, verification, scaffold review, featured or spotlight state, billing, checkout, and ranking outcomes remain unchanged. AI Automation Definition And Rollout is now complete for the current planned slice and the roadmap returns to awaiting prioritisation.
- 2026-03-10: `AA-706C` canonised the future business-owned post-onboarding management surface as the planned authenticated `/account/business/**` route family. `AA-706` remains the single active priority and now explicitly binds to that future business-owned surface rather than a vague existing record path.
- 2026-03-10: Control-state correction applied for `AA-706B`. The operator scaffold-review shadow implementation remains the current active priority pending main-control acceptance; `AA-706` remains pending future business-facing work on a genuine business-owned path, and no `AA-707` is opened.
- 2026-03-10: `AA-706B` completed by attaching a shadow-only operator scaffold-review guidance trace to the existing deterministic `/api/admin/scaffolded` queue path. The workflow remains operator-side throughout, audit traces are recorded via `latency_metrics.metadata.operatorScaffoldReviewGuidance`, and scaffold approval, publication, verification, featured/spotlight, billing, and ranking outcomes remain unchanged. `AA-706` is now the active priority again as the pending future business-facing listing-quality slice.
- 2026-03-07: `AA-706A` corrected the roadmap by reopening `AA-706` as not accepted. The attempted implementation was rejected because it attached a business-labelled workflow to `/api/admin/scaffolded`, which is an operator scaffold-review path. Canonical scope now keeps business listing-quality guidance reserved for a genuine business-owned route, and opens `AA-706B` as the next active implementation task for operator-side scaffolded listing review guidance.
- 2026-03-07: `AA-705` completed by attaching a shadow-only business onboarding assistance trace to the existing deterministic `/api/onboarding` submission path. The visible onboarding validation gates, submission payload semantics, publication state, verification state, featured or spotlight state, and billing outcomes remain deterministic; shadow advisory traces are stored in `latency_metrics.metadata`, and `/admin/ai-health` now reports the workflow explicitly as shadow-only and non-outcome-changing. `AA-706` is now the active priority.
- 2026-03-07: `AA-704` completed by attaching a shadow-only owner triage-to-search advisory trace to the existing deterministic `/api/emergency/triage` handoff path. The visible `/triage -> /search` journey, search params, search results, ranking, and emergency escalation behaviour remain deterministic; audit metadata now records owner handoff advisory candidates and `/admin/ai-health` summarises those traces explicitly as non-user-visible shadow output. `AA-705` is now the active priority.
- 2026-03-07: `AA-703` completed by aligning the existing operator automation families to one canonical control model. Review moderation now records draft-only recommendations and preserves the final operator action as a separate audit state instead of auto-applying review publication changes; ops digest shadow mode now records candidate summaries without replacing the visible deterministic digest; `/admin/reviews`, `/api/admin/reviews/*`, the admin overview digest card, and `/admin/ai-health` now distinguish advisory output, draft recommendations, final operator actions, and workflow-specific rollback/disable paths. `AA-704` is now the active priority.
- 2026-03-07: `AA-702` completed by centralising AI mode resolution into one shared substrate, wiring structured audit envelopes into the existing triage, moderation, digest, and verification workflow storage paths, and updating `/admin/ai-health` to show effective mode, kill-switch state, and degraded visibility for the connected workflow families. Shadow-mode traces now record without changing final public or moderation outcomes. `AA-703` is now the active priority.
- 2026-03-07: `AA-701` completed by rewriting `DOCS/SSOT/07_AI_AUTOMATION.md` from a narrow modes-and-pipelines note into the canonical DTD AI Automation programme definition. The new canon now covers owner-facing, business-facing, and operator-facing workflow scope; advisory/assistive/write-capable classes; `disabled`/`shadow`/`live` mode semantics; approval boundaries; kill switches; audit requirements; and explicit non-goals. Phase 11 is now open with `AA-702` as the next active priority.
- 2026-03-07: `RT-603` completed by auditing the indirect server-side helper chains used by public pages and confirming the in-scope public SSR helper paths were already bounded after `RT-601` and `RT-602`. No additional runtime code changes were required. The remaining tooling annoyance was fixed by explicitly ignoring `test-results/**` in ESLint config so `npm run lint` no longer depends on Playwright having already created that directory.
- 2026-03-07: `RT-602` completed by auditing the remaining public server-rendered pages that directly use `supabaseAdmin` and hardening the unsafe ones. `/promote` now catches admin-client/query initialisation failures in `loadBusiness()` and degrades to its existing bounded UI, while `/trainers/[id]` now separates success, missing, and failure states so runtime failures render an explicit unavailable state instead of a global app error. Focused unit coverage was added for both pages and runtime browser verification confirmed the bounded unavailable state on `/trainers/[id]` under missing-env conditions.
- 2026-03-06: `RT-601` completed by wrapping the `/directory` Supabase RPC call in a bounded failure path so missing server-side Supabase env now renders the intended unavailable `StateCard` instead of a global application error. Focused unit coverage was added, and browser smoke verification confirmed `/directory` now returns `200` with the bounded failure state under missing-env local runtime conditions.
- 2026-03-06: `IX-503` completed by making `/search` rehydrate and display locality from canonical `suburbId` rather than stale URL snapshot fields, while preserving current search contracts. Browser-level regression coverage now locks canonical suburb rehydration and request construction on the search page.
- 2026-03-06: `IX-502` completed by adding browser-level Playwright coverage for the canonical `/triage` journey, fixing `scripts/ssot_refresh.py` to parse quoted `supabase/schema.sql`, rerunning `npm run ssot:refresh`, and synchronising the affected SSOT contract, route, and security documents to the current implementation. Phase 9 (`IX-501` to `IX-502`) is now complete and the roadmap is awaiting the next prioritisation cycle.
- 2026-03-06: `IX-501` completed by locking down unsafe `/api/test/**` surfaces to operators or explicit `E2E_TEST_MODE`, making `/api/test/seed-review` write a schema-compatible pending review only, and replacing fabricated `/api/trainer/dashboard` analytics with an honest unavailable/partial-metrics contract. `IX-502` is now the active priority.
- 2026-03-06: `SH-406` completed by replacing onboarding review-step implementation-language copy with user-outcome wording while preserving form logic, validation, submit contract, and route behaviour. Phase 8 (`SH-401` to `SH-406`) is now complete and the roadmap is awaiting the next prioritisation cycle.
- 2026-03-06: `SH-405` completed by enforcing a 44px touch-target baseline through systemic button sizing (`sm`/`md`/`lg`/`icon`) and patching remaining primary journey anchor/Link CTAs that were below minimum target size. Behaviour and contracts remained unchanged. `SH-406` is now the active priority.
- 2026-03-06: `SH-404` completed by adding explicit recovery actions to the `/search` error `StateCard` while preserving existing error title/description and request contracts: users can now retry the current search directly or switch to guided triage. Both actions are touch-friendly (44px minimum). `SH-405` is now the active priority.
- 2026-03-06: `SH-403` completed by refactoring `/triage` onto the canonical public shell and DS primitive baseline (`Capsule`, `Card`, `Field`, `Chip`, `Badge`, `Divider`, `StateCard`) while preserving step flow, URL-state contract (`step`, `age`, `issues`, `suburbId`, `radius`), emergency escalation behaviour, and submit handoff to `/search`. Primary action targets remain at least 44px. `SH-404` is now the active priority.
- 2026-03-06: `SH-402` completed by replacing fail-fast queue loading on `/admin` with per-endpoint resilient loading and recoverable degraded states, and by standardising `/api/admin/scaffolded` handled-failure envelopes to always return predictable JSON (`success`, `error`, optional `message`, and stable `scaffolded` list shape). Queue surfaces now degrade independently instead of collapsing when one endpoint fails. `SH-403` is now the active priority.
- 2026-03-06: `SH-401` completed by refactoring `/directory` data loading to return an explicit success/failure result shape instead of coercing fetch failures to empty inventory, and by adding a terminal failure `StateCard` with direct recovery actions (`Reload directory`, `Search trainers`). True empty-success inventory behaviour and existing featured/verified/rating ordering remained unchanged. `SH-402` is now the active priority.
- 2026-03-05: `DS-399` (`AUD-002` lite) completed with a `Partial` verdict. The post-phase checkpoint confirmed strong improvements from `DS-301` to `DS-305`, then opened a targeted closure slice for six residual gaps (directory error-vs-empty, admin queue resilience, triage DS alignment, search error recovery actions, touch-target baseline, and onboarding implementation-language cleanup). `SH-401` is now the active priority.
- 2026-03-05: `DS-305` completed by restructuring `/emergency` into an urgent-first hierarchy with immediate action CTAs, demoted-but-visible safety guidance, explicit Step 1 (resource lookup) and Step 2 (triage guidance) progression, and consistent DS primitive-based empty/error/retry states. Endpoint contracts and triage logic remained unchanged, and independent verification passed (`type-check`, `lint`, `test`, and Playwright emergency coverage). `DS-399` is now the active priority.
- 2026-03-05: `DS-304` completed by introducing canonical token-driven UI primitives (`Card`, `Field`, `Chip`, `Badge`, `Divider`, `Sheet`, `Capsule`, `StateCard`) and refactoring the core public surfaces (`/`, `/search`, `/directory`, `/emergency`, `/trainers/[id]`, and missing-trainer fallback) to use consistent primitive composition and bounded empty/error state patterns. Verification remained green (`type-check`, `lint`, `test`, and Playwright coverage), and the monetisation E2E visual snapshot was refreshed with deterministic stub timestamps to prevent repeated baseline drift. `DS-305` is now the active priority.
- 2026-03-05: `DS-303` completed by converting `/onboarding` from a single long-form wall into a staged flow (`Account`, `Business`, `Service profile`, `Review`) with visible progress, backward navigation, and per-step validation gates. Submit contract compatibility was preserved (`POST /api/onboarding` payload keys unchanged), focused unit coverage was added for step validation, and one additional guard was applied in control review to enforce `businessName` at the Business step before progression. `DS-304` is now the active priority.
- 2026-03-05: `DS-302` completed by refactoring `/search` into the canonical intent-capsule and filter-sheet interaction model while preserving existing request/URL contracts (`q`, `page`, `suburbId`, filter params, and deep-link auto-search behaviour). Keyboard/touch accessibility for sheet interactions was added (open/close controls, `Escape` close, focus return, and 44px touch targets), and required visual QA evidence was captured for desktop and mobile across default, filters-open, results, and empty-results states. `DS-303` is now the active priority.
- 2026-03-05: `DS-301` completed by introducing a design-system token bridge in `theme.css`, applying a shared public shell baseline (`public-shell-*` and `shell-*` classes) across `/`, `/search`, `/onboarding`, and `/emergency`, adding a global Living Field environment in root layout, and enforcing reduced-motion/focus/touch-target baseline behaviour. Independent verification passed (`type-check`, `lint`, `test`) and before/after visual evidence was captured for desktop and mobile on all four required routes. `DS-302` is now the active priority.
- 2026-03-05: Tightened `Phase 7 - Design System Enforcement` governance by adding an explicit `DS-301` enforcement gate, phase non-goals, mandatory verification standards, and a required `DS-399` post-phase checkpoint before any new optimisation slice.
- 2026-03-05: Opened `Phase 7 - Design System Enforcement` as the next delivery slice after the completion of `NX-101` to `NX-106`. `DS-301` is now the active priority, with `DS-302` to `DS-305` queued in strict order.
- 2026-03-05: `NX-106` completed by making `/api/public/search` parse canonical `suburbId`, resolve effective search coordinates from the suburb record when possible, and ignore conflicting snapshot coordinates when a canonical suburb identity is present. If `suburbId` is unresolvable, the route now falls back to a non-location search rather than trusting tamperable snapshot coordinates.
- 2026-03-05: `NX-105` completed by tightening the instructional weight on `/` and `/search` without changing routes, search contracts, or core flow logic. The home hero now has one clearer dominant path with secondary routes demoted to a compact “Other ways in” list, while the search page replaces tutorial-style blocks with shorter orientation and support panels that preserve triage, locality, and emergency differentiation without reading like a manual.
- 2026-03-05: `NX-104` completed by replacing the thin placeholder empty states on `/search` and `/directory` with actionable recovery states. Search zero-results now suggests concrete next actions and exposes in-place recovery CTAs (`Search all distances`, `Clear extra filters`, `Start guided search`), while the directory empty state now gives both demand-side and supply-side next steps (`Try search instead`, `Add your business`) without changing route logic or backend contracts.
- 2026-03-05: `NX-103` completed by removing the public latitude/longitude inputs from `/search` while preserving the existing internal `lat` / `lng` URL and state support for saved links and current search requests.
- 2026-03-05: `NX-102` completed as a copy-only public UI pass. Internal/builder labels were removed from the home, search, directory, and onboarding surfaces without changing layout structure, filter density, or empty-state behaviour.
- 2026-03-05: `NX-101` completed by adding a suburb-by-id lookup path to the existing `suburbs` Edge Function plus `apiService`, then rehydrating `/triage` location state from canonical `suburbId` instead of relying on split or mutable snapshot state. Unit coverage now locks deep-link, unresolved-id, and repeat rehydration behaviour.
- 2026-02-13: `P1-010` completed. Generated snapshots added under `DOCS/SSOT/_generated/*`, `npm run ssot:refresh` added, and CI drift enforcement enabled via refresh + dirty-tree check.
- 2026-02-13: `P1-011` completed by refactoring `04_API_CONTRACTS.md`, `05_ROUTES_AND_NAV.md`, and `09_DEPLOYMENT.md` to reference `DOCS/SSOT/_generated/*` and remove duplicated endpoint/route inventories.
- 2026-02-13: `P2-020` verified complete in implementation review. Checks passed: `/triage -> /search -> /trainers/[id]` path present; no `window.alert` placeholders in core journey pages; footer legal links resolve to implemented pages.
- 2026-02-13: `P2-021` completed. `/admin/ai-health` now counts `manual_override` and `manual` for moderation decisions, degrades to `Not instrumented yet.` when metric tables are unavailable, and explicitly labels `24h Errors` as not instrumented.
- 2026-02-28: `P0-001` closed after commit `5a80f58` with green verification (`type-check`, `lint`, `test`, `smoke`, `docs:guard`, `ssot:refresh`, targeted Playwright).
- 2026-02-28: Product roadmap restructured into `Build Completion -> Production Hardening -> Market Optimization`; `BC-104` completed in the same update.
- 2026-03-01: `BC-101` completed by fixing `/search` URL-driven auto-search to execute through a stable search runner, preventing repeated page-1 fetches and restoring correct `Load More` progression (`page 1 -> page 2`). Regression coverage added in `tests/e2e/search-and-trainer.spec.ts` and targeted verification passed.
- 2026-03-01: `BC-102` completed by replacing duplicated `/search` filter enums with shared taxonomy constants and labels from `src/lib/constants/taxonomies.ts`, including canonical filtering of URL-provided enum params before they hydrate UI state.
- 2026-03-01: `BC-103` completed by moving onboarding payload normalization and validation into a dedicated parser, enforcing required normalized fields (`suburbId`, `primaryService`) and returning deterministic `400` responses for invalid enum values before any database writes. Unit coverage added in `tests/unit/onboarding-payload.test.ts`.
- 2026-03-01: `PH-201` completed by extracting public search and checkout request parsing into dedicated contract helpers, then adding regression coverage for `q/query`, `service/service_type`, `page/offset`, dual metadata flags (`hasMore` + `has_more`), checkout body aliases, and the onboarding alias-validation path.
- 2026-03-01: `PH-202` completed by aligning `.env.local` to the live `xqytwtmdilipxnjetvoe` Supabase project, applying the missing remote migrations (`20251209093000`, `20260203171000`, `20260203182000`), repairing remote migration history for the two 20260203 versions, refreshing `supabase/schema.sql`, and re-running remote-backed smoke with `6/6` passing once `SUPABASE_PGCRYPTO_KEY` was present.
- 2026-03-01: `MO-301` completed by adding `commercial_funnel` instrumentation to the canonical `latency_metrics` path for `triage_submit`, `search_results`, `trainer_profile_view`, `promote_page_view`, and `promote_checkout_session`; wiring stage summaries and drop-off calculations into `/api/admin/telemetry/latency`; and preserving triage-origin attribution through `flow_source` from `/triage` into `/search` and trainer profile views.
- 2026-03-01: `MO-302` completed by running one controlled engineering sample through the live-backed funnel (`/api/emergency/triage`, `/api/public/search`, `/trainers/999999`, `/promote`, and `/api/stripe/create-checkout-session`) and recording the first baseline in `08_OPS_RUNBOOK.md`. The sample confirmed telemetry is writing, but it also exposed two live blockers: `POST /api/emergency/triage` currently fails with `null value in column "description" of relation "emergency_triage_logs"`, and the live database is missing the `public.search_trainers(...)` and `public.get_trainer_profile(...)` RPCs. Those findings reopen Production Hardening as `PH-203` and `PH-204`.
- 2026-03-01: `PH-203` completed by extracting a dedicated triage persistence helper that writes the required `emergency_triage_logs` columns (`description`, `predicted_category`, `recommended_flow`) and normalizes persisted classifications to the live enum-safe set. Unit coverage was added for the insert payload, and live verification confirmed `POST /api/emergency/triage` now returns `200` and inserts rows successfully against the current Supabase schema.
- 2026-03-01: `PH-204` completed by restoring the canonical `public.search_trainers(...)` and `public.get_trainer_profile(...)` RPCs from the repo’s existing 2025-02-10 migrations, refreshing the PostgREST schema cache, and refreshing `supabase/schema.sql`. Live verification confirmed PostgREST recognizes both RPCs and `GET /api/public/search` now returns `200`, but the live project still has `0` rows in `public.businesses`, so full trainer profile verification remains blocked and is now tracked as `PH-205`.
- 2026-03-01: `PH-205` completed by adding one controlled verification dataset to the live project: a `City of Yarra` council row, a linked `Collingwood` suburb relationship, one active business (`DTD Verification Trainer PH205`, `business_id = 1`), and the minimum specialization/behavior/service relations. Live verification then confirmed `GET /api/public/search?q=PH205&limit=1` returns the inserted business and `GET /trainers/1` renders the real profile path without the fallback marker.
- 2026-03-02: `MO-303` completed from a sourced competitor scan covering Yellow Pages, Oneflare, APDT Australia, Bark Busters Victoria, Melbourne Dog Trainers, and Next Level Dog Training. The highest-confidence market gaps are: low visible inventory depth, weak public trust density, limited suburb/service landing coverage, higher post-discovery friction, and a business-side monetisation proposition that does not yet show clear public-facing ROI. The resulting prioritized implementation backlog is `MO-304` through `MO-308`.
- 2026-03-02: The roadmap was reclassified to make `Website Completion` explicit before broader market optimization. `WC-301` is now the active priority because the public UI/UX is still unfinished, with `MO-304` and `MO-306` queued as the trust and conversion layers that depend on that foundation.
- 2026-03-02: `WC-301` completed by rebuilding the core public presentation layer on `/`, `/search`, and `/trainers/[id]` around clearer hierarchy, stronger trust framing, and more intentional CTA placement. The route-intent SSOT in `05_ROUTES_AND_NAV.md` was updated alongside the implementation so the public journey expectations match the finished UI foundation. `MO-304` is now the active priority.
- 2026-03-02: `MO-304` completed by increasing visible trust density on `/search` and `/trainers/[id]` using only existing canonical fields: ABN verification state, verification status, public review evidence, featured status, contact availability, pricing visibility, and disclosed fit details. No backend or schema change was required; the Playwright search/profile spec was updated only to keep the placeholder assertion aligned with the Australian-English copy. `MO-306` is now the active priority.
- 2026-03-02: `MO-306` completed by making the next action clearer on `/search` and `/trainers/[id]` without changing routes, telemetry, or API contracts. Search result cards now explain the profile as the next decision step more explicitly, and trainer profiles prioritise the fastest available direct contact method (phone, then email, then website) while retaining the enquiry form as the written-first fallback. The route-intent SSOT was updated in `05_ROUTES_AND_NAV.md` to reflect the refined contact hierarchy. `MO-305` is now the active priority.
- 2026-03-02: `MO-305` completed by moving `/search` onto a server-rendered metadata path, replacing placeholder SEO content with canonical query-driven metadata and `CollectionPage` structured data, and strengthening locality/service landing intent within the existing `/search` route model. The route-intent SSOT was updated in `05_ROUTES_AND_NAV.md` to make `/search` the explicit first-slice landing surface for locality and service SEO. `MO-307` is now the active priority.
- 2026-03-02: `MO-307` completed by expanding the live directory from the single `PH-205` verification fixture to a four-listing controlled demo baseline across three suburbs and three councils, while preserving the existing RPC layer and all schema/contracts. The controlled live inventory strategy is now documented in `08_OPS_RUNBOOK.md`, and the next active priority is `MO-308`.
- 2026-03-03: `MO-308` completed by repackaging `/promote` around the real current featured-placement value: one-time payment, visible featured differentiation where it already exists (`/directory` and `/trainers/[id]`), and explicit non-goals around analytics, guaranteed ranking, and subscription changes. `06_MONETISATION.md` now records those support boundaries. The remaining blocker is a pre-existing admin-side timeout in `tests/e2e/monetization.spec.ts`, which is now tracked as `PH-206`.
- 2026-03-03: `PH-206` completed by adding an E2E-only admin auth bypass in `src/lib/auth.ts` so Playwright can render `/admin` without a real login session, keeping production auth unchanged. The stale `/api/admin/queues` mock in `tests/e2e/monetization.spec.ts` was aligned to the current admin page contract, the monetisation snapshot was refreshed, and `tests/e2e/monetization.spec.ts` now passes fully.
- 2026-03-04: `AUD-001` completed as a full-scope Product Experience & Functional Completion Audit across IA, interface, workflow, experience, conversion, and failure layers. The audit reopens product completion work with six recovery tasks: broken featured-placement monetisation, inconsistent triage emergency escalation, dead operator affordances, hard-stop failure states, mixed admin/public shell structure, and credibility/consistency debt. `PC-401` is now the active priority.
- 2026-03-04: `PC-401` completed by introducing a shared checkout-availability contract, gating `/promote` when live checkout is unavailable, preserving deterministic E2E checkout stubs, rewriting the admin monetisation overview to merge business data without a broken implicit relation, and replacing the admin monetisation loading loop with a terminal error state plus retry action. The real-mode `/promote` page now also loads listing details against the actual `businesses` + `suburbs` schema. `PC-402` is now the active priority.
- 2026-03-04: `PC-402` completed by extracting the triage emergency issue-to-flow mapping into a shared helper used by both `/triage` and `EmergencyGate`, removing the previous hardcoded gate subset that let `destructive_behaviour`, `rescue_dog_support`, and `resource_guarding` bypass escalation. Unit coverage now locks the full mapping and branch-priority behaviour. `PC-403` is now the active priority.
- 2026-03-04: `PC-403` completed by removing the remaining operator-facing links to raw API and test endpoints from `/admin/triage` and `/admin/errors`, while preserving valid internal operator navigation. The authenticated admin UI no longer exposes those dead affordances. `PC-404` is now the active priority.
- 2026-03-04: `PC-404` completed by adding explicit recovery actions to the missing trainer profile fallback, including links back to search, directory, and home while preserving any available query-string search context. The profile dead-end is now recoverable, and targeted Playwright coverage locks the fallback behaviour. `PC-405` is now the active priority.
- 2026-03-04: `PC-405` completed by splitting `/admin/**` into a dedicated operator shell with task-focused navigation while hiding the public site header and footer chrome on admin routes. Runtime browser verification confirmed the operator shell is visible and the public acquisition controls are no longer shown on `/admin`. `PC-406` is now the active priority.
- 2026-03-04: `PC-406` completed by replacing the rolling legal-page render dates with one explicit shared revision date, switching `/api/admin/overview` to request-derived same-origin fetches with forwarded auth cookies instead of the hidden `localhost:3005` fallback, and preserving query-string context on the `/trainer/[id]` compatibility redirect.
- 2026-03-04: Validation for `PC-406` exposed one additional operator-facing defect outside the original audit set: `/api/admin/latency` can still return `500` on zero-volume windows because its summary query can divide by zero. That follow-up is now tracked as `PC-407`, which becomes the new active priority.
- 2026-03-04: `PC-407` completed by handling the known zero-volume `division by zero` RPC error inside `/api/admin/latency` and returning the normal zero-data success payload instead of `500`, while still preserving `500` for unrelated RPC failures. Focused unit coverage now locks that route-level behaviour. The current Product Completion Recovery slice is now closed for the application-layer audited scope.
