# Operations Runbook: AI Review Moderation

**Last Updated:** December 2025  
**Owner:** Operations Team  
**Audience:** Administrators, QA testers  
**Severity:** Medium (affects user content visibility)

## Overview

This runbook documents the AI-assisted review moderation system, which automatically flags reviews for approval, rejection, or manual review based on safety heuristics. The system is **always human-approved** — AI flags content, humans decide.

## System Architecture

### Components

1. **AI Moderation Module** (`src/lib/moderation.ts`)
   - Heuristic-based classification (no external API calls)
   - Decision categories: `AUTO_APPROVE`, `AUTO_REJECT`, `MANUAL_REVIEW`
   - Confidence scores (0.0–1.0) for each decision

2. **Moderation Queue** (Admin dashboard `/admin`)
   - Pending reviews surfaced with AI recommendation and rationale
   - Quick-action buttons: Approve, Reject, Edit, Request Info

3. **AI Review Decisions Table** (`ai_review_decisions`)
   - Audit log of all moderation decisions
   - Links to `reviews` table
   - Stores AI recommendation, human override, timestamp

4. **Automated Job** (`/api/admin/moderation/run`)
   - Runs every 10 minutes via Vercel Cron
   - Processes pending reviews, applies auto-decisions
   - Logs all actions for audit trail

## Moderation Heuristics

### Auto-Approve (Confidence ≥ 0.9)

**Criteria:**
- Content length 50–500 words
- No profanity (checked against blocklist)
- No personal identifiers (phone, email, address patterns)
- No spam indicators (excessive links, repeated characters)
- No all-caps sentences
- Grammar check: ≤2 errors per 100 words
- Sentiment: not extreme (anger/hate indicators)

**Example:**  
```
"Great trainer! Fixed my dog's leash reactivity in 3 sessions. 
Very patient and knowledgeable. Highly recommend."
```

### Auto-Reject (Confidence ≥ 0.8)

**Criteria:**
- Profanity or slurs (hard blocklist)
- Contact info: phone/email/address patterns
- Spam: URLs, repeated characters ("aaaaaa"), suspicious formatting
- Threats, harassment, or hate speech
- Off-topic content (not about trainer/dog training)
- Gibberish or unreadable text (entropy check)

**Example:**  
```
"This trainer is a SCAM!!! Call 0412345678 or email spam@example.com 
for REAL DOG TRAINING!!! CLICKHERE.COM"
```

### Manual Review (Everything else)

**Common Triggers:**
- Borderline profanity (slang, context-dependent words)
- Mixed signals (compliment + minor complaint)
- Detailed criticism (legitimate but detailed)
- Medical claims (liability concern)
- Testimonials mentioning other businesses

**Example:**  
```
"Trainer was ok, but pricey. Didn't work as well as the place 
my neighbor recommended. Dog still barks at guests."
```

## Operational Procedures

### Daily Operations

#### 1. Monitor the Moderation Queue (Every 4 hours)

```bash
# SSH into admin dashboard or use API
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://dogtrainersdirectory.com.au/api/admin/queues

# Expected response includes:
# {
#   "reviews": {
#     "pending": N,
#     "auto_approved": N,
#     "auto_rejected": N,
#     "manual_review": N
#   },
#   "queue": [{ id, trainer_id, rating, text, ai_recommendation, confidence }]
# }
```

**What to look for:**
- Pending count: If ≥10, escalate
- Auto-reject rate: If >5% of all reviews, investigate heuristics
- Auto-approve rate: If <50%, heuristics may be too strict

#### 2. Review Manual Review Queue (Daily)

1. Log into `/admin` dashboard
2. Click "Reviews" → filter by `MANUAL_REVIEW`
3. For each review:
   - Read AI rationale under the review text
   - Decide: Approve, Reject, Edit content, or Request Info from reviewer
   - Click action button to apply decision
   - Decision is immediately logged in `ai_review_decisions`

**SLA:** Aim to clear manual review queue within 24 hours

#### 3. Handle Auto-Reject Appeals (as needed)

If a reviewer disputes an auto-reject:

1. Open the review in admin queue
2. Click "Override" → "Appeal Review"
3. Modal shows:
   - Original AI decision (e.g., "Detected spam: 5 URLs")
   - Full review text
   - Re-scan button
4. If you disagree with AI:
   - Click "Approve" to override
   - System logs the override with your rationale in `ai_review_decisions.human_notes`
   - Trainer is notified their review was approved

### Weekly Operations

#### 1. Audit AI Decision Distribution (Monday morning)

```bash
# Query: Decision distribution over past 7 days
SELECT decision, COUNT(*) as count
FROM ai_review_decisions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY decision;

# Expected: ~50% AUTO_APPROVE, ~20% AUTO_REJECT, ~30% MANUAL_REVIEW
# If distribution is skewed, adjust heuristics (see Calibration below)
```

#### 2. Review Confidence Score Trends (Weekly)

```bash
# Query: Average confidence by decision
SELECT decision, AVG(confidence) as avg_confidence, COUNT(*) as count
FROM ai_review_decisions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY decision;

# Healthy baseline:
# AUTO_APPROVE: 0.93–0.97 (high confidence)
# AUTO_REJECT: 0.82–0.90 (moderate-high confidence)
# MANUAL_REVIEW: 0.50–0.75 (uncertain)
```

If confidence drifts, investigate reason and adjust heuristics.

#### 3. False Positive / False Negative Analysis (Monthly)

Randomly sample 20 auto-decisions and verify:

```bash
-- Sample 10 auto-approved reviews
SELECT * FROM ai_review_decisions
WHERE decision = 'AUTO_APPROVE' AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY RANDOM() LIMIT 10;

-- Sample 10 auto-rejected reviews
SELECT * FROM ai_review_decisions
WHERE decision = 'AUTO_REJECT' AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY RANDOM() LIMIT 10;
```

Manually review each sample and record:
- False positives (should have been approved/rejected differently)
- False negatives (should have been caught by auto-moderation)
- Patterns (e.g., "borderline profanity not caught", "overly strict on complaint reviews")

Document findings in monthly report.

### Monthly Operations

#### 1. Calibrate Heuristics (First Monday of month)

If false positive/negative rate >5%, adjust heuristics:

**Example: High false-reject rate for complaint reviews**

Current logic: "Reject if contains complaint word + lowercase letters"

Refinement:
- Add exception: "If complaint is ≤30% of review text and sentiment is mixed, mark MANUAL_REVIEW instead"
- Re-test on historical data
- Deploy with feature flag (disabled by default)

**Files to update:**
- `src/lib/moderation.ts` — core heuristics
- `DOCS/automation/moderation_heuristics_v{N}.md` — documentation

#### 2. Escalation Review (Monthly)

Check if any reviewers have high override rate:

```bash
-- Trainers with >20% of reviews overridden
SELECT 
  b.name, 
  COUNT(a.*) as total_reviews,
  COUNT(CASE WHEN a.human_override = true THEN 1 END) as overrides,
  ROUND(100.0 * COUNT(CASE WHEN a.human_override = true THEN 1 END) / COUNT(a.*), 2) as override_rate
FROM ai_review_decisions a
JOIN reviews r ON a.review_id = r.id
JOIN businesses b ON r.business_id = b.id
WHERE a.created_at >= NOW() - INTERVAL '30 days'
GROUP BY b.id, b.name
HAVING COUNT(CASE WHEN a.human_override = true THEN 1 END) > 0
ORDER BY override_rate DESC;
```

**Actions:**
- If override_rate >20%: Investigate if AI is mis-classifying that trainer's reviews (possibly due to writing style). Reach out to trainer or adjust heuristics.
- If override_rate <5%: AI decisions are good; no action needed.

#### 3. Prepare Monthly Report

Document:
- Total reviews processed
- Distribution of decisions (auto-approve%, auto-reject%, manual%)
- False positive/negative rate
- Key heuristic improvements
- Recommendations for next month

Example structure:
```
# Moderation Report — December 2025

## Summary
- Total reviews: 145
- Auto-approved: 73 (50%)
- Auto-rejected: 29 (20%)
- Manual review: 43 (30%)

## Quality Metrics
- False positives (auto-rejected, manually approved): 2 (0.7%)
- False negatives (auto-approved, should have been rejected): 1 (0.7%)
- Average approval SLA: 8 hours

## Calibration Actions
- Raised profanity blocklist threshold (fewer borderline words marked)
- Added exception for "complaint reviews" with mixed sentiment

## Recommendations
- Consider adding domain-specific phrases (e.g., "aggressive behavior" is not a complaint about trainer)
```

## Alerts & Escalations

### Alert: High Auto-Reject Rate (>25%)

**Trigger:** Daily job logs warn if >25% of day's reviews auto-rejected

**Response:**
1. SSH into admin dashboard
2. Pull sample of 10 auto-rejected reviews
3. Check for:
   - False positives (legitimate reviews incorrectly rejected)
   - New spam pattern (if legitimate, investigate source)
4. If false positives: Disable auto-reject temporarily, escalate to dev team
5. If spam: Investigate IP addresses, block if necessary

### Alert: Manual Review Queue >50 (Backlog)

**Trigger:** Daily job logs warn if pending manual_review count >50

**Response:**
1. Assign additional reviewer(s) to clear queue
2. If queue continues to grow, lower confidence threshold for auto-approve (more reviews auto-approved, fewer sent to manual review)
3. Monitor in 24 hours; escalate to management if SLA will be missed

### Alert: Moderation Job Fails (No entries in last 24 hours)

**Trigger:** Daily health check: `SELECT MAX(created_at) FROM ai_review_decisions`

**Response:**
1. Check Vercel Cron logs: `/api/admin/moderation/run` should have recent POST
2. If no recent entries, check:
   - Cron job configuration in `vercel.json`
   - Supabase connection (test with quick SQL query)
   - Secrets (`SUPABASE_SERVICE_ROLE_KEY` set in Vercel)
3. If job is disabled, re-enable and re-run immediately

## Troubleshooting

### Problem: AI is auto-rejecting legitimate reviews

**Diagnosis:**
- Check false positive rate (sample 10 auto-rejected reviews)
- Look for pattern (e.g., all use word "aggressive")

**Solution:**
1. Identify the problematic heuristic
2. Adjust confidence threshold or add exception
3. Test on historical data
4. Deploy with feature flag, monitor for 48 hours
5. If successful, make permanent

**Example:**
```typescript
// Before: All reviews mentioning "aggressive" auto-rejected
const hasAggressive = /aggressive/i.test(text);
if (hasAggressive) return 'AUTO_REJECT';

// After: Allow "aggressive" if review is mostly positive
const aggressiveScore = text.match(/aggressive/gi)?.length || 0;
const positiveScore = text.match(/good|great|awesome|helpful|patient/gi)?.length || 0;
if (aggressiveScore > positiveScore * 2) return 'AUTO_REJECT'; // Majority aggressive
```

### Problem: Manual review queue keeps growing

**Diagnosis:**
- Check heuristic precision (is auto-approve threshold too high?)
- Review decision distribution (see Weekly Operations)

**Solution:**
1. Lower auto-approve confidence threshold (e.g., 0.85 → 0.80)
2. Monitor for 48 hours; assess false positive rate
3. If false positives acceptable, keep new threshold
4. If false positives increase, raise threshold back and investigate manually

### Problem: Spam is getting through (auto-approved spam reviews)

**Diagnosis:**
1. Sample recent auto-approved reviews (check `ai_review_decisions` table)
2. Identify spam pattern (e.g., "Buy cheap training at…", repeated URLs)

**Solution:**
1. Add pattern to spam blocklist in `src/lib/moderation.ts`
2. Re-test on historical data
3. Deploy, monitor for false positives
4. If spam stops, document the new pattern for future reference

## Key Metrics Dashboard

**Daily Dashboard (for ops team):**
- Pending reviews count (target: <10)
- Auto-approve rate (target: 45–55%)
- Auto-reject rate (target: 15–25%)
- Manual review rate (target: 25–35%)
- Queue SLA (target: <24 hours median)
- False positive rate (target: <1%)

**Weekly/Monthly Reports:**
- Decision distribution over time
- Confidence score trends
- False positive/negative analysis
- Heuristic adjustments made
- Escalation incidents

## Contacts & Escalation

**Primary Contact:** Operations Manager  
**Secondary Contact:** Dev Team Lead (for heuristic changes)  
**Escalation Path:**
1. Local decision (operator) → 2. Team lead → 3. Management

**Contacts:**
- Ops Manager: [email]
- Dev Lead: [email]
- Admin Dashboard: https://dogtrainersdirectory.com.au/admin

## Appendix: Key Files

- `src/lib/moderation.ts` — Core heuristics and auto-decision logic
- `src/app/api/admin/moderation/run/route.ts` — Automated job endpoint
- `src/app/admin/page.tsx` — Admin dashboard UI (moderation queue)
- `DOCS/automation/moderation_heuristics_v1.md` — Detailed heuristics documentation

---

**Document Version:** 1.0  
**Last Reviewed:** December 2025  
**Next Review:** January 2026
