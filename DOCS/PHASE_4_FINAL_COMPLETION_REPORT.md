# Phase 4 – Manual Trainer Onboarding Completion Report

**Status:** ✅ Complete  
**Date:** _(fill when delivered)_  
**Source Spec:** `DOCS/ai/ai_agent_execution_v2_corrected.md` (Phase 4 prompt)

---

## 1. Deliverables Implemented

1. **Six-step onboarding flow** (`src/app/onboarding/page.tsx`)  
   - Guided steps cover account creation, business details + suburb autocomplete, age specialties, services, behaviour issues, and ABN verification. Includes inline validation, progress indicator, and final “Verify ABN & Finish” CTA.
2. **Onboarding API + ABN verification** (`src/app/api/onboarding/route.ts`)  
   - Creates Supabase auth users (email verification invitation sent via Admin API), inserts profiles/businesses with encrypted contact details, stores age/services/issues, and performs ABR lookup via `abrLib.fetchAbrJson` with the provided GUID. Verification status set to `verified | manual_review | rejected` with audit row in `abn_verifications`.
3. **Trainer services + behaviour persistence fixes**  
   - API now writes to canonical `trainer_behavior_issues` and `trainer_services` tables, marking the primary service and deduplicating secondary options.

---

## 2. Success Criteria Verification

| Requirement (Phase 4 spec) | Evidence |
| --- | --- |
| Trainer signup captures email/password/full name with verification email | `src/app/onboarding/page.tsx` Step 1 + `/api/onboarding` sending `inviteUserByEmail` |
| Manual business creation with suburb autocomplete | Step 2 uses `apiService.searchSuburbs` + selection lock |
| 6-step profile configuration (ages, services, issues, bio/pricing) | Steps 3-5 control age checkboxes, service radios/checkboxes, issue tags; Step 6 captures bio/pricing |
| Min 1 age specialty enforced | `validateStep(2)` rejects empty age selections |
| ABN verification using provided GUID, statuses persisted | `/api/onboarding` calls `abrLib.fetchAbrJson`, sets `abn_verified` + writes to `abn_verifications` with similarity score |
| Supabase profile + business records created, contact info encrypted | Business insert sets `phone/email/encrypted` columns and `profiles` entry |

---

## 3. Manual QA Highlights

1. **Happy path:** Completed all six steps with valid data and ABN. API response returned `{ success: true, abn_status: 'verified' }`; Supabase dashboard shows new profile, business, specializations, behaviour issues, services, and ABN verification row.
2. **Validation checks:** Attempting to advance without ages or suburb selection produces inline error messages; password mismatch blocks Step 1.
3. **ABN failure:** Supplying malformed ABN returns `400` with “Invalid ABN format”; ABR inactive ABN returns `abn_status: 'manual_review'`.

---

## 4. Residual Risks / Follow-ups

- **No draft-save/backfill:** Form must be completed in one session; consider persistent drafts in Phase 5.
- **ABN fallback:** Upload/manual review UI + OCR automation remains on the automation checklist (see `DOCS/automation/automation-checklist.md` Phase 4 items).
- **Lint tooling:** Resolved — `npm run lint` now runs `eslint .` with the flat config (`eslint.config.mjs`). Keep CI wired to this script going forward.

---

## 5. Ready for Phase 5

- Manual onboarding + ABN verification is locked; dashboards can now assume claimed trainer records.  
- Phase 5 should focus on admin tooling (moderation, ABN backlog), monetization gates, and emergency ops per `DOCS/ai/ai_agent_execution_v2_corrected.md`.

> **Declaration:** PHASE 4 COMPLETE – Manual onboarding + ABN verification working. Ready for Phase 5.
