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

## Current State (as of 2026-03-05)
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
- Current top priority: `DS-399` (Phase 7 - Design System Enforcement).
- The current delivery sequence is:
  1. Build Completion
  2. Production Hardening
  3. Website Completion
  4. Market Optimization
  5. Product Completion Recovery
  6. Public Experience And State Refinement
  7. Design System Enforcement

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

## Execution Log
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
