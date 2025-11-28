# PHASE 1 MVP MASTER SPEC — FEATURED PLACEMENTS + LEAD GENERATION

**Date:** 28 November 2025  
**Status:** ✅ Locked for build  
**Timeline:** 8 weeks to launch (Weeks 1–8)  
**Revenue Target:** $900–1,500/month by Month 1 (featured placements only)

---

## 1. Executive Summary

- **Focus:** Two revenue-impacting tracks only  
  1. Featured Placements — $20 AUD per 30-day FIFO slot, max 5 active per LGA (28 LGAs = 140 concurrent slots).  
  2. Lead Generation Tracking — profile clicks + inquiries only (no monetization until Phase 1.5).
- **What’s deferred:** Premium profile tiers, advanced analytics, lead monetization, affiliate/sponsored content, marketplace fees. These wait until Month 1 data validates demand.
- **Success metric:** Featured renewal rate ≥30% by end of Month 1. This determines whether to scale or pivot pricing/duration.

---

## 2. Decision Lock Overview

- LGA-level featured model replaces hyperlocal suburb targeting (working-class suburbs lacked density).  
- FIFO queue ensures fairness, transparency, and automation — position/ETA visible to trainers at all times.  
- Stripe powers every transaction; Supabase stores payments/metrics per the ABN/Stripe legal spec (§2).  
- Five new tables + trainer additions + analytics plumbing are mandatory for MVP lock.  
- Phase 1.5 roadmap (premium profiles, paid leads) only starts after Month 1 proof hits targets.

---

## 3. Build Scope

### 3.1 Deliver in Phase 1

```
Featured Placements
├─ $20 per 30-day slot, FIFO queue when 5-slot cap hit per LGA
├─ Auto-promote from queue on expiry
├─ Trainer dashboard: status, metrics, renew button
├─ 8 automated email templates (activation → expiry)
└─ Stripe webhook-driven lifecycle

Lead Generation
├─ Metric 1: Profile clicks (search result → profile)
├─ Metric 2: Inquiries (owner submits profile form)
├─ Trainer dashboard: featured vs. free breakdown, week trends
└─ Dog owner + trainer notifications per inquiry
```

### 3.2 Explicitly Deferred

Premium tiers, analytics add-ons, lead monetization, affiliate/sponsored content, marketplace fees. Those belong to Phase 1.5+ once retention metrics justify.

---

## 4. Build Timeline (8 Weeks)

| Weeks | Focus | Deliverables |
|-------|-------|--------------|
| 1–2 | Featured Placements Core | DB migrations, Stripe checkout + metadata, FIFO queue logic, trainer dashboard basics |
| 3–4 | Lead Tracking | Profile-click endpoint, inquiry form + storage, dashboard metrics, inquiry notifications |
| 5–6 | Polish & QA | Cron jobs, queue recalculation tests, end-to-end Stripe webhooks, email template QA, trainer pilot |
| 7–8 | Launch & Monitor | Production deploy, Stripe webhook config, daily monitoring, weekly KPIs, Month 1 proof gathering |

---

## 5. Data Model & Infra

### 5.1 Trainer Table Additions

```sql
ALTER TABLE trainers
  ADD COLUMN featured_tier          ENUM('free','featured') DEFAULT 'free',
  ADD COLUMN featured_lga_id        INT REFERENCES councils(id),
  ADD COLUMN featured_slot_active   BOOLEAN DEFAULT FALSE,
  ADD COLUMN featured_slot_start_date TIMESTAMP,
  ADD COLUMN featured_slot_expiry_date TIMESTAMP,
  ADD COLUMN featured_payment_reference VARCHAR(255),
  ADD COLUMN featured_queue_position INT DEFAULT NULL,
  ADD COLUMN featured_last_promoted_date TIMESTAMP DEFAULT NULL;
```

### 5.2 New Tables

```sql
CREATE TABLE featured_queue (
  id SERIAL PRIMARY KEY,
  trainer_id INT UNIQUE NOT NULL REFERENCES trainers(id),
  lga_id INT NOT NULL REFERENCES councils(id),
  joined_queue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  queue_position INT,
  status ENUM('waiting','promoted_pending','active','cancelled','expired') DEFAULT 'waiting',
  payment_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE featured_slots_metrics (
  id SERIAL PRIMARY KEY,
  lga_id INT NOT NULL REFERENCES councils(id),
  trainer_id INT NOT NULL REFERENCES trainers(id),
  featured_slot_id VARCHAR(255),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  active_days INT,
  total_slot_views INT DEFAULT 0,
  total_profile_clicks INT DEFAULT 0,
  total_inquiries INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE featured_slots_status (
  id SERIAL PRIMARY KEY,
  lga_id INT UNIQUE NOT NULL REFERENCES councils(id),
  current_featured_count INT DEFAULT 0,
  max_slots INT DEFAULT 5,
  queue_length INT DEFAULT 0,
  next_expiry_date TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type ENUM('profile_click','inquiry_submitted') NOT NULL,
  trainer_id INT NOT NULL REFERENCES trainers(id),
  dog_owner_session_id VARCHAR(255),
  search_query_text VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inquiries (
  id SERIAL PRIMARY KEY,
  trainer_id INT NOT NULL REFERENCES trainers(id),
  dog_owner_name VARCHAR(255),
  dog_owner_email VARCHAR(255),
  dog_owner_phone VARCHAR(20),
  dog_age_group ENUM('puppy','young_adult','adult','senior'),
  dog_issue VARCHAR(500),
  message TEXT,
  inquiry_source ENUM('featured','free_listing','search'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Featured Placement Lifecycle

1. **Purchase** — Trainer selects LGA, pays $20 via Stripe Checkout. Metadata includes `trainer_id`, `business_id`, `lga_id`, `tier`.
2. **Webhook (`charge.succeeded`)** — Handler checks `featured_slots_status`.
   - If `current_featured_count < 5`: activate immediately, set start/end dates, email “LIVE”.
   - Else: insert into `featured_queue`, assign `queue_position`, email “Position N”.
3. **Active Period (Day 1–30)** — Trainer card boosted in matching searches. Metrics tracked in `featured_slots_metrics` and dashboard.
4. **Expiry Cron** — Daily job finds `featured_slot_expiry_date <= today`.
   - Deactivate trainer, send expiry email, log metrics.
   - Promote next queued trainer (oldest `joined_queue_date`), set new start/end, recalc queue positions, send promotion + position improved emails.
5. **Renewal Flow** — Trainer triggers `/renew`, initiates new Checkout session. Renew before expiry to skip queue.

### Queue Math

- `queue_position = COUNT(waiting trainers joined before this) + 1`.  
- ETA uses average expiry interval (30 days / 5 slots → ~6 days per slot) → `(position-1) * 6` days baseline.

---

## 7. Lead Generation Flow

1. **Profile Clicks** — `POST /api/analytics/profile-click` logs events; session anonymized. Dashboard shows featured vs free splits and week trend.
2. **Inquiries** — Profile form posts to `/api/inquiries/submit`, storing dog owner contact, dog info, issue, source.
3. **Notifications** — Trainer email (new inquiry) + dog owner confirmation.
4. **Dashboard** — `/api/vendor/metrics/dashboard` aggregates clicks/inquiries, top issues, recent inquiries, featured status.

---

## 8. API Surface (8 endpoints)

1. `POST /api/vendor/featured-slots/purchase`  
2. `GET /api/vendor/featured-slots/status`  
3. `POST /api/vendor/featured-slots/{slot_id}/renew`  
4. `POST /api/vendor/featured-slots/{queue_id}/cancel`  
5. `GET /api/admin/featured-slots/lga/{lga_id}`  
6. `POST /api/analytics/profile-click`  
7. `POST /api/inquiries/submit`  
8. `GET /api/vendor/metrics/dashboard`

Request/response schemas remain as defined in the original build doc.

---

## 9. Email Automation (8 templates)

1. Featured activated — “Your placement is LIVE.”  
2. Added to queue — position + ETA.  
3. Position improved — highlight movement + new ETA.  
4. Expiring in 7 days — push renew CTA with metrics.  
5. Featured expired — show ROI, options to renew/queue/idle.  
6. Auto-promoted — celebration + new expiry date.  
7. Inquiry received — trainer details, reminder to respond quickly.  
8. Inquiry confirmation — dog owner summary + expectations.

All templates live in this master spec and should be implemented verbatim.

---

## 10. Metrics & Decision Framework

### Month 1 Targets

| Area | KPI | Target |
|------|-----|--------|
| Featured adoption | Trainers | 40–60 active by end of Month 1 |
| Revenue | Featured only | $800–1,500 |
| Renewal rate | % renewing | ≥30% ideal, <20% triggers pricing/duration review |
| Queue health | At-capacity LGAs | 8–12 councils; 2–5 queued trainers each |
| Lead volume | Profile clicks | 800–1,500 |
| Lead volume | Inquiries | 100–200 |
| Conversion | Click → inquiry | 10–15% |
| Lead quality | Verified contact | ≥85% with email + phone |

### Pivot Rules

- **Renewal ≥30%** → proceed to Phase 1.5 (premium tiers + lead monetization).  
- **Renewal 20–30%** → monitor, consider price reduction or extended duration.  
- **Renewal <20%** → pivot pricing/model immediately.  
- **Inquiries ≥200/month** → safe to monetize leads (Phase 1.5).  
- **Inquiries <50/month** → fix dog owner UX/triage before monetizing.

---

## 11. Month 1 Reporting & Dashboarding

- Daily cron captures expiries/promotions and pushes queue notifications.  
- Admin dashboard tracks featured counts/queue per LGA, revenue, click/inquiry totals, satisfaction surveys.  
- Weekly cadence review: adoption, queue health, Stripe revenue, lead volume.  
- Month-end review decides Phase 1.5 roadmap using KPIs above.

---

## 12. Phase 1.5/Phase 2 Outlook

- **Phase 1.5 (Month 2–3)** — launch premium profiles ($5–8/mo), pay-per-lead ($2–5), advanced analytics once renewal + inquiry thresholds met.  
- **Phase 2 (Month 4+)** — sponsored content, marketplace transaction fees, regional tiers, contingent on $4k+ MRR and sustained trainer satisfaction.

---

**Result:** All prior STRIPE docs consolidated here. Treat this as the single source for Phase 1 Stripe/monetization implementation. Update this file for any future decisions. All superseded documents removed per instructions.
