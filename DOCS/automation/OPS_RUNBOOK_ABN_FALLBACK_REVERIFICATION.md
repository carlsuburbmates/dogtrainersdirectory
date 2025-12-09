# Operations Runbook: ABN Fallback & Re-Verification

Last Updated: December 2025  
Owner: Operations Team  
Audience: Admins, Support  
Severity: Medium

## Overview

This runbook describes procedures when ABN API verification fails or is inconclusive, and the scheduled re-verification process. It complements the canonical ABN/ABR guide in `DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md` and the rollout checklist.

## Fallback Flow (Manual)

Trigger: User attempts ABN verification and result is `name_mismatch`, `inactive`, or `not_found`.

1. System prompts for fallback evidence upload:
   - Accepted: ABN certificate PDF, business registration screenshot, recent invoice with ABN
   - Redact PII except business name and ABN
2. User uploads evidence → creates `abn_fallback_submissions` row with status `pending_review`.
3. Ops reviews evidence:
   - If matches claimed business name ≥85% similarity → mark `verified_manual`
   - If mismatch but legitimate trading name → set `verified_manual` with note
   - If invalid → `rejected`
4. System updates trainer profile `abn_verified` accordingly; audit row in `ai_review_decisions` equivalent table for verification.

## Re-Verification (Scheduled)

- Weekly job checks `abn_verified` profiles older than 180 days.
- Calls ABR API using `ABR_GUID`.
- If ABN inactive or name diverges <70% match:
  - Mark profile `abn_status='attention'`
  - Send email to trainer to re-verify within 14 days

## Queries

- Pending fallbacks:
```sql
SELECT * FROM abn_fallback_submissions WHERE status = 'pending_review' ORDER BY created_at;
```

- Stale ABN verifications (>180 days):
```sql
SELECT id, business_id, abn, verified_at
FROM abn_verifications
WHERE status = 'verified' AND verified_at < NOW() - INTERVAL '180 days';
```

## Admin UI Guidance

- `/admin` → ABN queue card shows counts: pending, attention, rejected
- Each submission shows evidence preview; actions: Verify, Reject, Request More Info
- Bulk actions available for low-risk matches (>95% similarity)

## Troubleshooting

- ABR API errors: check `ABR_GUID` secret present; retry in 5 minutes
- High false mismatches: adjust similarity threshold in server code (e.g., 0.85 → 0.80 temporarily)

## Contacts

- Ops on-call: [email]
- Legal/Data: [email]
