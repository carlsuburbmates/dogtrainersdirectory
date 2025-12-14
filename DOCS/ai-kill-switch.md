# AI Kill-Switch Guide

## Overview

The Dog Trainers Directory uses AI across multiple automation pipelines. This guide explains how to disable AI (emergency kill-switch), test AI in shadow mode, and understand the behavior of each mode.

## Emergency: Disable All AI

To immediately stop all AI automation and fall back to deterministic rules:

```bash
AI_GLOBAL_MODE=disabled
```

Deploy this change to Vercel and the application will:
- Stop making LLM API calls
- Use deterministic heuristics for all decisions
- Log all decisions with `decision_source='deterministic'`
- Continue operating without interruption

**When to use:** AI costs are too high, LLM provider is down, or you want to test non-AI behavior.

---

## Shadow Mode (Testing)

To run AI without applying its decisions (logging only):

```bash
AI_GLOBAL_MODE=shadow
```

**Behavior:**
- LLM calls are made normally
- AI decisions are logged to the database
- Deterministic fallback is applied instead of AI recommendations
- Useful for A/B testing new prompts without risk

**Use case:** Testing a new prompt version or evaluating AI accuracy before going live.

---

## Per-Pipeline Control

You can override the global mode for specific pipelines:

```bash
# Global default
AI_GLOBAL_MODE=live

# Override only moderation
MODERATION_AI_MODE=disabled

# Override only triage to shadow
TRIAGE_AI_MODE=shadow
```

### Available Pipeline Overrides

| Environment Variable | Pipeline | Description |
|---------------------|----------|-------------|
| `TRIAGE_AI_MODE` | Emergency Triage | Classifies dog emergencies (medical/stray/crisis/normal) |
| `MODERATION_AI_MODE` | Review Moderation | Filters spam/profanity in reviews |
| `VERIFICATION_AI_MODE` | Resource Verification | Validates emergency resource contact info |
| `DIGEST_AI_MODE` | Ops Digest | Generates daily operations summaries |

---

## Mode Behavior Matrix

| Mode | LLM Called? | Decision Applied? | DB Logged? | Use Case |
|------|------------|-------------------|------------|----------|
| `live` | ✅ Yes | ✅ Yes | ✅ Yes | Production automation |
| `shadow` | ✅ Yes | ❌ No (uses fallback) | ✅ Yes | Testing/evaluation |
| `disabled` | ❌ No | ❌ No (uses fallback) | ✅ Yes (fallback logged) | Cost control / emergency |

---

## Expected Behavior Per Pipeline

### Emergency Triage (`TRIAGE_AI_MODE`)

**Live Mode:**
- LLM classifies emergencies into 4 categories
- Decision saved to `emergency_triage_logs` with `decision_source='llm'`

**Shadow Mode:**
- LLM classifies (logged)
- Deterministic keyword matching is applied
- `decision_source='deterministic'` in DB

**Disabled Mode:**
- Keyword matching only (e.g., "bleeding" → medical)
- `decision_source='deterministic'`

---

### Review Moderation (`MODERATION_AI_MODE`)

**Live Mode:**
- LLM analyzes review content
- Auto-approve, auto-reject, or flag for manual review
- Decision saved to `ai_review_decisions` with `decision_source='llm'`

**Shadow Mode:**
- LLM analyzes (logged)
- Deterministic spam filter applied (keyword blacklist)
- `decision_source='deterministic'`

**Disabled Mode:**
- Simple keyword filter only
- All reviews flagged for manual review if keywords match
- `decision_source='deterministic'`

---

### Resource Verification (`VERIFICATION_AI_MODE`)

**Live Mode:**
- LLM evaluates phone/website validity edge cases
- Recommendation applied
- Logged to `emergency_resource_verification_events` with `decision_source='llm'`

**Shadow Mode:**
- LLM evaluates (logged)
- Deterministic phone/URL checks applied
- `decision_source='deterministic'`

**Disabled Mode:**
- Phone format validation + HTTP HEAD request only
- `decision_source='deterministic'`

---

### Ops Digest (`DIGEST_AI_MODE`)

**Live Mode:**
- LLM generates daily summary prose
- Saved to `daily_ops_digests` with `decision_source='llm'`

**Shadow Mode:**
- LLM generates summary (logged)
- Fallback: "Daily metrics: X trainers, Y reviews. AI digest disabled."
- `decision_source='deterministic'`

**Disabled Mode:**
- Fallback summary only
- `decision_source='deterministic'`

---

## Deployment Steps

1. **Update Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add/Edit `AI_GLOBAL_MODE` (or pipeline-specific vars)
   - Select all environments (Production, Preview, Development)

2. **Redeploy** the application:
   - Trigger a new deployment (push to main or manual redeploy)
   - Env vars only take effect after redeployment

3. **Verify in Admin Dashboard**:
   - Navigate to `/admin/ai-health`
   - Check that "Mode" column shows the new values
   - Confirm decisions are being logged with correct `decision_source`

---

## Monitoring AI Mode Changes

After changing modes, monitor:

1. **Decision Source Distribution** (`/admin/ai-health`)
   - Should see shift from `llm` to `deterministic` when disabled
   
2. **Error Logs**
   - Watch for unexpected errors if deterministic fallback is broken

3. **Decision Quality**
   - In shadow mode, compare AI vs deterministic outcomes

---

## Rollback Plan

If disabling AI causes issues:

1. Revert env var to previous value
2. Redeploy
3. Check `/admin/ai-health` to confirm AI is active
4. Review logs for root cause

---

## FAQ

**Q: Will disabling AI break the application?**  
**A:** No. All pipelines have deterministic fallbacks that continue operating.

**Q: How much does it cost to run in shadow mode?**  
**A:** Same as live mode (LLM calls are made). Use `disabled` to eliminate costs.

**Q: Can I test a single pipeline in shadow mode?**  
**A:** Yes. Set `AI_GLOBAL_MODE=live` and override one pipeline, e.g., `TRIAGE_AI_MODE=shadow`.

**Q: How do I know if AI is actually disabled?**  
**A:** Check `/admin/ai-health` - the "Mode" column will show `disabled`. Also, no LLM API calls will appear in provider logs.

**Q: What happens to existing data when I change modes?**  
**A:** Nothing. Historical data remains unchanged. Only new decisions use the new mode.
