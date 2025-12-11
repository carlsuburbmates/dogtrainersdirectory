# Phase 9B Operator Checklist – Staging Monetization Drill

> **Use this checklist on the day you execute the Phase 9B Stripe drill in staging.**
> This is your day-of operations guide. For detailed technical context, see:
> - PHASE_9B_STAGING_HARDENING_RUNBOOK.md (full reference)
> - launch-staging-20251211-monetization-preflight.md (evidence archive)

## Overview

**You should only open this checklist once:**
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
- [ ] Staging URL is: `https://dogtrainersdirectory-staging.vercel.app` (or verify your actual staging domain)
- [ ] Production feature flags are OFF (verify in Vercel UI before proceeding)

---

## Step 4 – Stripe Drill (Staging)

### 4.1 Webhook Registration (Manual – Stripe Dashboard)

**Goal:** Create a webhook endpoint in Stripe test mode to receive payment events.

- [ ] Open https://dashboard.stripe.com → **Developers** → **Webhooks** (ensure you're in **Test mode**)
- [ ] Click **+ Add endpoint**
- [ ] Endpoint URL: `https://dogtrainersdirectory-staging.vercel.app/api/webhooks/stripe`
- [ ] Events to listen: Select **All events** (or minimal: `checkout.session.completed`, `charge.succeeded`, `charge.failed`)
- [ ] Create endpoint
- [ ] **Copy the signing secret** (begins with `whsec_test_`)
- [ ] Paste the secret into: **Vercel** → **Settings** → **Environment Variables** → **Preview** → `STRIPE_WEBHOOK_SECRET` → **Save & Redeploy**
- [ ] Confirm Vercel preview deployment completes (check: https://vercel.com/deployments)
- [ ] **Record in launch_run file (Step 4.1 section):**
  - Stripe endpoint ID (e.g., `we_12345...`)
  - Signing secret reference (e.g., `whsec_test_***` – last 4 chars only for security)
  - Redeploy timestamp

### 4.2 Test Payment (Manual – Staging UI)

**Goal:** Run a test checkout and complete payment with Stripe test card.

- [ ] Open: `https://dogtrainersdirectory-staging.vercel.app/promote?businessId={{BUSINESS_ID}}`
  - Replace `{{BUSINESS_ID}}` with an actual (unverified or test) trainer ID from staging DB
- [ ] Click **Upgrade to Featured** (or equivalent button)
- [ ] You should see Stripe checkout session
- [ ] Use test card: `4242 4242 4242 4242` (any future date, any CVC)
- [ ] Complete payment
- [ ] **Record in launch_run file (Step 4.2 section):**
  - Checkout Session ID (from Stripe Dashboard → Events)
  - Payment Intent ID
  - Stripe Customer ID (if created)
  - Subscription ID (if applicable)
  - Timestamp

### 4.3 Webhook Replay (Manual – Stripe CLI or Dashboard)

**Goal:** Manually trigger webhook delivery to confirm `/api/webhooks/stripe` endpoint receives and processes events.

**Option A: Via Stripe CLI (recommended)**
```bash
# In a terminal, start listening on the webhook secret:
stripe listen --events checkout.session.completed,charge.succeeded --forward-to https://dogtrainersdirectory-staging.vercel.app/api/webhooks/stripe

# In another terminal, replay or resend an event:
stripe events resend {{EVENT_ID}}
# OR manually trigger:
stripe trigger checkout.session.completed
```

**Option B: Via Stripe Dashboard**
- Dashboard → Developers → Webhooks → [Your endpoint] → **Attempts** → click a past event → **Resend**

- [ ] Confirm **200 OK** response (check Stripe Dashboard → Webhooks → Attempts, or CLI output)
- [ ] **Record in launch_run file (Step 4.3 section):**
  - Event ID(s) replayed
  - HTTP response code(s)
  - Timestamp(s)

### 4.4 Database Verification (Manual – psql or Supabase Studio)

**Goal:** Confirm payment + subscription records were inserted into staging DB.

Run these queries in psql (or Supabase Studio SQL editor):

```sql
-- Check payment audit
SELECT id, business_id, amount_cents, status, created_at 
  FROM payment_audit 
  ORDER BY created_at DESC LIMIT 5;

-- Check subscription status
SELECT id, business_id, stripe_subscription_id, status, current_period_end 
  FROM business_subscription_status 
  ORDER BY updated_at DESC LIMIT 5;
```

- [ ] Confirm rows exist (not empty)
- [ ] Verify `business_id` matches the ID you used in 4.2
- [ ] Verify `status` is `completed` or `active` (depending on payment stage)
- [ ] **Record in launch_run file (Step 4.4 section):**
  - Row counts (e.g., "3 rows in payment_audit, 1 row in business_subscription_status")
  - Paste query output or screenshot

### 4.5 Admin Dashboard Verification (Manual – UI)

**Goal:** Confirm the promoted trainer appears correctly in the admin dashboard.

- [ ] Open: `https://dogtrainersdirectory-staging.vercel.app/admin/dashboard` (if available)
- [ ] Navigate to "Subscriptions" or "Featured Placements" section
- [ ] Search for the business ID from step 4.2
- [ ] Confirm:
  - [ ] Status shows as **Featured** or **Active Subscription**
  - [ ] Renewal date is ~30 days from today (or as per pricing)
  - [ ] Payment status shows **Paid** or **Succeeded**
- [ ] Take 2–4 screenshots (dashboard list, detail view, payment status)
- [ ] **Record in launch_run file (Step 4.5 section):**
  - Screenshot file names or paste URLs
  - Observed status fields

---

## Step 6 – Update SSOT (After Step 4 Complete)

**Goal:** Lock in Phase 9B completion in the single source of truth.

Once all Step 4 substeps are done and evidence is captured:

- [ ] Open: `DOCS/MONETIZATION_ROLLOUT_PLAN.md`
  - Find section: **Phase 9B – Staging Hardening (IN PROGRESS – Stripe drill pending)**
  - Replace `{{PHASE_9B_EXECUTION_DATE}}` with today's date (YYYY-MM-DD)
  - Replace `{{PHASE_9B_OPERATOR}}` with your name
  - Change status from `IN PROGRESS – Stripe drill pending` to `COMPLETED`
  - Change "Expected outcomes" to "Verified outcomes"
  - Change tense from "will be" to "are" / "were"
  - Save and commit

- [ ] Open: `DOCS/LAUNCH_READY_CHECKLIST.md`
  - Find item 10: **Monetization readiness (Phase 9B – staging only)**
  - Change `PENDING – operator execution required` to: `COMPLETED {{PHASE_9B_EXECUTION_DATE}}` (with real date)
  - Save and commit

- [ ] Verify no other doc updates are needed (run: `python3 scripts/check_docs_divergence.py --base-ref origin/main`)

---

## Step 7 – Production Safety (Final Gate – Manual)

**Goal:** Confirm production environment is still safe (monetization OFF) and no live Stripe webhooks exist.

- [ ] **Vercel Production Env** (https://vercel.com/dogtrainersdirectory/dogtrainersdirectory/settings/environment-variables):
  - [ ] `FEATURE_MONETIZATION_ENABLED` = 0 (or missing / not set to 1)
  - [ ] `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED` = 0 (or missing / not set to 1)
  - [ ] **Environment** column shows "(Production)" for these vars, NOT "(Preview)"

- [ ] **Stripe Live Mode** (https://dashboard.stripe.com):
  - [ ] Switch to **Live** mode (toggle at top-left)
  - [ ] Developers → Webhooks
  - [ ] Confirm **zero webhook endpoints** for dogtrainersdirectory.com.au (or your prod domain)
  - [ ] **Do NOT register any live webhooks yet** (Phase 9C will do this after governance approval)

- [ ] **Gates to Production** (verify before moving to Phase 9C):
  - [ ] ≥ 50 claimed trainers on platform (check: `SELECT COUNT(*) FROM trainers WHERE claim_verified = true;`)
  - [ ] ≥ 85% ABN auto-verification rate (check: recent audit logs, ABN success count)
  - [ ] Formal governance sign-off (document: who approved, date, ticket)

---

## Final Checklist

- [ ] All Step 4 substeps (4.1–4.5) completed and evidence in launch_run file
- [ ] Step 6: SSOT docs updated with real execution date + operator name
- [ ] Step 7: Production safety verified
- [ ] Git commit: `git add DOCS/launch_runs/launch-staging-20251211-monetization-preflight.md DOCS/MONETIZATION_ROLLOUT_PLAN.md DOCS/LAUNCH_READY_CHECKLIST.md && git commit -m "ops(phase9b): drill completed {{PHASE_9B_EXECUTION_DATE}}"`
- [ ] Ready for Phase 9C governance & production enablement (if gates met)

