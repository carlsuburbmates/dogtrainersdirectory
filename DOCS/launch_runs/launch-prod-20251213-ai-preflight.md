<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->
# Launch Run – production – 20251213

---
## AI Launch Gate – 2025-12-13T10:53:40.923Z (sha 02aede97e4385cb426a73c601f622ade8929a563, target staging)
- Commit: 02aede97e4385cb426a73c601f622ade8929a563
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 16 / WARN 2 / SKIP 10 / FAIL 0
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 46.2s | > dtd@1.0.0 verify:phase9b
> tsx scripts/verify_phase9b.ts

========================================
Phase 9B Verification Harness
========================================

[PASS] Environment Variables: All required vars present (3 checked)

[BUILD] Running npm run build...
[PASS] Build (npm run build): Next.js build succeeded

[TESTS] Running npm test...
[PASS] Tests (npm test): Tests passed (unknown tests)

[DB] Connecting to Supabase...
[PASS] Database Schema: All required tables present (payment_audit, business_subscription_status)


---

## Automated Verification Snapshot – Phase 9B

- **Date:** 2025-12-13T10:51:41.991Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 26.3s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 24.6s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 990[2mms[22m[39m
     [33m[2m✓[22m[39m caps override expiry to two hours by default [33m 528[2mms[22m[39m
     [33m[2m✓[22m[39m filters expired overrides when fetching [33m 455[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 2558[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 2424[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 3094[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 2997[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 3208[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 3128[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 3233[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 3104[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 3591[2mms[22m[39m
     … |
| smoke | PASS | 3.5s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 27[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 842[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 21:52:34
[2m   Duration [22m 2.19s[2m (transform 1.81s, setup 0ms, import 2.61s, tests 935ms, environment 3ms)[22m |
| e2e | PASS | 42.6s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (3.7s)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (6.8s)
  ✓  3 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (7.1s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (3.3s)
  ✓  4 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (10.4s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (933ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (425ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (9.2s)

  8 passed (40.4s) |
| preprod (staging) | PASS | 16.6s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 551[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 21:53:26
[2m   Duration [22m 1.27s[2m (transform 1.52s, setup 0ms, import 1.85s, tests 604ms, environment 1ms)[22m

[PASS] Smoke Tests
========================================
Running Lint

> dtd@1.0.0 lint
> eslint .

[PASS] Lint
========================================
Running Doc Divergence Detector
Doc Divergence Detector: all checks passed ✅
[PASS] Doc Divergence Detector
========================================
Running Env Ready Check
========================================
Run… |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 1.3s | No actionable alerts to report. |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.9s | {"missing":[]} |
| RLS status | PASS | 0.5s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.5s | {"missing":[],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.2s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","216.198.79.1"]} |
| DNS staging → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.65","64.29.17.65"]} |
| Production curl | PASS | 0.2s | HTTP/2 404 |
| Monetization flags (staging env) | PASS | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"1","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"1"} |
| Secrets alignment (.env vs Vercel) – item 4c | SKIP | 0.0s | {"reason":"Requires Vercel dashboard + secret rotation approvals."} |
| Stripe monetization drill – item 8b | SKIP | 0.0s | {"reason":"Live Stripe payment and webhook replay need human supervision."} |
| Production payouts + compliance review – item 9b | SKIP | 0.0s | {"reason":"Requires finance + compliance teams sign-off."} |
| Production admin toggles – item 10c | SKIP | 0.0s | {"reason":"Vercel/Stripe toggles enforced during final go/no-go."} |
| Stripe live upgrade path – item 10d | SKIP | 0.0s | {"reason":"Must be exercised with real card + observers."} |
| Stripe invoice sanity – item 10f | SKIP | 0.0s | {"reason":"Needs invoice PDF inspection + accounting approval."} |
| Production governance approvals – item 11b | SKIP | 0.0s | {"reason":"Board/governance approvals cannot be automated."} |
| Legal sign-off + comms – item 11c | SKIP | 0.0s | {"reason":"Requires legal + comms leads to sign launch docs."} |
| Production monetization flags – item 10e | SKIP | 0.0s | {"reason":"Needs Vercel production env inspect via MCP/browser."} |
| Production DNS evidence – item 11a | SKIP | 0.0s | {"reason":"Needs DNS provider screenshots/API (MCP) for production domain."} |

---
## AI Launch Gate – 2025-12-13T11:51:29.881Z (sha 73cc520f15c475447efce519e411510c51cbc9a3, target staging)
- Commit: 73cc520f15c475447efce519e411510c51cbc9a3
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 15 / WARN 1 / SKIP 11 / FAIL 1
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 24.9s | > dtd@1.0.0 verify:phase9b
> tsx scripts/verify_phase9b.ts

========================================
Phase 9B Verification Harness
========================================

[PASS] Environment Variables: All required vars present (3 checked)

[BUILD] Running npm run build...
[PASS] Build (npm run build): Next.js build succeeded

[TESTS] Running npm test...
[PASS] Tests (npm test): Tests passed (unknown tests)

[DB] Connecting to Supabase...
[PASS] Database Schema: All required tables present (payment_audit, business_subscription_status)


---

## Automated Verification Snapshot – Phase 9B

- **Date:** 2025-12-13T11:50:45.392Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 9.4s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 2.2s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 90[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 229[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 253[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 279[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 330[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 329[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 332[2mms[22m[39m
     [33m[2m✓[22m[39m stores matched_json parsed object and status=verified for Active ABN [33m 323[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 698[2mms[22m[39m
 [32m✓[39m test… |
| smoke | PASS | 1.7s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 578[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:50:57
[2m   Duration [22m 838ms[2m (transform 772ms, setup 0ms, import 1.08s, tests 640ms, environment 0ms)[22m |
| e2e | PASS | 13.5s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  2 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (781ms)
  ✓  3 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (2.3s)
  ✓  4 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (2.8s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (2.2s)
  ✓  1 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (5.3s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (503ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (388ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (6.3s)

  8 passed (12.5s) |
| preprod (staging) | PASS | 13.4s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 29[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 592[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:51:15
[2m   Duration [22m 1.38s[2m (transform 903ms, setup 0ms, import 1.24s, tests 663ms, environment 1ms)[22m

[PASS] Smoke Tests
========================================
Running Lint

> dtd@1.0.0 lint
> eslint .

[PASS] Lint
========================================
Running Doc Divergence Detector
Doc Divergence Detector: all checks passed ✅
[PASS] Doc Divergence Detector
========================================
Running Env Ready Check
========================================
Run… |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 0.8s | No actionable alerts to report. |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | FAIL | 0.3s | WARN not allowed for ABN fallback rate |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.5s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.5s | {"missing":[],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","216.198.79.1"]} |
| DNS staging preview model | SKIP | 0.0s | Staging uses Vercel Preview deployments; no staging subdomain by design. |
| Production curl | PASS | 0.1s | HTTP/2 404 |
| Monetization flags (staging env) | PASS | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"1","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"1"} |
| Secrets alignment (.env vs Vercel) – item 4c | SKIP | 0.0s | {"reason":"Requires Vercel dashboard + secret rotation approvals."} |
| Stripe monetization drill – item 8b | SKIP | 0.0s | {"reason":"Live Stripe payment and webhook replay need human supervision."} |
| Production payouts + compliance review – item 9b | SKIP | 0.0s | {"reason":"Requires finance + compliance teams sign-off."} |
| Production admin toggles – item 10c | SKIP | 0.0s | {"reason":"Vercel/Stripe toggles enforced during final go/no-go."} |
| Stripe live upgrade path – item 10d | SKIP | 0.0s | {"reason":"Must be exercised with real card + observers."} |
| Stripe invoice sanity – item 10f | SKIP | 0.0s | {"reason":"Needs invoice PDF inspection + accounting approval."} |
| Production governance approvals – item 11b | SKIP | 0.0s | {"reason":"Board/governance approvals cannot be automated."} |
| Legal sign-off + comms – item 11c | SKIP | 0.0s | {"reason":"Requires legal + comms leads to sign launch docs."} |
| Production monetization flags – item 10e | SKIP | 0.0s | {"reason":"Needs Vercel production env inspect via MCP/browser."} |
| Production DNS evidence – item 11a | SKIP | 0.0s | {"reason":"Needs DNS provider screenshots/API (MCP) for production domain."} |

---
## AI Launch Gate – 2025-12-13T11:55:56.958Z (sha 73cc520f15c475447efce519e411510c51cbc9a3, target staging)
- Commit: 73cc520f15c475447efce519e411510c51cbc9a3
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 15 / WARN 1 / SKIP 11 / FAIL 1
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 16.3s | > dtd@1.0.0 verify:phase9b
> tsx scripts/verify_phase9b.ts

========================================
Phase 9B Verification Harness
========================================

[PASS] Environment Variables: All required vars present (3 checked)

[BUILD] Running npm run build...
[PASS] Build (npm run build): Next.js build succeeded

[TESTS] Running npm test...
[PASS] Tests (npm test): Tests passed (unknown tests)

[DB] Connecting to Supabase...
[PASS] Database Schema: All required tables present (payment_audit, business_subscription_status)


---

## Automated Verification Snapshot – Phase 9B

- **Date:** 2025-12-13T11:55:08.740Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 5.7s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 2.7s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 126[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 272[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 314[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 304[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 318[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 317[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 331[2mms[22m[39m
     [33m[2m✓[22m[39m stores matched_json parsed object and status=verified for Active ABN [33m 317[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 346[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 320[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 120[2mm… |
| smoke | PASS | 1.9s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 859[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:55:17
[2m   Duration [22m 1.32s[2m (transform 1.45s, setup 0ms, import 2.06s, tests 930ms, environment 1ms)[22m |
| e2e | PASS | 19.1s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (3.8s)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (5.9s)
  ✓  3 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (6.1s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (3.0s)
  ✓  4 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (9.2s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (660ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (403ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (7.9s)

  8 passed (18.1s) |
| preprod (staging) | PASS | 14.9s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 670[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:55:43
[2m   Duration [22m 1.36s[2m (transform 1.05s, setup 0ms, import 1.48s, tests 733ms, environment 1ms)[22m

[PASS] Smoke Tests
========================================
Running Lint

> dtd@1.0.0 lint
> eslint .

[PASS] Lint
========================================
Running Doc Divergence Detector
Doc Divergence Detector: all checks passed ✅
[PASS] Doc Divergence Detector
========================================
Running Env Ready Check
========================================
Run… |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 0.7s | No actionable alerts to report. |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | FAIL | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":0,"fallbackCount7d":2,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.4s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.4s | {"missing":[],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","216.198.79.1"]} |
| DNS staging preview model | SKIP | 0.0s | Staging uses Vercel Preview deployments; no staging subdomain by design. |
| Production curl | PASS | 0.1s | HTTP/2 404 |
| Monetization flags (staging env) | PASS | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"1","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"1"} |
| Secrets alignment (.env vs Vercel) – item 4c | SKIP | 0.0s | {"reason":"Requires Vercel dashboard + secret rotation approvals."} |
| Stripe monetization drill – item 8b | SKIP | 0.0s | {"reason":"Live Stripe payment and webhook replay need human supervision."} |
| Production payouts + compliance review – item 9b | SKIP | 0.0s | {"reason":"Requires finance + compliance teams sign-off."} |
| Production admin toggles – item 10c | SKIP | 0.0s | {"reason":"Vercel/Stripe toggles enforced during final go/no-go."} |
| Stripe live upgrade path – item 10d | SKIP | 0.0s | {"reason":"Must be exercised with real card + observers."} |
| Stripe invoice sanity – item 10f | SKIP | 0.0s | {"reason":"Needs invoice PDF inspection + accounting approval."} |
| Production governance approvals – item 11b | SKIP | 0.0s | {"reason":"Board/governance approvals cannot be automated."} |
| Legal sign-off + comms – item 11c | SKIP | 0.0s | {"reason":"Requires legal + comms leads to sign launch docs."} |
| Production monetization flags – item 10e | SKIP | 0.0s | {"reason":"Needs Vercel production env inspect via MCP/browser."} |
| Production DNS evidence – item 11a | SKIP | 0.0s | {"reason":"Needs DNS provider screenshots/API (MCP) for production domain."} |

---
## AI Launch Gate – 2025-12-13T12:00:11.190Z (sha 73cc520f15c475447efce519e411510c51cbc9a3, target staging)
- Commit: 73cc520f15c475447efce519e411510c51cbc9a3
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 16 / WARN 1 / SKIP 11 / FAIL 0
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 13.2s | > dtd@1.0.0 verify:phase9b
> tsx scripts/verify_phase9b.ts

========================================
Phase 9B Verification Harness
========================================

[PASS] Environment Variables: All required vars present (3 checked)

[BUILD] Running npm run build...
[PASS] Build (npm run build): Next.js build succeeded

[TESTS] Running npm test...
[PASS] Tests (npm test): Tests passed (unknown tests)

[DB] Connecting to Supabase...
[PASS] Database Schema: All required tables present (payment_audit, business_subscription_status)


---

## Automated Verification Snapshot – Phase 9B

- **Date:** 2025-12-13T11:59:47.277Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 4.1s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.3s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 31[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 90[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 136[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 132[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 154[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 171[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/unit/verifyLaunch… |
| smoke | PASS | 1.0s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 450[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:59:52
[2m   Duration [22m 642ms[2m (transform 390ms, setup 0ms, import 516ms, tests 483ms, environment 1ms)[22m |
| e2e | PASS | 7.6s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (318ms)
  ✓  4 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (1.6s)
  ✓  2 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (1.8s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (2.4s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (845ms)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (373ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (283ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (3.5s)

  8 passed (7.0s) |
| preprod (staging) | PASS | 6.2s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 400[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 23:00:02
[2m   Duration [22m 625ms[2m (transform 332ms, setup 0ms, import 484ms, tests 429ms, environment 0ms)[22m

[PASS] Smoke Tests
========================================
Running Lint

> dtd@1.0.0 lint
> eslint .

[PASS] Lint
========================================
Running Doc Divergence Detector
Doc Divergence Detector: all checks passed ✅
[PASS] Doc Divergence Detector
========================================
Running Env Ready Check
========================================
Runni… |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 0.6s | No actionable alerts to report. |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":8,"fallbackCount7d":2,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.5s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.5s | {"missing":[],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.0s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","216.198.79.1"]} |
| DNS staging preview model | SKIP | 0.0s | Staging uses Vercel Preview deployments; no staging subdomain by design. |
| Production curl | PASS | 0.1s | HTTP/2 404 |
| Monetization flags (staging env) | PASS | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"1","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"1"} |
| Secrets alignment (.env vs Vercel) – item 4c | SKIP | 0.0s | {"reason":"Requires Vercel dashboard + secret rotation approvals."} |
| Stripe monetization drill – item 8b | SKIP | 0.0s | {"reason":"Live Stripe payment and webhook replay need human supervision."} |
| Production payouts + compliance review – item 9b | SKIP | 0.0s | {"reason":"Requires finance + compliance teams sign-off."} |
| Production admin toggles – item 10c | SKIP | 0.0s | {"reason":"Vercel/Stripe toggles enforced during final go/no-go."} |
| Stripe live upgrade path – item 10d | SKIP | 0.0s | {"reason":"Must be exercised with real card + observers."} |
| Stripe invoice sanity – item 10f | SKIP | 0.0s | {"reason":"Needs invoice PDF inspection + accounting approval."} |
| Production governance approvals – item 11b | SKIP | 0.0s | {"reason":"Board/governance approvals cannot be automated."} |
| Legal sign-off + comms – item 11c | SKIP | 0.0s | {"reason":"Requires legal + comms leads to sign launch docs."} |
| Production monetization flags – item 10e | SKIP | 0.0s | {"reason":"Needs Vercel production env inspect via MCP/browser."} |
| Production DNS evidence – item 11a | SKIP | 0.0s | {"reason":"Needs DNS provider screenshots/API (MCP) for production domain."} |

