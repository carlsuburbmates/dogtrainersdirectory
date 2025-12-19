# Routes & Navigation — Public vs Admin

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Public pages
- `/` — src/app/page.tsx
- `/directory` — src/app/directory/page.tsx
- `/emergency` — src/app/emergency/page.tsx
- `/onboarding` — src/app/onboarding/page.tsx
- `/promote` — src/app/promote/page.tsx
- `/search` — src/app/search/page.tsx
- `/trainer/[id]` — src/app/trainer/[id]/page.tsx
- `/trainers` — src/app/trainers/page.tsx
- `/trainers/[id]` — src/app/trainers/[id]/page.tsx
- `/triage` — src/app/triage/page.tsx

## 2. Admin pages
- `/admin` — src/app/admin/page.tsx
- `/admin/ai-health` — src/app/admin/ai-health/page.tsx
- `/admin/cron-health` — src/app/admin/cron-health/page.tsx
- `/admin/errors` — src/app/admin/errors/page.tsx
- `/admin/reviews` — src/app/admin/reviews/page.tsx
- `/admin/triage` — src/app/admin/triage/page.tsx

## 3. Hard separation rule
- The `/emergency` page is **public** and must never be repurposed as an admin monitoring surface.
- Admin monitoring belongs under `/admin/**`.
