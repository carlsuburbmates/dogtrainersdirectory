# Phase 9B Operator Checklist – Staging Monetization Drill

> **SSOT – Canonical Source of Truth** · Phase 9B operator-only actions and evidence capture

> **Use this checklist on the day you execute the Phase 9B Stripe drill in staging.**
> This is your day-of operations guide. For detailed technical context, see:
> - PHASE_9B_STAGING_HARDENING_RUNBOOK.md (full reference)
> - launch-staging-<timestamp>-monetization-preflight.md (evidence archive)

## Overview

**You should only open this checklist once:**
- [x] `npm run verify:launch` (or GitHub Actions **Verify Launch**) is green for the target branch
- [x] `npm run build` succeeds
- [x] `npm test` / `npm run e2e` passes (including monetization flows)
- [x] All code commits are pushed to main

This checklist assumes all automation (Steps 1–3) have already **PASSED**. You are now executing the manual Stripe drill (Steps 4–7) and capturing evidence.

---

## Preconditions (Tick-list)

- [ ] `npm run build` and tests green (verified by automation, last checked: [insert date])
- [ ] (Optional but recommended) GitHub Actions workflow **Verify Phase 9B** has been run and is green for main
- [ ] You have access to Stripe Dashboard (test mode)
- [ ] You have access to Vercel project settings (dogtrainersdirectory)
- [ ] You can connect to staging Supabase DB via psql or Supabase Studio
- [ ] Staging uses Vercel Preview deployments (no fixed `staging.` DNS); use the Preview deployment URL shown in Vercel for any manual checks.
- [ ] Production feature flags are OFF (verify in Vercel UI before proceeding)

(remaining checklist unchanged)
