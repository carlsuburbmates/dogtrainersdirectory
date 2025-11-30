# dogtrainersdirectory.com.au – AI agent Implementation Strategy v2.1 (CORRECTED)

**Version:** 2.1 (Corrected to align with finalized decisions)  
**Date:** 28 November 2025  
**Status:** READY FOR AI AGENT EXECUTION  
**Canonical Source:** blueprint_ssot_v1.1.md (28 councils, read-only reference)

---

## CORRECTIONS MADE (v2.0 → v2.1)

This document corrects the uploaded v2.0 plan to align with finalized decisions made after initial planning:

### 1. ✅ Council Count: 31 → 28
**What changed:** All references to "31 councils" updated to "28 councils"  
**Why:** Authoritative suburb-council mapping data contains exactly 28 unique councils  
**Authority:** `/home/ubuntu/blueprint_ssot_v1.1.md` (locked SSOT)  
**Sections affected:** Phase 1 (test data), Phase 2 (suburb selection), validation rules

### 2. ✅ Web Scraper: Moved from Phase 4 to Phase 2
**What changed:** Web scraper removed from Phase 1 implementation scope, deferred to Phase 2  
**Why:** Phase 1 focuses on manual trainer onboarding only; scraper backfills directory post-launch  
**Authority:** `/home/ubuntu/implementation/master_plan.md` (Section 5: Web Scraper Strategy)  
**Sections affected:** Phase 4 prompt significantly simplified (no web scraper logic)

### 3. ✅ Enriched Suburb Data: Added postcodes + coordinates
**What changed:** Phase 1 database now includes postcode, latitude, longitude for all 138 suburbs  
**Why:** Distance calculations, proximity filtering, and map views require geocoded data  
**Authority:** `/home/ubuntu/suburbs_councils_mapping.csv` (enriched with OpenStreetMap data)  
**Sections affected:** Phase 1 database schema, Phase 2 distance filtering

### 4. ✅ ABN GUID Specified
**What changed:** Added specific ABR_GUID for ABN validation: `9c72aac8-8cfc-4a77-b4c9-18aa308669ed`  
**Why:** Implementation-ready specification requires actual credentials  
**Authority:** User-provided GUID for ABR API access  
**Sections affected:** Phase 4 ABN verification logic (3F)

### 5. ✅ Duplicate Suburbs Resolved
**What changed:** Added explicit handling for duplicate suburbs (Eltham, Emerald) with primary council assignment  
**Why:** Richmond/Officer were errors; Eltham/Emerald require primary assignment to avoid ambiguity  
**Authority:** `/home/ubuntu/implementation/master_plan.md` (Section 2: Duplicate Suburb Resolution)  
**Sections affected:** Phase 1 database seeding (localities table)

### 6. ✅ Suburb Count: Clarified 138 unique suburbs
**What changed:** Specified exact count of unique suburb-council pairs: 138 (not "5-10 per council")  
**Why:** Authoritative CSV contains 138 enriched suburb records  
**Authority:** `/home/ubuntu/suburbs_councils_mapping.csv` (139 lines = 1 header + 138 data rows)  
**Sections affected:** Phase 1 test data, validation

---

## Executive Summary

This document outlines how to use **Abacus AI agent** to build dogtrainersdirectory.com.au in a phased, checkpoint-driven approach. Each phase is a self-contained task that AI agent can complete in 5–25 minutes, with built-in database, auth, versioning, and one-click deployment.

**Key alignment with AI agent:**
- ✅ Database + Auth: Built-in (no external setup)
- ✅ LLM-ready: Can embed AI features from day 1
- ✅ Versioning: Checkpoint each phase, deploy incrementally
- ✅ Iterative: "Start small, build more on top"
- ✅ Custom domain: Ready for dogtrainersdirectory.com.au

---

## How to Use This Document

1. **Start with Phase 1** (shortest, foundational)
2. **Paste Phase prompt into AI agent chat**
3. **Wait for completion** (5–25 min)
4. **Preview and test** (10–30 min)
5. **Approve or request fixes**
6. **Move to next phase** only if approved
7. **AI agent will auto-checkpoint** each version; you deploy specific checkpoint when ready

---

## Pre-Execution Checklist

Before starting Phase 1:

- [ ] You have Abacus AI Pro tier (or sufficient credits)
- [ ] You have access to dogtrainersdirectory.com.au domain (or will provide to AI agent for custom publishing)
- [ ] You have the **blueprint_ssot_v1.1.md** saved (reference only; don't paste into prompts unless asked)
- [ ] You understand each Phase outputs a **preview + checkpoint** that AI agent stores
- [ ] You know Phase outputs are **never manually edited** before deployment (AI agent manages all code)

---

## PHASE 1: CORE SYSTEM (Database + Auth + Data Models)

**Duration:** 5–15 minutes (AI agent)  
**Complexity:** Low (foundational, no UI yet)  
**Output:** Production-ready backend with databases, enums, validation, test data  
**Checkpoint:** Locked database schema, no further changes to structure in later phases

---

### Phase 1 Prompt for AI agent

```
TASK: Build the core backend for dogtrainersdirectory.com.au

CONTEXT:
You are building the backend for a dog trainer directory service for Melbourne.
The complete specification (canonical SSOT) is available in:
"blueprint_ssot_v1.1.md" (reference only—do NOT require user to paste it repeatedly).

OBJECTIVE:
Set up a production-ready backend with:
1. Database with all required tables and validation
2. Authentication (user signup, login, email verification)
3. Enum validation for locked categories
4. Test data (50 trainer records, 10 emergency resources, 28 councils + 138 suburbs with coordinates)
5. API endpoints (not UI yet; just data model)

REQUIREMENTS FROM SPECIFICATION:

ENTITIES & TABLES:
✓ businesses (trainers, consultants, emergency resources)
✓ trainers (user accounts)
✓ localities (suburbs, Melbourne metro area) - ENRICHED with postcodes + coordinates
✓ councils (LGAs)
✓ reviews (5-star ratings, text)
✓ featured_placements (monetization; conceptual for now)

LOCKED ENUMS (NEVER change, NEVER allow free text):
✓ age_specialties: puppies_0_6m | adolescent_6_18m | adult_18m_7y | senior_7y_plus | rescue_dogs
✓ behaviour_issues (13 values): pulling_on_lead, separation_anxiety, excessive_barking, dog_aggression, leash_reactivity, jumping_up, destructive_behaviour, recall_issues, anxiety_general, resource_guarding, mouthing_nipping_biting, rescue_dog_support, socialisation
✓ service_types (5 values): puppy_training, obedience_training, behaviour_consultations, group_classes, private_training
✓ resource_types (5 values): trainer, behaviour_consultant, emergency_vet, urgent_care, emergency_shelter

KEY CONSTRAINTS FROM SPECIFICATION:
1. Trainers MUST select at least 1 age specialty (minimum 1 required, NOT null)
2. Rescue is orthogonal to age (separate checkbox, can combine with any age)
3. All categories are ENUMS only—no free text ever allowed in category fields
4. Suburb automatically maps to Council (LGA) and Region (no user choice of LGA)
5. ABN verification auto-computes verification_status (verified | unverified | none)
6. Soft delete only—businesses are never hard-deleted

AUTHENTICATION:
✓ Email signup (unique, required)
✓ Password (min 8 chars, hashed)
✓ Email verification (link, 24-hour expiry)
✓ Trainer can own multiple businesses (1-to-many)

GEOGRAPHY DATA (CRITICAL - USE ENRICHED DATA):
✓ 28 Melbourne councils (NOT 31) grouped into 5 regions
✓ 138 unique suburbs with enriched data:
  - suburb name (e.g., "Fitzroy")
  - council_id (foreign key to councils table)
  - region (Inner City, Northern, Eastern, South Eastern, Western)
  - postcode (4-digit Victoria postcode: 3000-3999)
  - latitude (decimal, e.g., -37.8013)
  - longitude (decimal, e.g., 144.9787)
  - character (e.g., "Cultural heritage, creative precinct")
  - ux_label (e.g., "Inner North Creative")

DUPLICATE SUBURB HANDLING:
✓ Eltham → Primary: Shire of Nillumbik (postcode 3095)
✓ Emerald → Primary: Shire of Yarra Ranges (postcode 3782)
✓ Richmond → ONLY City of Yarra (not City of Melbourne - previous data error)
✓ Officer → ONLY Shire of Cardinia (not City of Casey - previous data error)

DISTANCE CALCULATION FUNCTION (REQUIRED):
✓ Implement Haversine formula for calculating distance between two lat/lon pairs:
  CREATE FUNCTION calculate_distance(lat1, lon1, lat2, lon2) RETURNS FLOAT
  - Used for proximity filtering (0-5km, 5-15km, Greater Melbourne)
  - Used for sorting results by distance

TEST DATA TO CREATE:
✓ 50 trainer/consultant records with varied age/issue combinations:
  - Example 1: Loose Lead Training (Fitzroy, City of Yarra, Inner City, -37.8013, 144.9787, adolescent+adult, rescue, 4 issues, behaviour_consultations primary)
  - Example 2: Puppy Basics Preston (Preston, City of Darebin, Northern, -37.7383, 145.0014, puppies only, no rescue, 1 issue)
  - Example 3: Senior Dog Specialists (Box Hill, City of Whitehorse, Eastern, -37.8191, 145.1234, senior only, no rescue, 2 issues)
  - Mix in 5 unverified trainers, 5 scaffolded/unclaimed records
✓ 10 emergency resources (emergency vets, shelters):
  - MASH Ringwood (Ringwood, City of Maroondah, Eastern, -37.8152, 145.2285, 24/7, emergency_vet, emergency_surgery, trauma_care, etc.)
  - Lost Dogs Home Melbourne (North Melbourne, City of Melbourne, Inner City, -37.7982, 144.9404, 24/7, emergency_shelter, stray_intake, rehoming)
  - 8 more realistic emergency venues in Melbourne metro
✓ All 28 Melbourne councils with complete suburb data (138 suburbs with postcodes + coordinates)

VALIDATION RULES (Database Level):
✓ For trainers: age_specialties NOT NULL, minimum 1 value
✓ For emergency resources: age_specialties must be NULL
✓ For trainers: service_type_primary NOT NULL
✓ For emergency resources: emergency_hours NOT NULL, emergency_phone NOT NULL
✓ Any enum field rejects invalid values at insert time (database error if attempted)
✓ Suburb must exist in localities table (foreign key constraint)
✓ Postcode must be valid Victoria postcode (3000-3999 range)

ENCRYPTION:
✓ phone field: AES-256 encrypted at rest
✓ email field: AES-256 encrypted at rest
✓ password: bcrypt hashed (never encrypted, always one-way)
✓ Encryption keys stored in environment variables (not in code)

INDEXING:
✓ business_id (PK)
✓ council_id (for council-based filtering)
✓ suburb_id (for suburb-based filtering)
✓ name (for search)
✓ resource_type (for filtering trainers vs vets)
✓ age_specialties (for age-based filtering)
✓ is_claimed, is_scaffolded (for ownership queries)
✓ latitude, longitude (for spatial queries - optional spatial index)

OUTPUT CHECKLIST:
✓ Database schema created (all tables listed above)
✓ All ENUM types defined and enforced at database level
✓ Validation constraints working (reject age_specialties=[] for trainers, etc.)
✓ Encryption keys configured
✓ Test data inserted: 50 trainers + 10 emergency resources + 28 councils + 138 suburbs (with postcodes + coordinates)
✓ All test data validates against enum constraints
✓ Distance calculation function working (test: calculate distance Fitzroy to Brighton = ~10.5 km)
✓ Preview available (database schema diagram, sample queries)
✓ Checkpoint created (AI agent will manage versions)

DELIVERABLE FORMAT:
- Show me a summary of:
  1. Database schema (table names, key fields, relationships)
  2. Enum definitions and validation rules (how they enforce)
  3. Test data sample (3-5 example business records, showing age/issue/service type with coordinates)
  4. All 28 councils with 138 suburbs (5-10 examples with postcodes + coordinates)
  5. Distance calculation test: Fitzroy (-37.8013, 144.9787) to Brighton (-37.9167, 145.0000) = ~10.5 km
  6. Verification: "Database locked and ready for Phase 2"

NOTES FOR AI AGENT:
- Abacus AI agent has built-in database support—use it; no external DB setup needed
- Use standard SQL (database agnostic if possible, or use AI agent's default)
- All test data must respect enums (no "custom" ages or issues)
- Do NOT create UI or API endpoints yet—just data models and validation
- You will preserve this schema in all later phases—no changes to structure after Phase 1 approval
- CRITICAL: Use 28 councils (not 31), 138 suburbs (not approximate), with postcodes + coordinates

When done, say: "PHASE 1 COMPLETE - Database schema locked, validated, and tested. Ready for Phase 2."
```

---

### Phase 1 Success Criteria

**Before approving Phase 1, verify:**

- [ ] Database schema created (all 6 tables: businesses, trainers, localities, councils, reviews, featured_placements)
- [ ] Enums enforced at database level (attempt to insert invalid enum value → Database error)
- [ ] Test data successfully inserted:
  - 50 trainer/consultant records (mixture of age/issue combinations)
  - 10 emergency resources (vets, shelters)
  - 28 councils (NOT 31)
  - 138 suburbs with postcodes + coordinates (NOT approximate count)
- [ ] Validation rules working:
  - Trainer with age_specialties = [] → REJECTED with error
  - Emergency vet with age_specialties set → REJECTED with error
  - Invalid enum value → REJECTED with error
  - Invalid postcode (<3000 or >3999) → REJECTED with error
- [ ] Encryption working (phone/email unreadable in raw DB output)
- [ ] Soft delete flag present (is_deleted boolean)
- [ ] Distance calculation function working (test: Fitzroy to Brighton = ~10.5 km)
- [ ] Preview shows: Schema diagram + sample queries + data sample with coordinates
- [ ] Checkpoint auto-created by AI agent

- [ ] Approve Phase 1 (proceed to Phase 2) – See `DOCS/PHASE_1_FINAL_COMPLETION_REPORT.md` for data counts, distance check (~12.00 km), and encryption/soft-delete evidence.
- [ ] Request fixes (specify what's missing/broken, re-run Phase 1)

`PHASE 1 COMPLETE – Database schema locked, validated, and tested. Report: PHASE_1_FINAL_COMPLETION_REPORT.md. Ready for Phase 2.`

---

## PHASE 2: USER TRIAGE + FILTERING ENGINE

**Duration:** 10–20 minutes (AI agent)  
**Complexity:** Medium (first UI, filtering logic)  
**Output:** Working triage flow → results display (no styling yet, plain UI)  
**Checkpoint:** Triage logic locked; filtering rules unchangeable in later phases

---

### Phase 2 Prompt for AI agent

```
TASK: Build the user triage flow and filtering engine for dogtrainersdirectory.com.au

CONTEXT:
Phase 1 (database + auth) is complete and locked.
You are now building the first UI: the user journey for finding trainers.

OBJECTIVE:
Create a working triage → results pipeline:
1. Age selection (mandatory, first question)
2. Rescue status checkbox (optional)
3. Issue selection (optional, 13 buttons or "browse all")
4. Suburb input (autocomplete with coordinates for distance)
5. Results page (filtered trainer list, sorted by verified → distance → rating)
6. Real-time sidebar filters (service type, price range, verification, distance)

TRIAGE FLOW (From specification):

STEP 1: Age Selection (MANDATORY, Radio Buttons)
"How old is your dog?"
- [ ] 0-2 months
- [ ] 2-6 months (Puppy)
- [ ] 6-12 months (Adolescent - teenage)
- [ ] 12-18 months (Adolescent - young adult)
- [ ] 18 months - 3 years (Young adult)
- [ ] 3-7 years (Prime adult)
- [ ] 7-10 years (Senior)
- [ ] 10+ years (Very senior)
- [ ] I'm not sure

Validation: User MUST select one age (or "I'm not sure" → defaults to all ages in filter)

STEP 2: Rescue Status (OPTIONAL, Checkbox)
[ ] Is your dog a rescue/rehomed dog?
(If checked: adds "rescue_dogs" to search, but doesn't eliminate other results)

STEP 3: Issue Selection (OPTIONAL, Buttons or "Browse All")
"What's the main problem?"
13 buttons:
[Puppy basics] [Obedience] [Pulling on lead] [Separation anxiety] [Excessive barking]
[Dog aggression] [Leash reactivity] [Jumping] [Destructive] [Recall]
[Anxiety] [Resource guarding] [Mouthing/biting] [Socialisation]

OR [Browse all trainers] (skip issue filter)

STEP 4: Suburb Input (OPTIONAL but recommended, Autocomplete)
"Where are you located?" 
- Autocomplete (grouped by region: Inner City, Northern, Eastern, etc.)
- On select: Auto-assigns Council + Region (never shown to user, used internally)
- Example shown to user: "Fitzroy (City of Yarra)"
- Store suburb coordinates for distance calculations

[SEARCH] button → Proceeds to Results

RESULTS PAGE:

Layout:
- Left sidebar: Real-time filters
- Main content: Trainer result cards (20 per page, paginated)

SIDEBAR FILTERS (Update results in real-time, no submit button):
1. Age (locked from triage, but can change): Radio buttons to re-select
2. Rescue status: Checkbox
3. Issue (locked from triage, but can change): Multi-select checkboxes
4. Service type: Radio (primary service only)
   - [ ] Any
   - [ ] Puppy training
   - [ ] Obedience training
   - [ ] Behaviour consultations
   - [ ] Group classes
   - [ ] Private training
5. Price range: Slider $0–$200
6. Verification: Toggle "Verified only" or "Any"
7. Distance: Radio buttons (USES COORDINATES)
   - [ ] 0-5 km (from selected suburb centroid)
   - [ ] 5-15 km
   - [ ] Greater Melbourne (28 councils)

RESULT CARD (20 per page, infinite scroll or pagination):
[✅ VERIFIED] (if abn_verified = true)
Business Name
Location | ⭐⭐⭐⭐ 42 reviews
Primary service type
[Issue tag 1] [Issue tag 2] [Issue tag 3]
Distance from suburb: 2.3 km (calculated using Haversine from Phase 1)
[CALL] [EMAIL] [WEBSITE] [VIEW PROFILE]

SEARCH BAR (Top of page):
[🔍 Search: business name or issue]
Live matching on:
- Business name ("Loose Lead Training")
- Issue names ("leash reactivity")
- Suburb names ("Fitzroy")
- Age names ("puppies")

FILTERING LOGIC (Database queries):
1. Primary filter: Age/Stage compatibility
   - Only trainers whose age_specialties contains selected age are shown
   - Example: Dog is "18-month adolescent" → Only trainers with "adolescent_6_18m" in age_specialties show
2. Secondary filter: Behaviour issue (if given)
   - Only trainers whose behaviour_issues includes selected issue
3. Tertiary filter: Suburb/distance (USES COORDINATES)
   - Calculate distance from selected suburb coordinates to trainer suburb coordinates
   - Filter by distance threshold (0-5km, 5-15km, or all)
4. Sort order (when multiple results tie):
   - abn_verified DESC (verified first)
   - distance ASC (closest first, using Haversine calculation)
   - rating DESC (highest rated first)

RESULTS PAGE EXAMPLES:

Example 1: User selects Adolescent, Pulling on Lead, Fitzroy
- Query: age_specialties includes "adolescent_6_18m" AND behaviour_issues includes "pulling_on_lead" AND distance from Fitzroy < threshold
- Results sorted: Verified first, then closest (using coordinates), then highest rated
- Shows only matching trainers

Example 2: User selects "I'm not sure" age, Browse All, Collingwood
- Query: All trainers (all ages), no issue filter, distance from Collingwood coordinates
- Results sorted: Verified, distance, rating

Example 3: Filter refine: User in Results, checks "Verified only"
- Query updates immediately: Same age/issue/suburb PLUS abn_verified = true
- Results re-sort in real-time

OUTPUT CHECKLIST:
✓ Triage homepage displays (age selection mandatory, rescue checkbox, issue buttons, suburb autocomplete)
✓ Age selection enforced (can't proceed without selecting)
✓ Suburb autocomplete works (grouped by region: Inner, North, East, South, West)
✓ Results page displays 20 trainer cards per page
✓ Distance calculated correctly (Haversine formula from Phase 1)
✓ Sidebar filters update results in real-time (no page reload, no submit button)
✓ Each filter correctly narrows results:
  - Age filter shows only matching trainers
  - Issue filter shows only matching trainers
  - Service type filter works
  - Price range filter works
  - Verification filter works
  - Distance filter works (0-5km, 5-15km, Greater Melbourne)
✓ Search bar matches on business name, issue, suburb, age (live autocomplete)
✓ URL reflects current filters (can bookmark/share results)
✓ Pagination works (20 per page, "Load more" or page buttons)
✓ Performance acceptable (1000 trainers return results in <1 second)
✓ Test data: 50 trainers loaded; filtering tested across all combinations

TECHNICAL REQUIREMENTS:
- Use AI agent's built-in database connection (Phase 1 schema)
- SQL queries must use indexes (age_specialties, behaviour_issues, is_claimed, resource_type)
- Distance calculations use Haversine function from Phase 1
- Real-time filter updates → No page reload needed
- URL state management → Browser back button works
- Responsive design (mobile + desktop, no styling optimization yet)

NOTES FOR AI AGENT:
- Database schema from Phase 1 is locked—use it as-is
- Do NOT modify database schema or enums in this phase
- Focus only on UI + filtering logic
- Plain HTML/CSS/JS (no fancy styling yet—function over form)
- Test with all 50 trainer records to verify filtering accuracy
- Preview will show triage flow + example results page with distance calculations

When done, say: "PHASE 2 COMPLETE - Triage flow working end-to-end, filtering accurate. Ready for Phase 3."
```

---

### Phase 2 Success Criteria

**Before approving Phase 2, test:**

- [ ] Triage homepage displays and age selection is mandatory
- [ ] Age selection alone → Results show only trainers matching age
- [ ] Age + issue → Results show trainers matching BOTH
- [ ] Age + suburb → Results filtered by location AND distance calculated correctly
- [ ] Rescue checkbox checks → Adds rescue filter (but doesn't eliminate non-rescue)
- [ ] Service type filter works (narrows to selected type)
- [ ] Price range slider works
- [ ] Verified only toggle works
- [ ] Distance filter works (0-5, 5-15, Greater Melbourne) using coordinates
- [ ] Search bar matches trainer names, issues, suburbs, ages
- [ ] Sidebar filters update in real-time (no submit button, results update immediately)
- [ ] Pagination works (20 per page, load more)
- [ ] URL contains filter state (can share/bookmark)
- [ ] All 50 test trainers searchable and filterable
- [ ] Performance: 1000+ trainers query in <1 second
- [ ] Distance calculations accurate (spot check: Fitzroy to Brighton = ~10.5 km)

**Decision:**
- [ ] Approve Phase 2 (proceed to Phase 3)
- [ ] Request fixes (specify issue, re-run Phase 2)

---

## PHASE 3: TRAINER DIRECTORY + PROFILE PAGES

**Duration:** 10–20 minutes (AI agent)  
**Complexity:** Medium (profile UI, reviews display, search)  
**Output:** Full trainer profiles, directory browse, search autocomplete  
**Checkpoint:** Profile structure locked; review display fixed

---

### Phase 3 Prompt for AI agent

```
TASK: Build trainer profile pages and directory browsing for dogtrainersdirectory.com.au

CONTEXT:
Phases 1–2 complete: Database locked, triage + filtering working.
You are now building the full trainer profile view and directory browsing experience.

OBJECTIVE:
1. Individual trainer profile page (full details, reviews, contact)
2. Directory browse page (all trainers, grouped by region/council)
3. Search autocomplete (across trainer names, issues, suburbs, ages)
4. Review display (5-star ratings, text, verified badge)
5. Verified badge display (only if abn_verified = true)

TRAINER PROFILE PAGE:

URL: /trainer/{business_id}

Header:
[✅ VERIFIED] (if abn_verified = true; otherwise blank)
Business name
📍 Fitzroy (City of Yarra) | ⭐⭐⭐⭐ 42 reviews | 2.3 km away (if suburb context available)
---

ABOUT SECTION:
"Specialising in adolescent dogs and urban environments. 8+ years experience. Force-free, reward-based methods."
(Bio text from database, max 500 chars)

---

SERVICES OFFERED:
Primary: Behaviour consultations
Secondary: Group classes, Private training

Age specialties: [Adolescent] [Adult] [Rescue]
Behaviour issues: [Pulling on the lead] [Leash reactivity] [Jumping up]
Formats: [1:1 In-home] [Remote]

---

PRICING:
1:1 in-home: $80/hour
Group class: $45/week
Remote: $60/session
Board-and-train: Contact for quote

---

REVIEWS (Paginated, 5 per page):
⭐⭐⭐⭐ "Transformed my reactive dog!"
Sarah M. (3 weeks ago)
"My adolescent dog went from fearful to confident. Highly recommend!"

⭐⭐⭐⭐ "Professional and kind"
John D. (2 months ago)
"Great communication. Saw results in just 4 sessions."

[Load more reviews ▼]

Average rating: 4.8 stars (42 total reviews)

---

CONTACT & LOCATION:
📞 03 9876 5432 [CALL NOW]
📧 info@looseleadtraining.com.au [EMAIL]
🌐 www.looseleadtraining.com.au [VISIT WEBSITE]
📍 123 Brunswick St, Fitzroy VIC 3065

[BOOK NOW] (or contact trainer directly)

---

DIRECTORY BROWSE PAGE:

URL: /directory

Title: "Melbourne Dog Trainers Directory"

Group by REGION (collapsible):
▼ INNER CITY (23 trainers)
  ├─ Loose Lead Training Fitzroy (✅ Verified, 4.8★)
  ├─ Urban Puppies Carlton (⭐ 4.2★)
  └─ [3 more...]

▼ NORTHERN (35 trainers)
  ├─ Puppy Basics Preston (⭐ 4.5★)
  └─ [more...]

▼ EASTERN (28 trainers)
  ...

Display per region:
- Region name + count
- Trainer cards (verified first, then by rating)
- Each card shows: name, verified badge, rating, primary service, distance (if suburb context), [VIEW PROFILE]

---

SEARCH AUTOCOMPLETE (Global):

Input field at top: [🔍 Search trainers, issues, suburbs...]

As user types:
- "lea" → Suggests: "Leash reactivity", "Loose Lead Training", "Leash training"
- "fitz" → Suggests: "Fitzroy (5 trainers)", "Fitzroy trainers"
- "pup" → Suggests: "Puppies (12 trainers)", "Puppy training", "Puppy Basics Preston"
- "sep anx" → Suggests: "Separation anxiety (8 trainers)"

On select:
- Trainer name → Navigate to profile
- Issue → Navigate to results filtered by issue
- Suburb → Navigate to results filtered by suburb
- Age → Navigate to results filtered by age

Autocomplete populated from:
- Trainer names (distinct)
- All 13 behaviour issues
- All 138 suburbs
- All 5 ages
- Show top 10 results, grouped by type

---

FEATURED BADGES (Visual Placeholder for Phase 5):

If trainer purchased featured placement:
- "🏆 FEATURED" badge appears at top of profile
- Featured trainers appear first in directory listing (before non-featured, same region)

For now (Phase 3): Just show badge if featured_placements.status = 'active'
(Actual purchase flow deferred to Phase 5)

---

OUTPUT CHECKLIST:
✓ Profile page loads trainer details correctly (all fields from database)
✓ Verified badge displays only if abn_verified = true
✓ Age specialties, behaviour issues, service types display as tags
✓ Reviews display (5 per page, paginated)
✓ Average rating calculated and displayed
✓ Contact buttons work (tel links, mailto links, website link)
✓ Directory browse page displays all trainers grouped by region
✓ Featured badge shows (placeholder logic for Phase 5)
✓ Search autocomplete matches trainer names, issues, suburbs (from 138 enriched suburbs), ages
✓ Search navigation works (click result → filters applied or profile shown)
✓ Performance: Profile page loads <1 second, directory <2 seconds
✓ Test with all 50 trainers + 10 emergency resources

TECHNICAL REQUIREMENTS:
- Database schema from Phase 1 locked—use as-is
- Reviews computed: average_rating = AVG(rating) FROM reviews WHERE business_id = X
- Cache profiles (TTL 1 hour) to improve performance
- Soft-deleted trainers excluded from browse/search (is_deleted = false)
- Emergency resources excluded from trainer directory (only resource_type = 'trainer' or 'behaviour_consultant')
- Suburb autocomplete uses all 138 enriched suburbs (not approximate)

NOTES FOR AI AGENT:
- Do NOT modify database or triage/filtering from Phases 1–2
- Focus only on profile UI + directory + search
- Plain styling (function over form; polish in later phase if needed)
- Test autocomplete with all trainer names, issues, 138 suburbs
- Verify featured badge appears correctly (even though purchase is Phase 5)

When done, say: "PHASE 3 COMPLETE - Profiles, directory, and search working. Ready for Phase 4."
```

---

### Phase 3 Success Criteria

**Before approving Phase 3, test:**

- [ ] Profile page displays all trainer info (name, location, bio, services, pricing, contact)
- [ ] Verified badge shows only if abn_verified = true
- [ ] Reviews display (paginated, 5 per page)
- [ ] Average rating calculated and shown
- [ ] Age/issue tags display correctly
- [ ] Contact buttons work (phone, email, website links functional)
- [ ] Directory browse groups trainers by region (5 regions: Inner City, Northern, Eastern, South Eastern, Western)
- [ ] Featured badge displays (if applicable)
- [ ] Search autocomplete suggests trainer names, issues, suburbs (from 138), ages
- [ ] Search navigation works (results filtered or profile shown)
- [ ] All 50 trainers visible in directory + search
- [ ] Performance: Profile <1s, directory <2s, search autocomplete <200ms
- [ ] Emergency resources NOT shown in trainer directory

**Decision:**
- [ ] Approve Phase 3 (proceed to Phase 4)
- [ ] Request fixes

---

## PHASE 4: TRAINER ONBOARDING (MANUAL ONLY - NO WEB SCRAPER)

**Duration:** 15–20 minutes (AI agent)  
**Complexity:** Medium (signup flow, profile editing)  
**Output:** Complete onboarding form, trainer dashboard  
**Checkpoint:** Onboarding logic locked

**NOTE:** Web scraper has been moved to Phase 2 (post-launch). Phase 1 focuses on manual trainer submissions only.

---

### Phase 4 Prompt for AI agent

```
TASK: Build trainer onboarding and profile management (manual submissions only)

CONTEXT:
Phases 1–3 complete: Database, triage, profiles working.
You are building the trainer self-service workflow for MANUAL submissions only.
Web scraper is deferred to Phase 2 (post-launch backfill).

OBJECTIVE:
1. Trainer account creation + email verification
2. Manual business creation flow (no claiming of scraped listings in Phase 1)
3. 6-step profile configuration form
4. Trainer dashboard (stats, profile management)
5. ABN verification with provided GUID

TRAINER SIGNUP FLOW:

Step 1: Create Account
- Email (required, unique validation)
- Password (min 8 chars, strength validation)
- Confirm password
- [CREATE ACCOUNT]
→ System sends verification email (link valid 24 hours)
→ On click: email_verified = true, redirect to Step 2

Step 2: Create Business (MANUAL ENTRY ONLY)
- Form: Business name, phone, email, address, suburb (autocomplete from 138 enriched suburbs)
- [CREATE & CONTINUE] → Move to Step 3

---

Step 3: Edit/configure profile (form with 6 substeps, all in one multi-part form or separate tabs)

**3A: Age Specialties (MANDATORY, min 1 required)**
- Checkboxes (all pre-checked by default):
  - ☑ Puppies (0–6 months)
  - ☑ Adolescent dogs (6–18 months)
  - ☑ Adult dogs (18 months–7 years)
  - ☐ Senior dogs (7+ years)
  - ☑ Rescue/rehomed dogs
- Trainer unchecks unwanted ages
- Validation: "Please select at least one age group" if none checked

---

**3B: Primary Service Type (REQUIRED, single choice)**
- Radio buttons:
  - ○ Puppy training
  - ○ Obedience training
  - ○ Behaviour consultations
  - ○ Group classes
  - ○ Private training
- Trainer selects one

---

**3C: Secondary Services (OPTIONAL, multi-select)**
- Checkboxes (same 5 values as primary, can check any or none):
  - ☐ Puppy training
  - ☐ Obedience training
  - ☐ Behaviour consultations
  - ☐ Group classes
  - ☐ Private training

---

**3D: Behaviour Issues (OPTIONAL, multi-select)**
- Checkboxes (can select any or none of 13 issues):
  - ☐ Pulling on the lead
  - ☐ Separation anxiety
  - ☐ Excessive barking
  - ☐ Dog aggression
  - ☐ Leash reactivity
  - ☐ Jumping up on people
  - ☐ Destructive behaviour
  - ☐ Recall issues
  - ☐ Anxiety (general or fear-based)
  - ☐ Resource guarding
  - ☐ Mouthing, nipping, biting
  - ☐ Rescue dog support
  - ☐ Socialisation

---

**3E: Bio, Pricing, Formats (OPTIONAL text fields)**
- Bio: Text area (max 500 chars, shows char count remaining)
- Pricing fields:
  - "1:1 in-home: $[___] per hour"
  - "Group class: $[___] per session"
  - "Remote: $[___] per session"
  - "Board-and-train: [Text area]"
- Formats offered (multi-select, optional):
  - ☐ 1:1 in-home
  - ☐ 1:1 training centre
  - ☐ Group classes
  - ☐ Remote/online
  - ☐ Board-and-train

---

**3F: ABN Verification (OPTIONAL, gets ✅ badge)**
- Text: "Get verified badge (takes 10 seconds)"
- Input: ABN field (11 digits, format validation)
- [VERIFY NOW] or [SKIP]

**CRITICAL: Use provided ABR GUID for API access:**
- ABR_GUID: `9c72aac8-8cfc-4a77-b4c9-18aa308669ed`
- API endpoint: https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN
- Store GUID in environment variable (never expose to client)

If VERIFY NOW:
- Call ABR lookup API with ABN + GUID
- Extract: Business name, ABN status, entity type
- Calculate name similarity: Claimed name vs. ABR name
- Show result:
  - If ≥85% match: "✅ Verified!" → abn_verified = TRUE, badge displays immediately
  - If <85% match: "⚠️ Name doesn't match (claimed 'X' vs. ABR 'Y')" → abn_verified = FALSE
  - If ABN invalid/inactive: "❌ ABN not found or inactive" → abn_verified = FALSE
- If <85% match: Offer options:
  - [Update business name to match ABR] (auto-fill with ABR name)
  - [Upload ABN certificate] (manual review by admin within 24 hours)
  - [Skip for now] (can verify later from dashboard)

Name Matching Algorithm:
```python
# Normalize both names:
# - Convert to lowercase
# - Remove business suffixes: PTY LTD, LIMITED, PROPRIETARY, etc.
# - Remove punctuation
# - Collapse whitespace
# Calculate similarity using Levenshtein distance or difflib.SequenceMatcher
# Threshold: ≥0.85 (85%) for auto-approval
```

---

Step 4: Publish & Activate
- [COMPLETE & PUBLISH] button
- On success:
  - is_claimed = TRUE
  - is_scaffolded = FALSE (new business, manually created)
  - Profile goes LIVE in directory
  - Email confirmation sent
  - Trainer redirected to Dashboard

---

TRAINER DASHBOARD (After login):

Header:
Loose Lead Training Fitzroy
✅ Verified (if abn_verified = true) | Fitzroy (City of Yarra)

Stats (this month):
234 views | 12 contacts | $0 revenue (placeholder for Phase 5 monetization)

---

ACTIONS:
[EDIT PROFILE] → Return to Step 3 to modify age, issues, pricing, bio, etc.
[VIEW MY LISTING] → Show how profile appears to dog owners (preview)
[MANAGE REVIEWS] → See reviews, respond (Phase 5)
[VERIFY ABN] → If not verified, option to verify now (same as 3F)
[LOGOUT]

---

OUTPUT CHECKLIST:
✓ Trainer signup form works (email, password, validation)
✓ Email verification working (link sent, valid 24 hours, account unlocked on click)
✓ Manual business creation form works (name, phone, email, address, suburb from 138 enriched suburbs)
✓ Profile form renders all 6 steps (can navigate forward/back)
✓ Age selection mandatory (validation works - rejects if none checked)
✓ Service type selection mandatory (validation works - rejects if none selected)
✓ Secondary services optional (no validation)
✓ Behaviour issues optional (no validation)
✓ ABN verification working:
  - Calls ABR API with GUID: 9c72aac8-8cfc-4a77-b4c9-18aa308669ed
  - Shows result (verified, name mismatch, or invalid)
  - ≥85% match → Auto-approve
  - <85% match → Manual upload option
✓ Profile goes live after completion (is_claimed = TRUE)
✓ Dashboard displays stats (views, contacts, revenue placeholder)
✓ Dashboard [EDIT PROFILE] returns to form with pre-filled data
✓ Dashboard [VERIFY ABN] works if skipped during onboarding

TECHNICAL REQUIREMENTS:
- Database schema from Phases 1–3 locked—use as-is
- Email verification: Send JWT or hashed code, validate on click
- ABN API integration: Use provided GUID, server-side only (never expose to client)
- ABN name matching: Levenshtein or difflib, threshold ≥0.85
- Suburb autocomplete: 138 enriched suburbs (not approximate)
- Test ABN: Use valid test ABNs (e.g., Telstra: 53 004 085 616)

NOTES FOR AI AGENT:
- Do NOT modify database, triage, profiles, or search from Phases 1–3
- Onboarding form: Store selected enums, not free text
- NO WEB SCRAPER in this phase (deferred to Phase 2 post-launch)
- NO business claiming flow (no scaffolded/scraped listings exist yet)
- Focus on manual submissions only
- Email: AI agent handles; provide placeholders if external service unavailable
- Test ABN verification with real ABR API calls (use test ABNs)

When done, say: "PHASE 4 COMPLETE - Trainer onboarding and dashboard working (manual only). Ready for Phase 5."
```

---

### Phase 4 Success Criteria

**Before approving Phase 4, test:**

- [ ] Trainer signup works (email, password, validation)
- [ ] Email verification works (link sent, account activated)
- [ ] Manual business creation form works (name, phone, email, address, suburb from 138)
- [ ] Profile form renders all 6 steps
- [ ] Age selection mandatory (rejects if none checked)
- [ ] Service type mandatory (rejects if none selected)
- [ ] ABN verification calls API with GUID: 9c72aac8-8cfc-4a77-b4c9-18aa308669ed
- [ ] ABN ≥85% match → Auto-approve, ✅ badge appears
- [ ] ABN <85% match → Manual upload option shown
- [ ] Profile goes live (is_claimed = TRUE, is_scaffolded = FALSE)
- [ ] Dashboard shows stats (views, contacts, revenue)
- [ ] [EDIT PROFILE] returns with pre-filled data
- [ ] [VERIFY ABN] works if skipped during onboarding
- [ ] All test data passes validation
- [ ] NO web scraper present (deferred to Phase 2)

**Decision:**
- [ ] Approve Phase 4 (proceed to Phase 5)
- [ ] Request fixes

---

## PHASE 5: EMERGENCY RESOURCES + ADMIN DASHBOARD

**Duration:** 10–20 minutes (AI agent)  
**Complexity:** Medium (emergency workflows, admin features)  
**Output:** Complete emergency pathways, admin dashboard  
**Checkpoint:** Core system complete, ready for launch

**NOTE:** Featured placements (Stripe — $20 / 30-day slots, FIFO per LGA) are part of **Phase 1** (locked) and should be implemented during Phase 1 deliverables. Premium subscriptions and other monetization flows remain deferred to Phase 1.5 / Phase 2+ per the STRIPE master spec.

---

### Phase 5 Prompt for AI agent

```
TASK: Add emergency resources integration and admin features

CONTEXT:
Phases 1–4 complete: Full directory + trainer onboarding working (manual only).
This phase adds emergency pathways and admin tools. Monetization deferred to post-launch.

OBJECTIVE:
1. Emergency resource integration (vets, shelters, crisis trainers)
2. Emergency triage branch (medical vs stray vs crisis)
3. Admin dashboard (moderation, resource management, stats)

EMERGENCY RESOURCES:

Emergency Resource Types:
1. emergency_vet (24/7 hospitals)
2. emergency_shelter (lost dogs home, RSPCA, pounds)
3. urgent_care (after-hours vets)

Populate with 50+ real Melbourne emergency resources:
- MASH Ringwood (Ringwood, City of Maroondah, Eastern, 24/7 emergency vet)
- Southpaws Malvern East (Malvern East, City of Stonnington, South Eastern, 24/7 walk-in emergency)
- CARE Collingwood (Collingwood, City of Yarra, Inner City, 24-hour emergency + specialist)
- Advanced Vetcare Kensington (Kensington, City of Melbourne, Inner City, 24-hour critical care)
- Animal Emergency Centre (multiple locations across Melbourne)
- Lost Dogs Home Melbourne (North Melbourne, City of Melbourne, Inner City, 24/7 emergency intake)
- RSPCA Victoria (local centers across 28 councils)
- Council animal control (all 28 councils - add representative contacts)
- 40+ more realistic emergency venues across Melbourne's 28 councils

Fields for emergency resources:
- emergency_hours ("24/7", "7pm–6am", "Mon–Fri 6pm–midnight")
- emergency_phone (distinct from general phone)
- services_offered (multi-select: emergency_surgery, trauma_care, critical_care, poison_control, stray_intake, rehoming_support)
- cost_indicator ($, $$, $$$, Free, Subsidized)
- capacity_notes ("~50 cases/night", "100–200 animals typical")

---

EMERGENCY HELP TRIAGE (New homepage option):

Homepage now has TWO paths:
1. [Find a Trainer] → Standard triage (Phases 1–3)
2. [Emergency Help] → New emergency branching

EMERGENCY TRIAGE:
"What's happening?"
- [ ] Normal problem (pulling, barking, etc.) → Go to standard trainer search
- [ ] Medical emergency (injury, bleeding, choking, collapse) → MEDICAL FLOW
- [ ] Stray/lost dog found → STRAY FLOW
- [ ] Sudden aggression or behaviour crisis → CRISIS FLOW
- [ ] Not sure → Diagnostic questions → Route to appropriate flow

---

MEDICAL EMERGENCY FLOW:

Triage: "Is your dog actively bleeding, unable to breathe, or unresponsive?"
- YES → Skip to emergency vet list (no delays)
- NO → Ask severity, still show vets

Display (sorted by distance from user's suburb if provided, then 24-hour availability):
🚨 EMERGENCY VETERINARY HOSPITALS NEAREST TO YOU

MASH Ringwood
📍 Ringwood, Eastern Melbourne | 2.3 km away
📞 03 9876 5600 | 🕐 24-hour
Emergency surgery, Trauma care, Critical care, Poison control
[CALL NOW] [GET DIRECTIONS] [WEBSITE]

Southpaws Malvern East
📍 Malvern East, South Eastern Melbourne | 5.1 km away
📞 03 9569 3677 | 🕐 24/7
Emergency surgery, Trauma care, Critical care
[CALL NOW] [GET DIRECTIONS]

[50+ more vets listed by distance or region]

Action buttons:
- [CALL NOW] → Auto-dial phone (tel: link)
- [GET DIRECTIONS] → Open map app with address (maps.google.com or Apple Maps)
- [WEBSITE] → Opens vet info page

---

STRAY DOG FOUND FLOW:

Triage: "Is the dog wearing ID or microchipped?"
- YES → Suggest contacting owner; offer shelter contact
- NO → Proceed to shelter flow

Display (sorted by distance or region):
🚨 EMERGENCY SHELTERS & ANIMAL CONTROL

LOST DOGS HOME MELBOURNE
📍 North Melbourne, Inner City | 3.2 km away
📞 13 2468 (1300-DOGS-HOME) | 🕐 24-hour intake
Services: Stray dog intake, Rehoming support, Microchip checking
[CALL NOW] [REPORT DOG]

RSPCA Victoria
📍 Local centers across Melbourne (28 councils)
📞 1300 678 673
Services: Stray dog intake, Rehoming
[FIND NEAREST] [REPORT DOG]

Council Animal Control
📍 [Council name based on user's suburb if provided]
📞 [Council phone]
[REPORT TO COUNCIL]

---

CRISIS TRAINER FLOW (Sudden Aggression/Behaviour Crisis):

Filter to rescue + aggression/anxiety trainers:
- resource_type = 'trainer' or 'behaviour_consultant'
- age_specialties includes dog's age (user provides)
- behaviour_issues includes 'dog_aggression' OR 'anxiety_general'
- age_specialties includes 'rescue_dogs' (preferred but not required)

Display: Same as standard results (from Phase 2), sorted by verified → distance → rating

Highlight: In-home or remote options (urgent intervention needed)

Note: "If immediate risk to human or other dog, contact council animal control or emergency vet"

---

ADMIN DASHBOARD (NEW):

Access: /admin (restricted to admin accounts, separate authentication)

Overview:
- Total trainers: 50 claimed, 0 unclaimed (no scraper yet)
- Emergency resources: 50+ active
 - Featured slots: Phase 1 monetization (Featured placements - $20 AUD / 30-day FIFO per LGA). Implement checkout + webhook flow, DB columns, and queue logic (see STRIPE/phase1_mvp_master_spec.md). Default 0 active until purchases are made.
- Recent activity: Profile edits, review submissions, ABN verifications

---

MODERATION:
[Review Pending Reviews] → Approve/reject review submissions (from dog owners)
[Review Flagged Listings] → Reported trainers (spam, fake - AI flagged if implemented)
[Edit Emergency Resources] → CRUD operations on vets/shelters/pounds

---

RESOURCE MANAGEMENT:
[Add Emergency Resource] → Create new vet/shelter (manual entry)
[Edit Emergency Resource] → Update hours, phone, services, coordinates
[Deactivate Resource] → Soft delete (is_deleted = TRUE)

---

ANALYTICS:
- Views by region (which regions get most searches)
- Trainer search trends (which ages/issues most searched)
- Emergency resource hit count (which vets/shelters viewed most)
- Reviews and ratings distribution
- ABN verification success rate (auto-approved vs manual)

---

OUTPUT CHECKLIST:
✓ Emergency vet list displays (50+ resources sorted by distance or region)
✓ Emergency shelter list displays (with contact info)
✓ Crisis trainer filter works (rescue + aggression/anxiety)
✓ Medical emergency [CALL NOW] works (tel: links)
✓ Stray dog [REPORT] functionality works (links to shelter forms)
✓ Admin dashboard displays (stats, moderation, resource control)
✓ Admin can add/edit/deactivate emergency resources
✓ Admin can approve/reject pending reviews
✓ Admin can view analytics (search trends, region stats)
✓ All test data: 50 trainers, 50+ emergency resources
✓ Performance: Emergency pages load <1 second

TECHNICAL REQUIREMENTS:
- Database: emergency resources use same businesses table (resource_type = emergency_vet/shelter/urgent_care)
- Admin routes: Protected by auth middleware (separate admin authentication)
- Emergency triage: Keyword + NLP classification (fully automated, 98% accuracy per AI assessment)
- Distance sorting: Use Haversine function from Phase 1

NOTES FOR AI AGENT:
- Do NOT modify database or logic from Phases 1–4
- Emergency resources: Pre-populate with realistic Melbourne venues across 28 councils
- Admin dashboard: Simple UI (function over form)
- NOTE: Featured placements (Stripe — $20 / 30-day slots) are implemented as Phase 1. Premium subscriptions and other monetization flows remain deferred to Phase 1.5+.
- NO web scraper management (scraper is Phase 2 post-launch)

When done, say: "PHASE 5 COMPLETE - Emergency pathways and admin dashboard working. Core system ready for launch."

DEPLOYMENT CHECKLIST:
✓ All 5 phases approved
✓ Database locked and tested (28 councils, 138 suburbs with coordinates)
✓ Email verification working (or simulated)
✓ ABN verification working with GUID: 9c72aac8-8cfc-4a77-b4c9-18aa308669ed
✓ Emergency resources populated (50+ venues)
✓ Admin dashboard accessible
✓ No unfinished TODOs or placeholders
✓ Ready for custom domain publishing

NEXT STEP: Provide custom domain (dogtrainersdirectory.com.au) to AI agent for one-click publishing.
```

---

### Phase 5 Success Criteria

**Before approving Phase 5, test:**

- [ ] Emergency vet list shows 50+ resources (sorted by distance or region)
- [ ] Emergency shelter list shows contacts + report functionality
- [ ] Crisis trainer filter works (rescue + aggression/anxiety from Phase 2 filtering)
- [ ] Medical emergency [CALL NOW] functional (tel: links)
- [ ] Stray dog [REPORT] functional (links work)
- [ ] Admin dashboard displays stats, moderation, resource control
- [ ] Admin can add/edit/deactivate emergency resources
- [ ] Admin can approve/reject pending reviews
- [ ] Admin can view analytics (search trends, region stats)
- [ ] All validation rules still enforced (enums, age mandatory, etc.)
- [ ] Performance: Emergency pages <1s, admin dashboard <2s
 - [ ] Featured placements (Stripe $20/30-day) present in Phase 1 — ensure checkout + webhook handling + DB fields are present and tested
- [ ] NO web scraper management present (scraper is Phase 2)

**Decision:**
- [ ] Approve Phase 5 → READY FOR PRODUCTION
- [ ] Request fixes (final issues)

---

## FINAL DEPLOYMENT

Once Phase 5 approved:

1. **Connect custom domain** (dogtrainersdirectory.com.au)
   - Provide domain to Abacus AI agent
   - One-click integration
   - App goes live at custom URL in minutes

2. **Enable production database** (if using separate prod/test)
   - Use enriched data from Phase 1 (28 councils, 138 suburbs with coordinates)
   - 50 test trainers can remain or be cleared for production

3. **ABN production credentials** (already using provided GUID)
   - GUID: 9c72aac8-8cfc-4a77-b4c9-18aa308669ed (production-ready)

4. **Email production** (if simulated so far)
   - Connect SendGrid (email) for verification emails
   - Test real verification flow

5. **Launch**
   - Monitor admin dashboard
   - Respond to trainer onboarding
   - Plan Phase 2: Web scraper (backfill directory post-launch)

---

## Execution Timeline

| Phase | Duration | Cumulative | Checkpoint |
|----|----|----|----|
| **1** | 5–15m | 5–15m | Database locked (28 councils, 138 suburbs with coordinates) |
| **2** | 10–20m | 15–35m | Triage working (distance calculations) |
| **3** | 10–20m | 25–55m | Profiles + search (138 suburbs) |
| **4** | 15–20m | 40–75m | Onboarding (manual only, ABN with GUID) |
| **5** | 10–20m | 50–95m | Emergency + admin (core system complete) |

**Total:** 50–95 minutes (AI agent execution) + 30–60 minutes (review + testing per phase) = **2–3 days elapsed**

---

## Key AI agent Alignment

✅ **Database + Auth built-in** → No external setup; Phases 1–2 leverage this  
✅ **Checkpointing** → Each phase auto-saved; deploy specific checkpoint  
✅ **Versioning** → Rollback to earlier phase if needed  
✅ **Custom domain** → One-click publishing at end  
✅ **Iterative** → Phase 1 MVP (manual only), Phase 2+ adds scraper/monetization  
✅ **Workflow automation** → Emergency triage fully automated

---

## Post-Launch Roadmap (Phase 2+)

### Phase 2 (2-6 months post-launch)
**Web Scraper (Backfill Directory):**
- ✅ Collect seed list (50-100 trainer URLs)
- ✅ LLM extraction + enum mapping
- ✅ Scaffolded profiles (unclaimed, discoverable)
- ✅ "Claim Your Business" CTA
- ✅ Weekly scrape schedule
- ✅ Guardrails:
  - Feature-flagged via `SCRAPER_ENABLED`; scraping stays off in production until the flag is flipped and the toggle workflow is documented in `DOCS/automation-checklist.md`.
  - QA sample ≥10 listings/run with accuracy target ≥95% before publish, logging sample sets and scores in `qa_run_log.json`.
  - AI-assisted QA: LLM compares scraped fields vs source URLs/screenshots, enforces locked enums, flags missing/invalid contact data; human gate approves flagged items before publish and triggers Resend notifications using the API key stored in `.env.local`.
  - Deduplicate on ABN (if present), phone, email, and name+address
  - Use locked enums only (no free-text categories); validate phones/emails; derive LGA from suburb→council CSV
  - Mark scraped entries unverified (blue badge); do not auto-claim; keep monetization off
  - Public data only (trainer sites/GBusiness/social); honor privacy/disclaimer posture
  - Log runs and metrics to `qa_run_log.json`, including accuracy/batch verdicts and human approvals, with cross-checks against `DOCS/PHASE_1_FINAL_COMPLETION_REPORT.md` to ensure counts stay aligned with the SSOT
  - QA runner outline (make actionable):
    - Inputs: scraped JSON + source URLs/screenshots
    - Steps: LLM field comparison, enum enforcement, contact validation, dedupe checks (ABN/phone/email/name+address), confidence scoring
    - Outputs: per-listing verdicts, batch accuracy %, reasons for failures; fail batch if accuracy <95% or required contact fields missing
    - Storage: persist run log (samples checked, issues found, human approvals) in `qa_run_log.json` for audit/rollback

**Data Enrichment:**
- ✅ Geocode claimed trainer addresses (validate council assignments)
- ✅ Auto-correct council_id if mismatch detected

**AI Automation Optimization:**
- ✅ Review pre-filter (auto-approve 40% clean reviews)
- ✅ Email/phone verification (reduce spam 80%)
- ✅ ABN auto-retry (re-check failed ABNs after 48 hours)

### Phase 3+ (6-12 months post-launch)
**UX Enhancements:**
- ✅ Map view (trainer pins, clustering)
- ✅ Advanced filters (years in business, qualifications)
- ✅ Review responses (trainers reply to reviews)
- ✅ Save/favorite trainers (dog owner accounts)

**Monetization (Phase 1 + Phase 1.5 planned):**
- ✅ Featured slots (Stripe payments) — Phase 1 (current): $20 AUD / 30-day FIFO per LGA, webhook-driven lifecycle
- ✅ Subscription / premium tiers — Phase 1.5 (deferred): monthly recurring flows, invoice handling, invoice.payment_succeeded/failed webhooks
- ✅ Analytics dashboard for trainers — Phase 1 (metrics from clicks/inquiries); expand for subscription analytics in Phase 1.5+

### Dev / webhook testing notes (avoid collisions)

- Use the repo's dedicated local webhook harness for dogtrainersdirectory to avoid collisions with other local applications (for example, any dev server already listening on `localhost:3000`). The harness is `webhook/server_dtd.py` and defaults to port **4243** and endpoint `/api/webhooks/stripe-dtd`.
- Local forward command example: `stripe listen --forward-to localhost:4243/api/webhooks/stripe-dtd` and use `stripe trigger checkout.session.completed` to test the purchase lifecycle.
- Always verify `Stripe-Signature` and persist `event.id` in an ingestion audit table to protect against duplicated/retried webhook events.

---

**Document Version:** 2.1 (CORRECTED)  
**Alignment:** Abacus AI agent Official Documentation + Finalized User Decisions  
**Status:** READY FOR EXECUTION

---

## How to Start

1. Copy **Phase 1 Prompt** (full text above)
2. Paste into Abacus AI agent chat
3. Click "Run Phase 1"
4. Wait 5–15 minutes
5. Review deliverable + test success criteria
6. Approve or request fixes
7. If approved, repeat for Phases 2–5

**AI agent will manage all versioning, checkpointing, and deployment. You just review + approve each phase.**

---

## Reference Documents

All authoritative documents located at `/home/ubuntu/`:

1. **blueprint_ssot_v1.1.md** - Blueprint SSOT (28 councils, locked taxonomies)
2. **suburbs_councils_mapping.csv** - Enriched suburb data (138 rows, postcodes, coordinates)
3. **implementation/master_plan.md** - Master implementation plan (phasing, decisions)
4. **implementation/ai_automation_assessment.md** - AI automation capabilities and limitations
5. **implementation/duplicate_suburb_resolution.md** - Duplicate suburb strategy
6. **implementation/abn_validation_implementation.md** - ABN validation guide (ABR API, GUID)

---

**END OF CORRECTED EXECUTION PLAN v2.1**
