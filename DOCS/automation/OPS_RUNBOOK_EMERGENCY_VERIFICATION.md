# Operations Runbook: Emergency Resource Verification

Last Updated: December 2025  
Owner: Operations Team  
Audience: Administrators, On-call  
Severity: High (affects safety-critical content)

## Overview

This runbook covers the verification process for emergency resources (24/7 vets, shelters, animal control), ensuring contact information is valid and current. Verification runs daily via cron and can be triggered manually.

## System Components

- Endpoint: POST/GET `/api/emergency/verify` (cron and manual)
- Tables: `emergency_resources`, `emergency_resource_verification_runs`, `emergency_resource_verification_events`
- Admin UI: `/admin` → Emergency verification queue (stale/failing resources)
- Scheduled Cron: `vercel.json` → `0 0 * * *`

## Daily Flow

1. Cron triggers `/api/emergency/verify` with GET
2. Endpoint fetches all active `emergency_resources`
3. For each resource:
   - Check phone format (deterministic) and/or AI assessment when enabled
   - Optional HTTP HEAD/GET to `website` (lightweight reachability)
   - Write a row to `emergency_resource_verification_events`
4. Aggregate results into `emergency_resource_verification_runs` (counts of success/fail)
5. Admin dashboard surfaces failing or stale resources

## Manual Trigger

```bash
curl -X POST https://dogtrainersdirectory.com.au/api/emergency/verify \
  -H "Content-Type: application/json" \
  -d '{"resourceId":"<uuid>","phone":"<opt>","website":"<opt>"}'
```

## Triage Guidance

- Failing resource with invalid phone + dead website:
  - Mark as `needs_review`
  - Attempt alternate contact (if known)
  - If unresolved for >14 days, set `active=false` and add note

- Failing resource with valid website but invalid phone:
  - Visit site to confirm correct phone, update in DB

- Failing resource with valid phone but 404 website:
  - Keep active; treat website as optional, attempt to find correct site or social profile

## SLA

- Daily verification must complete within 20 minutes
- Failing resources should be reviewed within 48 hours

## Alerts

- If >10% of resources fail in a single run → escalate
- If cron misses a day (no runs in 24h) → escalate

## Queries

- Last run summary:
```sql
SELECT * FROM emergency_resource_verification_runs 
ORDER BY created_at DESC LIMIT 1;
```

- Failing resources past 7 days:
```sql
SELECT resource_id, COUNT(*) fails
FROM emergency_resource_verification_events
WHERE is_valid = false AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY resource_id
ORDER BY fails DESC;
```

## Troubleshooting

- Cron not firing:
  - Check `vercel.json` and Vercel project logs
  - Verify project has `SUPABASE_SERVICE_ROLE_KEY` set

- Endpoint errors:
  - Check Supabase connection via `psql`
  - Validate `emergency_resources` schema (columns: id, phone, website, active)

- High false negatives (valid entries marked invalid):
  - Confirm AI mode → if `live`, review prompt/thresholds
  - Switch to deterministic mode temporarily

## Contacts

- Ops on-call: [email]
- Dev team: [email]
