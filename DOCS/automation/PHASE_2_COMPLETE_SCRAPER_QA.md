# Phase 2 Complete – Triage + Filtering Engine Validated

## Summary
- ✅ Age-first triage now ships as a guided flow (`src/app/page.tsx`): radio grid for the nine age buckets, independent rescue checkbox, issue chips with “Browse all,” and an optional-but-encouraged suburb autocomplete grouped by council/region. Submission writes the user’s selection into `sessionStorage` and the URL before handing off to the results engine.
- ✅ Results experience (`src/app/search/page.tsx`) mirrors the Phase 2 spec: search bar + live suburb changer, sidebar filters (age, rescue, issues, primary service, price slider to $200, verified toggle, distance buckets), live-updating list of 20 cards with “Load more,” and the URL keeps every filter for shareable deep links/back-button support.
- ✅ Backend filtering is locked in Supabase: `search_trainers` now accepts `age_filters`, `issue_filters`, `service_type_filter`, `rescue_only`, `distance_filter`, `price_max`, `search_term`, `verified_only`, and returns `pricing_min_rate` plus sanitized arrays. The query pre-aggregates trainer rows, applies Haversine distance buckets (0–5 km, 5–15 km, Greater Melbourne), enforces enums, and sorts Verified → distance → rating per the SSOT.
- ✅ The triage edge function (`supabase/functions/triage/index.ts`) validates all incoming filters (age arrays, service enums, price range, distance options), fetches suburb coordinates when provided, and proxies them to the RPC while keeping older constraints like radius validation out of the way.
- ✅ Suburb autocomplete (`supabase/functions/suburbs/index.ts`) now accepts JSON payloads, returns council + region metadata, and powers both the triage homepage and the results page location switcher without breaking grouping requirements.

## QA Evidence
- **Age + Rescue enforcement:** selecting “6–12 months” + Rescue on the homepage yields only trainers advertising `adolescent_6_18m` and `rescue_dogs`, then the sidebar radio lets reviewers flip between other age stages without a page reload. “I’m not sure” removes the age filter entirely as required.
- **Location + distance buckets:** suburb autocomplete supplies enriched data from Phase 1; once a suburb is chosen, the 0–5 km / 5–15 km / Greater Melbourne radios enable and apply the Haversine filter server-side (verified via Supabase logs calling `calculate_distance`). Clearing the location gracefully reverts to “Greater Melbourne (28 councils).”
- **Filter accuracy:** tests covered every checklist item in `DOCS/ai/ai_agent_execution_v2_corrected.md`: service radio narrows to a single `service_type`, the price slider clamps (`pricing_min_rate <= priceMax`), “Verified only” toggles `abn_verified`, text search matches business names + issue labels, and pagination shows 20 cards at a time with “Load more” fetching from the cached dataset.
- **URL/back-button QA:** all filter mutations write to the query string (age, rescue, issues, suburb, distance, service, price, verified, text search) so back/forward navigation rehydrates identical results. Bookmarking `/search?stage=2-6&issues=leash_reactivity&suburbId=12` reproduces the exact triage outcome without needing session state.
- **Data integrity:** manual spot checks confirmed Fitzroy → Brighton distance ≈10.5 km, and invalid enum attempts (e.g., tampering with `issues` in the POST body) are rejected in `supabase/functions/triage/index.ts` with detailed validation errors logged through `logValidationError`.

## References
- `src/app/page.tsx` – triage UI + URL handoff
- `src/app/search/page.tsx` – live filtering experience
- `src/lib/api.ts`, `src/lib/triage.ts` – shared filter types, constants, and helpers
- `supabase/functions/suburbs/index.ts`, `supabase/functions/triage/index.ts` – edge functions backing autocomplete + filtering
- `supabase/schema.sql`, `supabase/migrations/20250205120000_update_search_trainers.sql` – revised `search_trainers` RPC with full filter support
