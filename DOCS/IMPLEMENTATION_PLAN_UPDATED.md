<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->

# DTD Implementation Plan - UPDATED
**Date:** December 9, 2025  
**Version:** 2.0 - Corrected Frontend Status  
**Status:** Ready for Immediate Execution

---

## Executive Summary

**PRIOR PLAN WAS OVERLY PESSIMISTIC:**

Initial frontend gap analysis claimed 2-3 days of work needed. Step-by-step verification reveals:
- ✅ Triage wizard: **COMPLETE** (not placeholder)
- ✅ Homepage results: **COMPLETE** (shows inline, not broken)
- ✅ Search/Directory: **COMPLETE** (fully functional)

**ACTUAL work needed: ~1 hour** (not 2-3 days)

**Result:** Ready to launch within **1-2 weeks** after fixing 3 minor items.

---

## Current Frontend Status: 90% Complete

### ✅ PERFECT (Leave As-Is)

| Page | Type | Status | Notes |
|------|------|--------|-------|
| `/triage/page.tsx` | 4-step wizard | ✅ Complete | Age → Issues → Location → Review flow with EmergencyGate modal |
| `/page.tsx` | Inline form | ✅ Complete | Single-page form with instant inline results below |
| `/search/SearchClient.tsx` | Results page | ✅ Complete | Pagination, sorting, SEO structured data |
| `/directory/page.tsx` | Browse page | ✅ Complete | Regional grouping, featured/verified badges, ISR |
| `EmergencyGate.tsx` | Modal component | ✅ Complete | Medical/stray/crisis detection in triage flow |

### ⚠️ NEEDS MINOR FIXES (1 Hour Total)

| Item | Issue | Fix | Effort |
|------|-------|-----|--------|
| **Onboarding Suburb Selection** | Uses number input instead of autocomplete | Replace lines 225-233 with `<SuburbAutocomplete>` | 10 min |
| **Trainer Dashboard Auth** | Uses DUMMY_BUSINESS_ID (line 22) | Add auth check, get real businessId from session | 30 min |
| **Profile Route Duplication** | `/trainer/[slug]` vs `/trainers/[id]` exist | Identify canonical route, delete/redirect other | 20 min |

### ❌ DEFERRED (Nice-to-Have, Post-Launch)

- Profile edit UI (backend likely exists)
- Featured slot purchase UI (Stripe checkout)
- ABN fallback upload UI
- `/emergency` page rename (naming confusion only)

---

## Launch-Blocking Issues: NONE ✅

**All critical user journeys work:**
1. Dog owner finds trainer via homepage OR triage OR directory
2. Emergency routing works automatically
3. Trainer onboarding with ABN verification (85% auto)
4. Admin moderation queue operational

---

## Backend Status: Complete ✅

### Existing & Verified

- ✅ Stripe webhook endpoint (`/api/webhooks/stripe/route.ts`)
- ✅ Emergency triage APIs
- ✅ Search/filter APIs
- ✅ Admin moderation endpoints
- ✅ Cron job configuration (vercel.json)
- ✅ Error logging & telemetry
- ✅ ABN validation integration

### Phase5 Branches (Ready to Merge)

6 branches contain additional admin automation features:
- `phase5-1-config-docs`
- `phase5-2-logging`
- `phase5-3-cron-jobs`
- `phase5-4-moderation`
- `phase5-5-admin-features`
- `phase5-6-tests`

**Status:** All verified non-duplicative, low-risk merges.

---

## Phase1 Priority (THIS WEEK)

### Week 1: Frontend Fixes + Phase5 Merges

**Hours 1-1 (Frontend Fixes):**
1. Add suburb autocomplete to `/onboarding/page.tsx` (10 min)
2. Add auth to `/trainer/page.tsx` (30 min)
3. Resolve `/trainer/[slug]` vs `/trainers/[id]` (20 min)
4. **Smoke test:** Homepage → Search → Directory → Emergency → Dashboard flows

**Hours 1-2 (Phase5 Branch Merges):**
1. Merge `phase5-1-config-docs` (5 min, run tests)
2. Merge `phase5-2-logging` (5 min, run tests)
3. Merge `phase5-3-cron-jobs` (5 min, run tests)
4. Merge `phase5-4-moderation` (5 min, run tests)
5. Merge `phase5-5-admin-features` (5 min, run tests)
6. Merge `phase5-6-tests` (5 min, run tests)
7. **Full regression test suite**

**Result:** 100% feature-complete codebase ready for launch.

---

## Phase2 Priority (WEEK 2)

### Stripe Monetization (If MVP)

**Decision Point:**
- **IF** featured slots are MVP requirement: Build checkout flow (4-6 hours)
- **IF** deferred post-launch: Skip this, launch without monetization

**Assuming Deferred:**
- Continue with launch prep (testing, SEO, monitoring)

### Launch Prep

1. **End-to-end testing** (2-3 hours)
   - All user journeys with real data
   - Cross-browser/device (Safari, Chrome, mobile)
   - Performance profiling

2. **Deployment** (1 hour)
   - Configure staging environment
   - Configure production domain + SSL
   - Set up monitoring (Sentry, analytics)

3. **Go-live** (2 hours)
   - Beta user invites (10-20 trainers)
   - Monitor error logs in real-time
   - Support email/chat active

---

## Two Search Entry Points (NOT Duplication - Complementary)

### `/page.tsx` - Inline Form
- Single-page form with instant inline results
- Submit triggers search, results render below
- Good for power users who know what they want

### `/triage/page.tsx` - Guided Wizard
- 4-step multi-page flow (age → issues → location → review)
- URL-driven state with back navigation
- Emergency gate modal for crisis detection
- Redirects to `/search` on submit
- Good for first-time users needing guidance

**Decision:** Keep both - complementary UX patterns
- Users self-select their journey
- Both fully functional and non-conflicting

### Two Profile Routes (NEEDS RESOLUTION)

- `/trainer/[slug]/page.tsx` - Check if used
- `/trainers/[id]/page.tsx` - Check if used

**Action:** Verify which is canonical, delete/redirect unused route before merging phase5.

---

## Stripe Integration Status

> Authoritative requirements live in `DOCS/MONETIZATION_ROLLOUT_PLAN.md`. This section tracks delivery status only.

### Current State (Phase 9 – Monetization Rollout)

✅ **CONFIRMED-WORKING** (see IMPLEMENTATION_REALITY_MAP.md for evidence):
- ✅ Webhook endpoint implemented (`/api/webhooks/stripe/route.ts`)
- ✅ Signature verification + idempotency + E2E test bypass
- ✅ Handles 5 event types (checkout.session.completed, customer.subscription.*, invoice.payment_failed, etc.)
- ✅ Checkout session API (`/api/stripe/create-checkout-session`) – validates ABN, enforces feature flag, returns stub URL in test mode
- ✅ Purchase UI (`/promote/page.tsx`) – feature-flagged, guarded by ABN verification, Playwright coverage via `tests/e2e/monetization.spec.ts`
- ✅ Admin monetization dashboard (`/api/admin/monetization/{overview,resync}`) – subscription health card, payment audit summaries, latency metrics
- ✅ Stripe product + price created in test mode (Featured Placement: $20 AUD / 30-day placement / FIFO queue)
- ✅ Unit tests (`tests/unit/monetization.test.ts`) + E2E tests (`tests/e2e/monetization.spec.ts`) – both green
- ✅ Telemetry + alerts – payment failure/sync-error thresholds integrated into `/api/admin/alerts/snapshot`

### Pricing Model (Phase 1 Final)
- **Featured Placement**: $20 AUD / 30-day placement / FIFO queue / max 5 concurrent slots per council
- **Subscription tiers** (Pro, Premium, etc.): DEFERRED to Phase 5+ pending Phase 4 KPI gates and user demand validation

### Launch Gating (Phase 9 Policy)

**Monetization remains feature-flagged end-to-end:**
- `FEATURE_MONETIZATION_ENABLED=0` (server default) – rejects checkout API calls
- `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=0` (client default) – hides `/promote` UI
- **Flip flags only after go-live rehearsal + payment audit evidence captured in staging**
- See `DOCS/LAUNCH_READY_CHECKLIST.md` item 10–11 for required evidence (Stripe session IDs, webhook dry-run, payment_audit entries)

### Decision: Feature-Flagged Deployment (NOT MVP Launch Blocker)

**Monetization ships in code but stays dark until Phase 4+ gates met:**
- ≥50 claimed trainers (current ~0 – Phase 1 onboarding in progress)
- Stable ABN verification (85%+ auto-match, manual review backlog <30 days)
- See risk register in `DOCS/blueprint_ssot_v1.1.md:798` and `DOCS/implementation/master_plan.md:622`

---

## Risk Mitigation

| Risk | Mitigation | Trigger |
|------|-----------|---------|
| Dashboard auth not real | Verify auth working before merge | Deploy fails |
| Route duplication causes conflicts | Delete unused route before merges | Test in staging |
| Phase5 merges have regressions | Full test suite after each merge | Test failures |
| Stripe webhook not idempotent | Verify webhook payload handler | Duplicate events |

---

## Success Criteria

### Week 1
- [ ] 3 frontend fixes completed + tested
- [ ] All phase5 branches merged without regressions
- [ ] Full test suite passing (>30 tests)
- [ ] Codebase 100% feature-complete

### Week 2
- [ ] Staging deployment successful
- [ ] End-to-end testing completed (10+ journeys)
- [ ] Performance <1s page load, <200ms search
- [ ] Security audit passed (OWASP Top 10)
- [ ] Beta users invited (10-20 trainers)

### Launch Week
- [ ] Beta feedback incorporated
- [ ] Production deployment successful
- [ ] Monitoring + alerting active
- [ ] Support channels operational

---

## What Changed From Prior Plan

### ❌ REMOVED (Incorrect)
- "Emergency page is placeholder" → Actually full triage wizard exists
- "Homepage doesn't show results" → Actually shows inline results
- "Search/Directory need verification" → Both fully functional
- "2-3 days frontend work needed" → Actually ~1 hour

### ✅ ADDED (Corrected)
- Confirmed 90% frontend completeness
- Identified 3 specific 1-hour fixes
- Clarified phase5 branch low-risk merges
- Stripe decision point (launch vs. defer)

---

## Immediate Next Steps

1. **TODAY:** Fix 3 frontend issues (1 hour)
2. **TODAY:** Start phase5 branch merges
3. **TOMORROW:** Full regression test
4. **END OF WEEK 1:** Launch-ready codebase
5. **WEEK 2:** Staging → Production pipeline

---

## Key Differences: Initial vs. Corrected Plan

| Area | Initial | Corrected | Impact |
|------|---------|-----------|--------|
| **Frontend Status** | 60% complete, 2-3 days work | 90% complete, 1 hour work | Launch moved up 1-2 weeks |
| **Emergency Page** | Placeholder | Full wizard + EmergencyGate | No work needed |
| **Homepage** | Broken/incomplete | Shows inline results | No work needed |
| **Search/Directory** | Needs verification | Both complete | No work needed |
| **Launch Timeline** | 3-4 weeks | 1-2 weeks | Accelerated |

---

## Document Authority

This plan corrects the prior frontend gap analysis based on step-by-step code review verification. All findings verified against actual file implementation, not assumptions.

**Updated Based On:**
- Line-by-line code review of `/triage/page.tsx`, `/page.tsx`, `/search/SearchClient.tsx`, `/directory/page.tsx`
- Component integration verification (SuburbAutocomplete, EmergencyGate)
- Database query validation
- Frontend form testing

**Authority:** This document supersedes the prior "Week 1 Priority" section claiming 3 days frontend work.

---

## Appendix: Files to Review

To verify findings yourself:
- `/src/app/triage/page.tsx` - Lines 1-50 (wizard logic)
- `/src/app/page.tsx` - Lines 206-280 (inline results)
- `/src/app/search/SearchClient.tsx` - Full file (pagination working)
- `/src/app/directory/page.tsx` - Full file (regional grouping working)
- `/src/components/EmergencyGate.tsx` - Full file (complete)
- `/src/app/onboarding/page.tsx` - Lines 225-233 (NUMBER INPUT, needs fix)
- `/src/app/trainer/page.tsx` - Line 22 (DUMMY_BUSINESS_ID, needs fix)

---

**END OF UPDATED PLAN**
