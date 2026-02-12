# Routes & Navigation — Public vs Admin

**Status:** Canonical (Tier-1)  
**Version:** v1.1  
**Last Updated:** Phase 1 Batch 3 - Documentation Updates

## 1. Public pages

### Core Pages
- `/` — src/app/page.tsx  
  **Status:** Implemented
  
- `/directory` — src/app/directory/page.tsx  
  **Status:** Implemented

- `/emergency` — src/app/emergency/page.tsx  
  **Status:** ✅ **Implemented (Phase 1 Batch 2)**  
  **Features:** Emergency resources lookup by location/type, AI triage form with priority classification
  
- `/onboarding` — src/app/onboarding/page.tsx  
  **Status:** Implemented

- `/promote` — src/app/promote/page.tsx  
  **Status:** Implemented

- `/search` — src/app/search/page.tsx  
  **Status:** ✅ **Implemented (Phase 1 Batch 1)**  
  **Features:** Full-text search with 11+ filters, location-based search, service type filtering, results grid

- `/triage` — src/app/triage/page.tsx  
  **Status:** Implemented

- `/login` — src/app/login/page.tsx  
  **Status:** Implemented  
  **Notes:** Admin sign-in via one-time email link

### Legal & policy pages
- `/privacy` — src/app/privacy/page.tsx  
  **Status:** Implemented

- `/terms` — src/app/terms/page.tsx  
  **Status:** Implemented

- `/disclaimer` — src/app/disclaimer/page.tsx  
  **Status:** Implemented

### Trainer Profile Pages
- `/trainers` — src/app/trainers/page.tsx  
  **Status:** Redirects to `/directory`  
  **Notes:** Canonical directory listing is `/directory`

- `/trainers/[id]` — src/app/trainers/[id]/page.tsx  
  **Status:** ✅ **Enhanced (Phase 1 Batch 2)**  
  **Features:** 
    - Comprehensive trainer profile with hero section, about, services, behavior issues, age specialties
    - Approved reviews display (up to 10)
    - Contact information sidebar with phone, email, website, physical address
    - Integrated contact form component
    - ABN verification badge, featured status badge
    - Star rating display with review count

- `/trainer/[id]` — src/app/trainer/[id]/page.tsx  
  **Status:** ✅ **Redirect Handler (Phase 1 Batch 2)**  
  **Purpose:** 301 redirect to `/trainers/[id]` for backward compatibility  
  **Notes:** Preserves query parameters in redirect

## 2. Admin pages

### Dashboard & Monitoring
- `/admin` — src/app/admin/page.tsx  
  **Status:** Implemented

- `/admin/ai-health` — src/app/admin/ai-health/page.tsx  
  **Status:** Implemented

- `/admin/cron-health` — src/app/admin/cron-health/page.tsx  
  **Status:** Implemented

- `/admin/errors` — src/app/admin/errors/page.tsx  
  **Status:** Implemented

### Content Moderation
- `/admin/reviews` — src/app/admin/reviews/page.tsx  
  **Status:** ✅ **Implemented (Phase 1 Batch 2)**  
  **Features:**
    - Review list with filtering (status: pending/approved/rejected, rating: 1-5 stars)
    - AI moderation suggestions display (decision, confidence, reason)
    - Approve/Reject actions with reason capture
    - Client-side search across reviewer name, title, content, business name
    - Pagination (10 reviews per page)
    - Real-time status updates
  **Auth:** Protected by admin middleware

- `/admin/triage` — src/app/admin/triage/page.tsx  
  **Status:** Implemented

## 3. Deleted Routes

### Removed in Phase 1 Batch 1
- `/wizard/**` — **DELETED**  
  **Reason:** Directory structure removed as part of cleanup

## 4. Hard separation rule
- The `/emergency` page is **public** and must never be repurposed as an admin monitoring surface.
- Admin monitoring belongs under `/admin/**`.

## 5. Route Protection
- All `/admin/**` routes are protected by Next.js middleware (src/middleware.ts)
- Authentication check via `checkAdminAuthFromRequest()` from src/lib/auth.ts
- Non-admin users are redirected to `/login`
- See DOCS/SSOT/10_SECURITY_AND_PRIVACY.md for auth implementation details
