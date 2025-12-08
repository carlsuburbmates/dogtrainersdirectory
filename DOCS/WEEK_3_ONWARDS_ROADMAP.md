# Implementation Roadmap: Week 3 & Beyond
## DTD (dogtrainersdirectory.com.au) - Priority 3-6 Phases

**Status:** 🟢 Planning Phase
**Date:** December 8, 2025
**Based on:** Completed Week 1-2 (LLM Integration + Data Validation)

---

## Executive Summary

**Completed (Week 1-2):**
- ✅ Z.ai LLM provider integration with health checks
- ✅ Search telemetry tracking
- ✅ Data validation and normalization middleware
- ✅ Infrastructure health monitoring

**Planned (Week 3-8):**
- Priority 3: Error Logging & Monitoring
- Priority 4: AI Automation (Emergency Triage + Verification)
- Priority 5: Admin Automation (Moderation + Digest)
- Priority 6: Deployment & Optimization

---

## Priority Matrix

| # | Priority | Phase | Focus | Timeline | Status |
|---|----------|-------|-------|----------|--------|
| 1 | LLM Integration | Week 1 | Z.ai API, Health Checks | ✅ Complete | Done |
| 2 | Data Validation | Week 2 | Normalization, Validation, Health | ✅ Complete | Done |
| 3 | Error Logging | Week 3 | Structured Logging, Error Dashboard | ⏳ Next | Planning |
| 4 | AI Automation A-B | Week 4 | Emergency Triage, Medical Detection | ⏳ Planned | Queued |
| 4 | AI Automation C-F | Week 5 | Verification, Crisis Detection, Moderation | ⏳ Planned | Queued |
| 5 | Admin Automation | Week 6 | Daily Digest, Moderation Queue, Analytics | ⏳ Planned | Queued |
| 6 | Deployment | Week 7-8 | Testing, Optimization, Launch Prep | ⏳ Planned | Queued |

---

## Priority 3: Error Logging & Monitoring (Week 3)

### Objective
Implement structured error logging, error dashboards, and comprehensive system observability.

### Components

#### 3.1 Structured Error Logging
**File:** `/src/lib/errorLog.ts`
- JSON-structured error logging (timestamp, level, context, stack trace)
- Severity levels: DEBUG, INFO, WARN, ERROR, CRITICAL
- Automatic context collection (user_id, session_id, api_route)
- Stack trace capture with source mapping

**Key Functions:**
```typescript
logError(error, context, severity)
logAPIError(route, method, statusCode, error)
logValidationError(field, error, userInput)
logLLMError(prompt, response, latency)
```

#### 3.2 Error Metrics Dashboard
**File:** `/src/app/api/admin/errors/route.ts`
- Real-time error rate by endpoint
- Error frequency by severity
- LLM error classification (API timeout, rate limit, invalid response)
- Top 10 errors (by frequency)

**Metrics Tracked:**
- Errors per minute (trend)
- Error type distribution (pie chart)
- Affected user percentage
- Mean time to recovery (MTTR)

#### 3.3 Error Alerting
**File:** `/src/lib/errorAlerts.ts`
- Alert threshold definitions
- Notification triggers (email, Slack, dashboard)
- Alert cooldown (prevent notification spam)
- Alert history and acknowledgement

**Alert Types:**
- High error rate (>5 errors/min for 5+ min)
- Critical errors (severity=CRITICAL)
- LLM provider downtime (health=down)
- Database connectivity issues

#### 3.4 Error Detail API
**File:** `/src/app/api/admin/errors/[errorId]/route.ts`
- Fetch detailed error information
- Related errors (similar patterns)
- User impact analysis
- Suggested fixes (if available)

### Integration Points
- `/src/lib/api.ts` - Log all API errors
- `/src/lib/llm.ts` - Log LLM provider errors
- `/src/middleware/validation.ts` - Log validation errors
- Error boundary component - Client-side error capture

### Deliverables
- Error logging utility library
- Error metrics API endpoint
- Admin dashboard component for error monitoring
- Documentation (usage guide + alert setup)

### Success Criteria
- [ ] All API errors logged with full context
- [ ] LLM errors classified and tracked
- [ ] Error dashboard shows real-time metrics
- [ ] Alert system sends notifications for critical errors
- [ ] Error history retained for 30 days

---

## Priority 4: AI Automation Phases A-F (Week 4-5)

### Objective
Implement autonomous AI workflows for emergency triage, resource verification, and intelligent moderation.

### Phase A: Emergency Triage Classification (Week 4)

**File:** `/src/lib/emergencyTriage.ts`

**Workflow:**
1. User submits through "Emergency Help" form
2. LLM classifies: Medical, Stray, Crisis Training, Other
3. Route to appropriate resource queue
4. Log classification + confidence score

**LLM Prompt:**
```
You are an emergency dispatcher for dog owners. Classify the following emergency:
[user message]

Respond in JSON:
{
  "classification": "medical|stray|crisis_training|other",
  "confidence": 0.85,
  "summary": "brief description",
  "recommended_action": "vet|shelter|trainer|...",
  "urgency": "immediate|urgent|moderate|low"
}
```

**Database Tables:**
- `emergency_triage_logs` (classification history)
- `emergency_triage_metrics` (daily stats)

**Success Criteria:**
- [ ] Classification accuracy >85%
- [ ] Response time <2 seconds
- [ ] All message types classified

---

### Phase B: Medical Detection Sub-classifier (Week 4)

**File:** `/src/lib/medicalDetector.ts`

**Purpose:** Identify medical emergencies requiring 24-hour vet

**LLM Prompt:**
```
You are a veterinary triage assistant. Analyze this dog emergency:
[emergency description]

Is this medically urgent? (requires immediate vet)
Respond in JSON:
{
  "is_medical": true|false,
  "severity": "life_threatening|serious|moderate|minor",
  "symptoms": ["symptom1", "symptom2"],
  "recommended_resources": ["24hr_vet", "poison_control", ...],
  "vet_wait_time_critical": true|false
}
```

**Integration:**
- Called when emergency_classification = "medical"
- Routes to 24-hour vet list if is_medical=true

---

### Phase C: Resource Verification (Week 5)

**File:** `/src/lib/resourceVerifier.ts`

**Daily Verification Job** (runs 12 AM UTC):
```
1. Query all active emergency resources
2. For each resource:
   a. If phone: Attempt call, log response time
   b. If website: Check HTTP 200, verify open hours
   c. If email: Send test request, check bounce
3. Log results to emergency_resource_verification_runs
4. Update resource.is_verified + last_verified_at
5. Alert admin if >5% resources offline
```

**Database Tables:**
- `emergency_resource_verification_runs` (daily runs)
- `emergency_resource_verification_events` (per-resource results)

**Success Criteria:**
- [ ] Daily verification runs automatically
- [ ] 95%+ resources verified within 24 hours
- [ ] Offline resources marked for admin review
- [ ] Alerts sent for critical resource downtime

---

### Phase D: Crisis Training Detection (Week 5)

**File:** `/src/lib/crisisDetector.ts`

**Purpose:** Identify behavioral emergencies requiring crisis trainer

**LLM Prompt:**
```
You are a dog behavior crisis expert. Analyze this emergency:
[emergency description]

Is this a behavioral/aggression crisis requiring immediate trainer intervention?
Respond in JSON:
{
  "is_crisis": true|false,
  "crisis_type": "aggression|extreme_fear|unknown_behavior|other",
  "dangerousness_level": 1-10,
  "immediate_actions": ["action1", "action2"],
  "recommended_trainer_type": "crisis_specialist|general_trainer|board_stay"
}
```

**Integration:**
- Called when emergency_classification = "crisis_training"
- Filters to trainers with behavior_issues matching crisis_type

---

### Phase E: AI Review Decision Logging (Week 5)

**File:** `/src/lib/aiReviewLogger.ts`

**Purpose:** Log all AI decisions for audit + training

**Data Logged:**
```typescript
{
  decision_id: string,
  decision_type: "triage|verification|moderation|review",
  ai_provider: "z.ai",
  prompt: string,
  response: JSON,
  confidence: 0.85,
  human_override: boolean,
  override_reason: string,
  timestamp: datetime,
  duration_ms: number
}
```

**Database Table:** `ai_review_decisions`

**Uses:**
- Audit trail for compliance
- Model performance tracking
- Human-in-the-loop training data
- Decision reversal tracking

---

### Phase F: Admin Interface for AI Decisions (Week 5)

**File:** `/src/app/api/admin/ai-decisions/route.ts`

**Endpoints:**
- `GET /api/admin/ai-decisions` - List recent AI decisions
- `GET /api/admin/ai-decisions/[id]` - Detailed decision view
- `POST /api/admin/ai-decisions/[id]/override` - Log human override
- `GET /api/admin/ai-decisions/stats` - Decision accuracy by type

**Dashboard Components:**
- AI decision log with filters (type, confidence, date)
- Decision confidence distribution (histogram)
- Human override rate (should be <5%)
- Model performance trend

---

## Priority 5: Admin Automation (Week 6)

### Objective
Implement AI-assisted admin operations: daily digest, moderation queue, automated reviews.

### Phase 5.1: Daily Operations Digest

**File:** `/src/lib/dailyDigest.ts`

**Scheduled Job** (runs 6 AM UTC):
```
1. Fetch yesterday's metrics:
   - New trainers registered
   - New emergency submissions
   - System health status
   - Top errors + resolutions
   - Verification runs completed
   
2. Generate LLM summary:
   Prompt: "Summarize yesterday's operations..."
   Response: Structured markdown summary
   
3. Email digest to admin
4. Store in daily_ops_digests table
```

**Database Table:** `daily_ops_digests`

**Email Content:**
- Executive summary (1-2 sentences)
- Key metrics (new registrations, emergencies handled)
- System health (% uptime, error rate)
- Alerts (if any)
- Recommendations (LLM-generated)

### Phase 5.2: Moderation Queue Automation

**File:** `/src/lib/moderationQueue.ts`

**Workflow:**
1. New review submitted (1-5 stars + text)
2. LLM analyzes for spam/abuse (confidence >0.95)
3. Auto-approve if safe, queue for manual review if questionable
4. Spam auto-rejected with audit log

**LLM Prompt:**
```
Analyze this review for spam/abuse:
[review text]

Is this a legitimate review? (not spam, abuse, or bot)
Respond in JSON:
{
  "is_legitimate": true|false,
  "spam_score": 0-1,
  "spam_type": "spam|abuse|bot|legitimate",
  "reason": "..."
}
```

**Database Table:** `moderation_queue` + `ai_review_decisions` (audit)

### Phase 5.3: Review Auto-Approval

**File:** `/src/lib/autoApproveReviews.ts`

**Criteria for Auto-Approval:**
- Spam score <0.05 (legitimate)
- No prohibited words detected
- Reviewer account age >7 days
- Reviewer not flagged for abuse

**Workflow:**
1. Check auto-approval criteria
2. If all pass: Auto-approve (mark as verified)
3. If any fail: Queue for manual review
4. Log decision to ai_review_decisions

**Success Criteria:**
- [ ] >80% reviews auto-approved
- [ ] <0.1% false positive rate (legitimate reviews rejected)
- [ ] All auto-rejected reviews have audit trail

### Phase 5.4: AI Monitoring Dashboard

**File:** `/src/app/api/admin/ai-metrics/route.ts`

**Metrics Displayed:**
- Triage classification accuracy (vs actual outcomes)
- Resource verification success rate
- Review moderation accuracy
- Human override rate
- Average response time per AI task

**Charts:**
- AI decision accuracy trend (line chart)
- Decision type distribution (pie chart)
- Confidence score distribution (histogram)
- Performance by LLM provider

---

## Priority 6: Deployment & Optimization (Week 7-8)

### Phase 6.1: Testing Infrastructure

**Test Coverage:**
- Unit tests for LLM provider (mocked responses)
- Integration tests for emergency triage (end-to-end)
- API tests for all new endpoints
- Load tests for health check endpoints

**Test Files:**
- `/__tests__/lib/llm.test.ts`
- `/__tests__/lib/emergencyTriage.test.ts`
- `/__tests__/api/admin/*.test.ts`

**Success Criteria:**
- [ ] >80% code coverage
- [ ] All critical paths tested
- [ ] No regressions in existing features

### Phase 6.2: Performance Optimization

**Profiling Targets:**
- LLM response time (target <2s for triage)
- Database query optimization (index on timestamps)
- Caching strategies (cache health checks, frequent queries)
- API rate limiting (prevent abuse)

**Optimization Tasks:**
- [ ] Add database indexes for frequent queries
- [ ] Implement caching for health check results
- [ ] Optimize LLM prompts (fewer tokens)
- [ ] Batch verification jobs (reduce API calls)

### Phase 6.3: Monitoring & Alerting Setup

**Infrastructure:**
- Datadog/New Relic for APM (Application Performance Monitoring)
- Alert rules for critical errors
- Dashboard for operations team
- Log aggregation (centralize all logs)

**Metrics to Monitor:**
- API latency (p50, p95, p99)
- Error rate by endpoint
- LLM provider health
- Database connection pool usage
- Memory usage (Node.js)

### Phase 6.4: Documentation & Release

**Documentation:**
- Admin guide (how to use new features)
- API documentation (new endpoints)
- Troubleshooting guide (common errors)
- Runbook for incident response

**Pre-Launch Checklist:**
- [ ] All tests passing
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Staging environment validated
- [ ] Rollback procedure documented

---

## Implementation Timeline

| Week | Priority | Component | Time Est. | Status |
|------|----------|-----------|-----------|--------|
| 1 | 1 | LLM Provider + Telemetry | 8h | ✅ Done |
| 2 | 2 | Data Validation + Health | 8h | ✅ Done |
| 3 | 3 | Error Logging & Dashboard | 8h | ⏳ Next |
| 4 | 4A-B | Emergency Triage + Medical | 12h | Queued |
| 5 | 4C-F | Verification + Moderation | 12h | Queued |
| 6 | 5 | Admin Automation | 10h | Queued |
| 7-8 | 6 | Testing, Optimization, Deploy | 16h | Queued |

**Total:** 64 hours (8 work days)

---

## Code Organization

```
/src
├── /lib
│   ├── llm.ts (Week 1) ✅
│   ├── errorLog.ts (Week 3)
│   ├── errorAlerts.ts (Week 3)
│   ├── emergencyTriage.ts (Week 4)
│   ├── medicalDetector.ts (Week 4)
│   ├── resourceVerifier.ts (Week 5)
│   ├── crisisDetector.ts (Week 5)
│   ├── aiReviewLogger.ts (Week 5)
│   ├── dailyDigest.ts (Week 6)
│   ├── moderationQueue.ts (Week 6)
│   └── autoApproveReviews.ts (Week 6)
├── /middleware
│   └── validation.ts (Week 2) ✅
├── /utils
│   └── normalize.ts (Week 2) ✅
├── /app/api/admin
│   ├── /latency/route.ts (Week 1) ✅
│   ├── /health/route.ts (Week 2) ✅
│   ├── /errors/route.ts (Week 3)
│   ├── /errors/[errorId]/route.ts (Week 3)
│   ├── /ai-decisions/route.ts (Week 5)
│   ├── /ai-metrics/route.ts (Week 6)
│   └── /overview/route.ts (Week 2, modified) ✅
└── /__tests__
    └── [test files for all above]
```

---

## Database Migrations

**Already Applied (Weeks 1-2):**
- `search_telemetry` table with RLS
- Indexes on search_telemetry

**Planned (Weeks 3-6):**
- `error_logs` table
- `emergency_triage_logs` table
- `emergency_triage_metrics` table
- `emergency_resource_verification_runs` table
- `emergency_resource_verification_events` table
- `ai_review_decisions` table
- `daily_ops_digests` table
- `moderation_queue` table (if not exists)

---

## Success Metrics

### Week 3 (Error Logging)
- [ ] All errors logged to database
- [ ] Error dashboard shows real-time metrics
- [ ] Alerts trigger for high error rates

### Week 4 (AI Automation A-B)
- [ ] Emergency triage classification >85% accurate
- [ ] Response time <2 seconds
- [ ] Medical vs non-medical correctly identified

### Week 5 (AI Automation C-F)
- [ ] Resource verification runs daily
- [ ] 95%+ resources verified
- [ ] Review moderation >80% auto-approved
- [ ] Human override rate <5%

### Week 6 (Admin Automation)
- [ ] Daily digest sent at 6 AM UTC
- [ ] Moderation queue processes 100+ reviews/day
- [ ] Admin dashboard shows accurate metrics

### Week 7-8 (Deployment)
- [ ] >80% code coverage
- [ ] Load tests pass (100 req/s)
- [ ] Zero regressions in existing features
- [ ] Production monitoring active

---

## Dependencies & Blockers

### No Blockers ✅
- All Week 1-2 work completed
- LLM provider stable and tested
- Database schema supports new tables
- Environment variables configured

### Dependencies
- Week 3 → Week 4 (error logging used by triage)
- Week 4 → Week 5 (triage logs used for metrics)
- Week 5 → Week 6 (decisions feed admin dashboard)
- Week 6 → Week 7 (all features tested before deploy)

---

## Risk Mitigation

### Risk 1: LLM Provider Overload
**Mitigation:**
- Rate limiting (5 req/s per user)
- Queue system for batch jobs
- Fallback to cached responses

### Risk 2: Database Query Performance
**Mitigation:**
- Proper indexing on timestamp, type columns
- Pagination (100 results max)
- Archive old logs (>30 days)

### Risk 3: False Positive Moderation
**Mitigation:**
- Confidence threshold >0.95 for auto-approval
- Human review queue for borderline cases
- Regular retraining on false positives

---

## Next Steps

### Immediate (This Week)
1. Review this roadmap with stakeholders
2. Create detailed spec for Priority 3 (Error Logging)
3. Begin Week 3 implementation

### Week 3 Start
1. Create `/src/lib/errorLog.ts`
2. Create error logging API endpoints
3. Integrate logging into existing code
4. Build admin dashboard component
5. Document error logging system

---

## Rollback & Contingency

If any priority encounters blockers:
1. **Week 3 fails:** Skip to Week 4 (AI automation can work without error logging)
2. **Week 4 fails:** Use manual triaging as fallback (slower but works)
3. **Week 5 fails:** Disable verification automation, use manual checks
4. **Week 6 fails:** Release without admin automation (still functional)
5. **Week 7-8 fails:** Delay launch 1 week, but core features still work

**Key Point:** All priorities build on prior work but don't block each other.

---

## Success Definition

**Complete Implementation:** All 6 priorities delivered on schedule with:
- ✅ LLM integration working reliably
- ✅ Data quality validated at input layer
- ✅ All errors tracked and alerting
- ✅ Emergency triage automated with high accuracy
- ✅ Admin operations AI-assisted
- ✅ Full test coverage + monitoring in place
- ✅ Documentation complete for team

**Launch Ready:** System can handle 100+ emergencies/day with <1% manual admin intervention

---

**Last Updated:** December 8, 2025  
**Next Review:** After Week 3 completion