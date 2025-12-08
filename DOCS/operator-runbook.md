# Dog Trainers Directory - Operator Runbook

## Daily Operations Checklist (5 minutes)

### Morning Health Check

1. **Visit `/admin/cron-health`**
   - ✅ All jobs should show "healthy" status
   - ⚠️ If any job shows "warning" or "critical", investigate logs
   - 🔴 If moderation hasn't run in >20 min, trigger manually

2. **Visit `/admin/ai-health`**
   - ✅ Verify all pipelines show correct mode (usually `live`)
   - ✅ Check "AI %" column - should be >70% if AI is enabled
   - ⚠️ If AI % drops to 0%, check API keys / AI mode

3. **Check Email for Daily Ops Digest**
   - Should arrive at ~11pm daily
   - Review for anomalies (sudden spike in reviews, ABN failures, etc.)

---

## Manual Operations

### 1. Review Moderation

**When:** AI flags a review for manual review, or you need to override a decision.

**Steps:**
1. Open `/admin` and look at the **Pending Reviews** card.
2. Each row shows the AI decision + reasoning. Click **Approve** or **Reject**.
3. (Optional) enter a rejection reason when prompted.
4. Result is logged with `decision_source='manual_override'` and shown in `/admin/ai-health`.

**What happens:**
- Review's `is_approved` / `is_rejected` columns update immediately.
- A row is upserted in `ai_review_decisions` capturing provider, model, prompt version, etc.
- If Resend is configured, the submitter receives the usual notification.

---

### 2. Featured Placement Management

**When:** Need to demote/extend active placements or promote queued ones.

**Steps:**
1. Open `/admin` and scroll to **Featured Placements**.
2. Use the per-row buttons:
   - **Demote** removes an active slot immediately.
   - **Extend 30d** bumps expiry.
   - **Promote** activates the highest-priority queued slot.
   - **Run featured expiry now** triggers the automated sweep via `/api/admin/run/featured-expire`.

**What happens:**
- `featured_placements` rows update (active flag, expiry date).
- Events are inserted into `featured_placement_events` with `triggered_by='manual'` or `cron`.
- `/admin/cron-health` shows the manual run for auditing.

**Manual API trigger** (if UI not available):
```bash
curl -X POST https://your-domain.com/api/admin/featured/expire \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

### 3. Trigger Moderation Manually

**When:** Cron is delayed (>10 min) or you want immediate review triage.

**Steps:**
1. Open `/admin`.
2. Click **Run moderation now**. A toast confirms success/failure.
3. Check `/admin/cron-health` to ensure the run is recorded.

**Manual API trigger:**
```bash
curl -X POST https://your-domain.com/api/admin/moderation/run \
  -H "x-vercel-cron-secret: $CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "processedCount": 15,
  "autoApproved": 12,
  "autoRejected": 2,
  "manualReview": 1,
  "durationMs": 3421
}
```

### 4. Dashboards & Kill Switch

- `/admin/ai-health` shows AI vs deterministic counts, last success, and mode for each pipeline. Use it after changing `AI_*_MODE` env vars.
- `/admin/cron-health` lists the latest run for each scheduled job and surfaces warnings.
- **AI Kill Switch:** set `AI_GLOBAL_MODE=disabled` in Vercel envs to force deterministic fallbacks everywhere. Override per pipeline via `TRIAGE_AI_MODE`, `MODERATION_AI_MODE`, etc., then redeploy.

---

## Emergency Procedures

### Scenario 1: AI Cost Spike

**Symptoms:**
- Unexpected bill from LLM provider
- High API usage alerts

**Solution:**
```bash
# Immediate kill-switch
AI_GLOBAL_MODE=disabled
```

1. Update env var in Vercel dashboard
2. Redeploy application
3. Verify at `/admin/ai-health` - mode should show "disabled"
4. Investigate root cause (infinite loop? Wrong model? High traffic?)
5. Re-enable when safe: `AI_GLOBAL_MODE=live`

**Expected behavior:**
- LLM calls stop immediately
- All pipelines switch to deterministic fallbacks
- No data loss, no downtime

---

### Scenario 2: Database Migration Failure

**Symptoms:**
- 500 errors on API routes
- Logs show "column does not exist" errors

**Solution:**
```bash
# Roll back migration
cd ~/path/to/DTD
npx supabase db reset --linked
```

⚠️ **WARNING:** `db reset` wipes ALL data in local/staging. For production:

1. Go to Supabase Dashboard
2. Database → Backups
3. Restore previous backup
4. Contact admin to fix migration script

---

### Scenario 3: Cron Job Stuck

**Symptoms:**
- `/admin/cron-health` shows job status "running" for >10 minutes
- No new completions in `cron_job_runs` table

**Solution:**
1. Check Vercel function logs (Project → Logs → Filter by function name)
2. If timeout (>10s for serverless), increase timeout in `vercel.json`
3. If infinite loop, fix code and redeploy
4. Manually complete stuck job:

```sql
-- In Supabase SQL Editor
UPDATE cron_job_runs
SET status = 'failed',
    completed_at = NOW(),
    error_message = 'Manual termination - stuck job'
WHERE id = <stuck_run_id>;
```

---

### Scenario 4: Stripe Webhook Failure

**Symptoms:**
- Featured placements not activating after payment
- Errors in `webhook_events` table

**Solution:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Check recent deliveries for failures
3. Click "Resend" on failed events
4. If signature mismatch, verify `STRIPE_WEBHOOK_SECRET` env var
5. If persistent, check `/api/webhooks/stripe` logs in Vercel

---

## Weekly Tasks

### Monday Morning

- [ ] Review weekly triage summary (`emergency_triage_weekly_metrics`)
- [ ] Check accuracy percentage (should be >85%)
- [ ] If accuracy drops, investigate misclassified cases

### Friday Afternoon

- [ ] Review featured placement queue
- [ ] Ensure upcoming expirations have queued replacements
- [ ] Check for any manual review backlog

---

## Monitoring Dashboards

### Vercel (Performance)
- URL: `https://vercel.com/your-team/dtd`
- Check: Function execution times, errors, bandwidth usage
- Alert if: Any function >5s average, or >5% error rate

### Supabase (Database)
- URL: Database dashboard
- Check: Connection count, query performance, storage usage
- Alert if: Connections >80%, slow queries >1s

### Sentry (Error Tracking)
- URL: Sentry dashboard (if configured)
- Check: New errors, error frequency
- Alert if: New error type appears, or frequency spikes

---

## AI Mode Reference

| Mode | When to Use |
|------|-------------|
| `live` | Normal production operation |
| `shadow` | Testing new AI prompts / evaluating accuracy |
| `disabled` | Emergency cost control / provider outage |

**Change via:** Vercel env vars → Redeploy

---

## Common Issues & Solutions

### Issue: "Review not appearing in moderation queue"

**Cause:** Review already processed or doesn't meet criteria  
**Solution:** Check `ai_review_decisions` table for existing decision

### Issue: "AI Health shows 0% AI decisions"

**Cause 1:** AI mode set to `disabled`  
**Cause 2:** API keys missing/invalid  
**Solution:** Check `/admin/ai-health` mode column, verify env vars

### Issue: "Featured placement didn't auto-promote"

**Cause:** No queued placements available  
**Solution:** Check `featured_placements` table, ensure queue has entries

### Issue: "Cron job showing old timestamp"

**Cause:** Vercel cron not triggering (deployment issue)  
**Solution:** Redeploy, verify `vercel.json` cron config, check Vercel logs

---

## Escalation

**If you can't resolve an issue:**

1. **Check logs** (Vercel + Supabase)
2. **Search GitHub issues** for similar problems
3. **Contact tech lead** with:
   - Exact error message
   - Steps to reproduce
   - Affected user count
   - Timeline of issue

**Emergency contact:** [Your emergency contact info here]

---

## Useful Commands

### Trigger featured expiry manually
```bash
curl -X POST https://dtd.example.com/api/admin/featured/expire \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

### Trigger moderation manually
```bash
curl -X POST https://dtd.example.com/api/admin/moderation/run \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

### Check last 10 cron runs
```sql
SELECT job_name, started_at, status, duration_ms, error_message
FROM cron_job_runs
ORDER BY started_at DESC
LIMIT 10;
```

### Find failed AI decisions (last 24h)
```sql
SELECT pipeline, created_at, error_message
FROM ai_evaluation_runs  -- Or relevant decision table
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours';
```

---

## Maintenance Windows

**Recommended:** Deploy updates during low-traffic periods (2-4am AEST)

**Before deployment:**
1. Notify team in Slack
2. Set `MAINTENANCE_MODE=true` (if implemented)
3. Monitor error rates post-deploy
4. Rollback if errors spike >5%

**After deployment:**
1. Run smoke tests (`/admin/ai-health`, `/admin/cron-health`)
2. Check first cron execution
3. Monitor for 30 minutes
