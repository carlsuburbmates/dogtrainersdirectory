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

## Current State (as of 2026-03-02)
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
- The public UI/UX is not complete yet, so website completion now takes priority ahead of broader market optimization.
- Current top priority: `WC-301`.
- The current delivery sequence is:
  1. Build Completion
  2. Production Hardening
  3. Website Completion
  4. Market Optimization

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

**WC-301: Complete the public UI/UX foundation**
- Purpose: finish the public-facing product experience so the site is credible before broader optimization work.
- Definition of done:
  - Core public surfaces (`/`, `/triage`, `/search`, `/directory`, `/trainers/[id]`, `/emergency`, `/promote`) feel intentional, cohesive, and complete on desktop and mobile.
  - The visual hierarchy, CTA hierarchy, and information density support trust and action without relying on placeholder patterns.
  - The next trust/conversion tasks (`MO-304` and `MO-306`) can build on a stable, clearly defined UI foundation instead of compensating for unfinished UX.

**MO-304: Increase public trust density on search and trainer profiles**
- Purpose: close the largest visible trust gap between DTD and market leaders.
- Definition of done:
  - Search results and trainer profiles surface stronger proof signals (for example: credentials, vetting state, review evidence, and clearer trust framing).
  - Trust signals are sourced from canonical data fields or explicit new schema-backed fields, not static copy.
  - The public user can distinguish why a listing is trustworthy before contacting the trainer.

**MO-306: Reduce buyer friction with clearer primary conversion actions**
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

**MO-305: Build suburb and service landing-page coverage for local SEO**
- Purpose: match the location/service discovery patterns used by strong directory and local trainer competitors.
- Definition of done:
  - DTD has a defined landing-page strategy for suburb/region and service-specific discovery.
  - Search metadata and structured data stop relying on placeholder location/pricing values for core search surfaces.
  - The routing and content strategy is explicit enough to support repeatable SEO and local discovery work.

**MO-307: Expand live directory inventory depth beyond the verification fixture**
- Purpose: move from a technically verified live directory to a market-comparable discovery surface.
- Definition of done:
  - The live project contains more than the single controlled verification listing.
  - Coverage strategy for real listings (controlled imports, onboarding, or vetted seed path) is explicit.
  - Search depth and geography are sufficient to validate the discovery experience beyond a one-record environment.

**MO-308: Repackage business-side monetisation around visible ROI**
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

## Execution Log
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
