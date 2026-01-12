# File Manifest — Canonical Post-launch Docs

**Status:** Canonical (Tier-1)  
**Version:** v1.1  
**Last Updated:** Phase 1 Batch 3 - Documentation Updates

## 1. Authority tiers
- **Tier-0:** Blueprint SSOT (`00_BLUEPRINT_SSOT.md`)
- **Tier-1:** Canonical support docs in this folder
- **Tier-2+:** Non-canonical (design notes, drafts, historical) — not included here by design

## 2. Canonical set (must read)
- `00_BLUEPRINT_SSOT.md` (Tier-0)
- `01_SYSTEM_MODEL.md` — ✅ Updated (Phase 1 Batch 3)
- `02_ARCHITECTURE.md` — ✅ Updated (Phase 1 Batch 3)
- `03_DATA_CONTRACTS.md`
- `04_API_CONTRACTS.md` — ✅ Updated (Phase 1 Batch 3)
- `05_ROUTES_AND_NAV.md` — ✅ Updated (Phase 1 Batch 3)
- `06_MONETISATION.md`
- `07_AI_AUTOMATION.md`
- `08_OPS_RUNBOOK.md`
- `09_DEPLOYMENT.md`
- `10_SECURITY_AND_PRIVACY.md` — ✅ Updated (Phase 1 Batch 3)
- `CHANGE_PROTOCOL.md`

## 3. Exclusions (explicit)
The following are intentionally excluded from the post-launch canonical set:
- weekly/phase implementation diaries
- raw test output logs
- legacy rollout plans superseded by launch reality
- incident dumps (unless converted into a runbook entry)

## 4. Key implementation files (Phase 1)

### 4.1 New files created (Batch 1 & 2)
**Authentication & Middleware:**
- `src/lib/auth.ts` — Admin authentication helper functions
- `src/middleware.ts` — Next.js middleware for route protection

**API Endpoints:**
- `src/app/api/public/search/route.ts` — Full-text search API with filtering
- `src/app/api/admin/reviews/list/route.ts` — Admin reviews list with AI moderation data

**UI Components:**
- `src/app/trainers/[id]/ContactForm.tsx` — Contact form for trainer inquiries

### 4.2 Deleted files (Batch 1)
- `src/app/wizard/layout.tsx` — **REMOVED** (entire wizard directory deleted)
- `src/app/wizard/**` — **REMOVED** (directory cleanup)

### 4.3 Significantly modified files (Batch 1 & 2)
**Pages:**
- `src/app/search/page.tsx` — Enhanced with full search functionality
- `src/app/emergency/page.tsx` — Enhanced with resources lookup and AI triage
- `src/app/trainers/[id]/page.tsx` — Comprehensive trainer profile with full details
- `src/app/trainer/[id]/page.tsx` — Redirect handler for backward compatibility
- `src/app/admin/reviews/page.tsx` — Full review moderation interface

**Database Access:**
- `src/app/trainers/page.tsx` — Updated to use businesses table (not deprecated trainers table)

### 4.4 Configuration
- `next.config.js` — Middleware matcher configuration for protected routes
- `.env.example` — Updated with required environment variables
