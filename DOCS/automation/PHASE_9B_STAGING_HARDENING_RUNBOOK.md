<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->

> **Runbook Status:** Active · Last reviewed: 2025-12-11
> Purpose: Phase 9B staging drill for monetization end-to-end validation
> Authority: DOCS/MONETIZATION_ROLLOUT_PLAN.md, DOCS/blueprint_ssot_v1.1.md, DOCS/implementation/master_plan.md

# Phase 9B – Staging Hardening Runbook (Monetization Drill)

## Objective

Prove that all monetization components work end-to-end in **staging only**, without enabling live payments or touching production infrastructure. This runbook is the definitive operations checklist for validating the Phase 9a codebase before Phase 9c beta rollout decision.

## Success Criteria (All Must Be True)

1. ✅ `scripts/check_env_ready.sh staging` → **PASS**
2. ✅ Migration `20251209101000_create_payment_tables.sql` applied in staging Supabase
3. ✅ Manual Stripe test payment → webhook replay → DB update → admin dashboard verification
4. ✅ Evidence captured in `DOCS/launch_runs/launch-staging-YYYYMMDD-monetization-preflight.md`
5. ✅ Monetization flags remain **OFF** in production environment
6. ✅ `DOCS/LAUNCH_READY_CHECKLIST.md` items 10 & 11 marked with evidence links

---

## 🔥 STEP 0 — Preconditions (MUST Verify Before Starting)

**Do NOT start the drill unless ALL three conditions are true. If any are false, abort and remediate.**

### Precondition 1: Staging Infrastructure Available
- [ ] Staging Supabase project URL obtained from ops team
- [ ] Staging Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`) available (NOT in repo)
- [ ] Staging database accessible: `psql postgresql://user:pass@...staging...` connects successfully
- [ ] Supabase CLI linked: `supabase link --project-ref <staging-project-id>` returns "Project linked"

### Precondition 2: Staging Stripe Test Keys (NOT Live)
- [ ] `STRIPE_SECRET_KEY` begins with `sk_test_` (NOT `sk_live_`)
- [ ] Webhook signing secret format: `whsec_test_*` (after webhook registration in Step 4.1)
- [ ] Stripe test pricing IDs already created:
  - `STRIPE_PRICE_FEATURED` = `price_1Sd6oRClBfLESB1nh3NqPlvm` (or similar test price ID)
  - `STRIPE_PRICE_PRO` = reserved for Phase 5+ (do not use in Phase 1)
- [ ] Stripe test mode dashboard accessible (not production dashboard)

### Precondition 3: Production Flags Remain OFF ⚠️ CRITICAL SAFETY GATE
- [ ] **Production Vercel environment MUST have:**
  ```
  FEATURE_MONETIZATION_ENABLED=0
  NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=0
  ```
- [ ] **Staging/Preview Vercel environment MUST have:**
  ```
  FEATURE_MONETIZATION_ENABLED=1
  NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=1
  ```
- [ ] Confirm via Vercel UI: https://vercel.com/dogtrainersdirectory/dogtrainersdirectory/settings/environment-variables
  - Look at "Environment" column to distinguish Production vs. Preview
  - Values are encrypted in UI but labels show "(Production)" or "(Preview)"
  - If you cannot verify, **STOP and contact ops team before proceeding**

**⚠️ ABORT CONDITIONS - Do NOT proceed if:**
1. Production flags are set to `1` (monetization would be enabled live)
2. You cannot verify the environment targets (risk of production changes)
3. Staging/Preview flags are not set to `1` (cannot run the drill)
4. Any other precondition fails

**If preconditions fail:**
1. Stop immediately.
2. Document which condition failed.
3. Remediate with ops team (likely: fix Vercel env var values).
4. Re-run precondition check.
5. Only proceed when all three gates are ✅.

---

## �� STEP 1 — Populate Staging Environment in Vercel

**Scope:** Vercel → Project → Settings → Environment Variables → Environment: **Staging**

**Do NOT touch Production environment in this step.**

### Required Variables (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=https://<staging-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_URL=https://<staging-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
SUPABASE_PGCRYPTO_KEY=<staging-pgcrypto-key>
SUPABASE_CONNECTION_STRING=postgresql://postgres:<pass>@...staging...
```

### Required Variables (Stripe)
```
STRIPE_SECRET_KEY=sk_test_<test-mode-key>
STRIPE_WEBHOOK_SECRET=whsec_test_<webhook-secret> (populate after Step 4.1)
STRIPE_PRICE_FEATURED=price_1Sd6oRClBfLESB1nh3NqPlvm
STRIPE_PRICE_PRO=price_<reserved-for-phase-5>
```

### Required Variables (Telemetry & ABN)
```
ABR_GUID=<staging-abr-guid>
RESEND_API_KEY=<staging-resend-api-key>
ALERTS_EMAIL_TO=ops@dogtrainersdirectory.com.au
ALERTS_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Required Variables (Monetization Feature Flags)
```
FEATURE_MONETIZATION_ENABLED=1
NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=1
```

### Verification
After populating all variables in Vercel staging environment:
- Restart staging deployment: `vercel --prod` (targets staging environment)
- Confirm deployment succeeded (check Vercel UI or `vercel logs`)

---

## ⚙️ STEP 2 — Run Staging Environment Validator

**Local machine (with repo cloned):**

```bash
cd /Users/carlg/Documents/PROJECTS/Project-dev/DTD

TARGET_ENV=staging ./scripts/check_env_ready.sh staging
```

**Expected Output:**
```
[PASS] Env Ready Check (staging)
  ✓ NEXT_PUBLIC_SUPABASE_URL
  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
  ✓ SUPABASE_URL
  ✓ SUPABASE_SERVICE_ROLE_KEY
  ✓ STRIPE_SECRET_KEY (sk_test_*)
  ✓ STRIPE_WEBHOOK_SECRET
  ✓ STRIPE_PRICE_FEATURED
  [all other required keys]
```

**If FAIL:**
1. Identify which variable is missing
2. Re-populate in Vercel staging environment
3. Re-run validator
4. Proceed only when PASS

**Capture Evidence:**
Copy/paste the entire PASS output (including timestamp) into:
```
DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md
```

Section: `## Environment Ready Check`

---

## 🗄️ STEP 3 — Apply Monetization Migration to Staging

**Local machine:**

### 3.1 Link Supabase Project

```bash
supabase link --project-ref <staging-project-id>
```

Expected output:
```
Your project has been linked to:
  <staging-project-id>
```

### 3.2 Push Migration

```bash
supabase db push --linked
```

Expected output:
```
Applying migration <timestamp>_create_payment_tables.sql...
✓ Migration applied successfully
```

### 3.3 Verify Migration Applied

```bash
supabase db diff --linked
```

Expected output:
```
No unapplied migrations.
```

If you see unapplied migrations, re-run `supabase db push --linked`.

### 3.4 Confirm Tables Exist

```bash
psql <staging-connection-string> -c "\dt payment_audit business_subscription_status"
```

Expected output:
```
             List of relations
 Schema |         Name         | Type  | Owner
--------+----------------------+-------+-------
 public | business_subscription_status | table | postgres
 public | payment_audit        | table | postgres
```

**Capture Evidence:**
1. Screenshot or paste the migration log (Step 3.2 output)
2. Paste the `\dt` output
3. Add to `DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md`

**Update SSOT:**
```
DOCS/db/MIGRATIONS_INDEX.md
```

Add line:
```
20251209101000_create_payment_tables.sql — Applied in staging (<YYYYMMDD>)
```

---

## 💳 STEP 4 — Conduct Stripe Test Payment Drill

### 4.1 Register Staging Webhook in Stripe Dashboard

**Do NOT use production Stripe dashboard.**

1. Log into **Stripe test mode** (ensure dashboard shows "Test Mode" label)
2. Navigate: **Developers** → **Webhooks** → **Add Endpoint**
3. Enter Endpoint URL:
   ```
   https://<your-vercel-staging-url>/api/webhooks/stripe
   ```
   (Example: `https://dtd-staging.vercel.app/api/webhooks/stripe`)

4. Select Events:
   - ✓ `checkout.session.completed`
   - ✓ `customer.subscription.created`
   - ✓ `customer.subscription.updated`
   - ✓ `customer.subscription.deleted`
   - ✓ `invoice.payment_failed`

5. Click **Add endpoint**

6. Copy the new signing secret: `whsec_test_*`

7. Update Vercel staging environment:
   - Go to Vercel → Settings → Environment Variables → Staging
   - Set `STRIPE_WEBHOOK_SECRET=whsec_test_*` (the value you just copied)
   - Redeploy staging

8. Confirm webhook endpoint created:
   - Stripe Dashboard → Developers → Webhooks
   - You should see your endpoint listed with status "Enabled"

**Capture Evidence:**
- Screenshot of Stripe webhook endpoint (showing URL + events)
- Paste into `DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md`
- Section: `## Stripe Webhook Registration`

---

### 4.2 Create Checkout Session (Manual Test Payment)

**Goal:** Initiate a Stripe checkout in staging to generate a payment intent and subscription record.

#### Option A: Web UI (Recommended for End-to-End)

1. Open browser to staging environment:
   ```
   https://<staging-url>/promote?businessId=<staging-business-id>
   ```

2. You should see the "Upgrade your listing" panel (since flag is ON in staging)

3. Click **"Upgrade" or "Proceed to Payment"** button

4. You are redirected to Stripe Checkout

5. Use **Stripe test card**:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/25 (any future date)
   CVC: 123 (any 3 digits)
   ```

6. Complete the payment

7. You should be redirected back to staging (success page or dashboard)

#### Option B: API Call (If Web UI Not Available)

```bash
curl -X POST https://<staging-url>/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "<staging-business-id>",
    "priceId": "price_1Sd6oRClBfLESB1nh3NqPlvm"
  }'
```

Expected response:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

Visit the `url` in browser and complete payment (same card as above).

**Record Information:**

After completing payment, capture and record:

| Item | Value | Source |
|------|-------|--------|
| Checkout Session ID | `cs_test_...` | Stripe Dashboard → Logs, or API response |
| Payment Intent ID | `pi_test_...` | Stripe Dashboard → Payments |
| Customer ID | `cus_...` | Stripe Dashboard → Customers |
| Subscription ID | `sub_...` | Stripe Dashboard → Subscriptions (if recurring) |
| Amount Charged | `$20.00 AUD` | Invoice |
| Timestamp | `2025-12-11T...` | Stripe Dashboard |

**Paste all four IDs into:**
```
DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md
Section: ## Stripe Test Payment Evidence
```

---

### 4.3 Replay Webhook Events via Stripe CLI

**Goal:** Trigger webhook deliveries to simulate real Stripe events and verify your `/api/webhooks/stripe` handler processes them.

**Prerequisites:**
- Stripe CLI installed: `brew install stripe/stripe-cli/stripe`
- Logged in to Stripe CLI: `stripe login`

**Steps:**

1. Open a terminal window (keep it running)

2. Start listening to webhook deliveries:
   ```bash
   stripe listen --forward-to https://<staging-url>/api/webhooks/stripe
   ```

   Expected output:
   ```
   > Ready! Your webhook signing secret is whsec_test_...
   ```

3. In another terminal, trigger test events:

   ```bash
   # Event 1: Checkout session completed
   stripe trigger checkout.session.completed

   # Event 2: Customer subscription created
   stripe trigger customer.subscription.created

   # Event 3: Customer subscription updated
   stripe trigger customer.subscription.updated

   # Event 4: Invoice payment failed (simulated)
   stripe trigger invoice.payment_failed
   ```

4. Watch the `stripe listen` terminal for delivery confirmations:
   ```
   ✓ webhook.checkout.session.completed [evt_test_...] delivered
   ✓ webhook.customer.subscription.created [evt_test_...] delivered
   ...
   ```

5. Check Vercel staging logs for handler execution:
   ```bash
   vercel logs --prod  # (targets staging environment)
   ```

   Expected log entries:
   ```
   POST /api/webhooks/stripe 200 (timing)
   Event: checkout.session.completed
   Webhook processed successfully
   ```

**Capture Evidence:**

- Paste full output from `stripe listen` terminal (all 4 event deliveries)
- Paste relevant log lines from `vercel logs` showing successful handling
- Add to `DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md`
- Section: `## Webhook Replay Evidence`

---

### 4.4 Verify Supabase Staging DB State

**Goal:** Query the staging database to confirm payment audit and subscription tables were populated correctly by the webhook handler.

**Connect to staging database:**

```bash
psql <your-staging-connection-string>
```

Or use Supabase Studio web console:
- https://supabase.com → select your staging project → SQL Editor

**Query 1: Payment Audit Entries**

```sql
SELECT 
  id, event_type, business_id, session_id, 
  amount_cents, status, created_at 
FROM payment_audit 
ORDER BY created_at DESC 
LIMIT 20;
```

**Expected Results:**

Should see entries like:
```
  id  |       event_type        | business_id |     session_id      | amount_cents | status  |         created_at
------+-------------------------+             +---------------------+--------------+---------+---------------------------
  1   | checkout_session_created| <bus-id>    | cs_test_...         | 2000         | pending | 2025-12-11 14:32:15.123
  2   | subscription_active     | <bus-id>    | cs_test_...         | 2000         | active  | 2025-12-11 14:32:18.456
  3   | payment_succeeded       | <bus-id>    | cs_test_...         | 2000         | success | 2025-12-11 14:32:20.789
```

**Query 2: Business Subscription Status**

```sql
SELECT 
  business_id, status, current_period_start, 
  current_period_end, updated_at 
FROM business_subscription_status 
ORDER BY updated_at DESC 
LIMIT 20;
```

**Expected Results:**

```
  business_id |  status  | current_period_start | current_period_end | updated_at
+-------------+----------+----------------------+--------------------+---------------------------
  <bus-id>    | active   | 2025-12-11           | 2026-01-10         | 2025-12-11 14:32:20.789
```

**Capture Evidence:**

- Take a screenshot of both query results
- Paste query output into `DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md`
- Section: `## Supabase Staging DB Verification`

---

### 4.5 Verify Admin Dashboard

**Goal:** Open the staging admin dashboard and confirm monetization data is visible and telemetry is healthy.

**Open in browser:**
```
https://<staging-url>/admin
```

**Confirm:**

1. **Subscription Health Card Visible**
   - Admin dashboard should show a "Subscription Health" card (or similar monetization panel)
   - Card displays subscription count, active subscriptions, recent revenue

2. **Your Test Subscription Listed**
   - Look for the business ID you just created a subscription for
   - Status should show: **Active** (or equivalent success state)
   - Amount should show: **$20.00 AUD** (or equivalent in test currency)
   - Date range should match current date

3. **No Monetization Alerts**
   - Check the alerts section (`/api/admin/alerts/snapshot`)
   - Should show NO unsuppressed alerts related to:
     - Stripe webhook failures
     - Payment sync errors
     - Subscription state mismatches
   - (Alerts might exist for other systems; that's OK; focus on monetization alerts)

4. **Latency Metrics Present**
   - Check `/api/admin/telemetry/latency` section
   - Should see entries for `monetization_api` (checkout route)
   - Latency should be <200ms for test invocations

**Capture Evidence:**

- **Screenshot 1:** Full admin dashboard showing Subscription Health card
- **Screenshot 2:** Close-up of your test subscription entry
- **Screenshot 3:** Alerts section (proving no critical monetization alerts)
- **Screenshot 4:** Latency metrics for monetization_api

Add all four screenshots to:
```
DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md
Section: ## Admin Dashboard Evidence
```

---

## 🧩 STEP 5 — Confirm All Alerts & Telemetry

**Goal:** Run the alert evaluation script and confirm no unsuppressed monetization alerts exist (or document any expected alerts).

**Local machine:**

```bash
TARGET_ENV=staging npx tsx scripts/run_alerts_email.ts --dry-run
```

**Expected Output:**

```
Alert Evaluation (staging) – Dry Run
=====================================

Service: monetization
  Status: OK (no unsuppressed alerts)

Service: stripe_webhooks
  Status: OK (no unsuppressed alerts)

Service: abn_verification
  Status: OK (no unsuppressed alerts)

[All other services...]

Summary:
  Total unsuppressed alerts: 0
  Would email to: ops@dogtrainersdirectory.com.au
  Would Slack to: https://hooks.slack.com/...
```

**If unsuppressed alerts exist:**

1. Document what alerts exist (copy output)
2. Investigate the root cause
3. Either:
   - Fix the underlying issue (e.g., missing environment variable)
   - Or, suppress the alert temporarily (with a comment explaining why)
4. Re-run alert script until clean

**Capture Evidence:**

- Paste the full alert dry-run output into:
```
DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md
Section: ## Alert Evaluation (Dry Run)
```

---

## 🚀 STEP 6 — Update All SSOT Documents

**Goal:** Record the successful completion of the Phase 9B drill and update all governance documents to reflect this evidence.

### 6.1 Update MONETIZATION_ROLLOUT_PLAN.md

**Add a new section** near the end, before "References":

```markdown
## Phase 9B – Staging Hardening (COMPLETED)

**Date:** 2025-12-11  
**Operator(s):** [Your name / Team]

### Drill Results
- ✅ Environment validator PASS (staging all keys present)
- ✅ Payment tables migration applied in staging Supabase
- ✅ Stripe test payment completed: Session ID `cs_test_...`
- ✅ Webhook events replayed via Stripe CLI (all 4 events delivered)
- ✅ payment_audit table populated with checkout_session_created + subscription_active entries
- ✅ business_subscription_status table reflects active subscription
- ✅ Admin dashboard shows Subscription Health card with test subscription visible
- ✅ No unsuppressed monetization alerts
- ✅ Latency metrics recorded for monetization_api

### Evidence Stored
- Full drill log: `DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md`
- Commit hash: [link to commit]

### Next: Phase 9C (Beta Rollout Decision)
When Phase 4+ gates are met (≥50 trainers + 85%+ ABN verify), enable monetization feature flags in production.
```

### 6.2 Update LAUNCH_READY_CHECKLIST.md

**Find the "Monetization readiness" section (item 10).**

Replace:
```
10. **Monetization readiness**
   - ✔ `npm run e2e` (or `npx playwright test tests/e2e/monetization.spec.ts`) recorded PASS...
   - ✔ Stripe webhook dry-run...
   - ✔ `payment_audit` table shows...
   - ✔ Evidence captured in `DOCS/launch_runs/...`
```

With:
```
10. **Monetization readiness (Phase 9B Staging Drill Completed)**
   - ✔ Staging environment validator: `TARGET_ENV=staging ./scripts/check_env_ready.sh staging` → PASS
   - ✔ Migration 20251209101000_create_payment_tables.sql applied in staging
   - ✔ Stripe webhook endpoint registered: https://<staging-url>/api/webhooks/stripe
   - ✔ Test payment completed: Session ID cs_test_*, Amount $20.00 AUD
   - ✔ Webhook replay via CLI: All 4 events (checkout.session.completed, customer.subscription.*, invoice.payment_failed) delivered
   - ✔ `payment_audit` table contains checkout_session_created + subscription_active entries (screenshot in launch_runs/)
   - ✔ `business_subscription_status` table shows active subscription (screenshot in launch_runs/)
   - ✔ Admin dashboard displays Subscription Health card with test subscription visible
   - ✔ `/api/admin/alerts/snapshot` shows no unsuppressed monetization alerts
   - ✔ `/api/admin/telemetry/latency` logs monetization_api invocations (<200ms)
   - ✔ Evidence captured in: DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md
```

### 6.3 Update MIGRATIONS_INDEX.md

**Add to the migrations table:**

```markdown
| 20251209101000_create_payment_tables.sql | Create payment_audit + business_subscription_status | Applied in staging 2025-12-11 | Evidence: DOCS/launch_runs/launch-staging-20251211-... |
```

### 6.4 Update launch_runs Entry

**Ensure you have created/updated:**
```
DOCS/launch_runs/launch-staging-<YYYYMMDD>-monetization-preflight.md
```

With ALL evidence from Steps 1–5:
- Environment ready check output
- Migration logs
- Stripe webhook registration screenshot
- Test payment IDs (session, intent, customer, subscription)
- Webhook replay output from `stripe listen`
- Supabase query results (payment_audit + business_subscription_status)
- Admin dashboard screenshots (4 total)
- Alert evaluation dry-run output

**Example structure:**

```markdown
# Launch Run – Staging – 2025-12-11 Monetization Preflight

## Preconditions Verified
- [x] Staging Supabase available
- [x] Staging Stripe test keys (sk_test_*, whsec_test_*)
- [x] Production flags OFF (FEATURE_MONETIZATION_ENABLED=0)

## Step 1: Environment Ready
[paste output from check_env_ready.sh]

## Step 2: Migration Applied
[paste migration log + \dt output]

## Step 3: Webhook Registered
[screenshot of Stripe webhook endpoint]

## Step 4: Test Payment
- Session ID: cs_test_...
- Payment Intent: pi_test_...
- Customer: cus_...
- Amount: $20.00 AUD
- Timestamp: 2025-12-11T14:32:...

## Step 5: Webhook Replay
[paste output from stripe listen showing all 4 events delivered]

## Step 6: DB Verification
[paste payment_audit query results]
[paste business_subscription_status query results]

## Step 7: Admin Dashboard
[screenshot 1: dashboard overview]
[screenshot 2: subscription details]
[screenshot 3: alerts section]
[screenshot 4: latency metrics]

## Step 8: Alert Evaluation
[paste alert evaluation dry-run output]

## Decision
✅ Phase 9B staging drill PASSED
Next: Phase 9C (await ≥50 trainers + 85%+ ABN verify before production enablement)
```

---

## 🛑 STEP 7 — STOP HERE (Do NOT Proceed to Production)

**Monetization remains OFF in production until all gates are met:**

- [ ] **≥50 claimed trainers** in the directory (Phase 1 onboarding in progress)
- [ ] **≥85% sustained ABN verification rate** (current: ~0%, being built in Phase 4)
- [ ] **Governance approval** from product/ops leadership

**Production Vercel environment must have:**
```
FEATURE_MONETIZATION_ENABLED=0
NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=0
```

**Do NOT flip these flags until all gates are confirmed.**

See:
- `DOCS/blueprint_ssot_v1.1.md` line 798 (risk governance section)
- `DOCS/implementation/master_plan.md` line 622 (launch gates)
- `DOCS/IMPLEMENTATION_PLAN_UPDATED.md` (Phase 9 gating policy)

---

## 📋 Troubleshooting & Rollback

### Problem: Webhook Endpoint Registration Fails

**Symptom:** Stripe Dashboard shows "Failed" status for webhook endpoint

**Solution:**
1. Confirm staging URL is publicly accessible (not localhost)
2. Confirm `/api/webhooks/stripe` route exists and is deployed
3. Re-register the endpoint in Stripe Dashboard
4. Use `stripe trigger` to manually test

### Problem: Webhook Events Not Delivering

**Symptom:** `stripe listen` shows 0 deliveries or "failed" status

**Solution:**
1. Check Vercel logs: `vercel logs --prod` (look for 404 or 500 errors on webhook route)
2. Confirm `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe Dashboard value
3. Confirm `/api/webhooks/stripe` signature verification logic is correct
4. Re-deploy staging: `vercel --prod`

### Problem: payment_audit Table Empty

**Symptom:** Webhook event claims delivery succeeded, but DB has no audit entry

**Solution:**
1. Check Vercel logs for errors in webhook handler
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel (not anon key)
3. Confirm `payment_audit` table exists: `\dt payment_audit` in psql
4. Manually insert a test audit row to verify table permissions:
   ```sql
   INSERT INTO payment_audit (event_type, business_id, session_id, status)
   VALUES ('test', 'test-biz', 'test-sess', 'test');
   ```

### Problem: Subscription Status Not Updating

**Symptom:** payment_audit entries exist, but business_subscription_status table empty

**Solution:**
1. Check webhook handler code in `src/app/api/webhooks/stripe/route.ts`
2. Confirm `customer.subscription.created` or `customer.subscription.updated` events are being handled
3. Manually insert a test subscription row:
   ```sql
   INSERT INTO business_subscription_status (business_id, status, updated_at)
   VALUES ('test-biz', 'active', NOW());
   ```

### Rollback (If Drill Must Be Aborted)

**If anything fails and you need to abort:**

1. **Do NOT change production environment**
2. **Do NOT flip monetization flags in production**
3. **Document the failure** in `DOCS/launch_runs/` with:
   - Step number where failure occurred
   - Error messages or logs
   - Remediation steps needed
4. **Notify ops team** for follow-up

Example rollback entry:
```markdown
# Launch Run – Staging – 2025-12-11 Monetization Preflight (ABORTED)

## Failure Point
Step 4.3: Webhook replay failed

## Root Cause
Vercel staging deployment did not include latest webhook handler code

## Remediation
- Redeploy staging with latest main branch
- Re-run Step 2 environment validator
- Attempt webhook replay again

## Next Attempt
[scheduled for YYYY-MM-DD]
```

---

## 📋 Quick Reference Checklist

**Print or open during execution:** [`PHASE_9B_QUICK_REFERENCE.md`](./PHASE_9B_QUICK_REFERENCE.md)
- ✅ Operator checklist (70+ checkboxes, 7 sections)
- ✅ Preconditions with abort criteria
- ✅ Evidence file locations and sections
- ✅ Troubleshooting quick-links table
- ✅ Sign-off section

---

## 📚 Related Documents

- `DOCS/MONETIZATION_ROLLOUT_PLAN.md` — High-level monetization roadmap
- `DOCS/LAUNCH_READY_CHECKLIST.md` — Final go/no-go checklist for production
- `DOCS/IMPLEMENTATION_REALITY_MAP.md` — Component verification evidence
- `DOCS/MONETIZATION_ROLLOUT_PLAN.md` — Stripe integration SSOT (product scope, metadata, legal expectations)
- `DOCS/VERCEL_ENV.md` — Environment variable reference
- `DOCS/automation/STRIPE/webhook/README_DTD.md` — Webhook handler specifics

---

## Sign-Off

**Operator Name:**  
**Date Completed:**  
**Commit Hash (if applicable):**  

When all 7 steps are complete with evidence captured, update:
- [ ] MONETIZATION_ROLLOUT_PLAN.md (Phase 9B completed section)
- [ ] LAUNCH_READY_CHECKLIST.md (item 10 marked as passed)
- [ ] MIGRATIONS_INDEX.md (migration apply date recorded)
- [ ] launch_runs/launch-staging-YYYYMMDD-monetization-preflight.md (all evidence attached)

**Next Phase:** Await Phase 4+ gates + governance approval before Phase 9C/9D production rollout.
