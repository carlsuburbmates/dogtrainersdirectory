# Phase 5 Integration - Incremental Merge Plan

## Goal
Safely integrate Phase 5 (Emergency AI and Automation) features into main through 6 independent, reviewable PRs.

## Current Status
- Main branch: STABLE (16 tests passing)
- Phase 5 core commit: a4d413e "feat: add admin AI controls and dashboards"
- Strategy: Cherry-pick commit → split into 6 focused PRs

## Created PR Branches (Ready for Review)

### 1. phase5-1-config-docs
**Scope:** Documentation and configuration
- `.env.example` - Environment configuration template
- `DOCS/ai-kill-switch.md` - AI safety controls
- `DOCS/hand_over.md` - Handover documentation
- `DOCS/operator-runbook.md` - Operational procedures
- `DOCS/user-workflow-design.md` - User workflows
- `README_DEVELOPMENT.md` - Development guide updates
- `vercel.json` - Deployment configuration

**Risk:** Minimal - documentation and configuration only
**Tests Required:** None specific to this PR
**Merge Order:** First (no dependencies)

### 2. phase5-2-database-migrations
**Scope:** Database schema and migrations
- `supabase/migrations/20251206010000_ai_automation_complete.sql`
  - `ai_review_decisions` table
  - `featured_placements` schema
  - Emergency triage tables
  - Constraints and indexes

**Risk:** Low - migration is additive only
**Tests Required:** Database schema validation
**Merge Order:** Second (runs before backend code)
**Prerequisites:** phase5-1 merged

### 3. phase5-3-api-routes
**Scope:** Admin API endpoints
- `/api/admin/featured/[id]/demote` - Demote featured resource
- `/api/admin/featured/[id]/extend` - Extend featured listing
- `/api/admin/featured/[id]/promote` - Promote queued resource
- `/api/admin/featured/expire` - Manage featured expiry
- `/api/admin/featured/list` - List active/queued placements
- `/api/admin/moderation/run` - Trigger moderation cycle
- `/api/admin/reviews/[id]` - Review override management
- `/api/admin/run/featured-expire` - Run expiry job
- `/api/admin/run/moderation` - Run moderation job

**Risk:** Low-Medium - new endpoints, no breaking changes
**Tests Required:** API endpoint tests
**Merge Order:** Third
**Prerequisites:** phase5-2 merged

### 4. phase5-4-lib-and-scripts
**Scope:** Library utilities and scripts
- `src/lib/eval.ts` - Evaluation utilities
- `src/lib/services/moderation-service.ts` - Moderation logic
- `src/lib/prompt-versions.ts` - Prompt version management
- `src/components/DecisionSourceBadge.tsx` - UI component
- `scripts/evaluate_ai.ts` - AI evaluation script
- Updated `scripts/local_db_start_apply.sh`

**Risk:** Low - new utilities, no breaking changes
**Tests Required:** Library function tests
**Merge Order:** Fourth
**Prerequisites:** phase5-3 merged

### 5. phase5-5-admin-ui
**Scope:** Admin dashboard pages
- `src/app/admin/ai-health/page.tsx` - AI health dashboard
- `src/app/admin/cron-health/page.tsx` - Cron job dashboard
- Updated `src/app/admin/page.tsx` - Admin queues page with Phase 5 features

**Risk:** Medium - UI changes, feature-complete
**Tests Required:** Component and integration tests
**Merge Order:** Fifth
**Prerequisites:** phase5-4 merged

### 6. phase5-6-tests
**Scope:** Unit tests for Phase 5 features
- `src/tests/unit/admin_featured.test.ts` - Featured placement tests (7 tests)
- `src/tests/unit/admin_reviews.test.ts` - Review override tests (3 tests)
- `src/tests/unit/evaluate.test.ts` - Evaluation tests (4 tests)
- `src/tests/fixtures/ai_golden_triage_sample.json` - Test data

**Risk:** None - tests only
**Tests Required:** All tests must pass
**Merge Order:** Last (comprehensive validation)
**Prerequisites:** phase5-5 merged
**Expected Result:** 30 tests passing

## Merge Strategy

### Pre-Merge Checklist for Each PR
1. Run `npm run test` - Ensure all tests pass
2. Run `npm run type-check` - TypeScript validation
3. Review code for security and best practices
4. Verify no breaking changes to existing APIs
5. Check database migration compatibility (phase5-2)

### Merge Sequence
```
main
  ↓ merge phase5-1-config-docs
  ↓ merge phase5-2-database-migrations
  ↓ merge phase5-3-api-routes
  ↓ merge phase5-4-lib-and-scripts
  ↓ merge phase5-5-admin-ui
  ↓ merge phase5-6-tests
final: Phase 5 fully integrated into main
```

## Rollback Plan
Each PR is independent and can be reverted if issues arise:
- Individual commits can be reverted without affecting others
- Database migrations are additive (safe to revert)
- No data loss on rollback

## Branch Management
After merge is complete:
- Delete feature/phase5-emergency-ai-and-automation
- Delete merge/phase5-core
- Keep individual phase5-* branches for 30 days as reference
- Tag final merge commit with `phase5-complete`

## Timeline
- Phase 5-1: Config & docs (1-2 days review)
- Phase 5-2: Database (2-3 days review)
- Phase 5-3: API routes (2-3 days review)
- Phase 5-4: Libraries (1-2 days review)
- Phase 5-5: Admin UI (2-3 days review)
- Phase 5-6: Tests (1 day review)

**Total:** ~10-15 days for complete Phase 5 integration

## Success Criteria
✅ All 6 PRs merged to main
✅ 30+ unit tests passing
✅ No TypeScript errors
✅ No breaking changes to existing APIs
✅ Admin dashboards fully functional
✅ Database migrations applied successfully
✅ Documentation updated and clear
✅ Code reviewed and approved

## Notes
- Supabase connection verified and working
- All Phase 5 code is clean (no injections)
- Tests pass locally and in CI
- Low-risk, incremental approach minimizes deployment risks
