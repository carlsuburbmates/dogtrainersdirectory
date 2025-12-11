> **SSOT – Canonical Source of Truth**
> Scope: Product blueprint & domain rules
> Status: Active · Last reviewed: 2025-12-09

---

# dogtrainersdirectory.com.au – Complete Conceptual Blueprint (SSOT)

**Version:** 1.1  
**Date:** 28 November 2025  
**Purpose:** Universal, technology-agnostic specification for all future implementation.  
**Status:** LOCKED IN – Single Source of Truth for dogtrainersdirectory.com.au

---

## CHANGELOG (v1.1)

**Version 1.1 – 28 November 2025**

### Changes:
- **Council count correction:** Updated all references from 31 metropolitan councils to 28 councils
  - Sections affected: 1.2, 1.4, 3.5, 3.6, 4.7, 8.1
  - Rationale: Authoritative suburb-council mapping data (suburbs_councils_mapping.csv) contains exactly 28 unique councils
  - No functional changes to logic, taxonomies, or user journeys

**Version 1.0 – 28 November 2025**
- Initial SSOT release

---

## 1. Product Overview

### 1.1 What this product is

dogtrainersdirectory.com.au is a hyperlocal directory and matching service that connects dog owners in Melbourne with qualified trainers and behavioural consultants, based on their dog's age/stage and specific behavioural needs. It surfaces verified trainers first and integrates emergency veterinary resources and animal shelters for crisis situations.

### 1.2 Who it is for

**Primary users:**
- Dog owners in Melbourne metropolitan area (any postcode within 28 councils).
- Trainers and behaviour consultants (for-profit or non-profit).
- Emergency veterinary clinics and animal shelters (passive directory presence).

**Secondary uses:**
- Council/pound staff may refer lost dog finders to shelter contacts.
- Trainers may refer owners to emergency vets in crisis scenarios.

### 1.3 Core goals

1. **Reduce mismatch:** Help dog owners find trainers whose age/stage and behaviour specialties match their dog's actual needs, not just generic listings.
2. **Age is primary:** Always ask age *first* (before issue, before location) because training methods differ fundamentally by age/stage.
3. **Trust first:** Surface verified trainers (ABN-checked) at the top of results; unverified trainers visible but without badge.
4. **Emergency pathways:** Provide clear, fast routes to 24-hour vets, shelters, and crisis support trainers when owners are in emergencies.
5. **Suburb-first UX:** Users think in suburbs and council areas, not LGAs; system automatically maps suburbs to councils and regions behind the scenes.
6. **Accurate data:** No free-text categories; all trainer info (age, issues, services) comes from locked taxonomies, preventing confusion and drift.

### 1.4 Non-goals

- Not a DIY training content site (no training videos, articles, or downloadable plans as core product, though may link externally).
- Not a booking/payment processor (trainers handle their own client management; directory is discovery only).
- Not a social network or review aggregator (reviews are secondary; trust badge is primary signal).
- Not for interstate or rural areas outside Melbourne metropolitan councils (scope locked to 28 councils).
- Not a veterinary clinic directory for routine care (only emergency/after-hours vets and shelters relevant to dog training crisis).

---

## 2. Domain Model

### 2.1 Core Entities

#### Business
A business is a trainer, behaviour consultant, emergency vet, urgent care facility, or emergency shelter offering services related to dogs in Melbourne.

**Fields (conceptual, not schema):**
- **Identity:** Name, phone, email, address, website (optional)
- **Location:** Suburb (user-entered), Council/LGA (auto-derived), Region (auto-derived)
- **Description:** Short bio (max 500 chars), pricing info, service areas
- **Resource type:** One of: `trainer`, `behaviour_consultant`, `emergency_vet`, `urgent_care`, `emergency_shelter`
- **For trainers/consultants ONLY:**
  - Age specialties (multi-select, at least 1 required): Puppies, Adolescent, Adult, Senior, Rescue
  - Behaviour issues (multi-select, optional): 13 locked values (pulling on lead, separation anxiety, excessive barking, dog aggression, leash reactivity, jumping up, destructive behaviour, recall issues, anxiety general, resource guarding, mouthing/nipping/biting, rescue dog support, socialisation)
  - Service type primary (required): Puppy training, Obedience training, Behaviour consultations, Group classes, Private training
  - Service types secondary (multi-select, optional): Same 5 values as primary
  - Formats offered (multi-select, optional): 1:1 in-home, 1:1 training centre, Group classes, Remote/online, Board-and-train
- **For emergency resources ONLY:**
  - Emergency hours (e.g., "24/7", "7pm–6am", "Mon–Fri 6pm–midnight")
  - Services offered (multi-select): Emergency surgery, Trauma care, Critical care, Poison control, Stray dog intake, Rehoming support, etc. (varies by type)
  - Emergency phone (distinct from general phone)
  - Dedicated hotline (boolean)
  - Cost indicator: Free, Subsidized, $, $$, $$$
  - Capacity notes (e.g., "typically 100–200 dogs")
  - Specialty animals (optional): Dogs, Cats, Exotic
- **Verification:** ABN-verified (boolean, auto-set after ABN check), Verification status (auto-computed: verified | unverified | none)
- **Status:** Claimed by trainer (true/false), Scaffolded/auto-populated (true/false), Soft-deleted (true/false)
- **Metadata:** Data source (web_scrape | manual_form | trainer_provided | admin_added), Created at, Last updated, Last scraped

#### Trainer
A human account that owns and manages one or more Business records. Distinct from Business (a trainer account can claim multiple business locations).

**Fields:**
- Email (unique)
- Password hash
- Email verified (boolean)
- Created at, Last login

#### Dog Owner (Implicit)
Not stored in database (anonymous/unauthenticated). Represented by their selections during search: age, rescue status, issue, suburb.

#### Locality (Suburb)
A suburb in the Melbourne metropolitan area. User-facing; searchable; mapped to exactly one Council and one Region.

**Fields:**
- Suburb name (e.g., "Fitzroy")
- Council ID (foreign key)
- Region (derived from council; e.g., "Inner City", "Northern", "Eastern", "South Eastern", "Western")
- Latitude, Longitude (for distance calculations)

#### Council / LGA (Local Government Area)
A metropolitan council in Melbourne. Never directly selected by users; always derived from suburb choice.

**Fields:**
- Council name (e.g., "City of Yarra")
- Region (e.g., "Inner City")
- Postcode (primary)
- Number of suburbs in council
- Key characteristics (for UX grouping, e.g., "Cultural heritage, creative precinct")

#### Age/Stage Category
A locked, non-negotiable category describing a dog's developmental stage.

**Values (exactly these 5, no others):**
1. Puppies (0–6 months): Newborn to teething to growing
2. Adolescent dogs (6–18 months): Teenage phase to young adult
3. Adult dogs (18 months–7 years): Young adult through prime adult
4. Senior dogs (7+ years): Mature through very senior (showing age signs)
5. Rescue/rehomed dogs (any age, trauma/unknown history): Shelter, street, or abused dogs requiring decompression and trust-building

**Key constraint:** Rescue is orthogonal to age (a dog is "adolescent AND rescue" if it's a 7-month-old shelter dog).

#### Behaviour Issue Category
A locked, multi-select category describing problem behaviours trainers address.

**Values (exactly these 13, no others):**
- Pulling on the lead
- Separation anxiety
- Excessive barking
- Dog aggression
- Leash reactivity
- Jumping up on people
- Destructive behaviour
- Recall issues
- Anxiety (general or fear-based)
- Resource guarding
- Mouthing, nipping, biting
- Rescue dog support
- Socialisation

#### Service Type Category
A locked, single-select (primary) or multi-select (secondary) category describing the trainer's core offering.

**Values (exactly these 5, no others):**
- Puppy training
- Obedience training
- Behaviour consultations
- Group classes
- Private training

#### Resource Type Category
A category describing whether a Business is a trainer, consultant, or emergency resource.

**Values (exactly these 5, no others):**
- `trainer`: Trainer offering services to dog owners
- `behaviour_consultant`: Behaviour specialist offering consultations
- `emergency_vet`: 24/7 emergency veterinary hospital
- `urgent_care`: After-hours or urgent care vet clinic
- `emergency_shelter`: Animal shelter, pound, or rescue intake facility

#### Review
A rating and text comment left by a dog owner on a trainer's business profile.

**Fields:**
- Reviewer name (or initials)
- Star rating (1–5)
- Review text (max 500 chars, optional)
- Created at
- Verified (boolean; admin-set to distinguish from spam)

#### Featured Placement
A monetisation artefact: a trainer purchases time/visibility in results (conceptually—details deferred to implementation).

**Fields (conceptual only):**
- Business ID (what listing is featured)
- Start date, End date
- Tier (basic | mid | premium)
- Status (active | expired | cancelled)

---

### 2.2 Relationships (Plain Language)

- **Business ↔ Locality (Suburb):** A Business has one Suburb. A Suburb is in many Businesses.
- **Locality ↔ Council:** A Suburb belongs to exactly one Council. A Council contains many Suburbs.
- **Council ↔ Region:** A Council belongs to exactly one Region. A Region contains multiple Councils.
- **Trainer ↔ Business:** A Trainer account can own/claim multiple Businesses. A Business has zero or one Trainer owner (unclaimed if null).
- **Business ↔ Age/Stage:** A trainer/consultant Business must select at least one Age/Stage. A Business can select multiple; each selection is a tag.
- **Business ↔ Behaviour Issue:** A trainer/consultant Business can select zero or more Behaviour Issues. Each selection is optional but improves discoverability.
- **Business ↔ Service Type:** A Business (trainer/consultant) has exactly one primary Service Type and can have multiple secondary Service Types.
- **Business ↔ Review:** A Business has many Reviews. A Review belongs to exactly one Business (not tied to user, anonymous).
- **Business ↔ Featured Placement:** A Business may have one active Featured Placement at any time. A Featured Placement applies to exactly one Business.

---

## 3. Canonical Taxonomies (Locked Data)

### 3.1 Age/Stage Specialties (REQUIRED for all trainers/consultants)

| Label | Age Range | Key Characteristics | Common Training Needs |
|-------|-----------|-------------------|----------------------|
| Puppies | 0–6 months | Newborn, teething, rapid growth, first interactions | Toilet training, bite inhibition, early socialization, foundational manners |
| Adolescent dogs | 6–18 months | Teenage phase, independence, impulse testing | Impulse control, recall under distraction, boundary setting, energy management |
| Adult dogs | 18 months–7 years | Young adult (peak energy) through prime adult (stable) | Behavioral issues, specific retraining, manners refinement, maintenance |
| Senior dogs | 7+ years | Showing age signs (7–10 yrs), mobility/cognitive changes (10+ yrs) | Gentle methods, mobility accommodation, pain-aware handling, cognitive enrichment |
| Rescue/rehomed dogs | Any age; trauma/unknown history | Shelter, street, abused, behaviorally unknown dogs | Decompression, trust-building, trauma-informed training, slow reintegration |

**Constraint:** Every trainer must select at least one. Rescue is independent and can combine with any age.

### 3.2 Behaviour Issues (Multi-select, optional for trainers)

1. Pulling on the lead
2. Separation anxiety
3. Excessive barking
4. Dog aggression
5. Leash reactivity
6. Jumping up on people
7. Destructive behaviour
8. Recall issues
9. Anxiety (general or fear-based)
10. Resource guarding
11. Mouthing, nipping, biting
12. Rescue dog support
13. Socialisation

### 3.3 Service Types (Primary required, secondary multi-select optional for trainers/consultants)

1. Puppy training
2. Obedience training
3. Behaviour consultations
4. Group classes
5. Private training

### 3.4 Resource Types (One per business; determines which fields are active)

1. `trainer` – Trainer offering training services
2. `behaviour_consultant` – Behaviour specialist
3. `emergency_vet` – 24/7 emergency veterinary hospital
4. `urgent_care` – Extended-hours or urgent vet clinic
5. `emergency_shelter` – Animal shelter, pound, lost dogs home, rescue intake

### 3.5 Regions (For grouping and navigation)

**Derived from Melbourne metropolitan councils; user-facing grouping:**

1. **Inner City:** City of Melbourne, City of Port Phillip, City of Yarra
2. **Northern:** City of Banyule, City of Darebin, City of Hume, City of Merri-bek, City of Whittlesea, Shire of Nillumbik
3. **Eastern:** City of Boroondara, City of Knox, City of Manningham, City of Maroondah, City of Whitehorse, Shire of Yarra Ranges
4. **South Eastern:** City of Bayside, City of Glen Eira, City of Kingston, City of Casey, City of Frankston, Shire of Cardinia, Mornington Peninsula Shire
5. **Western:** City of Brimbank, City of Hobsons Bay, City of Maribyrnong, City of Melton, City of Moonee Valley, City of Wyndham

### 3.6 Councils and Suburbs (Authority: Suburbs-councils-catchment.pdf)

**Key principle:** 
- Users select suburbs (intuitive, Melbourne residents know their suburb name).
- System automatically assigns Council (LGA) and Region.
- No user ever sees or selects "LGA" terminology; only "Area" or "Council name" labels such as "Fitzroy (City of Yarra)" or "Brighton & Bayside".

**28 metropolitan councils with example suburbs (non-exhaustive; use CSV as authoritative source):**

| Region | Council | Example Suburbs |
|--------|---------|-----------------|
| Inner City | City of Melbourne | Carlton, Docklands, Parkville, Kensington, North Melbourne |
| Inner City | City of Port Phillip | St Kilda, Albert Park, Elwood, Balaclava |
| Inner City | City of Yarra | Fitzroy, Collingwood, Abbotsford, Richmond |
| Northern | City of Banyule | Heidelberg, Ivanhoe, Greensborough, Watsonia |
| Northern | City of Darebin | Preston, Reservoir, Thornbury, West Preston |
| Northern | City of Hume | Broadmeadows, Sunbury, Craigieburn |
| Northern | City of Merri-bek | Brunswick, Coburg, Fawkner, Glenroy |
| Northern | City of Whittlesea | Epping, South Morang, Doreen, Mernda |
| Northern | Shire of Nillumbik | Diamond Creek, Eltham, Kallista |
| Eastern | City of Boroondara | Camberwell, Hawthorn, Kew, Balwyn |
| Eastern | City of Knox | Bayswater, Boronia, Ferntree Gully |
| Eastern | City of Manningham | Doncaster, Templestowe, Bulleen |
| Eastern | City of Maroondah | Ringwood, Croydon, Donvale |
| Eastern | City of Whitehorse | Box Hill, Nunawading, Vermont |
| Eastern | Shire of Yarra Ranges | Lilydale, Belgrave, Emerald |
| South Eastern | City of Bayside | Brighton, Beaumaris, Hampton |
| South Eastern | City of Glen Eira | Caulfield, Bentleigh, Elsternwick |
| South Eastern | City of Kingston | Mentone, Moorabbin, Aspendale |
| South Eastern | City of Casey | Narre Warren, Cranbourne, Officer |
| South Eastern | City of Frankston | Frankston, Seaford, Karingal |
| South Eastern | Shire of Cardinia | Pakenham, Beaconsfield |
| South Eastern | Mornington Peninsula Shire | Mornington, Mount Martha, Sorrento |
| Western | City of Brimbank | Sunshine, St Albans, Keilor |
| Western | City of Hobsons Bay | Williamstown, Altona, Newport |
| Western | City of Maribyrnong | Footscray, Yarraville, Seddon |
| Western | City of Melton | Melton, Caroline Springs, Hillside |
| Western | City of Moonee Valley | Essendon, Moonee Ponds, Ascot Vale |
| Western | City of Wyndham | Werribee, Point Cook, Tarneit |

---

## 4. Invariant Rules (Non-Negotiable Constraints)

### 4.1 Age/Stage Rules

- **Age is mandatory first:** In all dog owner search flows, age must be selected or skipped (default = all ages) *before* any other filter is applied.
- **At least one age required for trainers:** Every trainer/consultant business must select at least one age specialty before profile goes live.
- **Rescue is orthogonal:** A trainer can select "Adolescent AND Rescue" (separate checkboxes). Rescue status is not age-exclusive.
- **Scraping default:** If a trainer's website does NOT mention age specificity, system assumes ALL ages (maximum inclusion). Trainer can narrow later after claiming.
- **Age-first UI:** Homepage and triage flows always present age selection first, before issue, suburb, or filters.

### 4.2 Category / Taxonomy Rules

- **All categories are enums, never free text:** Trainers cannot invent service types, behaviour issues, or age groups. Only locked values are allowed in any field that is categorized.
- **No mixing:** A trainer selecting "Dog aggression" (issue) cannot also write "severe aggression" as free text. System enforces enum only.
- **Search and scraping map to enums:** When scraping a website or matching search terms, system must map results to locked enum values or return no match (not invent new values).
- **Display vs. storage:** Internal representation can use any format (e.g., `dog_aggression`, `pulling_on_lead`), but display layer always shows human-readable labels (`Dog aggression`, `Pulling on the lead`).

### 4.3 Geography Rules

- **Suburb is the only user selector:** Dog owners and trainers pick suburbs via autocomplete. They never pick LGA or region directly.
- **LGA/Council auto-derived:** Once suburb is selected, system automatically assigns the correct Council and Region. No user input required.
- **No LGA acronym exposed:** The term "LGA" or "Local Government Area" never appears in UI or trainer-facing text. Use "Council" or "Area" instead.
- **Example labeling:** Show "Fitzroy (City of Yarra)" or "Brighton & Bayside (City of Bayside)" so users understand both suburb and council context.
- **Distance calculated from suburb center:** When filtering by distance (0–5 km, 5–15 km, etc.), use suburb centroid or council center, not exact business address (for privacy and simplicity).

### 4.4 Verification Rules

- **Verification badge only if ABN passed:** A trainer must complete ABN verification with ≥85% name match to display the ✅ Verified badge.
- **Unverified has no badge:** If ABN was attempted and failed, or not provided, no badge is shown (absence ≠ negative signal).
- **Verification auto-computed:** Verification status is never manually entered. It is always derived from ABN check result (verified | unverified | none).

### 4.5 Search and Sort Rules

- **Primary filter: Age/Stage compatibility**  
  - Only trainers whose age_specialties contain the dog's selected age are shown. If dog is "18-month adolescent," only trainers with Adolescent selected appear.
  
- **Secondary filter: Behaviour issue (if given)**  
  - If owner selected an issue (e.g., "Pulling on the lead"), only trainers with that issue in their behaviour_issues list are shown.
  
- **Tertiary filter: Geography (suburb/council proximity)**  
  - Results filtered by suburb first (exact match), then optionally by nearby suburbs (same council or adjacent councils).
  
- **Sort order (when multiple results tie):**  
  1. ABN verified (verified first, unverified last)
  2. Distance (closest suburb first)
  3. Rating/reviews (highest rated first)

- **No free-text search on categories:** Search bar matches on:
  - Business name ("Loose Lead Training")
  - Suburb name ("Fitzroy")
  - Behaviour issue names ("leash reactivity")
  - Age names ("puppies")
  - But always against locked enum values or stored names, never substring matches on categories.

### 4.6 Emergency Resource Rules

- **Emergency resources appear ONLY on emergency path:** Normal trainer searches do NOT return emergency vets or shelters.
- **Emergency path branching:**
  - Medical emergency (injury, poisoning, collapse) → Show nearest 24-hour emergency vet hospitals first.
  - Stray dog found → Show nearest emergency shelters, Lost Dogs Home, council animal pound.
  - Sudden aggression or behaviour crisis → Show trainers with Rescue + Anxiety/Aggression tags, filtered by age/location.
- **Never replace emergency vet with trainer:** If user indicates active medical emergency, no circumstance should hide emergency vet info or delay access to it.

### 4.7 Data Integrity Rules

- **No orphaned data:** A Business record must always have a valid suburb (thus valid council and region).
- **No invalid enums:** Any attempt to store an age, issue, service type, or resource type not in the locked taxonomy is rejected at data entry or import.
- **Scraping safety:** Web scraper extracts and maps data to enums, but if unsure, chooses safe defaults (all ages, empty issues) rather than guessing new categories.
- **Soft delete only:** Businesses are never hard-deleted; instead, marked as deleted but remain in database for audit and recovery.

---

## 5. User Journeys (Scenario-Level Workflows)

### 5.1 Journey A: Dog Owner Finding a Trainer

**Starting point:** Homepage or deep-linked page (e.g., search result for "puppies").

**Steps:**

1. **Age selection (mandatory):** Owner sees radio buttons: 0–2 months, 2–6 months, 6–12 months, 12–18 months, 18 months–3 years, 3–7 years, 7–10 years, 10+ years, or "I'm not sure."
   - If "I'm not sure" → system defaults to all ages in filtering.
   - Otherwise, owner picks one age range.

2. **Rescue status (optional):** Checkbox: "Is your dog a rescue/rehomed dog?" (affects tagging but doesn't eliminate results).

3. **Issue selection:** Owner selects a behaviour problem from 13 buttons: [Puppy basics], [Obedience], [Pulling on lead], [Separation anxiety], …, [Socialisation], or [Browse all trainers].
   - If specific issue → results filtered to trainers matching that issue.
   - If [Browse all] → no issue filter applied.

4. **Suburb/location:** Owner enters suburb via autocomplete (grouped by region for easy scanning).
   - System auto-assigns council and region.
   - Optional: Owner can filter by distance (0–5 km, 5–15 km, Greater Melbourne).

5. **View results:** Trainers matching age + issue + location are shown, sorted by:
   - ✅ Verified badge (first)
   - Distance (closest first)
   - Rating (highest first)

6. **Filter & refine (optional):** Sidebar allows further filtering:
   - Service type (Behaviour consultations, Private training, etc.)
   - Price range (slider $0–$200)
   - Verified only (toggle)

7. **Profile view:** Owner clicks trainer card → sees full profile:
   - Business info, services, age/issue tags, pricing
   - Reviews and star rating
   - Contact buttons (call, email, website)

8. **Contact/book:** Owner clicks [CALL NOW], [EMAIL], [VISIT WEBSITE], or [BOOK] → Trainer handles booking offline.

**Success definition:** Owner discovers 2–3 relevant trainers matching age, issue, and location, and can contact one within 3 clicks.

---

### 5.2 Journey B: Trainer Onboarding and Profile Management

**Starting point:** Trainer finds directory, clicks "Add your business" or discovers listing via search.

**Step 1: Create account**
- Email (required, unique)
- Password (min 8 chars, validation)
- Confirm password
- System sends verification email (link valid 24 hours)

**Step 2: Claim or create business**
- Option A: Search for existing business listing (from scraping or manual entry)
  - Example: "Loose Lead Training" → results show existing Fitzroy listing
  - Trainer selects it, clicks "Claim this business"
  - System sends SMS code to business phone (masked) → Trainer enters code to verify ownership
- Option B: Create new business if not found
  - Trainer enters name, phone, email, address, suburb (auto-assigns council)
  - Can submit, or continue directly to Step 3

**Step 3: Edit/configure profile (form with 6 substeps)**

**3A: Age specialties (MANDATORY, min 1 required)**
- Checkboxes (all pre-checked by default):
  - ☑ Puppies (0–6 months)
  - ☑ Adolescent dogs (6–18 months)
  - ☑ Adult dogs (18 months–7 years)
  - ☐ Senior dogs (7+ years)
  - ☑ Rescue/rehomed dogs
- Trainer unchecks any that don't apply
- Validation: "Please select at least one age group" if all unchecked

**3B: Primary service type (REQUIRED, single choice)**
- Radio buttons:
  - ○ Puppy training
  - ○ Obedience training
  - ○ Behaviour consultations
  - ○ Group classes
  - ○ Private training
- Trainer selects one

**3C: Secondary services (OPTIONAL, multi-select)**
- Checkboxes (same 5 values as primary, can check any or none):
  - ☐ Puppy training
  - ☐ Obedience training
  - ☐ Behaviour consultations
  - ☐ Group classes
  - ☐ Private training

**3D: Behaviour issues (OPTIONAL, multi-select)**
- Checkboxes (can select any or none of 13 issues):
  - ☐ Pulling on the lead
  - ☐ Separation anxiety
  - … (all 13)

**3E: Bio, pricing, formats (OPTIONAL text fields)**
- Bio: Text area (max 500 chars, shows char count)
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

**3F: ABN verification (OPTIONAL, gets badge)**
- Text: "Get verified badge (takes 10 seconds)"
- Input: ABN field (11 digits, formatted)
- [VERIFY NOW] or [SKIP]
- If verify:
  - System queries ABN lookup with provided credentials
  - Shows result: "✅ Verified!" or "⚠️ Name doesn't match"
  - If matches (≥85%): abn_verified = true, badge shows in directory
  - If doesn't match: Offer manual upload or skip for now

**Step 4: Publish and activate**
- [COMPLETE & PUBLISH] button
- On success:
  - Business marked as is_claimed = true, is_scaffolded = false (or remains false if new)
  - Profile goes LIVE in directory
  - Email confirmation sent to trainer
  - Trainer redirected to Dashboard

**Step 5: Dashboard (ongoing management)**
- View stats: Monthly views, clicks, contacts, revenue (if featured/premium)
- [EDIT PROFILE] → Return to Step 3 to change age, issues, pricing, etc.
- [VIEW MY LISTING] → See how profile appears to dog owners
- [PURCHASE FEATURED SLOT] → Optional monetization (deferred to Phase 5)
- [MANAGE REVIEWS] → See and respond to reviews

---

### 5.3 Journey C: Emergency Help Pathways

**Starting point:** Homepage emergency button or triage branch.

**Triage question: "What's happening?"**
- [◯] Normal problem (pulling, barking, etc.) → Go to standard trainer search (Journey A)
- [◯] Medical emergency (injury, collapse, poisoning, choking) → **Emergency Vet Flow**
- [◯] Stray/lost dog found → **Shelter/Pound Flow**
- [◯] Sudden aggression or serious behaviour crisis → **Crisis Trainer Flow**
- [◯] Not sure → Diagnostic questions → Route to appropriate flow

---

#### 5.3a: Medical Emergency Flow

**Scenario:** Dog is injured, bleeding, or in acute distress.

**Steps:**

1. **Confirm emergency:** "Is your dog actively bleeding, unable to breathe, or unresponsive?" 
   - YES → Immediately show emergency contacts (no filters, no wait)
   - NO → Ask severity; if unclear, still show emergency vets

2. **Show nearest 24-hour emergency vets (map or list):**
   - MASH Ringwood (0.2 km, 24-hour)
   - Southpaws Malvern East (1.5 km, 24/7)
   - CARE Collingwood (2.1 km, 24-hour)
   - Animal Emergency Centre Moorabbin (3.0 km, 24/7)
   - … (sorted by distance)

3. **Action buttons for each:**
   - [CALL NOW] → Phone number auto-dialed
   - [GET DIRECTIONS] → Map app opens with address
   - [WEBSITE] → Opens clinic info

4. **After vet care:**
   - Optional: "Your dog may have trauma. Find behavioural support." → Link to Crisis Trainer Flow (below)

**Success definition:** Owner reaches 24-hour vet contact within 20 seconds of recognizing emergency.

---

#### 5.3b: Stray Dog Found Flow

**Scenario:** User finds a loose/stray dog.

**Steps:**

1. **Confirm stray:** "Is this dog microchipped, wearing a collar, or completely unknown to you?"
   - Dog has ID → Try to contact owner directly; offer shelter contact as backup
   - Dog has no ID → Proceed to shelter flow

2. **Show emergency shelter/pound contacts:**
   - Lost Dogs Home Melbourne: 24-hour intake (phone + address)
   - RSPCA local center: Intake hours + contact
   - Local council pound: Contact info
   - Vet emergency clinics: For injured stray

3. **Action buttons:**
   - [CALL LOST DOGS HOME] → Immediate phone contact
   - [REPORT TO COUNCIL] → Link to council animal control form
   - [NEAREST EMERGENCY VET] → If dog is injured

4. **Optional**: "Report found dog" form (name, description, location) → Aggregates to Lost Dogs Home or integrates with external found dog databases.

**Success definition:** Owner reports stray to shelter/council within 5 minutes of finding dog.

---

#### 5.3c: Crisis Trainer Flow

**Scenario:** Dog has suddenly shown severe aggression or behaviour crisis (not immediately life-threatening medical emergency, but serious).

**Steps:**

1. **Filter to rescue + aggression/anxiety trainers:**
   - Use system filters: resource_type = trainer, age_specialties includes dog's age, behaviour_issues includes "Dog aggression" OR "Anxiety (general)", age_specialties includes "Rescue/rehomed"

2. **Show results sorted by verification + distance**

3. **Highlight in-home or remote options** (may need urgent intervention at home)

4. **Action:** Owner contacts trainer directly with urgency note in message

5. **Optional escalation:** If owner indicates immediate risk to human/other dog, suggest contacting council animal control or emergency vet for emergency assessment

**Success definition:** Owner connects with aggression/crisis trainer who can assess within 24–48 hours.

---

### 5.4 Journey D: Web Scraper Data Capture (Non-User Journey, System Process)

**Trigger:** Weekly scheduled job (Monday 2am)

**Steps:**

1. **Load seed list:** URLs of trainer websites from CSV or database

2. **For each URL:**
   a. Fetch website content (HTTP request, 10-second timeout)
   b. Extract: Business name, phone, email, address, suburb (if available), services description
   c. Parse services using LLM mapping:
      - Input: "Services" section text from website
      - Prompt: "Match this text to EXACT enum values only:
        - Ages: [puppies_0_6m, adolescent_6_18m, adult_18m_7y, senior_7y_plus, rescue_dogs]
        - Issues: [13 issues]
        - Return ONLY matching values. NO free text. NO new values."
      - Output: JSON with matched enums (or empty if no match)
   d. Validate extracted data:
      - Address → Suburb → Council (must be in Melbourne 28 councils, else skip)
      - No invalid enums (reject if scraper tried to invent new category)
   e. Check for duplicates:
      - If business with same (name, phone, address) exists → Update last_scraped_at, skip create
      - Else → Create new business record: is_scaffolded = true, is_claimed = false, age_specialties = [matched or ALL if none found], data_source = "web_scrape"

3. **Post-scrape notifications:**
   - Admin sees: "Scraped 47 new, updated 3, skipped 2 duplicates"
   - Trainer sees (in directory): "Add your business" CTA for any unscraped competitor

4. **Fallback: Manual form**
   - If trainer not in scraper list:
     - Form: Business name, phone, email, address, suburb, website
     - Trainer submits; system creates scaffolded business: is_scaffolded = true, is_claimed = false, data_source = "manual_form"
     - System tags as "Pending"; approved after 24 hours if no issues
     - Trainer can claim immediately

---

## 6. Information Architecture (Page/Section Structure)

### 6.1 Navigation Structure (High-Level)

**Primary sections:**

1. **Home / Triage** (entry point for dog owners)
2. **Search & Results** (filtered trainer list + map view)
3. **Trainer Profile** (individual business detail)
4. **Emergency Help** (emergency vet, shelter, crisis pathways)
5. **Directory Browse** (all trainers, no filter)
6. **Trainer Portal** (login, dashboard, profile management)

**Secondary sections (policy, info):**
7. **About**
8. **How It Works**
9. **For Trainers**
10. **FAQs**
11. **Contact / Support**

---

### 6.2 Page Definitions

#### Home / Triage
**Purpose:** Entry point; guide dog owner toward right trainer or emergency resource.

**Must contain:**
- Age selection (radio buttons, mandatory)
- Rescue status checkbox (optional)
- Issue selection (13 buttons or browse all)
- Suburb input (autocomplete)
- Emergency quick-link (for immediate crisis)

**Output:** Redirect to Results page with filters pre-set, or Emergency Help page.

---

#### Search & Results
**Purpose:** Show filtered trainer list; allow real-time refinement.

**Must contain:**
- Results list (20 trainers per page, paginated)
- Each result card: business name, verified badge, rating, issue tags, primary service, distance, contact CTA
- Sidebar filters: Age, Issue, Service type, Price range, Verification, Distance
- Search bar (top): business name, issue, suburb, age
- Sort options: Verified first, Distance, Rating
- Map view (optional): Trainer pins on map, clustered by location

**Output:** Deep link to individual Trainer Profile, or refined results.

---

#### Trainer Profile
**Purpose:** Full business detail; drive contact/booking.

**Must contain:**
- Verified badge (if applicable)
- Business name, address, suburb (Council name visible)
- Star rating and review count
- About section (bio/description)
- Services offered: primary, secondary, age specialties, issues, formats
- Pricing breakdown by format
- Reviews (5 per page, paginated, oldest reviews shown first, verified badge on review)
- Contact buttons: [CALL], [EMAIL], [VISIT WEBSITE], [BOOK NOW]
- Distance from user's suburb

**Output:** Contact via phone/email/website, or back to Results.

---

#### Emergency Help
**Purpose:** Fast-track to emergency vets, shelters, or crisis trainers.

**Must contain (based on triage selection):**
- Medical emergency: List of 24-hour emergency vets (nearest first), with hours, phone, [CALL NOW] button
- Stray found: Lost Dogs Home, RSPCA, council animal control contact info + map
- Behaviour crisis: List of rescue + aggression specialists, nearest first
- Injured stray: Show both shelter and emergency vet options

**Output:** Phone contact or direction to vet/shelter, or back to trainer search.

---

#### Directory Browse
**Purpose:** Explore all trainers without filters; discover by area/council.

**Must contain:**
- All trainers (claimed only), grouped by region or council
- Browse by region card: "Inner North Creative (City of Yarra)" with count
- Trainers under each region, sorted by rating
- Verified badge visible
- Contact and profile links

**Output:** Individual Trainer Profile or filtered Results.

---

#### Trainer Portal (Dashboard)
**Purpose:** Trainer account management; profile editing; stats.

**Must contain (after login):**
- Business name, verification status, address, suburb
- Stats: Monthly views, clicks, contacts, revenue (if applicable)
- [EDIT PROFILE] → Form to update age, issues, pricing, bio
- [VIEW MY LISTING] → Shows how profile appears to dog owners
- [MANAGE REVIEWS] → See reviews, respond, flag spam
- [PURCHASE FEATURED SLOT] → Monetization options (deferred details)
- [LOGOUT]

**Output:** Profile edit form or back to home.

---

## 7. Non-Functional Expectations (Concept-Level)

### 7.1 Performance

- **Triage to results:** Dog owner selects age/issue/suburb and sees first 20 results within 1 second.
- **Large dataset handling:** System must remain responsive with 5,000+ trainer records in directory.
- **Search speed:** Search bar autocomplete returns suggestions (suburbs, issues, names) within 200ms.
- **Profile load:** Individual trainer profile page loads in <1 second.
- **Map rendering:** If map view implemented, must load and render 100+ pins in <2 seconds.

### 7.2 Safety and Ethics

- **Emergency prioritization:** Medical emergency flows NEVER show trainers instead of vets; never delay emergency vet contact.
- **Clear labeling:** Emergency vets and shelters are visibly distinct from trainers (different sections, clear CTA, different colors/icons).
- **Age-stage appropriateness:** System ensures trainer's claimed ages match dog owner's dog; prevents mismatch (e.g., puppy trainer for senior dog crisis).
- **No liability claim:** Site never claims to replace veterinary care; emergency pathways include explicit "contact vet immediately" guidance.
- **Privacy:** Dog owner names and details not collected or stored (anonymous searches); trainer contact info encrypted at rest.

### 7.3 Data Correctness

- **Enum enforcement:** System rejects any category value outside locked taxonomies; never accepts free text in category fields.
- **Suburb → Council → Region correctness:** System must reference authoritative Melbourne suburb-council mapping (Suburbs-councils-catchment.pdf); no manual edits to geography without audit trail.
- **Scraping safety:** Web scraper defaults to safe fallback (all ages, no issues) rather than inventing new categories.
- **Verification status:** Auto-computed from ABN check; never manually overridden without audit log.

### 7.4 Scalability Concepts (Not Implementation Details)

- **Caching:** Trainer profiles and reviews cached (refresh on edit/new review).
- **Indexing:** Suburb/council/age/issue queries must be fast (indexed appropriately regardless of storage tech).
- **Soft delete:** Deleted businesses remain recoverable; no data loss.

### 7.5 Risk Governance & Mitigation

- **Immutable SSOT assets:** Treat `DOCS/blueprint_ssot_v1.1.md`, `DOCS/suburbs_councils_mapping.csv`, and `DOCS/FILE_MANIFEST.md` as read-only except via approved RFCs. Add CI checks that assert 28 councils + 138 suburb rows, and block merges when checksums change without manifest updates.
- **Scraper safety gate:** Any Phase 2+ ingestion (web scraper, bulk import) must run behind a feature flag, log `is_scaffolded` accuracy metrics, and require QA sampling (≥10 listings per run) before auto-publishing data.
- **Monetization readiness:** Stripe features stay dark until the Phase 4+ criteria in `implementation/master_plan.md` are met (e.g., ≥50 claimed trainers, sustained ABN verification rate). Premature monetization must be rejected in design reviews.
- **AI moderation oversight:** AI only flags potential spam; humans approve or reject reviews/profiles. Track false-positive rates and revisit automation thresholds only when reviewer authenticity proof (e.g., bookings) exists.
- **ABN review SLA:** Maintain the ≥85% auto-match rule, review mismatches within 24 hours, store ABR responses for audit, and re-verify ABNs annually to avoid stale statuses.
- **Emergency listings upkeep:** Assign an owner for emergency vet/shelter data and verify phone numbers, hours, and council mapping at least quarterly; flag any record older than 90 days for immediate review.

---

## 8. Supporting References and Versioning

### 8.1 Source Documents

This blueprint is derived from, and is normatively based on:

- **V7.0 Category Taxonomy & Age-First Rules** (27 November 2025)  
  - Age/stage mandatory first, locked ranges, rescue orthogonal
  - 13 behaviour issues, 5 service types, 5 resource types
  - Age-first triage, rescue status, verification badge rules

- **Melbourne Suburbs–Councils Catchment Reference** (authoritative CSV: suburbs_councils_mapping.csv)  
  - 28 metropolitan councils
  - Suburb-to-council mapping
  - Region groupings (Inner City, Northern, Eastern, South Eastern, Western)
  - Key characteristics for UX labeling

- **Phased Execution Strategy** (28 November 2025)  
  - 5-phase implementation structure (Phases 1–5)
  - Database schema, triage, directory, onboarding, monetization

### 8.2 Deprecated Documents

The following documents are superseded and must NOT be used for implementation:

- **V6.0 Category Taxonomy + UI Enforcement** — DEPRECATED  
  - Replaced by V7.0 with age-first logic and emergency resources
  - Do not reference for new work

### 8.3 Versioning Convention

- **SSOT Blueprint v1.1** (this document): Locked and authoritative as of 28 November 2025.
- **Future updates** will be versioned as v1.2, v2.0, etc., with change log and deprecation notices.
- **Change process**: Any change to taxonomy, journeys, rules, or geography requires explicit versioning and notification to all builders.

### 8.4 Implementation Instructions

**For any agent, developer, or builder preparing to construct dogtrainersdirectory.com.au:**

1. Use ONLY this document (v1.0) as the conceptual specification.
2. Ignore V6.0, earlier proposals, or informal notes; they are outdated.
3. Map this blueprint to your chosen tech stack (database, framework, APIs); the rules and entities are tech-agnostic and must persist regardless of implementation.
4. Do not add, remove, or reinterpret categories, age ranges, or journeys without explicit amendment to this document and version bump.
5. If you discover gaps or ambiguities, document them and request clarification before building; do not invent solutions.

---

## Appendix A: Entity Relationship Diagram (Conceptual, Not Schema)

```
Trainer ──────1──── Business ──────1───── Locality (Suburb)
           (owns)          (located in)              |
                                                      |
                                              Derived FK to:
                                              Council ──────1──── Region
                                              (LGA)

Business ──────M──── Age/Stage Category
             (has specialties)

Business ──────M──── Behaviour Issue Category
             (specializes in)

Business ──────1──── Service Type (Primary)
             (has primary)

Business ──────M──── Service Type (Secondary)
             (can have multiple)

Business ──────M──── Review
             (receives)

Business ──────0..1──── Featured Placement
             (may have)
```

---

## Appendix B: Example Trainer Profiles (Illustration of Relationships)

### Example 1: Loose Lead Training (Fitzroy)

| Field | Value |
|-------|-------|
| Name | Loose Lead Training Fitzroy |
| Address | 123 Brunswick St, Fitzroy VIC 3065 |
| Suburb | Fitzroy |
| Council | City of Yarra |
| Region | Inner City |
| Phone | 03 9876 5432 |
| Email | info@looselea dtraining.com.au |
| Website | www.looselea dtraining.com.au |
| Resource type | trainer |
| Age specialties | Adolescent, Adult, Rescue |
| Primary service type | Behaviour consultations |
| Secondary service types | Group classes, Private training |
| Behaviour issues | Pulling on the lead, Leash reactivity, Jumping up |
| Formats | 1:1 in-home, Remote |
| Pricing | $80/hour (1:1), $45/week (group) |
| ABN verified | Yes (✅ Verified badge shows) |
| Reviews | 42 total, 4.8 stars average |

---

### Example 2: Puppy Basics Only (Preston)

| Field | Value |
|-------|-------|
| Name | Puppy Basics Preston |
| Address | 456 Bell St, Preston VIC 3072 |
| Suburb | Preston |
| Council | City of Darebin |
| Region | Northern |
| Resource type | trainer |
| Age specialties | Puppies |
| Primary service type | Puppy training |
| Secondary service types | (none) |
| Behaviour issues | Socialisation, Toilet training (mapped to "Socialisation" only) |
| Formats | Group classes |
| ABN verified | No (no badge) |
| Reviews | 8 total, 4.5 stars average |

---

### Example 3: MASH Emergency Vet (Ringwood)

| Field | Value |
|-------|-------|
| Name | MASH Ringwood |
| Address | 10 Mountain Highway, Ringwood VIC 3134 |
| Suburb | Ringwood |
| Council | City of Maroondah |
| Region | Eastern |
| Resource type | emergency_vet |
| Emergency hours | 24/7 |
| Emergency phone | 03 9876 5600 |
| Services offered | Emergency surgery, Trauma care, Critical care, Poison control, Wound care |
| Specialty animals | Dogs, Cats |
| Cost indicator | $$$ |
| Capacity notes | ~50 emergency cases/night |
| Age specialties | (N/A for emergency resources) |
| Behaviour issues | (N/A for emergency resources) |

---

## Appendix C: Glossary of Terms

| Term | Meaning |
|------|---------|
| **Age/Stage** | Developmental stage of a dog (Puppies, Adolescent, Adult, Senior, Rescue). Always required for trainers. |
| **Behaviour issue** | Specific problem behaviour (e.g., pulling on lead, separation anxiety). Optional for trainers. |
| **Business** | Entity offering services (trainer, consultant, vet, shelter). Has location, services, contact info. |
| **Council / LGA** | Local Government Area (Melbourne metropolitan council). User-facing but never selected directly; derived from suburb. |
| **Dog owner / Seeker** | End user looking for a trainer. Anonymous, unauthenticated. |
| **Emergency resource** | Vet hospital, urgent care clinic, or animal shelter. Separate from trainers in UI/search. |
| **Featured placement** | Paid visibility upgrade for a trainer (deferred to Phase 5; conceptual here). |
| **LGA** | Local Government Area. Term hidden from UI; use "Council" or "Area" instead. |
| **Locality / Suburb** | Melbourne suburb (e.g., Fitzroy). User-facing selector; maps to one Council and one Region. |
| **Region** | Grouping of councils (Inner City, Northern, Eastern, South Eastern, Western). For navigation and browsing. |
| **Rescue/rehomed dog** | Dog with unknown or trauma history (shelter, street, abused). Orthogonal to age. |
| **Resource type** | Classification: trainer, behaviour_consultant, emergency_vet, urgent_care, emergency_shelter. Determines which fields are active. |
| **Service type** | Trainer's primary offering (Puppy training, Obedience, Behaviour consultations, Group classes, Private training). |
| **SSOT** | Single Source of Truth. This document. |
| **Triage** | Initial questions (age, issue, suburb) that filter results. Always age-first. |
| **Verified / ABN verified** | Trainer has passed ABN identity check (≥85% name match). Earns ✅ Verified badge. |

---

**Document Version:** 1.1  
**Date:** 28 November 2025  
**Status:** LOCKED IN – Authoritative SSOT for all phases of development.

---

## Sign-Off

This conceptual blueprint supersedes all prior drafts, versions, and informal specifications. It is the authoritative single source of truth for dogtrainersdirectory.com.au.

**To be used by:**
- AI agent (or any builder) for implementation phase
- Project stakeholders for scope review
- QA for validation testing
- Future maintainers for consistency reference

**Change request process:** Any amendment requires version bump, change log, and stakeholder approval before implementation.
