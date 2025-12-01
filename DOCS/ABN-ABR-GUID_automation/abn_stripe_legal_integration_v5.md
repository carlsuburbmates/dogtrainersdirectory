# ABN Verification + Stripe Webhooks + Legal Compliance + Data Capture
## Complete Integration Architecture for dogtrainersdirectory.com.au

**Date:** 28 November 2025  
**Project:** dogtrainersdirectory.com.au  
**Version:** 5.0 — ABN Integration + Stripe Webhooks + Legal Framework + Automated Data Capture

---

## PART 1: ABN VERIFICATION INTEGRATION (GUID-Based)

### 1.1 What You Have: GUID Access for ABN Verification

```
YOUR ASSET:
├─ GUID (Global Unique Identifier) for Australian Business Register
├─ Allows: Real-time ABN lookup + business name verification
├─ Source: Australian Taxation Office (ATO) database
└─ Verification: Instant (no manual review needed)

CAPABILITY:
├─ Query: "Does this ABN exist?"
├─ Query: "Does this ABN name match business name?"
├─ Query: "Is this ABN active?"
├─ Query: "What's the registered entity type?"
└─ Response: JSON with business details
```

### 1.2 Integration Point: When Business Enters ABN

```
WORKFLOW: ABN Verification (Automatic)

STEP 1: Trainer Enters ABN During Onboarding
├─ Form field: "ABN (optional but recommended)"
├─ Format validation: Must be 11 digits
├─ Example: 12 345 678 901
└─ User clicks: [VERIFY WITH ABN]

STEP 2: AI agent Calls ABN Verification API
├─ Input: ABN from form + Business name from form
├─ API endpoint: Using your GUID credentials
├─ Query: GET /abr/abn/{ABN}?businessName={name}
└─ Response time: <2 seconds (instant)

STEP 3: System Compares Results
├─ ATO returns: {"abn": "12345678901", "entity_name": "Loose Lead Training", "status": "Active"}
├─ System compares:
│  ├─ ABN exists? ✓ (Yes = proceed)
│  ├─ Entity name matches form? ✓ (Close enough = proceed)
│  └─ Status = Active? ✓ (Not cancelled = proceed)
└─ Result: AUTO-VERIFIED (no human review needed)

STEP 4: Verified Badge Awarded
├─ Display on profile: ✅ VERIFIED BUSINESS (ABN certified)
├─ Display in directory: Shows badge next to trainer name
├─ SEO boost: Search algorithm slightly favors verified trainers
├─ Trust signal: Users see "This trainer is verified by ATO"
└─ Trainer benefit: Stand out from unverified competitors

STEP 5: Store Verification Record
├─ Table: business_verifications
├─ Fields:
│  ├─ business_id
│  ├─ abn (encrypted at rest)
│  ├─ verification_method ('abn_auto')
│  ├─ verification_status ('verified')
│  ├─ verified_at (timestamp)
│  ├─ ato_response (JSON from ATO)
│  └─ expires_at (refresh every 12 months)
└─ Purpose: Audit trail + compliance documentation
```

### 1.3 ABN Verification Database Schema

```
TABLE: Business_ABN_Verifications
├─ verification_id (unique)
├─ business_id (foreign key to Businesses)
├─ abn (encrypted - CRITICAL for security)
├─ abn_hash (for searching without decryption)
├─ entity_name_from_ato (what ATO says)
├─ entity_name_from_trainer (what trainer entered)
├─ name_match_score (0-100, do they match?)
├─ ato_status ('Active', 'Cancelled', 'Dormant')
├─ entity_type ('Trust', 'Sole Trader', 'Partnership', 'Company')
├─ abn_registration_date
├─ last_verified_at (timestamp)
├─ verification_expires_at (12 months from last_verified)
├─ requires_re_verification (flag if >12 months old)
├─ ato_api_response (full JSON stored for audit)
├─ verification_method ('auto_abn')
├─ error_message (if verification failed)
└─ notes (e.g., "Name slightly different but acceptable")

TABLE: Trainer_Business_ABN_Records
├─ record_id
├─ trainer_id
├─ business_id
├─ abn_verified (boolean - "Did ABN verification pass?")
├─ abn_verification_id (link to verification record)
├─ owns_by_abn (boolean - "ABN owner verified by ATO")
├─ badge_visible (boolean - "Show verified badge to users?")
└─ badge_display_text ("✅ ABN Verified" or custom)
```

### 1.4 Error Handling & Fallback

```
SCENARIO 1: ABN Is Valid But Name Doesn't Match
─────────────────────────────────────────────
Example:
├─ Trainer enters: "Loose Lead Training"
├─ ABN registered as: "Loose Lead Training Pty Ltd"
├─ Name match score: 85/100 (good enough)
└─ Result: VERIFIED (close enough, accept)

SCENARIO 2: ABN Is Valid But Name Significantly Different
──────────────────────────────────────────────────────
Example:
├─ Trainer enters: "Loose Lead Training"
├─ ABN registered as: "Jane Smith Enterprises"
├─ Name match score: 20/100 (too different)
├─ Result: MANUAL REVIEW REQUIRED
└─ Action: Flag for admin review (24h SLA)

SCENARIO 3: ABN Doesn't Exist
───────────────────────────
├─ Trainer enters ABN: 11 111 111 111
├─ ATO response: "ABN not found"
├─ Result: VERIFICATION FAILED
├─ Options for trainer:
│  ├─ [RETRY] - Enter different ABN
│  ├─ [SKIP] - Proceed without ABN verification
│  └─ [HELP] - Contact support@dogtrainersdirectory
└─ No penalty: Can still create listing without ABN

SCENARIO 4: ABN Is Cancelled/Dormant
──────────────────────────────────────
├─ Trainer enters: 12 345 678 901
├─ ATO response: "Status: Cancelled"
├─ Result: VERIFICATION FAILED (active businesses only)
├─ Display message: "This ABN is no longer active. Please verify with current ABN."
└─ Action: Trainer can't verify with this ABN

SCENARIO 5: API Timeout or Failure
────────────────────────────────────
├─ Problem: ATO API temporarily down
├─ Trainer clicks [VERIFY] → No response after 5 seconds
├─ Result: TIMEOUT (don't hang trainer)
├─ Action:
│  ├─ Show message: "Verification service temporarily unavailable"
│  ├─ Option 1: [RETRY] - Try again immediately
│  ├─ Option 2: [SKIP FOR NOW] - Complete onboarding, verify later
│  ├─ Option 3: [MANUAL UPLOAD] - Upload ABN document for review
│  └─ Log event: Alert if failures exceed 5% threshold
└─ Retry strategy: Queue for retry in 5 minutes, notify trainer via email
```

### 1.5 Trainer Messaging & Incentives

```
DURING ONBOARDING (Optional Step):

┌─────────────────────────────────────────────────────────────┐
│ "Get a Verified Badge (Takes 10 Seconds)"                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Why verify your ABN?                                       │
│ ✓ Show dog owners you're a legitimate business            │
│ ✓ Appear higher in search results (algorithm boost)        │
│ ✓ Get the ✅ VERIFIED BUSINESS badge                       │
│ ✓ Build trust = more bookings                             │
│                                                             │
│ ABN (optional):                                            │
│ [12 345 678 901________________________________]            │
│                                                             │
│ [VERIFY NOW] or [SKIP & CONTINUE]                         │
│                                                             │
│ 💡 You can verify anytime from your dashboard             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

AFTER VERIFICATION:

If VERIFIED:
┌─────────────────────────────────────────────────────────────┐
│ ✅ VERIFIED! Your ABN is confirmed by the ATO              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Your business is now marked as:                            │
│ ✅ ABN Verified by Australian Business Register            │
│                                                             │
│ Benefits:                                                   │
│ • Appears higher in search (verified badge boost)          │
│ • Users see trust signal: "✅ ABN Verified"                │
│ • Featured slots more effective (27% more clicks)          │
│ • Algorithm favors verified trainers                       │
│                                                             │
│ Verification expires in 12 months (we'll remind you)       │
│                                                             │
│ [VIEW YOUR PROFILE] [CONTINUE TO DASHBOARD]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

If NOT VERIFIED:
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ VERIFICATION NOT MATCHED                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ The ABN you entered doesn't match the business name.       │
│                                                             │
│ What you entered: "Loose Lead Training"                    │
│ What ATO has: "Jane Smith Training Pty Ltd"                │
│                                                             │
│ Options:                                                    │
│ [ENTER DIFFERENT ABN] - Try another ABN                    │
│ [MANUAL VERIFICATION] - Upload ABN document                │
│ [CONTACT SUPPORT] - We'll help verify                      │
│ [CONTINUE WITHOUT VERIFICATION] - No badge                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 2: STRIPE WEBHOOKS + PAYMENT WORKFLOW

### 2.0 Monetization Scope (Phase Alignment)

To eliminate confusion, Stripe monetization is now governed by the **Phase 1 MVP master spec** (`STRIPE/phase1_mvp_master_spec.md`). Treat all guidance in this document through that lens:

- **Phase 1 (CURRENT)** — Only the $20 AUD featured placement exists, sold as a 30-day FIFO slot with five concurrent spots per LGA, plus non-monetized lead tracking (profile clicks + inquiries). All webhook handlers, dashboards, and legal copy must reflect this limited product.
- **Phase 1.5 (FUTURE, gated by ≥30% renewal + ≥200 inquiries/month)** — Premium profile subscriptions, additional featured tiers ($50/$100), auto-renew toggle, and lead monetization unlock *after* Month‑1 data proves demand. Keep the specs in this file for planning, but clearly mark them as deferred so builders do not ship them prematurely.
- **Phase 2 (FUTURE)** — Sponsored content, marketplace fees, affiliate bundles, etc., remain aspirational until Phase 1.5 succeeds.

Any section below that references higher-priced featured tiers or premium subscriptions must be read as **Phase 1.5+** scope unless explicitly noted otherwise.

### 2.1 Stripe Integration Architecture (Complete)

```
WHAT STRIPE HANDLES FOR YOU:
├─ Payment processing (2.9% + $0.30 per transaction)
├─ PCI compliance (Stripe is PCI Level 1)
├─ Tax calculation (if needed)
├─ Fraud detection (Stripe Radar)
├─ Currency conversion (if international)
├─ Refund processing
└─ Dispute resolution

WHAT YOU OWN:
├─ Your business ABN + tax handling (as mentioned)
├─ Accounting records (quarterly/yearly)
├─ Business registration
├─ Terms of Service & Privacy Policy
└─ Customer support

YOUR STRIPE SETUP:
├─ Connected account (receives all payments directly)
├─ All revenue flows to YOUR bank account
├─ Stripe retains fees (2.9% + $0.30 per transaction)
├─ You handle tax with ATO
└─ Monthly Stripe reporting for your records
```

### 2.2 Payment Workflow (Phase 1 — Featured Slots Only)

```
WORKFLOW 1: Featured Slot Purchase ($20 / 30 days, FIFO queue)
─────────────────────────────────────────────────────────────

STEP 1: Trainer Clicks [BUY FEATURED SLOT]
├─ Choose LGA (28 total, derived from suburb selection)
├─ Price: Flat $20 AUD for 30 days (Phase 1 scope)
├─ Messaging: "5 spots per council; queue starts when full"
└─ Click: [PROCEED TO PAYMENT]

STEP 2: Stripe Checkout Opens
├─ Trainer completes hosted checkout (card details never touch our servers)
├─ Metadata attached: trainer_id, business_id, lga_id, desired start context
└─ On success, Stripe redirects to dashboard + fires webhook

STEP 3: Stripe Processes Payment
├─ Charge amount: $20
├─ Stripe fee: $0.68 → net $19.32 deposited
└─ Event: charge.succeeded queued for webhook handler

STEP 4: Webhook Handler Determines Capacity
├─ Look up `featured_slots_status` for the LGA (max_slots = 5)
├─ If `current_featured_count < 5`: activate immediately
│  ├─ Insert row in `featured_slots_metrics` (start now, end now + 30 days)
│  ├─ Update trainer record: `featured_tier='featured'`, `featured_slot_active=true`
│  └─ Send "Your placement is LIVE" email
└─ Else: enqueue trader
   ├─ Insert into `featured_queue` with `queue_position = existing_waiting + 1`
   ├─ Update trainer record with `featured_queue_position`
   └─ Send "You're Position N, ETA ~X days" email

STEP 5: Dashboard + Metrics
├─ Active trainers appear at top of search results for that LGA
├─ Profile clicks and inquiries write to `analytics_events` / `inquiries`
└─ Trainer dashboard shows days remaining (or queue position) + metrics split

STEP 6: 5-Day Renewal Reminder
├─ Daily cron checks for `featured_slot_expiry_date - today = 5`
├─ Email includes profile-view/inquiry totals + ROI and `[RENEW NOW]` CTA
└─ Clicking CTA opens a new $20 Checkout session; renewing before expiry skips queue

STEP 7: Expiry + Auto-Promotion
├─ When end date reached without renewal:
│  ├─ Mark slot inactive, log metrics, email expiry summary
│  └─ Promote oldest waiting trainer (if queue exists) within same LGA
├─ Newly promoted trainer inherits 30-day window + receives activation email
└─ Queue positions recalculated and emailed after each promotion

Notes:
- Auto-renew subscriptions, higher-priced tiers, and additional slot durations are **Phase 1.5+** features. Keep the webhook scaffolding flexible, but ship only the $20 FIFO logic now.
- All webhook URLs should point to the Next.js API route (or equivalent) defined in the app repo; replace placeholder https://ai-agent... endpoints with your actual deployment URL.
```

### 2.3 Premium Profile Subscription ($15/$40/month — Phase 1.5 DEFERRED)

> **Status:** Do not build until Phase 1 KPIs hit (≥30% featured renewal **and** ≥200 inquiries/month). Keep the specification below for planning so engineers know what unlocks next, but ensure dashboards, env vars, and webhook handlers treat subscriptions as inactive until leadership green-lights Phase 1.5.

```
WORKFLOW 2: Premium Profile Upgrade

STEP 1: Trainer Clicks [UPGRADE TO PREMIUM PROFILE]
├─ Option A: $15/month (Premium)
│  ├─ Video intro
│  ├─ FAQ section
│  ├─ Case studies
│  └─ Analytics dashboard
├─ Option B: $40/month (Platinum)
│  ├─ All premium features +
│  ├─ Algorithm boost (appears higher in recommendations)
│  ├─ Verified outcomes badge
│  └─ Priority support
└─ Select option → [START FREE TRIAL] (7 days free)

STEP 2: Stripe Subscription Created
├─ Subscription type: Monthly recurring
├─ Amount: $15 or $40
├─ Cycle: Monthly on day of signup
├─ Stripe handles: Auto-renewal, failed payment retries
└─ Trainer enters card info (secured by Stripe)

STEP 3: Free Trial (7 days)
├─ Features: All premium features immediately unlocked
├─ Charge: $0 (free trial period)
├─ Reminder at day 5: "Trial ends in 2 days"
├─ Cancellation: Trainer can cancel anytime during trial
└─ If not cancelled: Auto-charged on day 8

STEP 4: Recurring Charge & Webhook
├─ On day 8 (or monthly anniversary): Stripe charges
├─ Amount: $15 or $40
├─ Webhook event: invoice.payment_succeeded
├─ AI agent receives webhook data
└─ Update: trainer_subscriptions table

STEP 5: AI agent LLM Workflow
├─ Parse webhook: Extract subscription ID, amount, trainer ID
├─ Update database:
│  ├─ trainer_id
│  ├─ subscription_tier ('premium' or 'platinum')
│  ├─ stripe_subscription_id
│  ├─ amount_per_month ($15 or $40)
│  ├─ next_billing_date
│  └─ status ('active')
├─ Send email: "✅ Your premium profile is active"
└─ Features unlock (video upload, FAQ section, etc.)

STEP 6: Cancel Anytime
├─ Trainer goes to dashboard: [MANAGE SUBSCRIPTION]
├─ Clicks: [CANCEL SUBSCRIPTION]
├─ Warning: "Premium features will be removed at end of billing cycle"
├─ Stripe processes: Cancels subscription (no refund for current cycle)
├─ Features remain active until cycle ends (e.g., Dec 28)
├─ Email confirmation sent
└─ On end date: Features disabled, reverts to basic profile

STEP 7: Failed Payment Handling
├─ Problem: Card declines on renewal date
├─ Stripe behavior:
│  ├─ Day 0: Payment fails
│  ├─ Day 3: Stripe retries
│  ├─ Day 5: Stripe retries again
│  └─ Day 7: Stripe gives up, sends failed_payment webhook
├─ AI agent receives webhook:
│  ├─ Event: invoice.payment_failed
│  ├─ Sends email: "Your subscription payment failed"
│  ├─ Action: "Update your card: [LINK]"
│  └─ Grace period: 7 days before disabling features
└─ If no action: Features disabled after grace period
```

### 2.4 Stripe Webhook Events AI agent Must Handle

```
CRITICAL WEBHOOKS (Must configure in Stripe):

1. charge.succeeded
   └─ When: Featured slot or one-time payment succeeds
   ├─ Action: Create featured_placement record
   ├─ Update: trainer_payments table
   ├─ Send: Confirmation email to trainer
   └─ Log: Revenue tracking

2. charge.failed
   └─ When: Payment card declined
   ├─ Action: Webhook received but charge not completed
   ├─ Send: Error email to trainer
   ├─ Offer: [RETRY PAYMENT]
   └─ Log: Failed attempt for support

3. invoice.payment_succeeded
   └─ When: Monthly subscription (premium profile) charged successfully
   ├─ Action: Update subscription record
   ├─ Extend: Features active for another month
   ├─ Send: Receipt email to trainer
   └─ Log: Recurring revenue

4. invoice.payment_failed
   └─ When: Monthly subscription payment fails
   ├─ Action: Flag subscription for review
   ├─ Send: "Update your card" email
   ├─ Grace period: 7 days before disable
   └─ Log: Failed subscription attempt

5. customer.subscription.deleted
   └─ When: Trainer cancels subscription
   ├─ Action: Update trainer_subscriptions (status = 'cancelled')
   ├─ Schedule: Disable features at cycle end
   ├─ Send: Cancellation confirmation
   └─ Keep data: For refund disputes

6. charge.refunded
   └─ When: Stripe refund processed (trainer or platform initiated)
   ├─ Action: Update featured_placement (status = 'refunded')
   ├─ Reverse: Remove featured placement from directory
   ├─ Send: Refund confirmation email
   └─ Log: Refund for accounting

7. charge.dispute.created
   └─ When: Trainer disputes charge (chargeback)
   ├─ Action: Flag in admin dashboard (requires manual review)
   ├─ Send: Alert email to you (support@dogtrainersdirectory)
   ├─ Document: Evidence for dispute (Stripe dashboard)
   └─ Process: Follow Stripe dispute workflow
```

### 2.5 AI agent LLM Workflow Configuration

```
HOW TO SET UP WEBHOOKS IN AI AGENT (Chat-Based):

PROMPT FOR AI AGENT:

"Configure Stripe webhooks for dogtrainersdirectory.com.au.

I have Stripe connected account set up. Need to handle these events:

FEATURED SLOT PURCHASE FLOW:
1. Event: charge.succeeded
2. Data extracted: charge_id, amount, trainer_id, business_id, lga_id
3. Create record:
   - Table: featured_placements
   - Fields: trainer_id, business_id, lga_id, tier, amount_paid, 
     stripe_charge_id, start_date (now), end_date (now + 30 days)
4. Send email: Confirmation to trainer
5. Log: Revenue tracking

PREMIUM PROFILE SUBSCRIPTION FLOW:
1. Event: invoice.payment_succeeded
2. Data extracted: subscription_id, amount, trainer_id
3. Update record:
   - Table: trainer_subscriptions
   - Fields: status='active', next_billing_date, amount_per_month
4. Send email: Subscription active confirmation
5. Log: Monthly recurring revenue

CANCELLATION FLOW:
1. Event: customer.subscription.deleted
2. Data extracted: subscription_id, trainer_id
3. Update record:
   - Table: trainer_subscriptions
   - Fields: status='cancelled'
4. Schedule: Disable features at cycle end
5. Send email: Cancellation confirmation

REFUND FLOW:
1. Event: charge.refunded
2. Data extracted: charge_id, amount, trainer_id
3. Find: featured_placement with this stripe_charge_id
4. Update: status='refunded'
5. Remove: From featured directory display
6. Send email: Refund confirmation

FAILED PAYMENT FLOW:
1. Event: invoice.payment_failed
2. Data extracted: subscription_id, trainer_id
3. Send email: 'Your payment failed. Update card: [LINK]'
4. Start: 7-day grace period countdown
5. Schedule: Email reminder on day 3 and day 6
6. After day 7: Disable premium features if not resolved

### 2.6 Phase 1 MVP Implementation Snapshot (See `STRIPE/phase1_mvp_master_spec.md`)

**Scope locked:** Featured placements ($20/30-day FIFO per LGA) and lead-generation telemetry (profile clicks + inquiries). Everything else—premium tiers, paid leads, affiliate/sponsored content—is deferred until Month 1 data validates renewal and inquiry targets.

**Data model:** Trainers gain `featured_*` columns; new tables `featured_queue`, `featured_slots_metrics`, `featured_slots_status`, `analytics_events`, and `inquiries` backfill the lifecycle. This mirrors the schemas already documented in the STRIPE master spec and dictates what Stripe webhooks must populate.

**Lifecycle flow:**
- Trainer pays through Stripe Checkout → `charge.succeeded` webhook sets featured active or inserts queue entry (max five active slots per LGA).
- Daily cron handles expiries and auto-promotes oldest queued trainer, re-ranking queue positions and firing automation emails.
- Dashboard + APIs expose featured status, queue position, click/inquiry totals, and renewal CTA.

**Email automation:** Eight templates (activation, queue added, position improved, expires soon, expired, auto-promoted, trainer inquiry, dog-owner confirmation) must be triggered by the webhook + cron events above. Use the verbatim content in `phase1_mvp_master_spec.md`.

**Success metrics:** Month‑1 targets demand 40–60 featured trainers, $800–1,500 revenue, ≥30% renewal, 100–200 inquiries, and ≥10% click→inquiry conversion. Renewal <20% or inquiries <50/month force pricing/UX pivots before Phase 1.5.

**Next phases:** Phase 1.5 introduces premium profiles ($5–8/mo) and lead monetization ($2–5 per inquiry) only if renewal ≥30% *and* inquiries ≥200/month. Phase 2 (sponsored content + marketplace fees) waits for $4k+ MRR and strong trainer satisfaction. Treat the STRIPE master spec as the canonical playbook for these gates.

DISPUTE/CHARGEBACK FLOW:
1. Event: charge.dispute.created
2. Data extracted: charge_id, dispute_id
3. Create: Support ticket (priority)
4. Send email: Alert to support@dogtrainersdirectory
5. Log: In dispute tracking system
6. Action: Manual review required

Webhook endpoint URL: [AI AGENT WILL PROVIDE]
Events to listen for (Phase 1 recommended):
- checkout.session.completed (Checkout sessions - canonical for hosted flows)
- payment_intent.succeeded (PaymentIntent success - canonical for Checkout)
- charge.succeeded (legacy Charge event, if your flow uses charges)
- invoice.payment_succeeded (for subscription flows - Phase 1.5 planned)
- invoice.payment_failed
- customer.subscription.deleted
- charge.refunded
- charge.dispute.created

All payments to connected account: dogtrainersdirectory Stripe account.
All webhooks signed with secret: [I'll provide Stripe webhook secret]

IMPORTANT: Developer / testing notes
- Avoid tunnelling collisions with other local projects. Use the repository's dedicated test harness `webhook/server_dtd.py` which listens on **port 4243** and endpoint **/api/webhooks/stripe-dtd** by default. Example:
   - `stripe listen --forward-to localhost:4243/api/webhooks/stripe-dtd`

- Prefer handling `checkout.session.completed` and `payment_intent.succeeded` for Checkout flows — these are reliably fired when the payment completes. Checkout uses PaymentIntent under the hood, so building logic around PaymentIntent / Checkout events is more robust than relying only on `charge.succeeded`.

- Always verify incoming webhooks with Stripe's signature header (use the signing secret) and store `event.id` to guarantee idempotent processing (skip duplicated event ids). Keep the secret out of the repository — use environment variables or a secrets manager in CI/CD/production.

- Use separate test and production webhook endpoints in the Stripe dashboard. Do not forward development tunnels to a production webhook URL. For testing locally prefer `server_dtd.py` on :4243 to avoid conflicts with other local services (for example, apps bound to :3000).

AI AGENT WILL:

AI AGENT WILL:
├─ Create webhook receiver endpoint
├─ Configure event listeners
├─ Map events to database updates
├─ Set up email triggers
├─ Test with sample events
└─ Provide webhook URL for Stripe dashboard setup
```

---

## PART 3: LEGAL FRAMEWORK & TAX COMPLIANCE

### 3.1 Fine Print: Terms of Service (Robust Framework)

```
CRITICAL SECTIONS (Australian Compliance):

1. DISCLAIMER OF BUSINESS ENDORSEMENT
────────────────────────────────────

"dogtrainersdirectory.com.au ("Platform") is a directory service that:
- Lists dog training businesses provided by trainers themselves
- Does NOT endorse, recommend, or guarantee any trainer's qualifications
- Does NOT perform background checks beyond ABN verification (if provided)
- Does NOT verify trainer licensing or insurance (if required by state)
- Does NOT investigate trainer complaints (except safety escalations)

Users ("Dog Owners") acknowledge:
- It is the user's responsibility to verify trainer qualifications
- Platform is not liable for trainer misconduct, poor service, or injury
- Platform is not liable for any damages arising from trainer engagement
- Trainers may operate as sole traders, partnerships, or companies
- Platform does not employ any listed trainers (independent contractors)

By using this Platform, you agree:
- Platform disclaims all liability for trainer actions/services
- You will independently verify trainer credentials before engagement
- You will research trainer reviews and outcomes independently
- You will contact trainers to verify they offer services you need
- You assume all risk related to trainer selection and engagement"

2. PAYMENT TERMS & REFUND POLICY
────────────────────────────────

"Payment Terms:
- All prices in AUD (Australian Dollars)
- Payments processed via Stripe (stripe.com)
- Stripe handles all payment security (PCI Level 1 certified)
- Your payment card data is never stored on Platform servers

Featured Slot Pricing (Phase 1 live):
- Featured placement: $20 AUD (one-time, 30-day placement, 5 concurrent slots per LGA, FIFO queue)
- Future tiers ($50/$100) remain *inactive* until Phase 1 KPIs unlock Phase 1.5 monetization.

Premium Profile Pricing (Phase 1.5 deferred):
- Premium: $15 AUD/month (recurring subscription, pending go/no-go)
- Platinum: $40 AUD/month (recurring subscription, pending go/no-go)

Refund Policy:
- Featured slots: Refund available within 3 days of purchase (no questions)
- Featured slots after 3 days: No refund (service has been delivered/rendered)
- Premium profiles: Monthly billing cycle - cancel anytime
- Premium profile refunds: No pro-rata refunds (monthly cycle applies)
- Subscription cancellation: Effective immediately, features active until cycle end
- Failed payments: Trainer responsible for updating card information
- Chargebacks: Stripe will defend against invalid chargebacks; fraudulent 
  chargebacks may result in account termination

Refund Process:
- Request via support@dogtrainersdirectory.com.au
- Response within 24 hours
- Refund processed within 5-7 business days (Stripe timeline)
- Refund amount: Full refund if eligible, minus Stripe fees (non-refundable)"

3. DATA PRIVACY & COMPLIANCE (AUSTRALIA PRIVACY ACT)
────────────────────────────────────────────────────

"Data We Collect:
- Business name, phone, address, email, ABN (if provided)
- Trainer name, credentials, specialties, pricing
- User triage responses (dog info, behavior, location, budget)
- User progress tracking (DIY plan completion, outcomes)
- Payment information (processed by Stripe, not stored on Platform)

Data Use:
- Directory display (public)
- Personalized recommendations (private)
- Outcome tracking (aggregated, anonymized)
- Platform improvement (analytics, A/B testing)
- Tax/legal compliance (records retention)

Data Security:
- ABN encrypted at rest (AES-256)
- HTTPS/SSL for all data in transit
- Database backups every 6 hours
- No third-party sharing (except Stripe for payments)

User Rights (Australia Privacy Act):
- Right to access: You can request your data anytime
- Right to correction: You can update your information
- Right to deletion: You can delete your account (data deleted within 30 days)
- Right to portability: We can export your data

Data Retention:
- User triage data: Deleted 90 days after account deletion
- Trainer business data: Kept for 6 years (business records, tax compliance)
- Payment records: Kept for 7 years (tax requirements, ATO compliance)
- Chat/support: Kept for 2 years (support history, dispute resolution)

Compliance:
- Privacy Policy available at: dogtrainersdirectory.com.au/privacy
- Terms of Service available at: dogtrainersdirectory.com.au/terms
- Disputes resolved via arbitration (not court)
- Complaints to: privacy@dogtrainersdirectory.com.au"

4. ABN VERIFICATION DISCLAIMER
──────────────────────────────

"ABN Verification:
- ABN verification is optional (not required to list on Platform)
- Verified badge means: Business name matches ABR records on verification date
- Verified badge does NOT mean: Trainer is qualified, licensed, insured, or recommended
- ABN verification refreshed annually (automatic)
- Verification can be revoked if ABN becomes inactive/cancelled
- Fraudulent ABN information may result in immediate account termination

ABN Data:
- ABN information never displayed publicly (only badge)
- ABN encrypted at rest, stored securely
- ABN used only for verification and tax/legal compliance
- ABN not shared with third parties (except ATO for compliance)"

5. TAX & BUSINESS RESPONSIBILITY
─────────────────────────────────

"Business Responsibility:
- Platform operator (dogtrainersdirectory.com.au) is sole proprietor/business
- Platform business ABN: [YOUR ABN]
- All revenue collected from trainers is Platform income (taxable)
- Platform operator responsible for own tax filings (quarterly/annual to ATO)
- Platform operator responsible for own business registration

Trainer Responsibility:
- Each trainer is independent contractor (not Platform employee)
- Each trainer responsible for own business registration/ABN
- Each trainer responsible for own tax filings (if ABN holder)
- Trainer payments to Platform are business expenses (tax deductible)
- Platform does not withhold tax or provide PAYG summaries (trainers not employees)

Tax Reporting:
- Featured slot sales reported as Platform income (quarterly)
- Premium profile subscriptions reported as Platform income (quarterly)
- Affiliate commissions reported as Platform income (quarterly)
- Business expenses documented for ATO (Stripe fees, hosting, staff, etc.)
- No GST charged (assuming turnover <$75K initially, review annually)"

6. LIABILITY & INDEMNIFICATION
──────────────────────────────

"Limitation of Liability:
- Platform is provided 'AS IS' without warranties
- Platform is not liable for:
  ├─ Trainer misconduct or service failure
  ├─ Dog injury or behavioral issues
  ├─ Financial losses from trainer engagement
  ├─ Data loss, website downtime, or errors
  ├─ Third-party service failures (Stripe, email, hosting)
  └─ Any indirect, incidental, or consequential damages

Maximum Liability:
- Platform's total liability is limited to amount paid by user in last 12 months
- For featured slots (typical $20 payment): Max liability = $20
- For premium profiles (typical $40/month): Max liability = $480 (12 months)

User Indemnification:
- User agrees to indemnify Platform against:
  ├─ Claims arising from trainer engagement
  ├─ Claims arising from dog training outcomes
  ├─ Claims arising from user-provided data accuracy
  └─ Claims arising from user violation of these Terms"

7. DISPUTE RESOLUTION & ARBITRATION
────────────────────────────────────

"Dispute Resolution:
1. First: Contact support@dogtrainersdirectory.com.au with dispute details
2. Response: Within 24 hours with proposed resolution
3. If unresolved: Escalate to Platform operator for manual review (48 hours)
4. Final: Arbitration (not court) under Australian Consumer Law if necessary

Arbitration:
- Disputes resolved by independent arbitrator (Australian Disputes Centre)
- Arbitration binding on both parties
- Cost: Each party bears own costs (arbitration fees split)
- Location: Melbourne, Victoria (Australian Jurisdiction)"

8. COMPLIANCE ADDENDUM (SAFETY & ANIMAL WELFARE)
────────────────────────────────────────────────

"Safety Escalations:
- Platform maintains emergency escalation system for safety concerns
- If user reports: Animal abuse, injury to people, or illegal activity
- Platform action: Immediately escalate to RSPCA, Victoria Police, local council
- Trainer removal: Account terminated if substantiated safety violation
- Notification: User notified of action taken

State-Specific Licensing:
- Some states may require trainer licensing/regulation (check your state)
- Platform does not verify licensing (trainer responsibility)
- Trainer responsible for compliance with state regulations
- Platform not liable if trainer operates without required licensing"
```

### 3.2 Your Tax Responsibilities (Stripe + ATO)

```
YOUR SETUP (As Platform Owner):

Business ABN: [YOUR ABN - sole proprietor]
├─ All Platform revenue: To this ABN
├─ Stripe deposits: To your nominated bank account
├─ Stripe retains: 2.9% + $0.30 per transaction (automatic deduction)
└─ You receive: Net amount after Stripe fees

TAX HANDLING:

Quarterly (Recommended):
├─ Export Stripe reports (transactions, fees, refunds)
├─ Total revenue: Sum of all charges
├─ Total Stripe fees: Deductible business expense
├─ Business expenses: Hosting, lawyer, ABN verification API, support tools
├─ Calculate: (Revenue - Stripe fees - Expenses) = Taxable income
└─ File quarterly activity statement (BAS) with ATO

Annual (12 Months):
├─ Compile all Stripe reports (annual summary)
├─ Calculate: Total featured slot revenue
├─ Calculate: Total subscription revenue
├─ Calculate: Total affiliate/partnership revenue
├─ Calculate: Total expenses (Stripe fees, hosting, legal, etc.)
├─ File: Income tax return with ATO
├─ Pay: Quarterly tax instalments (if required based on income)
└─ Keep records: 5 years minimum (ATO requirement)

GST (When Required):
├─ Current: If turnover <$75K/year, no GST needed
├─ If >$75K/year: Must register for GST
├─ Then: Add 10% GST to all trainer prices
├─ Collect: GST from trainers, remit to ATO
├─ Complexity: Requires quarterly BAS with GST component
└─ Timing: Register when revenue likely to exceed $75K

STRIPE REPORTS FOR TAX:

On Stripe Dashboard:
├─ Go to: Reports → Payments
├─ Select: Date range (quarter or year)
├─ Download: CSV with all transactions
├─ Includes: Charge date, amount, fee, net deposit
├─ Use for: Reconciliation with bank deposits

Stripe API (Automated):
├─ Export via API: All charges, refunds, disputes
├─ Format: JSON data (integrate with accounting software)
├─ Frequency: Automated daily export
├─ Use for: Real-time revenue tracking in dashboard

Accounting Software Integration:
├─ Stripe → Xero (cloud accounting software)
├─ Auto-sync: All transactions imported daily
├─ Categorization: Featured slots vs. subscriptions vs. affiliates
├─ Reconciliation: Bank deposits match Stripe totals
├─ Reports: Tax summary automatically calculated
└─ Filing: Export to ATO-approved format

YOUR RESPONSIBILITY:
├─ Maintain accurate records (Stripe provides backup)
├─ Reconcile Stripe deposits with bank account
├─ Calculate business expenses deductions
├─ File quarterly BAS (if turnover >$10K/quarter)
├─ File annual income tax return (June 30 due date)
├─ Keep receipts for business expenses (5-year retention)
└─ Consult accountant (recommended for tax planning)

STRIPE + ATO COMPLIANCE:
├─ Stripe handles: Payment processing, fraud detection, PCI compliance
├─ Stripe reports: Provide records for ATO
├─ You handle: Tax calculations, BAS filing, ATO reporting
├─ NO withholding: Stripe doesn't withhold tax (you're business owner, not employee)
├─ NO PAYG summaries: Stripe doesn't provide PAYG (again, business income not wages)
└─ You report: All income on personal tax return under business income section
```

---

## PART 4: AUTOMATED DATA CAPTURE (Web-Based Contact Form)

### 4.1 AI agent Built-In Contact Form Capability

```
WHAT AI AGENT CAN DO (Native Capability):

AI agent can build REAL-TIME WEB SCRAPING + AUTO-POPULATION system:
├─ Scan websites (dogtrainersdirectory.com.au + trainer websites)
├─ Extract: Business name, phone, website, email, address
├─ Validate: Check if data is current/active
├─ Auto-populate: Feeds directly into directory database
└─ Live data: Stays updated as trainer websites change

EXAMPLE FLOW:

1. You provide: List of trainer websites (URLs)
2. AI agent action: Web crawler + LLM parse
3. Extract data:
   ├─ Business name (from website header/title)
   ├─ Phone (from contact page, footer)
   ├─ Email (from contact page, "Contact us" form)
   ├─ Address (from "About" page, Google Maps embed)
   ├─ Specialties (from service description, page text)
   └─ Pricing (from pricing page if available)
4. Store: As "scaffolded" entries (pending trainer claim)
5. Display: Shows as "Unverified" with blue badge
6. Trainer sees: "Complete your profile" CTA
7. Update: When trainer claims, data refreshes

ADVANTAGE vs. MANUAL CSV:
├─ Real-time updates (if trainer changes phone number on website)
├─ Auto-validation (we check if business still exists/phone still works)
├─ Less manual work (scraping automated, not manual data entry)
├─ Stays current (weekly/monthly refreshes possible)
└─ Higher accuracy (data from source of truth = trainer's own website)
```

### 4.2 Scaffolding Strategy: "Appear Alive" Display

```
SCAFFOLDED BUSINESS DISPLAY (Before Trainer Claims):

┌─────────────────────────────────────────────────────────────┐
│ 🔵 UNVERIFIED - Claimed by Trainer  (Blue badge)           │
│ Loose Lead Training Fitzroy                                 │
│                                                             │
│ 📍 Fitzroy | 📞 03 9876 5432 | 🌐 www.looseleadtraining.com│
│ ⭐⭐⭐⭐⭐ (23 reviews from web scrape)                       │
│                                                             │
│ "Training for adolescent dogs + leash reactivity"          │
│ [Data source: From trainer's website]                      │
│                                                             │
│ Specialties: Adolescent, Leash Reactivity, Urban Training  │
│ Format: 1:1, Remote                                        │
│ Est. Price: $75–$85/session (from website)                 │
│                                                             │
│ ✅ Next step: Trainer needs to claim & verify this profile│
│ [IS THIS YOUR BUSINESS? → CLAIM IT]                        │
│                                                             │
│ 💡 Data auto-refreshed from website every 7 days          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

BENEFITS:

User sees:
├─ Business appears "current" (not stale/old)
├─ Reviews already visible (builds trust)
├─ Key info populated (location, phone, price)
├─ No gaps in directory (looks complete, not skeleton)
└─ "Real" feeling (not obviously bootstrapped)

Trainer sees:
├─ "Your business is already listed!"
├─ Reviews already appearing (social proof before claiming)
├─ Existing inquiries (shows it's working!)
├─ "Claim this & take it over" CTA
└─ Low friction (doesn't feel like manual work)

You benefit:
├─ Launch with 50–100 trainers immediately (not empty directory)
├─ Lower onboarding friction (trainers feel validated)
├─ Faster featured slot adoption (they see it's already working)
├─ Real data (scraped from websites, not invented)
└─ Auto-refresh (keeps data current, less manual maintenance)
```

### 4.3 Data Capture Workflow (AI agent Prompt)

```
PROMPT FOR AI AGENT - Automated Data Capture:

"Build automated web scraping + data capture system for trainer onboarding.

OBJECTIVE:
Populate dogtrainersdirectory.com.au with 50–100 Melbourne trainers BEFORE
they claim their profiles. Data should appear "alive" and real.

DATA SOURCES:
1. Trainer websites (I'll provide list of URLs)
2. Google Business listings (scraped data)
3. Social media (Facebook pages, Instagram)
4. Australian Business Register (ABN lookup if available)

DATA TO EXTRACT (Per Trainer):
├─ Business name (primary + any alternate names)
├─ Phone number (primary + secondary if available)
├─ Email address (contact form or provided)
├─ Website URL (primary)
├─ Physical address (street, suburb, postcode)
├─ Business description (copy from website)
├─ Specialties (parsed from service/pricing pages)
├─ Training format (1:1, group, remote, board-and-train)
├─ Pricing (if publicly listed)
├─ Credentials/certifications (if mentioned on site)
├─ Social media links (Facebook, Instagram)
└─ Google reviews (auto-scraped if available)

STORAGE:
├─ Create table: scaffolded_trainer_data
├─ Fields: name, phone, email, website, address, lga_id, 
           specialties (JSON), pricing, description, source_url
├─ Flag: is_scaffolded = true
├─ Flag: is_claimed = false
├─ Flag: data_last_updated = [date]
└─ Auto-update: Weekly refresh from source URLs

DISPLAY:
├─ Show on directory: "Unverified" badge (blue)
├─ Message: "Claimed by Trainer" or "Needs Verification"
├─ CTA: [IS THIS YOUR BUSINESS? → CLAIM IT]
├─ Reviews: Show existing Google reviews/ratings
└─ Phone/Email: Clickable (call/email directly)

WORKFLOW:
1. I provide: List of trainer websites (Google Sheet URL or CSV)
2. AI agent crawls: Each URL, extracts data
3. Parse: Using LLM to understand page structure
4. Extract: Contact info, specialties, pricing
5. Validate: Check if phone number format correct, email valid
6. Store: To scaffolded_trainer_data table
7. Display: Immediately visible on directory (unverified)
8. Trainer discovers: Their business listed with their data
9. Trainer claims: Verification process (phone/ABN/email)
10. Update: Move from scaffolded to verified

REFRESH SCHEDULE:
├─ Initial: Scrape all 50–100 on launch day
├─ Ongoing: Weekly refresh (every Monday 2am)
├─ Update: Business name, phone, address, specialties
├─ Flag: If data changes significantly
└─ Alert: Notify trainer if critical data updated

ERROR HANDLING:
├─ Website down: Skip, retry next week
├─ Data extraction failed: Revert to previous data
├─ Phone invalid: Flag for manual review
├─ Email invalid: Flag for manual review
├─ No contact info found: Leave fields blank, mark as incomplete
└─ Duplicate detection: If multiple trainers have same ABN, flag

STORAGE ENCRYPTION:
├─ Phone: Encrypted (show partially: 03 9876 *****)
├─ Email: Encrypted (show partially: abc@***.com.au)
├─ Address: Encrypted at rest
└─ All encrypted using: AES-256, keys stored securely

COMPLIANCE:
├─ Privacy: Data collection for directory listing only
├─ Terms: Website ToS allows scraping (or we contact for permission)
├─ GDPR: Australia Privacy Act compliant
└─ Consent: Trainer consents by claiming profile

COST & PERFORMANCE:
├─ Scraping cost: Minimal (crawl, parse, store)
├─ Weekly refresh: <5 minutes per trainer
├─ Total: 50 trainers × 5 mins weekly = ~4 hours automation/week
├─ Parallel processing: Scrape all 50 simultaneously
└─ Estimated: <30 minutes for all 50 trainers per week

Please build this system and test with 5 sample trainer websites first."
```

### 4.4 Contact Form + Real-Time Data Validation

```
CONTACT FORM FOR MANUAL TRAINER SUBMISSION (Backup):

┌─────────────────────────────────────────────────────────────┐
│ "Can't Find Your Business? List It Here"                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ If your business isn't showing above, submit it here.       │
│ We'll add it to the directory within 24 hours.             │
│                                                             │
│ STEP 1: Business Details                                   │
│ Business name: [Loose Lead Training Fitzroy___________]    │
│ Phone: [03 9876 5432___________________________________]  │
│ Email: [info@looselea d.com.au_______________________]    │
│ Website: [www.looselea dtraining.com.au______________]    │
│ Address: [123 Brunswick St, Fitzroy VIC 3065________]     │
│ Suburb/LGA: [Fitzroy____________] [Auto-select ▼]         │
│                                                             │
│ STEP 2: Specialties (Select all)                           │
│ ☐ Puppy ☑ Adolescent ☐ Rescue ☑ Leash Reactivity        │
│ ☐ Aggression ☐ Separation Anxiety ☐ Other                │
│                                                             │
│ STEP 3: Submit                                             │
│ [SUBMIT FOR REVIEW]                                        │
│                                                             │
│ What happens next:                                         │
│ 1. We verify your business exists (Google search, ABN)    │
│ 2. We list you as "Pending Verification" (24 hours)       │
│ 3. We send you email: "Your business is now listed!"      │
│ 4. You can claim & verify anytime                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

BACKEND LOGIC:

AI agent processes form submission:
├─ Webhook triggered: Form submission received
├─ Validation: Check required fields present
├─ Duplicate check: Does business already exist?
│  ├─ Same phone number? → Suggest claim existing
│  ├─ Same ABN? → Suggest claim existing
│  ├─ Same email? → Suggest claim existing
│  └─ Same name + address? → Suggest claim existing
├─ If duplicate found: "This looks like an existing business. Claim it instead?"
├─ If new: Create scaffolded entry
├─ Auto-verification:
│  ├─ Verify phone number format (11 digits for Australia)
│  ├─ Verify email format (valid email pattern)
│  ├─ Lookup on Google Business? (if exists, auto-populate data)
│  └─ Flag if any data unusual or incomplete
├─ Send email: "Thanks! Your business is being added to the directory"
├─ Admin notification: "New trainer submission: [name]"
├─ Display: Shows on directory within 24 hours (or immediately if auto-verified)
└─ Follow-up: Send second email "Claim your profile" after 3 days
```

---

## PART 5: COMPLETE AI AGENT BUILD PROMPT (All Integrated)

```
MASTER PROMPT FOR AI AGENT - Full Integration:

"Build complete trainer directory with ABN verification, Stripe webhooks,
and automated data capture.

═══════════════════════════════════════════════════════════════

CORE FEATURES:

1. ABN VERIFICATION INTEGRATION
   ├─ Input: Trainer provides ABN (11 digits)
   ├─ API call: Query Australian Business Register (using provided GUID)
   ├─ Verification: Check ABN exists, active, name matches
   ├─ Auto-verify: If match ≥85%, auto-verified immediately
   ├─ Fallback: Manual review if match <85%
   ├─ Badge: Display ✅ VERIFIED BUSINESS next to trainer name
   ├─ Storage: Encrypt ABN, store verification record
   └─ Expiry: Re-verify every 12 months

2. STRIPE PAYMENT INTEGRATION (Webhooks)
   ├─ Featured slots: $20 / 30-day FIFO (Phase 1 live; higher tiers deferred)
   ├─ Premium profiles: $15/$40/month (Phase 1.5+ gating)
   ├─ Webhook events: charge.succeeded, invoice.payment_succeeded, etc.
   ├─ Database updates: Auto-update featured_placements, trainer_subscriptions
   ├─ Email confirmations: Auto-send to trainer
   ├─ 25-day renewal reminders: Automated 5 days before expiry
   ├─ Failed payments: Grace period + retry logic
   ├─ Revenue dashboard: Track all payment activity
   └─ Refund handling: Auto-refund within 3 days, process via Stripe

3. AUTOMATED DATA CAPTURE (Web Scraping)
   ├─ Source: Trainer websites, Google Business, social media
   ├─ Extract: Name, phone, email, address, specialties, pricing
   ├─ Store: As scaffolded entries (unverified)
   ├─ Display: Show on directory with 🔵 UNVERIFIED badge
   ├─ Auto-refresh: Weekly updates from source websites
   ├─ Fallback: Manual form submission if not found
   ├─ Deduplication: Check for duplicates before adding
   └─ Trainer claim: When trainer claims, converts scaffolded→verified

4. CONTACT FORM (Manual Trainer Submission)
   ├─ Fields: Name, phone, email, website, address, specialties
   ├─ Validation: Check phone format, email format, business exists
   ├─ Duplicate prevention: Warn if already in directory
   ├─ Auto-add: If verified, immediately add to directory
   ├─ Admin notification: Alert if manual review needed
   └─ Trainer email: "Your business is now listed"

═══════════════════════════════════════════════════════════════

DATABASE TABLES:

Businesses (scaffolded + verified)
├─ business_id, name, phone, email, address, lga_id
├─ is_scaffolded, is_claimed, created_by
├─ specialties (JSON array), pricing (JSON), description

Business_ABN_Verifications
├─ verification_id, business_id, abn (encrypted)
├─ verification_status, verification_method, ato_response (JSON)
├─ verified_at, verification_expires_at

Featured_Placements
├─ placement_id, business_id, lga_id, tier
├─ stripe_charge_id, amount_paid, start_date, end_date
├─ status ('active', 'expired', 'refunded')

Trainer_Subscriptions
├─ subscription_id, trainer_id, stripe_subscription_id
├─ subscription_tier ('premium', 'platinum')
├─ status ('active', 'cancelled'), next_billing_date

Trainer_Payments
├─ payment_id, trainer_id, amount, stripe_charge_id
├─ payment_type ('featured_slot', 'subscription', 'affiliate')
├─ status ('succeeded', 'failed', 'refunded'), created_at

═══════════════════════════════════════════════════════════════

STRIPE WEBHOOK CONFIGURATION:

Events to handle:
├─ charge.succeeded (featured slot paid)
├─ charge.failed (payment failed)
├─ invoice.payment_succeeded (subscription renewed)
├─ invoice.payment_failed (subscription payment failed)
├─ customer.subscription.deleted (trainer cancelled)
├─ charge.refunded (refund processed)
└─ charge.dispute.created (chargeback filed)

Webhook processing:
├─ Extract data from webhook payload
├─ Update appropriate database table
├─ Send email to trainer (confirmation/alert)
├─ Log transaction (for revenue tracking)
├─ Error handling: Log failures, retry if needed

Endpoint: [AI AGENT PROVIDES URL]
Signing secret: [I WILL PROVIDE]

═══════════════════════════════════════════════════════════════

TAX & COMPLIANCE:

Business model:
├─ Platform owner business ABN: [YOUR ABN]
├─ All revenue collected to Platform account
├─ Stripe fee: 2.9% + $0.30 (automatic deduction)
├─ Platform owner responsible for own tax filings
├─ Trainers are independent contractors (not employees)

Disclaimer language (embed in T&Cs):
├─ Platform not liable for trainer misconduct
├─ ABN verification does NOT endorse trainer
├─ User responsible for verifying trainer qualifications
├─ Refund policy: 3 days for featured slots, monthly for subscriptions

Privacy compliance (Australia Privacy Act):
├─ ABN encrypted at rest (AES-256)
├─ Data deletion: 90 days after account deletion
├─ User can request access to their data
├─ Trainer data kept for 6 years (tax compliance)

═══════════════════════════════════════════════════════════════

AUTOMATED WORKFLOWS (LLM-Based):
(Phase 1 live today: Workflows 1, 2, and 5. Workflows 3 and 4
become active once Phase 1.5 features ship.)

Workflow 1: Featured Slot Purchase
├─ Trigger: Stripe webhook (charge.succeeded)
├─ Action: Create featured_placement record
├─ Email: Confirmation to trainer
├─ Display: Shows in directory immediately

Workflow 2: 25-Day Renewal Reminder
├─ Trigger: Scheduled daily (check for placements expiring in 5 days)
├─ Action: Send email with renewal CTA
├─ Content: Performance metrics + ROI calculation
├─ Button: One-click [RENEW NOW] checkout

Workflow 3: Failed Subscription Payment
├─ Trigger: Stripe webhook (invoice.payment_failed)
├─ Action: 7-day grace period starts
├─ Day 1: Email "Payment failed, update card"
├─ Day 3: Reminder "2 days left to update"
├─ Day 7: Disable premium features if not resolved

Workflow 4: Data Capture & Refresh
├─ Trigger: Weekly (every Monday 2am)
├─ Action: Scrape trainer websites (50–100 URLs)
├─ Update: Refresh phone, address, specialties, pricing
├─ Alert: If critical data changed significantly

Workflow 5: Trainer Claim & Verification
├─ Trigger: Trainer claims scaffolded business
├─ Action: ABN/phone verification process
├─ Auto-verify: If ABN matches ≥85%
├─ Manual review: If verification uncertain
├─ Complete: Once verified, convert scaffolded→verified

═══════════════════════════════════════════════════════════════

DEPLOYMENT CHECKLIST:

Before launch:
☐ Stripe account connected (API keys configured)
☐ Webhook signing secret provided to AI agent
☐ ABR API (GUID) credentials tested
☐ Web scraping URLs provided (50–100 trainer websites)
☐ T&Cs + Privacy Policy finalized
☐ Legal review completed
☐ Business ABN documented
☐ Bank account for Stripe deposits confirmed
☐ Email domain configured (support@dogtrainersdirectory)
☐ Test webhook events (simulate charge, refund, etc.)
☐ Load test: Simulate 10 concurrent payments
☐ Test ABN verification with 5 sample ABNs
☐ Test data capture with 5 sample websites

After launch:
☐ Monitor Stripe webhook errors (should be 0)
☐ Track failed verification attempts
☐ Monitor payment failures (retry rate)
☐ Track featured slot adoption (% of trainers buying)
☐ Monitor revenue daily (dashboard check)
☐ Review refund requests (policy adherence)
☐ Test data refresh (weekly scrape completion)

═══════════════════════════════════════════════════════════════

Please ask clarifying questions about:
- ABN GUID credentials (how to provide securely)
- Trainer website URLs (format for scraping)
- Stripe connected account details
- Email sending preferences
- Webhook error handling thresholds
- Data refresh frequency (weekly, daily, monthly?)
- Trainer list for initial scaffolding (50–100 websites)"
```

---

## PART 6: TIMELINE & TASK BREAKDOWN

> **Phase gating reminder:** Weeks 1–4 cover the guaranteed MVP. Weeks 5+ include backlog items that only proceed if Phase 1 KPIs unlock Phase 1.5 (premium subscriptions, additional monetization, etc.).

```
WEEK 1-2: LEGAL + STRIPE SETUP
├─ Legal: T&Cs + Privacy Policy (now with ABN disclaimer + tax section)
├─ Stripe: Connect account, get API keys
├─ ABR API: Test GUID credentials with sample ABN
├─ Tech: Set up webhook receiver in AI agent
└─ Deliverable: Legal docs published, Stripe ready, ABN API tested

WEEK 3: DATA CAPTURE SETUP
├─ Compile: 50–100 trainer websites (URLs)
├─ Test: ABN verification with 10 sample trainers
├─ AI agent: Build web scraper for trainer data
├─ Test: Scrape 5 websites, manually verify accuracy
└─ Deliverable: Data capture system ready, tested

WEEK 4: PHASE 1-2 BUILD (Triage + Directory + Verification)
├─ AI agent: Build Phase 1 (triage system)
├─ AI agent: Build Phase 2 (directory + claiming + ABN verification)
├─ Stripe: Configure webhook endpoints
├─ Test: End-to-end featured slot purchase → payment → email
└─ Deliverable: Directory live, ABN verification working, Stripe webhook working

WEEK 5-6: DATA POPULATION + PHASE 3-4
├─ Run: Automated web scraper for all 50–100 trainers
├─ Populate: Featured_placements, trainer_subscriptions tables
├─ AI agent: Build Phase 3 (DIY plans)
├─ AI agent: Build Phase 4 (monetization + admin dashboard)
├─ Test: Subscription billing, recurring charges
└─ Deliverable: 50–100 trainers scaffolded in directory, monetization live

WEEK 7-8: PHASE 5 + TESTING
├─ AI agent: Build Phase 5 (emergency escalation + B2B)
├─ Test: All payment flows (featured slots, subscriptions, refunds)
├─ Test: ABN verification edge cases (mismatches, cancelled ABNs)
├─ Test: Web scraper refresh (weekly update accuracy)
├─ Load test: 100 concurrent featured slot purchases
└─ Deliverable: All phases complete, thoroughly tested

WEEK 9: LAUNCH PREP
├─ Final review: T&Cs, Privacy Policy published
├─ Stripe: Activate production (exit sandbox)
├─ Email: Prepare trainer launch sequence
├─ Monitor: Set up error tracking, revenue dashboard
└─ Deliverable: Everything ready for production launch

WEEK 10: LAUNCH
├─ Deploy to production (dogtrainersdirectory.com.au)
├─ Send trainer launch email
├─ Monitor: Errors, payments, ABN verifications
├─ Support: Help trainers claim businesses
└─ Deliverable: LIVE PLATFORM
```

---

**Document Version:** 5.0  
**Last Updated:** 28 November 2025  
**Status:** COMPLETE ABN VERIFICATION + STRIPE WEBHOOKS + LEGAL FRAMEWORK + DATA CAPTURE — Ready for Implementation

---

## KEY ACHIEVEMENTS (This Version)

✅ **ABN Verification:** GUID-based auto-verification with badge + fallback options

✅ **Stripe Webhooks:** Featured-slot flow implemented now; subscription/refund automation documented for Phase 1.5 readiness

✅ **Legal Compliance:** Robust T&Cs + privacy policy + tax responsibility clearly defined

✅ **Automated Data Capture:** Web scraping + contact form + real-time validation

✅ **Tax Framework:** Your business ABN setup, Stripe reporting for ATO, quarterly filing explained

✅ **No Manual Intervention:** All workflows automated via AI agent LLM + webhooks

✅ **Scaffolded Directory:** 50–100 trainers pre-populated via web scraping, "appear alive" before claiming

✅ **Error Handling:** All edge cases documented (ABN mismatches, failed payments, timeouts, duplicates)
