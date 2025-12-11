> ⚠️ **ARCHIVED / CONFLICTING DOCUMENT**
> This file is retained for historical reference only.
> It does NOT reflect the current implementation or plan and must not be used as a development source of truth.

---

# Frontend Implementation Gap Analysis
**Date:** December 9, 2025
**Purpose:** Comprehensive analysis of frontend pages/components vs requirements before Phase 5 merge

## Pages Inventory

### ✅ Complete & Functional

**1. Homepage (`src/app/page.tsx`)**
- ✅ Age-first triage form
- ✅ Suburb autocomplete with coordinates
- ✅ Behavior issue selection (multi-select)
- ✅ Search radius selector
- ✅ Integration with `/api/triage` endpoint
- ✅ Real-time suburb suggestions
- ❌ MISSING: Emergency help CTA link
- ❌ MISSING: Results display (should show inline or redirect to /search)

**2. Search Results (`src/app/search/page.tsx` + `SearchClient.tsx`)**
- ✅ Server-side component wrapper
- ✅ Client-side SearchClient with filters
- ✅ Filter sidebar (assumed based on imports)
- ⚠️ NEEDS VERIFICATION: Full filtering logic implementation
- ⚠️ NEEDS VERIFICATION: Pagination working
- ⚠️ NEEDS VERIFICATION: Sort by distance/rating/verified

**3. Trainer Onboarding (`src/app/onboarding/page.tsx`)**
- ✅ 6-step form (consolidated in one page)
- ✅ Account creation (email/password)
- ✅ Business details
- ✅ Age specialties multi-select
- ✅ Behavior issues multi-select
- ✅ Service type selection (primary + secondary)
- ✅ ABN field
- ✅ Integration with `/api/onboarding`
- ❌ MISSING: Suburb autocomplete (uses suburbId but no UI for selection)
- ❌ MISSING: Step-by-step wizard UI (currently one long form)
- ❌ MISSING: ABN verification feedback display
- ❌ MISSING: Progress indicator

**4. Trainer Dashboard (`src/app/trainer/page.tsx`)**
- ✅ Basic dashboard with metrics
- ✅ Profile status display
- ✅ ABN verification badge
- ✅ Featured until date
- ✅ Analytics (views, clicks, inquiries, ratings)
- ❌ MISSING: Edit profile functionality (buttons exist but not wired)
- ❌ MISSING: Update ABN functionality
- ❌ MISSING: View/purchase featured slots
- ❌ MISSING: Authentication check (uses DUMMY_BUSINESS_ID)

**5. Directory (`src/app/directory/page.tsx`)**
- ⚠️ NOT ANALYZED YET - need to check if complete
- EXPECTED: Region-grouped trainer listings
- EXPECTED: Featured badges
- EXPECTED: Filter by region/council

**6. Trainer Profile (`src/app/trainers/[id]/page.tsx` + `src/app/trainer/[slug]/page.tsx`)**
- ⚠️ TWO ROUTES EXIST - potential duplication/confusion
- ⚠️ NOT ANALYZED YET - need to check which is canonical

**7. Emergency Page (`src/app/emergency/page.tsx`)**
- ❌ PLACEHOLDER ONLY - not the real emergency triage flow
- Current: Generic "emergency controls" UI with toggle button
- REQUIRED: Medical/stray/crisis triage flow per PHASE_5 spec
- REQUIRED: Emergency resource listings (vets, shelters)
- REQUIRED: Crisis trainer recommendations
- REQUIRED: Integration with `/api/emergency/triage`

**8. Admin Dashboard (`src/app/admin/page.tsx`)**
- ✅ Queue interface (reviews, ABN, flagged profiles, scaffolded)
- ✅ EnhancedAdminDashboard component integration
- ✅ QueueCard component with review actions
- ✅ Integration with `/api/admin/queues` and `/api/admin/scaffolded`
- ✅ ABN manual review actions
- ⚠️ PARTIAL: Enhanced dashboard (need to verify what it shows)
- ❌ MISSING: Featured placement management UI
- ❌ MISSING: DLQ/replay UI
- ❌ MISSING: Error monitoring dashboard UI
- ❌ MISSING: AI health monitoring UI

**9. Admin Sub-pages**
- ✅ `/admin/errors/page.tsx` - exists
- ✅ `/admin/reviews/page.tsx` - exists
- ✅ `/admin/triage/page.tsx` - exists
- ✅ `/admin/ai-health/page.tsx` - exists
- ✅ `/admin/cron-health/page.tsx` - exists
- ⚠️ ALL NEED VERIFICATION: Are they complete or placeholders?

### ❌ Missing Pages

**1. Stripe Checkout Flow**
- `/trainer/featured/purchase` - Buy featured slot
- `/trainer/featured/success` - Payment success callback
- `/trainer/featured/cancel` - Payment cancelled

**2. ABN Fallback Upload**
- `/trainer/abn/upload` - Manual ABN certificate upload
- Integration with file upload + OCR

**3. Admin DLQ Management**
- `/admin/dlq` - Dead letter queue UI
- Replay failed webhooks/jobs

**4. Admin Featured Management**
- `/admin/featured` - Manage featured placements
- Promote/demote/extend placements

**5. Public Trainer Profile**
- Clarify: `/trainer/[slug]` vs `/trainers/[id]` - which is public-facing?

## Components Inventory

### ✅ Existing Components

**UI Components:**
- ✅ `Button.tsx`
- ✅ `Callout.tsx`
- ✅ `Loading.tsx`
- ✅ `SuburbAutocomplete.tsx`

**Feature Components:**
- ✅ `ReviewList.tsx`
- ✅ `SearchAutocomplete.tsx`
- ✅ `FiltersSidebar.tsx`
- ✅ `EmergencyGate.tsx`
- ✅ `ErrorMetricsChart.tsx`
- ✅ `TriageMetricsChart.tsx`

**Layout:**
- ✅ `AppHeader.tsx`
- ✅ `AppFooter.tsx`

**Admin:**
- ✅ `enhanced-dashboard.tsx`
- ✅ `queue-card.tsx`

### ❌ Missing Components

**Stripe:**
- `StripeCheckoutButton.tsx` - Featured slot purchase
- `PaymentStatus.tsx` - Success/failure display

**ABN:**
- `ABNUploadForm.tsx` - File upload UI
- `ABNStatusBadge.tsx` - Verification status display

**Admin:**
- `DLQTable.tsx` - Dead letter queue viewer
- `FeaturedPlacementManager.tsx` - Featured slot management
- `ErrorLogViewer.tsx` - Structured error log display
- `WebhookEventViewer.tsx` - Webhook event inspector

**Trainer:**
- `FeaturedSlotCard.tsx` - Featured placement display/management
- `ProfileEditForm.tsx` - Edit trainer profile
- `AnalyticsChart.tsx` - Dashboard charts

## Critical Gaps Summary

### HIGH PRIORITY (Block Launch)

1. **Emergency Page Complete Rebuild**
   - Current page is placeholder
   - Need medical/stray/crisis triage UI
   - Need emergency resource listings
   - BACKEND EXISTS - frontend completely missing

2. **Trainer Dashboard Authentication**
   - Currently uses hardcoded DUMMY_BUSINESS_ID
   - Need real auth integration
   - Need profile editing functionality

3. **Onboarding Suburb Autocomplete**
   - Form has suburbId field but no UI to select it
   - Critical for trainer signup flow

4. **Homepage Results Display**
   - Form submits but results aren't shown
   - Need inline results or redirect to /search

### MEDIUM PRIORITY (Nice to Have for Launch)

5. **Admin Featured Management UI**
   - Backend APIs exist in phase5-3 branch
   - No frontend to manage placements

6. **Stripe Checkout Flow**
   - Webhook exists, but no purchase UI
   - Can defer if monetization is post-launch

7. **ABN Fallback Upload**
   - Manual review exists, but no upload UI
   - 15% of trainers need this

8. **DLQ/Replay UI**
   - Backend API exists
   - No frontend for operators

### LOW PRIORITY (Post-Launch)

9. **Profile Edit Functionality**
   - Trainers can onboard but not edit
   - Backend likely exists, wire up UI

10. **Enhanced Analytics**
    - Basic metrics exist
    - Charts/graphs would be nice

## Verification Checklist

Before finalizing, verify these pages are actually complete:

- [ ] Check `SearchClient.tsx` has full filtering logic
- [ ] Check `directory/page.tsx` has region grouping
- [ ] Verify `trainers/[id]/page.tsx` vs `trainer/[slug]/page.tsx` - which is used?
- [ ] Check all admin sub-pages are functional, not placeholders
- [ ] Verify `enhanced-dashboard.tsx` shows digest + metrics
- [ ] Confirm `FiltersSidebar.tsx` has all filters per spec

## Integration Points to Verify

### API Endpoints → Frontend Usage

**Triage & Search:**
- ✅ `/api/triage` → `page.tsx` (homepage)
- ⚠️ `/api/triage` → `SearchClient.tsx` (needs verification)
- ❌ `/api/public/autocomplete` → Not used anywhere visible

**Emergency:**
- ❌ `/api/emergency/triage` → NOT USED (emergency page is placeholder)
- ❌ `/api/emergency/resources` → NOT USED (endpoint may not exist)

**Trainer:**
- ✅ `/api/onboarding` → `onboarding/page.tsx`
- ✅ `/api/trainer/dashboard` → `trainer/page.tsx`
- ❌ `/api/trainer/profile/edit` → Not wired up

**Admin:**
- ✅ `/api/admin/queues` → `admin/page.tsx`
- ✅ `/api/admin/scaffolded` → `admin/page.tsx`
- ✅ `/api/admin/overview` → `enhanced-dashboard.tsx` (assumed)
- ❌ `/api/admin/featured/*` → NO FRONTEND (in phase5 branches)
- ❌ `/api/admin/moderation/run` → NO FRONTEND (in phase5 branches)
- ❌ `/api/admin/dlq/replay` → NO FRONTEND

**Stripe:**
- ✅ `/api/webhooks/stripe` → Backend only (correctly)
- ❌ `/api/stripe/checkout` → DOESN'T EXIST (need to build)

## Recommended Action Plan

### Phase 1: Fix Critical Gaps (Block Launch)
1. Rebuild `/emergency/page.tsx` with real triage flow
2. Add suburb autocomplete to `/onboarding/page.tsx`
3. Fix homepage to show results inline or redirect properly
4. Add authentication to trainer dashboard (remove DUMMY_BUSINESS_ID)
5. Verify Search + Directory pages are complete

### Phase 2: Merge Phase5 Branches + Build Admin UIs
1. Merge phase5-1 through phase5-6 branches
2. Build featured placement management UI
3. Build DLQ/replay UI
4. Verify admin sub-pages are functional

### Phase 3: Stripe Integration (If Required for Launch)
1. Build `/api/stripe/checkout` endpoint
2. Build FeaturedSlotCard component
3. Build checkout flow pages
4. Test end-to-end purchase

### Phase 4: Polish & Testing
1. Add ABN upload UI (fallback for 15%)
2. Add profile edit functionality
3. Build analytics charts
4. End-to-end testing of all flows

## Notes for Implementation

- **Do NOT duplicate suburb autocomplete** - create reusable component
- **Unify trainer profile routes** - decide on [id] vs [slug]
- **Use consistent button/form styles** - leverage existing UI components
- **Mobile-first responsive** - all new UIs must work on mobile
- **Error handling** - all forms need proper error states
- **Loading states** - all async operations need spinners/skeletons
- **Accessibility** - keyboard navigation, ARIA labels, contrast ratios

## Status: ANALYSIS COMPLETE
- Next: Update implementation plan with frontend tasks
- Next: Prioritize which gaps to fix before Phase 5 merge
- Next: Decide if Phase 5 merge happens before or after frontend fixes
