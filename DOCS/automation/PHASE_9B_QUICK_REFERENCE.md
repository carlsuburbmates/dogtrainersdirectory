> **SSOT – Canonical Source of Truth**
> Scope: Phase 9B quick-reference checklist for operators
> Status: Active · Last reviewed: 2025-12-11
> Authority: DOCS/automation/PHASE_9B_STAGING_HARDENING_RUNBOOK.md

# Phase 9B – Quick Reference Checklist

**Use this checklist while executing PHASE_9B_STAGING_HARDENING_RUNBOOK.md**

---

## ✅ Preconditions (STOP if any are not confirmed)

- [ ] Staging Supabase project URL obtained
- [ ] Staging `SUPABASE_SERVICE_ROLE_KEY` available (NOT in repo)
- [ ] Staging database accessible via `psql`
- [ ] Supabase CLI linked: `supabase link --project-ref <id>` succeeds
- [ ] `STRIPE_SECRET_KEY` begins with `sk_test_` (NOT `sk_live_`)
- [ ] Stripe test pricing IDs exist (Featured: `price_1Sd6oRClBfLESB1nh3NqPlvm`)
- [ ] Stripe test mode dashboard confirmed (not production)
- [ ] Production has `FEATURE_MONETIZATION_ENABLED=0`
- [ ] Production has `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=0`

**If any unchecked: ABORT and remediate before proceeding**

---

## 🧪 Execution Steps

### STEP 1: Populate Staging Env Vars

- [ ] Opened Vercel → Project → Settings → Environment Variables
- [ ] Selected Environment: **Staging** (NOT Production)
- [ ] Added Supabase vars (6 total)
- [ ] Added Stripe vars (4 total)
- [ ] Added Telemetry vars (3 total)
- [ ] Added Feature flags: `FEATURE_MONETIZATION_ENABLED=1`, `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=1`
- [ ] Redeployed staging: `vercel --prod`
- [ ] Verified deployment succeeded

**Evidence file:** `DOCS/launch_runs/launch-staging-YYYYMMDD-monetization-preflight.md`

---

### STEP 2: Environment Validator

```bash
TARGET_ENV=staging ./scripts/check_env_ready.sh staging
```

- [ ] Output shows `[PASS] Env Ready Check`
- [ ] All required keys present
- [ ] Copied full PASS output to evidence file

**Evidence section:** `## Environment Ready Check`

---

### STEP 3: Apply Migration

```bash
supabase link --project-ref <staging-project-id>
supabase db push --linked
supabase db diff --linked
```

- [ ] Migration applied successfully
- [ ] `supabase db diff` shows "No unapplied migrations"
- [ ] Confirmed tables exist: `psql <connection-string> -c "\dt payment_audit business_subscription_status"`
- [ ] Copied migration logs to evidence file
- [ ] Updated `DOCS/db/MIGRATIONS_INDEX.md` with apply date

**Evidence section:** `## Migration Applied`

---

### STEP 4: Stripe Test Drill

#### 4.1 Register Webhook
- [ ] Logged into Stripe **test mode** (not production)
- [ ] Navigated: Developers → Webhooks → Add Endpoint
- [ ] Endpoint URL set: `https://<staging-url>/api/webhooks/stripe`
- [ ] Events selected (5 total):
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_failed`
- [ ] Copied webhook signing secret: `whsec_test_*`
- [ ] Updated Vercel staging: `STRIPE_WEBHOOK_SECRET=whsec_test_*`
- [ ] Redeployed staging
- [ ] Screenshot taken (webhook endpoint list)

**Evidence section:** `## Stripe Webhook Registration`

---

#### 4.2 Create Test Payment
- [ ] Opened staging: `https://<staging-url>/promote?businessId=<business-id>`
- [ ] Clicked "Upgrade" button
- [ ] Redirected to Stripe Checkout
- [ ] Entered test card: `4242 4242 4242 4242`
- [ ] Completed payment
- [ ] Recorded session ID: `cs_test_...`
- [ ] Recorded payment intent ID: `pi_test_...`
- [ ] Recorded customer ID: `cus_...`
- [ ] Recorded subscription ID: `sub_...`

**Evidence section:** `## Stripe Test Payment Evidence`

---

#### 4.3 Replay Webhooks

```bash
# Terminal 1: Listen
stripe listen --forward-to https://<staging-url>/api/webhooks/stripe

# Terminal 2: Trigger events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

- [ ] All 4 events shown as "delivered" in `stripe listen` output
- [ ] Vercel logs show: `POST /api/webhooks/stripe 200`
- [ ] Copied full `stripe listen` output to evidence file
- [ ] Copied relevant Vercel logs to evidence file

**Evidence section:** `## Webhook Replay Evidence`

---

#### 4.4 Verify Database

```sql
SELECT id, event_type, business_id, session_id, amount_cents, status, created_at 
FROM payment_audit 
ORDER BY created_at DESC 
LIMIT 20;

SELECT business_id, status, current_period_start, current_period_end, updated_at 
FROM business_subscription_status 
ORDER BY updated_at DESC 
LIMIT 20;
```

- [ ] `payment_audit` shows `checkout_session_created` entry
- [ ] `payment_audit` shows `subscription_active` entry
- [ ] `business_subscription_status` shows active subscription
- [ ] Amount is `2000` (cents = $20 AUD)
- [ ] Screenshots taken of both query results

**Evidence section:** `## Supabase Staging DB Verification`

---

#### 4.5 Verify Admin Dashboard

Open: `https://<staging-url>/admin`

- [ ] Subscription Health card visible
- [ ] Test subscription listed with correct business ID
- [ ] Status shows: **Active**
- [ ] Amount shows: **$20.00 AUD**
- [ ] No unsuppressed monetization alerts
- [ ] Latency metrics show `monetization_api` entries (<200ms)
- [ ] Screenshots taken (4 total):
  1. Dashboard overview
  2. Subscription details
  3. Alerts section
  4. Latency metrics

**Evidence section:** `## Admin Dashboard Evidence`

---

### STEP 5: Alert Evaluation

```bash
TARGET_ENV=staging npx tsx scripts/run_alerts_email.ts --dry-run
```

- [ ] Output shows: `Alert Evaluation (staging) – Dry Run`
- [ ] Monetization service: `Status: OK (no unsuppressed alerts)`
- [ ] All services healthy (or documented reasons for alerts)
- [ ] Copied full output to evidence file

**Evidence section:** `## Alert Evaluation (Dry Run)`

---

### STEP 6: Update SSOT Documents

- [ ] Updated `DOCS/MONETIZATION_ROLLOUT_PLAN.md`:
  - [ ] Added "Phase 9B – Staging Hardening (COMPLETED)" section
  - [ ] Recorded drill results (9 bullet points)
  - [ ] Added evidence location links
  - [ ] Added Next: Phase 9C note

- [ ] Updated `DOCS/LAUNCH_READY_CHECKLIST.md`:
  - [ ] Found item 10 ("Monetization readiness")
  - [ ] Replaced with detailed Phase 9B completion checkmarks
  - [ ] Added all evidence links

- [ ] Updated `DOCS/db/MIGRATIONS_INDEX.md`:
  - [ ] Added migration apply date row

- [ ] Updated `DOCS/launch_runs/launch-staging-YYYYMMDD-monetization-preflight.md`:
  - [ ] Preconditions verified section
  - [ ] Step 1: Environment Ready (output pasted)
  - [ ] Step 2: Migration Applied (logs + \dt output)
  - [ ] Step 3: Webhook Registered (screenshot)
  - [ ] Step 4: Test Payment (4 IDs recorded)
  - [ ] Step 5: Webhook Replay (stripe listen output)
  - [ ] Step 6: DB Verification (2 query results)
  - [ ] Step 7: Admin Dashboard (4 screenshots)
  - [ ] Step 8: Alert Evaluation (dry-run output)
  - [ ] Decision: ✅ Phase 9B PASSED

---

### STEP 7: STOP (Do NOT Proceed to Production)

- [ ] Confirmed: Production still has monetization flags OFF
- [ ] Confirmed: No production environment changes made
- [ ] Noted: Phase 9C requires ≥50 trainers + 85%+ ABN verify
- [ ] Documented: Awaiting governance approval

---

## 📋 Sign-Off

**Operator Name:** ___________________

**Date Completed:** ___________________

**Commit Hash:** ___________________

**Decision:**
- [ ] ✅ Phase 9B Staging Drill PASSED – Ready for Phase 9C (pending KPI gates)
- [ ] 🚫 Phase 9B FAILED – Remediation required (document above)

---

## 🆘 Troubleshooting Quick Links

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| Env validator FAIL | Missing Vercel staging var | Re-populate in Vercel UI, redeploy |
| Migration FAIL | Link failed | Confirm staging project ID, re-run `supabase link` |
| Webhook registration FAIL | Staging URL not public | Confirm Vercel staging URL is live, not localhost |
| Webhook events not delivering | Signature mismatch | Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard |
| `payment_audit` table empty | Handler not invoked | Check Vercel logs for 404/500 errors on webhook route |
| `business_subscription_status` empty | Handler code issue | Confirm `customer.subscription.*` events selected in Stripe |
| Admin dashboard blank | Feature flag OFF | Check `FEATURE_MONETIZATION_ENABLED=1` in Vercel staging |
| Alerts firing | Test side effect | Suppress temporarily with override toggle, or expected test alert |

---

**See full runbook:** `DOCS/automation/PHASE_9B_STAGING_HARDENING_RUNBOOK.md`
