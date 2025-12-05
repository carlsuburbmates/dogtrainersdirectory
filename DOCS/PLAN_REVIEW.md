# Plan Review & Approval Status
## dogtrainersdirectory.com.au - Execution Plan v2.0 → v2.1

**Review Date:** 28 November 2025  
**Reviewer:** AI agent Implementation Review  
**Original Plan:** ai_agent_execution_v2_aligned.md (v2.0)  
**Corrected Plan:** ai_agent_execution_v2_corrected.md (v2.1)  
**Decision:** 🔧 **CORRECTED** - Plan updated to align with finalized decisions

---

## Executive Summary

The uploaded execution plan (v2.0) was **fundamentally sound** with excellent structure, clear prompts, and comprehensive AI agent integration. However, it contained **6 critical conflicts** with finalized decisions made after the plan was initially drafted.

**Recommendation:** ✅ **APPROVE v2.1 (CORRECTED)** - Phases 1–4 are complete (see `DOCS/PHASE_1_FINAL_COMPLETION_REPORT.md`, `DOCS/PHASE_2_FINAL_COMPLETION_REPORT.md`, `DOCS/PHASE_3_FINAL_COMPLETION_REPORT.md`, `DOCS/PHASE_4_FINAL_COMPLETION_REPORT.md`). Ready to proceed with Phase 5 planning per this corrected plan.

> **Phase 5 delivery update (Feb 2026):** Emergency ops + admin automation are now implemented per v2.1 scope. See `DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md` for artifacts covering AI triage, emergency verification, admin digest, and moderation automation.

---

## Original Plan Summary (v2.0)

### Strengths ✅

**Structure:**
- Well-organized 5-phase approach
- Clear AI agent prompts for each phase
- Comprehensive success criteria and checklists
- Excellent alignment with AI agent capabilities

**Technical Detail:**
- Detailed database schema specifications
- Complete user journeys (dog owner, trainer, admin)
- Thorough validation rules and constraints
- Realistic timeline estimates (50-95 minutes execution)

**Scope:**
- Phase 1: Database + Auth
- Phase 2: Triage + Filtering
- Phase 3: Profiles + Directory
- Phase 4: Trainer Onboarding + Web Scraper
- Phase 5: Monetization + Emergency Resources

### Issues Identified ❌

**6 conflicts with finalized decisions:**
1. Council count: References "31 councils" (should be 28)
2. Web scraper placement: Included in Phase 4 (should be deferred to Phase 2 post-launch)
3. Suburb data: Missing enrichment details (postcodes + coordinates)
4. ABN GUID: Generic reference (should specify actual GUID)
5. Duplicate suburbs: No handling strategy (should reference primary assignment)
6. Monetization timing: Stripe in Phase 5 (should be Phase 4-5 post-launch per master plan)

---

## Finalized Decisions Summary

### Decision 1: Council Count - 28 (Not 31)

**Authority:** `/home/ubuntu/blueprint_ssot_v1.1.md` (Section 1.2, 3.5, 3.6)

**Rationale:**
- Authoritative suburb-council mapping data (suburbs_councils_mapping.csv) contains exactly 28 unique councils
- Previous reference to 31 councils was a data error

**28 Councils by Region:**
- Inner City: 3 councils (Melbourne, Port Phillip, Yarra)
- Northern: 6 councils (Banyule, Darebin, Hume, Merri-bek, Whittlesea, Nillumbik)
- Eastern: 6 councils (Boroondara, Knox, Manningham, Maroondah, Whitehorse, Yarra Ranges)
- South Eastern: 7 councils (Bayside, Glen Eira, Kingston, Casey, Frankston, Cardinia, Mornington Peninsula)
- Western: 6 councils (Brimbank, Hobsons Bay, Maribyrnong, Melton, Moonee Valley, Wyndham)

**Impact:** Database schema, test data generation, validation rules

---

### Decision 2: Web Scraper - Deferred to Phase 2

**Authority:** `/home/ubuntu/implementation/master_plan.md` (Section 5: Web Scraper Strategy)

**Rationale:**
- **Phase 1 focus:** Manual trainer onboarding only (higher quality, no scaffolded profiles)
- **Complexity:** Web scraper requires seed list, LLM prompt tuning, duplicate detection, validation logic
- **Phase 2 benefit:** Scraper can backfill directory after manual submissions validate data quality

**Phase 1 Approach:**
- Trainers self-submit via "Add Your Business" form
- Complete profile configuration (age, issues, pricing, ABN)
- Result: Claimed profiles only (is_claimed = TRUE, is_scaffolded = FALSE)

**Phase 2 Approach (Post-Launch):**
- Scrape competitor websites (seed list of 50-100 URLs)
- LLM extraction + enum mapping (95% accuracy)
- Scaffolded profiles (is_claimed = FALSE, is_scaffolded = TRUE)
- "Claim Your Business" CTA for trainers to verify and enhance

**Impact:** Phase 4 scope significantly simplified (no web scraper logic, no business claiming flow)

---

### Decision 3: Enriched Suburb Data - Postcodes + Coordinates

**Authority:** `/home/ubuntu/suburbs_councils_mapping.csv` (138 enriched suburb records)

**Enrichment Details:**
- **Source:** OpenStreetMap Nominatim API (free, no API key required)
- **Success rate:** 100% (138/138 suburbs enriched successfully)
- **Data added:**
  - Postcode (4-digit Victoria postcode: 3000-3999)
  - Latitude (decimal, e.g., -37.8013)
  - Longitude (decimal, e.g., 144.9787)

**Enriched CSV Schema:**
```csv
suburb,council,region,postcode,latitude,longitude,character,ux_label
Fitzroy,City of Yarra,Inner City,3065,-37.8013,144.9787,"Cultural heritage, creative precinct",Inner North Creative
Brighton,City of Bayside,South Eastern,3186,-37.9167,145.0000,"Beachside, affluent",Brighton & Bayside
```

**Use Cases Enabled:**
1. Distance-based filtering: "Show trainers within 10km of Fitzroy"
2. Postcode validation: Verify trainer addresses match council boundaries
3. Map visualization: Plot trainers on interactive map (Phase 3+)
4. Nearest emergency vet: Calculate distance to 24-hour vets

**Distance Calculation:**
- Haversine formula implemented in database (Phase 1)
- Test: Fitzroy (-37.8013, 144.9787) to Brighton (-37.9167, 145.0000) = ~10.5 km

**Impact:** Phase 1 database schema, Phase 2 distance filtering, Phase 3 map views

---

### Decision 4: ABN Validation - Specific GUID Provided

**Authority:** User-provided ABR GUID for production use

**ABN Validation Specification:**
- **API Service:** Australian Business Register (ABR) ABN Lookup
- **Endpoint:** https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN
- **GUID:** `9c72aac8-8cfc-4a77-b4c9-18aa308669ed`
- **Security:** Store in environment variable (never expose to client)

**Validation Logic:**
1. Trainer enters ABN + business name during onboarding
2. Server-side API call with GUID
3. Extract: Business name, ABN status, entity type
4. Calculate name similarity: Claimed name vs. ABR name
5. Auto-approve if ≥85% match → abn_verified = TRUE, ✅ badge appears
6. Manual upload fallback if <85% match → Admin reviews within 24 hours

**Expected Auto-Approval Rate:** 85% (15% require manual review)

**Impact:** Phase 4 ABN verification logic (Step 3F)

---

### Decision 5: Duplicate Suburbs - Primary Council Assignment

**Authority:** `/home/ubuntu/implementation/master_plan.md` (Section 2: Duplicate Suburb Resolution)

**Analysis:**
- 4 suburbs initially identified as duplicates
- 2 were **data errors** (Richmond, Officer)
- 2 are **true duplicates** (Eltham, Emerald)

**Resolution:**

| Suburb | Original Councils | Resolution | Rationale |
|--------|------------------|------------|-----------|
| Richmond | Yarra, Melbourne | **ERROR** - Only Yarra | Richmond is exclusively in City of Yarra (not Melbourne) |
| Officer | Cardinia, Casey | **ERROR** - Only Cardinia | Officer is exclusively in Shire of Cardinia (not Casey) |
| Eltham | Banyule, Nillumbik | **PRIMARY:** Nillumbik | Both valid (postcode 3095), Nillumbik assignment for simplicity |
| Emerald | Yarra Ranges, Cardinia | **PRIMARY:** Yarra Ranges | Both valid (postcode 3782), Yarra Ranges assignment for simplicity |

**Primary Assignment Approach:**
- Single suburb-council pair in database (no disambiguation UI)
- 95%+ cases covered correctly
- Proximity filtering handles edge cases naturally
- Clean UX: Single autocomplete entry per suburb

**Result:** 138 unique suburb-council pairs (down from 141 after removing errors)

**Impact:** Phase 1 database seeding (localities table), autocomplete logic

---

### Decision 6: Monetization - Deferred to Phase 4-5 Post-Launch

**Authority:** `/home/ubuntu/implementation/master_plan.md` (Sections 7-8: Phase Scope)

**Rationale:**
- **Phase 1 MVP:** Focus on core directory features (search, profiles, onboarding)
- **Monetization complexity:** Stripe integration, payment workflows, subscription management
- **Validation first:** Prove concept with manual submissions before adding revenue features

**Phase 1 Scope (MVP Launch):**
- ✅ Database + Auth
- ✅ Triage + Filtering
- ✅ Profiles + Directory
- ✅ Trainer Onboarding (manual)
- ✅ Emergency Resources
- ✅ Admin Dashboard

**Phase 4-5 Scope (Post-Launch):**
- 🔲 Featured slots (Stripe payments)
- 🔲 Subscription tiers (Basic, Mid, Premium)
- 🔲 Revenue tracking
- 🔲 Auto-renewal

**Impact:** Phase 5 simplified (no Stripe, no featured slot purchase flow in v2.1)

---

## Conflicts Identified

### 1. Council Count: 31 → 28 ❌

**Locations in v2.0:**
- Line 142: "Test data inserted: 50 trainers + 10 emergency resources + 31 councils + suburbs"
- Line 152: "All 31 councils with 5-10 suburbs each"
- Line 176: "31 councils with suburbs"
- Line 780: "Address → Suburb (must be in Melbourne 31 councils, else skip)"
- Line 969: "Council animal control (all 31 councils)"

**Correction in v2.1:**
- Replaced ALL instances: "31 councils" → "28 councils"
- Updated test data: "28 councils + 138 suburbs with coordinates"
- Updated validation: "must be in Melbourne 28 councils"

**Severity:** 🔴 **HIGH** - Database schema, test data, validation logic affected

---

### 2. Web Scraper in Phase 4 → Moved to Phase 2 ❌

**Location in v2.0:**
- Phase 4 (lines 564-840): Includes extensive web scraper logic
  - Weekly scrape schedule
  - LLM extraction + enum mapping
  - Scaffolded profile creation
  - Business claiming flow

**Correction in v2.1:**
- **Removed** web scraper from Phase 4 entirely
- **Removed** business claiming flow (no scraped listings exist in Phase 1)
- **Added** note: "Web scraper deferred to Phase 2 (post-launch)"
- **Simplified** Phase 4 to: Manual trainer onboarding only

**Rationale:**
- Phase 1 MVP focuses on manual submissions (higher quality)
- Web scraper backfills directory post-launch (Phase 2)
- Reduces Phase 1 complexity and timeline

**Severity:** 🟡 **MEDIUM** - Scope change, but doesn't break Phase 1 functionality

---

### 3. Suburb Data Not Enriched → Added Postcodes + Coordinates ❌

**Issue in v2.0:**
- Phase 1 database schema missing: postcode, latitude, longitude fields
- Phase 2 distance filtering mentioned but no coordinate data
- No reference to enriched suburb CSV

**Correction in v2.1:**
- **Phase 1 database schema** updated:
  - Added: postcode (VARCHAR 4)
  - Added: latitude (DECIMAL 10,7)
  - Added: longitude (DECIMAL 10,7)
- **Phase 1 test data** updated:
  - "138 suburbs with postcodes + coordinates"
  - Example: Fitzroy (3065, -37.8013, 144.9787)
- **Phase 2 distance filtering** updated:
  - "Distance calculated using Haversine from Phase 1"
  - "Filter by distance threshold (0-5km, 5-15km, or all)"

**Severity:** 🟡 **MEDIUM** - Critical for distance filtering, but easy to add

---

### 4. ABN GUID Not Specified → Added Specific GUID ❌

**Issue in v2.0:**
- Phase 4 ABN verification mentions "provided credentials" but no specific GUID
- Generic instruction: "AI agent has access" (unclear)

**Correction in v2.1:**
- **Added specific GUID:** `9c72aac8-8cfc-4a77-b4c9-18aa308669ed`
- **Added security note:** "Store GUID in environment variable (never expose to client)"
- **Added API endpoint:** https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN
- **Added test instruction:** "Test ABN: Use valid test ABNs (e.g., Telstra: 53 004 085 616)"

**Severity:** 🟢 **LOW** - Minor clarification, doesn't change logic

---

### 5. Duplicate Suburbs Not Addressed → Added Primary Assignment ❌

**Issue in v2.0:**
- No mention of duplicate suburbs (Richmond, Eltham, Officer, Emerald)
- No strategy for handling suburbs in multiple councils

**Correction in v2.1:**
- **Added duplicate suburb handling section** in Phase 1:
  - Eltham → Primary: Shire of Nillumbik (postcode 3095)
  - Emerald → Primary: Shire of Yarra Ranges (postcode 3782)
  - Richmond → ONLY City of Yarra (previous data error corrected)
  - Officer → ONLY Shire of Cardinia (previous data error corrected)
- **Result:** 138 unique suburb-council pairs (not 141)

**Severity:** 🟢 **LOW** - Data cleanup, doesn't affect core functionality

---

### 6. Monetization in Phase 5 → Clarified as Post-Launch ❌

**Issue in v2.0:**
- Phase 5 includes Stripe integration, featured slots, revenue tracking
- Implies monetization is part of Phase 1 MVP

**Correction in v2.1:**
- **Removed monetization from Phase 5** (v2.1 scope)
- **Added note:** "Monetization (featured slots, Stripe) deferred to Phase 4-5 post-launch per master plan"
- **Phase 5 now focuses on:**
  - Emergency resources integration
  - Admin dashboard
  - Core system completion (ready for launch)
- **Post-launch roadmap** section clarifies monetization timeline

**Severity:** 🟡 **MEDIUM** - Scope clarification, aligns with master plan

---

## Corrections Made (v2.0 → v2.1)

### Correction Summary

| # | Correction | Sections Affected | Severity |
|---|------------|------------------|----------|
| 1 | Council count: 31 → 28 | Phase 1, 2, validation rules | 🔴 HIGH |
| 2 | Web scraper: Phase 4 → Phase 2 (post-launch) | Phase 4 (major simplification) | 🟡 MEDIUM |
| 3 | Suburb data: Added postcodes + coordinates | Phase 1 schema, Phase 2 filtering | 🟡 MEDIUM |
| 4 | ABN GUID: Added specific GUID | Phase 4 ABN verification | 🟢 LOW |
| 5 | Duplicate suburbs: Added primary assignment | Phase 1 data seeding | 🟢 LOW |
| 6 | Monetization: Clarified post-launch timing | Phase 5 scope | 🟡 MEDIUM |

---

### Detailed Corrections

#### Correction 1: Council Count (31 → 28)

**Changes Made:**
```diff
Phase 1 Test Data:
- ✓ Test data inserted: 50 trainers + 10 emergency resources + 31 councils + suburbs
+ ✓ Test data inserted: 50 trainers + 10 emergency resources + 28 councils + 138 suburbs (with postcodes + coordinates)

Phase 1 Deliverable:
- 4. All 31 councils with 5-10 suburbs each
+ 4. All 28 councils with 138 suburbs (5-10 examples with postcodes + coordinates)

Phase 1 Validation:
- - 31 councils (NOT approximate)
+ - 28 councils (NOT 31)
+ - 138 suburbs with postcodes + coordinates (NOT approximate count)

Phase 2 Suburb Selection:
- - Suburb input autocomplete (grouped by region across 31 councils)
+ - Suburb input autocomplete (grouped by region across 28 councils)

Phase 4 Web Scraper Validation:
- - Address → Suburb (must be in Melbourne 31 councils, else skip)
+ - Address → Suburb (must be in Melbourne 28 councils, else skip)

Phase 5 Emergency Resources:
- - Council animal control (all 31 councils)
+ - Council animal control (all 28 councils - add representative contacts)
```

**Why This Matters:**
- Database seeding must use correct council count (28, not 31)
- Test data must match authoritative CSV (138 suburbs, not approximate)
- Validation rules must reject suburbs outside 28 councils

---

#### Correction 2: Web Scraper (Phase 4 → Phase 2 Post-Launch)

**Changes Made:**
```diff
Phase 4 Title:
- PHASE 4: TRAINER ONBOARDING + WEB SCRAPER
+ PHASE 4: TRAINER ONBOARDING (MANUAL ONLY - NO WEB SCRAPER)

Phase 4 Objective:
- 1. Trainer account creation + email verification
- 2. Business claiming or creation flow
- 3. 6-step profile configuration form
- 4. Trainer dashboard (stats, profile management)
- 5. Weekly web scraper (populate directory with unclaimed listings)
+ 1. Trainer account creation + email verification
+ 2. Manual business creation flow (no claiming of scraped listings in Phase 1)
+ 3. 6-step profile configuration form
+ 4. Trainer dashboard (stats, profile management)
+ 5. ABN verification with provided GUID

Phase 4 Removed Sections:
- [REMOVED] Business claiming flow (Option A: Search for existing listing)
- [REMOVED] SMS verification for claiming
- [REMOVED] Web scraper automation (weekly job, LLM mapping, duplicate detection)
- [REMOVED] Fallback: Manual submission form (replaced with primary manual entry flow)

Phase 4 Added Note:
+ NOTE: Web scraper has been moved to Phase 2 (post-launch). Phase 1 focuses on manual trainer submissions only.

Post-Launch Roadmap Added:
+ ### Phase 2 (2-6 months post-launch)
+ **Web Scraper (Backfill Directory):**
+ - ✅ Collect seed list (50-100 trainer URLs)
+ - ✅ LLM extraction + enum mapping
+ - ✅ Scaffolded profiles (unclaimed, discoverable)
+ - ✅ "Claim Your Business" CTA
+ - ✅ Weekly scrape schedule
```

**Why This Matters:**
- Phase 1 MVP focuses on manual submissions only (higher quality)
- Web scraper complexity deferred to post-launch (reduces timeline risk)
- No business claiming flow needed in Phase 1 (no scraped listings exist yet)

---

#### Correction 3: Suburb Data Enrichment (Added Postcodes + Coordinates)

**Changes Made:**
```diff
Phase 1 Database Schema:
  localities (suburbs):
    - suburb name
    - council_id (foreign key)
    - region
+   - postcode (4-digit Victoria postcode: 3000-3999)
+   - latitude (decimal, e.g., -37.8013)
+   - longitude (decimal, e.g., 144.9787)
    - character
    - ux_label

Phase 1 Test Data:
- ✓ All 31 councils with suburbs
+ ✓ All 28 councils with 138 suburbs (with postcodes + coordinates)
+ Example: Fitzroy (City of Yarra, Inner City, 3065, -37.8013, 144.9787)

Phase 1 Distance Calculation:
+ DISTANCE CALCULATION FUNCTION (REQUIRED):
+ ✓ Implement Haversine formula for calculating distance between two lat/lon pairs:
+   CREATE FUNCTION calculate_distance(lat1, lon1, lat2, lon2) RETURNS FLOAT
+   - Used for proximity filtering (0-5km, 5-15km, Greater Melbourne)
+   - Used for sorting results by distance

Phase 1 Deliverable:
+ 5. Distance calculation test: Fitzroy (-37.8013, 144.9787) to Brighton (-37.9167, 145.0000) = ~10.5 km

Phase 2 Distance Filtering:
- 7. Distance: Radio buttons
+ 7. Distance: Radio buttons (USES COORDINATES)
    - [ ] 0-5 km (from selected suburb centroid)
    - [ ] 5-15 km
-   - [ ] Greater Melbourne
+   - [ ] Greater Melbourne (28 councils)

Phase 2 Filtering Logic:
+ 3. Tertiary filter: Suburb/distance (USES COORDINATES)
+    - Calculate distance from selected suburb coordinates to trainer suburb coordinates
+    - Filter by distance threshold (0-5km, 5-15km, or all)
+ 4. Sort order (when multiple results tie):
+    - distance ASC (closest first, using Haversine calculation)
```

**Why This Matters:**
- Distance-based filtering requires coordinates (not just suburb names)
- Postcode validation ensures trainer addresses match council boundaries
- Map views (Phase 3+) require geocoded data

---

#### Correction 4: ABN GUID Specification (Added Specific GUID)

**Changes Made:**
```diff
Phase 4 ABN Verification:
**3F: ABN Verification (OPTIONAL, gets ✅ badge)**
- Text: "Get verified badge (takes 10 seconds)"
- Input: ABN field (11 digits, format validation)
- [VERIFY NOW] or [SKIP]

+ **CRITICAL: Use provided ABR GUID for API access:**
+ - ABR_GUID: `9c72aac8-8cfc-4a77-b4c9-18aa308669ed`
+ - API endpoint: https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN
+ - Store GUID in environment variable (never expose to client)

If VERIFY NOW:
- - Call ABN lookup API with provided credentials (AI agent has access)
+ - Call ABR lookup API with ABN + GUID
  - Extract: Business name, ABN status, entity type
+ - Calculate name similarity: Claimed name vs. ABR name
  - Show result:
-   - "✅ Verified!" or "⚠️ Name doesn't match" or error
+   - If ≥85% match: "✅ Verified!" → abn_verified = TRUE, badge displays immediately
+   - If <85% match: "⚠️ Name doesn't match (claimed 'X' vs. ABR 'Y')" → abn_verified = FALSE
+   - If ABN invalid/inactive: "❌ ABN not found or inactive" → abn_verified = FALSE

Phase 4 Technical Requirements:
+ - ABN API integration: Use provided GUID, server-side only (never expose to client)
+ - ABN name matching: Levenshtein or difflib, threshold ≥0.85
+ - Test ABN: Use valid test ABNs (e.g., Telstra: 53 004 085 616)
```

**Why This Matters:**
- Implementation-ready specification (no ambiguity about credentials)
- Security guidance (environment variable, server-side only)
- Clear thresholds (≥85% match for auto-approval)

---

#### Correction 5: Duplicate Suburb Handling (Added Primary Assignment)

**Changes Made:**
```diff
Phase 1 Geography Data:
+ DUPLICATE SUBURB HANDLING:
+ ✓ Eltham → Primary: Shire of Nillumbik (postcode 3095)
+ ✓ Emerald → Primary: Shire of Yarra Ranges (postcode 3782)
+ ✓ Richmond → ONLY City of Yarra (not City of Melbourne - previous data error)
+ ✓ Officer → ONLY Shire of Cardinia (not City of Casey - previous data error)

Phase 1 Test Data:
- ✓ All 31 councils with suburbs
+ ✓ All 28 councils with 138 suburbs (with postcodes + coordinates)
+ NOTE: Richmond and Officer errors corrected, Eltham and Emerald assigned to primary councils
```

**Why This Matters:**
- Data accuracy (Richmond and Officer errors corrected)
- Simplicity (single suburb-council pair, no disambiguation UI)
- Edge cases handled (Eltham/Emerald primary assignments documented)

---

#### Correction 6: Monetization Timing (Phase 5 → Post-Launch)

**Changes Made:**
```diff
Phase 5 Title:
- PHASE 5: MONETIZATION + EMERGENCY RESOURCES (FINAL PHASE)
+ PHASE 5: EMERGENCY RESOURCES + ADMIN DASHBOARD

Phase 5 Objective:
- 1. Featured slot purchase (Stripe payments)
- 2. Emergency resource integration (vets, shelters, crisis trainers)
- 3. Emergency triage branch (medical vs stray vs crisis)
- 4. Trainer payment dashboard + revenue tracking
- 5. Admin dashboard (moderation, scraper management, stats)
+ 1. Emergency resource integration (vets, shelters, crisis trainers)
+ 2. Emergency triage branch (medical vs stray vs crisis)
+ 3. Admin dashboard (moderation, resource management, stats)

Phase 5 Removed Sections:
- [REMOVED] Featured Slots (Monetization) - Tier structure, purchase flow, Stripe integration
- [REMOVED] Trainer payment dashboard + revenue tracking
- [REMOVED] Stripe webhook events
- [REMOVED] Renewal reminders

Phase 5 Added Note:
+ **NOTE:** Monetization (featured slots, Stripe) deferred to Phase 4-5 post-launch per master plan.

Phase 5 Admin Dashboard:
- Featured slots: 12 active (revenue this month: $840)
+ Featured slots: 0 active (monetization deferred to Phase 4-5)

Post-Launch Roadmap Added:
+ ### Phase 4-5 (6-12 months post-launch)
+ **Monetization:**
+ - ✅ Featured slots (Stripe payments)
+ - ✅ Subscription tiers (Basic, Mid, Premium)
+ - ✅ Revenue tracking
+ - ✅ Auto-renewal
```

**Why This Matters:**
- Phase 1 MVP scope clarified (no monetization)
- Aligns with master plan phasing strategy
- Reduces Phase 1 complexity and timeline

---

## Final Approval Status

### Decision: 🔧 CORRECTED

**Status:** Plan has been corrected to align with finalized decisions. Ready for Phase 1 commencement.

### Approval Criteria Met ✅

**Structure Preserved:**
- ✅ Original 5-phase structure maintained
- ✅ AI agent prompts preserved (with corrections)
- ✅ Success criteria and checklists intact
- ✅ User's original intent and approach preserved

**Finalized Decisions Incorporated:**
- ✅ 28 councils (not 31) - ALL references updated
- ✅ 138 enriched suburbs with postcodes + coordinates - Database schema updated
- ✅ Web scraper deferred to Phase 2 - Phase 4 simplified (manual only)
- ✅ ABN GUID specified - Implementation-ready
- ✅ Duplicate suburbs resolved - Primary assignment documented
- ✅ Monetization clarified - Post-launch timeline

**Implementation Ready:**
- ✅ Phase 1 database schema complete (28 councils, 138 suburbs, coordinates)
- ✅ Phase 2 triage + filtering ready (distance calculations)
- ✅ Phase 3 profiles + directory ready (138 suburbs autocomplete)
- ✅ Phase 4 onboarding ready (manual only, ABN GUID)
- ✅ Phase 5 emergency + admin ready (no monetization)

---

## Comparison: v2.0 vs. v2.1

### Side-by-Side Comparison

| Aspect | v2.0 (Original) | v2.1 (Corrected) | Change Type |
|--------|----------------|------------------|-------------|
| **Council Count** | 31 councils | 28 councils | 🔴 DATA CORRECTION |
| **Suburb Count** | "5-10 per council" (vague) | 138 unique suburbs | 🔴 DATA PRECISION |
| **Suburb Data** | Basic (name, council, region) | Enriched (+ postcode, lat, lon) | 🟡 ENHANCEMENT |
| **Distance Calc** | Mentioned, no details | Haversine formula, Phase 1 | 🟡 IMPLEMENTATION |
| **Web Scraper** | Phase 4 (included in MVP) | Phase 2 (post-launch) | 🟡 SCOPE CHANGE |
| **ABN GUID** | "Provided credentials" | Specific GUID: 9c72aac... | 🟢 CLARIFICATION |
| **Duplicate Suburbs** | Not addressed | Primary assignment strategy | 🟢 ADDITION |
| **Monetization** | Phase 5 (included in MVP) | Phase 4-5 (post-launch) | 🟡 SCOPE CHANGE |
| **Phase 1 Duration** | 5-15 min | 5-15 min | ✅ UNCHANGED |
| **Phase 2 Duration** | 10-20 min | 10-20 min | ✅ UNCHANGED |
| **Phase 3 Duration** | 10-20 min | 10-20 min | ✅ UNCHANGED |
| **Phase 4 Duration** | 15-25 min | 15-20 min | ✅ SIMPLIFIED |
| **Phase 5 Duration** | 15-25 min | 10-20 min | ✅ SIMPLIFIED |
| **Total Duration** | 55-105 min | 50-95 min | ✅ IMPROVED |

---

### Impact Analysis

**High Impact (Breaking Changes):**
- ✅ Council count correction (28 not 31) - Database schema affected
- ✅ Suburb enrichment (postcodes + coordinates) - Distance filtering enabled

**Medium Impact (Scope Changes):**
- ✅ Web scraper moved to Phase 2 - Phase 4 simplified, timeline reduced
- ✅ Monetization moved to post-launch - Phase 5 simplified, focus on MVP

**Low Impact (Clarifications):**
- ✅ ABN GUID specified - Implementation-ready, no logic change
- ✅ Duplicate suburbs resolved - Data cleanup, no functionality change

---

## Recommendation for Phase 1 Commencement

### ✅ READY TO PROCEED

**Recommendation:** Approve v2.1 (CORRECTED) and commence Phase 1 immediately.

---

### Pre-Flight Checklist

**All Prerequisites Met:**
- [x] Blueprint SSOT v1.1 (28 councils) - `/home/ubuntu/blueprint_ssot_v1.1.md`
- [x] Enriched suburb data (138 suburbs, postcodes, coordinates) - `/home/ubuntu/suburbs_councils_mapping.csv`
- [x] ABN GUID secured - `9c72aac8-8cfc-4a77-b4c9-18aa308669ed`
- [x] Duplicate suburbs resolved - Primary assignment strategy documented
- [x] Web scraper strategy confirmed - Deferred to Phase 2 (post-launch)
- [x] AI automation assessed - Transparent capabilities/limitations documented
- [x] Master plan finalized - `/home/ubuntu/implementation/master_plan.md`

**Execution Plan Status:**
- [x] Corrected plan created - `/home/ubuntu/ai_agent_execution_v2_corrected.md`
- [x] All conflicts resolved - 6 corrections made, all finalized decisions incorporated
- [x] Prompts validated - AI agent-ready, implementation-complete
- [x] Success criteria updated - Reflect corrected data (28 councils, 138 suburbs)

---

### Phase 1 Commencement Instructions

**Step 1: Review Corrected Plan**
- Open: `/home/ubuntu/ai_agent_execution_v2_corrected.md`
- Read: Phase 1 prompt (lines 70-200)
- Confirm: All corrections understood (28 councils, 138 suburbs, coordinates)

**Step 2: Launch AI agent**
- Navigate to: AI agent interface
- Start new conversation: "dogtrainersdirectory.com.au - Phase 1"

**Step 3: Execute Phase 1**
- Copy: Full Phase 1 prompt from corrected plan
- Paste: Into AI agent chat
- Send: Wait 5-15 minutes for completion

**Step 4: Validate Phase 1 Output**
- Verify: Database schema (28 councils, 138 suburbs with coordinates)
- Verify: Test data (50 trainers, 10 emergency resources)
- Verify: Distance calculation (Haversine function working)
- Verify: All enums enforced (attempt invalid enum → database error)

**Step 5: Approve or Iterate**
- If validation passes: Approve Phase 1, proceed to Phase 2
- If issues found: Request fixes, re-run Phase 1

**Step 6: Continue Phases 2-5**
- Repeat process for Phases 2, 3, 4, 5
- Each phase builds on previous (no backtracking needed)
- Total timeline: 50-95 minutes execution + 2-5 hours validation = 1-2 days elapsed

---

### Expected Timeline (Updated)

| Phase | Duration | Validation | Cumulative |
|-------|----------|------------|------------|
| **Phase 1** | 5-15 min | 30-60 min | 35-75 min |
| **Phase 2** | 10-20 min | 30-60 min | 75-155 min (1-2.5 hrs) |
| **Phase 3** | 10-20 min | 30-60 min | 115-235 min (2-4 hrs) |
| **Phase 4** | 15-20 min | 30-60 min | 160-315 min (2.5-5 hrs) |
| **Phase 5** | 10-20 min | 30-60 min | 200-395 min (3-6.5 hrs) |

**Total:** 50-95 minutes (AI agent) + 2.5-5 hours (validation) = **3-6.5 hours elapsed** (1-2 work days)

---

### Success Metrics (Phase 1 MVP Launch)

**Week 1 (Soft Launch):**
- 10-20 beta trainers registered
- 50+ searches performed
- Zero critical bugs
- Positive feedback from beta users

**Week 4 (Public Launch):**
- 50+ claimed trainer profiles
- 1,000+ unique visitors
- 500+ trainer searches
- 10+ ABN verifications completed
- 5+ reviews submitted

**Month 3 (Traction):**
- 100+ claimed trainers
- 5,000+ monthly visitors
- 2,000+ searches/month
- 50+ reviews
- Plan Phase 2: Web scraper (backfill 200+ unclaimed trainers)

---

### Risk Mitigation

**Identified Risks:**

**Risk 1: Database Migration Issues (28 vs 31 councils)**
- **Mitigation:** Use corrected v2.1 plan (28 councils verified)
- **Validation:** Count councils in Phase 1 output (must be exactly 28)

**Risk 2: Distance Calculations Inaccurate**
- **Mitigation:** Test Haversine formula in Phase 1 (Fitzroy to Brighton = ~10.5 km)
- **Validation:** Spot-check 10 distance calculations against Google Maps

**Risk 3: ABN Verification Fails (GUID invalid)**
- **Mitigation:** Test GUID with sample ABN (Telstra: 53 004 085 616) in Phase 4
- **Fallback:** Manual upload option (admin reviews within 24 hours)

**Risk 4: Duplicate Suburbs Confusion**
- **Mitigation:** Primary assignment strategy (Eltham→Nillumbik, Emerald→Yarra Ranges)
- **Validation:** Check autocomplete shows single entry per suburb (no duplicates)

**Risk 5: Phase 1 Scope Creep**
- **Mitigation:** Strict adherence to v2.1 plan (no web scraper, no monetization)
- **Validation:** Phase 4 success criteria explicitly checks "NO web scraper present"

---

## Conclusion

### Summary

**Original Plan (v2.0):** Excellent foundation, comprehensive structure, minor conflicts with finalized decisions.

**Corrected Plan (v2.1):** All conflicts resolved, implementation-ready, fully aligned with Blueprint SSOT v1.1 and Master Plan.

**Decision:** ✅ **APPROVE v2.1 (CORRECTED)** - Ready for Phase 1 commencement

---

### Key Takeaways

**What Changed:**
- ✅ Council count: 31 → 28 (data correction)
- ✅ Suburb data: Added postcodes + coordinates (enhancement)
- ✅ Web scraper: Phase 4 → Phase 2 post-launch (scope change)
- ✅ ABN GUID: Specified for implementation (clarification)
- ✅ Duplicate suburbs: Primary assignment strategy (addition)
- ✅ Monetization: Phase 5 → Post-launch (scope change)

**What Stayed the Same:**
- ✅ 5-phase structure (maintained)
- ✅ AI agent alignment (preserved)
- ✅ User journey logic (unchanged)
- ✅ Success criteria approach (intact)

**What Improved:**
- ✅ Data accuracy (28 councils, 138 suburbs)
- ✅ Distance filtering (coordinates enabled)
- ✅ Phase 1 focus (MVP scope clarified)
- ✅ Timeline (simplified, 50-95 min vs 55-105 min)

---

## Phase 5 Execution Update (February 2026)

- Emergency Help branch, emergency vet/shelter directory, and crisis trainer filters implemented per v2.1 scope.
- Supabase schema extended with `emergency_triage_logs`, `emergency_triage_weekly_metrics`, `emergency_resource_verification_runs/events`, `daily_ops_digests`, and `ai_review_decisions` to support AI-assisted operations.
- Admin dashboard now surfaces a Daily Ops Digest (LLM-generated), emergency verification queue, and triage watchlist; API entry point: `/api/admin/overview`.
- Scheduled job endpoints delivered: `/api/emergency/verify` (daily resource verification) and `/api/emergency/triage/weekly` (classifier accuracy summary). Wire via Vercel Cron/Supabase Scheduler before launch.
- AI moderation automation runs via `moderatePendingReviews`, auto-approving safe reviews and auto-rejecting spam with audit rows.

📎 Evidence: `DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md`

---

### Next Action

**Immediate:** Proceed to Phase 1 execution using corrected plan (v2.1)

**Files Required:**
1. `/home/ubuntu/ai_agent_execution_v2_corrected.md` - Execution prompts
2. `/home/ubuntu/blueprint_ssot_v1.1.md` - Blueprint reference
3. `/home/ubuntu/suburbs_councils_mapping.csv` - Enriched suburb data
4. `/home/ubuntu/implementation/master_plan.md` - Master plan reference

**Command to Start:**
```bash
# Open corrected execution plan
cat /home/ubuntu/ai_agent_execution_v2_corrected.md

# Copy Phase 1 prompt (lines 70-200)
# Paste into AI agent chat
# Execute and validate
```

---

**Review Status:** ✅ COMPLETE  
**Approval Status:** ✅ APPROVED (v2.1 CORRECTED)  
**Ready for Phase 1:** ✅ YES

**Reviewer:** AI agent Implementation Review  
**Date:** 28 November 2025

---

**END OF PLAN REVIEW**
