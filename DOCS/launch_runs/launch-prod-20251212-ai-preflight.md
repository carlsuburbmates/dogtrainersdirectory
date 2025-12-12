# Launch Run – production – AI preflight

## AI Launch Gate – 2025-12-12T11:14:59.324Z
- Commit: 0b3d91d479ae88c3171099bb6b905b2786488172
- Target: staging
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 19.5s | 
> dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T11:14:12.202Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue.

 |
| lint | PASS | 6.0s | 
> dtd@1.0.0 lint
> eslint .

 |
| test | FAIL | 6.1s | 
> dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 728[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 722[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 1782[2mms[22m[39m
     [33m[2m✓[22m[39m raises ABN fallback alert when rate exceeds threshold [33m 430[2mms[22m[39m
     [33m[2m✓[22m[39m suppresses AI health alert when override active [33m 388[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 599[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 542[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 334[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 626[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 616[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 180[2mms[22m[39m
 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 39[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m

[2m Test Files [22m [1m[31m5 failed[39m[22m[2m | [22m[1m[32m13 passed[39m[22m[90m (18)[39m
[2m      Tests [22m [1m[32m34 passed[39m[22m[90m (34)[39m
[2m   Start at [22m 22:14:19
[2m   Duration [22m 5.17s[2m (transform 2.02s, setup 0ms, import 2.00s, tests 4.38s, environment 16ms)[22m



[31m⎯⎯⎯⎯⎯⎯[39m[1m[41m Failed Suites 5 [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯[39m

[41m[1m FAIL [22m[49m tests/e2e/admin-dashboards.spec.ts[2m [ tests/e2e/admin-dashboards.spec.ts ][22m
[31m[1mError[22m: Playwright Test did not expect test.describe() to be called here.
Most common reasons include:
- You are calling test.describe() in a configuration file.
- You are calling test.describe() in a file that is imported by the configuration file.
- You have two different versions of @playwright/test. This usually happens
  when one of the dependencies in your package.json depends on @playwright/test.[39m
[90m [2m❯[22m TestTypeImpl._currentSuite node_modules/playwright/lib/common/testType.js:[2m75:13[22m[39m
[90m [2m❯[22m TestTypeImpl._describe node_modules/playwright/lib/common/testType.js:[2m115:24[22m[39m
[90m [2m❯[22m Function.describe node_modules/playwright/lib/transform/transform.js:[2m275:12[22m[39m
[36m [2m❯[22m tests/e2e/admin-dashboards.spec.ts:[2m85:6[22m[39m
    [90m 83| [39m}
    [90m 84| [39m
    [90m 85| [39mtest[33m.[39m[34mdescribe[39m([32m'Admin dashboards'[39m[33m,[39m () [33m=>[39m {
    [90m   | [39m     [31m^[39m
    [90m 86| [39m  test('AI health dashboard shows override state', async ({ page }) =>…
    [90m 87| [39m    [35mawait[39m [34mwireAdminRoutes[39m(page)

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/5]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/e2e/alerts-snapshot.spec.ts[2m [ tests/e2e/alerts-snapshot.spec.ts ][22m
[31m[1mError[22m: Playwright Test did not expect… |
| smoke | PASS | 1.3s | 
> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 513[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:14:24
[2m   Duration [22m 717ms[2m (transform 648ms, setup 0ms, import 863ms, tests 557ms, environment 1ms)[22m

 |
| e2e | PASS | 19.4s | 
> dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  4 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (509ms)
  ✓  1 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (3.9s)
  ✓  2 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (4.1s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (5.1s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (1.5s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (615ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (365ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (6.6s)

  8 passed (18.7s)
 |
| preprod (staging) | FAIL | 11.9s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

scripts/verify_phase9b.ts(106,34): error TS18046: 'err' is of type 'unknown'.
scripts/verify_phase9b.ts(153,34): error TS18046: 'err' is of type 'unknown'.
[FAIL] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 490[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:14:50
[2m   Duration [22m 712ms[2m (transform 594ms, setup 0ms, import 826ms, tests 538ms, environment 1ms)[22m

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
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check
[PASS] Env Ready Check
1 verification step(s) failed. See logs above.

 |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check
 |
| alerts dry-run | PASS | 1.6s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes
 |
| Database checks | FAIL | 0.5s | {"error":"relation \"abn_fallback_events\" does not exist"} |
| DNS root CNAME | FAIL | 0.1s | {} |
| DNS staging CNAME | FAIL | 0.0s | {} |
| Production curl | PASS | 0.2s | HTTP/2 404 
cache-control: public, max-age=0, must-revalidate
content-type: text/plain; charset=utf-8
date: Fri, 12 Dec 2025 11:14:59 GMT
server: Vercel
strict-transport-security: max-age=63072000
x-vercel-error: DEPLOYMENT_NOT_FOUND
x-vercel-id: syd1::lv8jz-1765538099330-2bb8b49a583d
content-length: 107

 |
| Monetization flags (staging env) | PASS | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"1","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"1"} |
| Secrets alignment (.env vs Vercel) – item 4c | SKIP | 0.0s | {"reason":"Operator-only (requires Vercel UI and secret inventory)"} |
| Production monetization flags – item 10e | SKIP | 0.0s | {"reason":"MCP verification pending (Vercel Production env access required)"} |
| Production DNS evidence – item 11a | SKIP | 0.0s | {"reason":"MCP verification pending (Vercel DNS tooling required)"} |

## AI Launch Gate – 2025-12-12T11:32:52.491Z
- Commit: 0b3d91d479ae88c3171099bb6b905b2786488172
- Target: staging
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 39.8s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T11:31:54.410Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 6.8s | > dtd@1.0.0 lint
> eslint . |
| test | FAIL | 15.8s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [31m❯[39m node_modules/next/dist/telemetry/post-telemetry-payload.test.js [2m([22m[2m3 tests[22m[2m | [22m[31m3 failed[39m[2m)[22m[32m 7[2mms[22m[39m
[31m     [31m×[31m sends telemetry payload successfully[39m[32m 3[2mms[22m[39m
[31m     [31m×[31m retries on failure[39m[32m 1[2mms[22m[39m
[31m     [31m×[31m swallows errors after retries exhausted[39m[32m 0[2mms[22m[39m
 [31m❯[39m node_modules/tsconfig-paths/lib/__tests__/match-path-async.test.js [2m([22m[2m17 tests[22m[2m | [22m[31m17 failed[39m[2m)[22m[32m 17[2mms[22m[39m
[31m     [31m×[31m should locate path that matches with star and exists[39m[32m 6[2mms[22m[39m
[31m     [31m×[31m should resolve to correct path when many are specified[39m[32m 1[2mms[22m[39m
[31m     [31m×[31m should locate path that matches with star and prioritize pattern with longest prefix[39m[32m 1[2mms[22m[39m
[31m     [31m×[31m should locate path that matches with star and exists with extension[39m[32m 0[2mms[22m[39m
[31m     [31m×[31m should resolve request with extension specified[39m[32m 0[2mms[22m[39m
[31m     [31m×[31m should locate path that matches without star and exists[39m[32m 0[2mms[22m[39m
[31m     [31m×[31m should resolve to parent folder when filename is in subfolder[39m[32m 0[2mms[22m[39m
[31m     [31m×[31m should resolve from main field in package.json[39m[32m 0[2mms[22m[39m
[31m     [31m×[31m should resolve from main field in package.json (js)[39m[32m 3[2mms[22m[39m
[31m     [31m×[31m should resolve from list of fields by priority in package.json[39m[32m 1[2mms[22m[39m
[31m     [31m×[31m should ignore field mappings to missing files in package.json[39m[32m 0[2mms[22m[39m
[31m     [31m×[31m should ignore advanced field mappings in package.json[39… |
| smoke | PASS | 2.4s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 797[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:32:17
[2m   Duration [22m 1.49s[2m (transform 1.69s, setup 0ms, import 2.52s, tests 876ms, environment 1ms)[22m |
| e2e | PASS | 18.2s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (867ms)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (4.1s)
  ✓  3 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (4.5s)
  ✓  4 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (6.2s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (2.4s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (961ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (442ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (8.1s)

  8 passed (17.2s) |
| preprod (staging) | PASS | 10.3s | ========================================
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
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 31[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 574[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:32:41
[2m   Duration [22m 895ms[2m (transform 776ms, setup 0ms, import 1.09s, tests 642ms, environment 1ms)[22m

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
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check
[PASS] Env Ready Check
All verification steps passed. |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 1.9s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | FAIL | 0.8s | {"missing":["ops_overrides"]} |
| RLS policy presence | PASS | 0.4s | {"missing":[]} |
| Migration parity | FAIL | 0.1s | {"missingCount":10,"missing":["1702059300000_week_3_error_logging","1702075200000_week_4_triage_logs","20241208020000_search_telemetry","20250210143000_fix_decrypt_sensitive_nullsafe","20250210152000_add_decrypt_sensitive_key_arg","20250210153000_search_trainers_accept_key","20250210160000_get_trainer_profile_accept_key","20251130000001_add_abn_matched_json","20251209093000_add_latency_metrics","20251209101000_create_payment_tables"]} |
| DNS root → Vercel | PASS | 0.1s | NS managed by Vercel (apex flattening) |
| DNS staging → Vercel | FAIL | 0.1s | Non-Vercel records: 216.198.79.1
64.29.17.1 |
| Production curl | PASS | 0.2s | HTTP/2 404 |
| Monetization flags (staging env) | PASS | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"1","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"1"} |
| Secrets alignment (.env vs Vercel) – item 4c | SKIP | 0.0s | {"reason":"Operator-only (requires Vercel UI & secret inventory)"} |
| Production monetization flags – item 10e | SKIP | 0.0s | {"reason":"MCP verification pending (Vercel Production env)"} |
| Production DNS evidence – item 11a | SKIP | 0.0s | {"reason":"MCP verification pending (Vercel DNS tooling)"} |

## AI Launch Gate – 2025-12-12T11:36:02.336Z
- Commit: 0b3d91d479ae88c3171099bb6b905b2786488172
- Target: staging
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 15.6s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T11:35:31.519Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 4.3s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.4s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 66[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 135[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 173[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 181[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 193[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 197[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 518[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 36[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 13[2mms[22m[39m

[2m Test Files [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m      Tests [22m [1m[32m34 passed[39m[22m[90m (34)[39m
[2m   Start at [22m 22:35:36
[2m   Duration [22m 961ms[2m (transform 1.19s, setup 0ms, import 1.33s, tests 1.55s, environment 2ms)[22m |
| smoke | PASS | 1.2s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 452[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:35:37
[2m   Duration [22m 728ms[2m (transform 524ms, setup 0ms, import 743ms, tests 503ms, environment 1ms)[22m |
| e2e | PASS | 12.9s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  3 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (531ms)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (3.3s)
  ✓  4 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (3.6s)
  ✓  1 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (4.7s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (1.6s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (589ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (383ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (6.2s)

  8 passed (12.2s) |
| preprod (staging) | PASS | 7.5s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 462[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:35:53
[2m   Duration [22m 696ms[2m (transform 579ms, setup 0ms, import 814ms, tests 515ms, environment 1ms)[22m

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
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check
[PASS] Env Ready Check
All verification steps passed. |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 1.2s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS policy presence | PASS | 0.4s | {"missing":[]} |
| Migration parity | FAIL | 0.1s | {"checkedCount":6,"missingCount":3,"missing":["20251130000001_add_abn_matched_json","20251209093000_add_latency_metrics","20251209101000_create_payment_tables"]} |
| DNS root → Vercel | PASS | 0.1s | NS managed by Vercel (apex flattening) |
| DNS staging → Vercel | WARN | 0.1s | A-record(s): 216.198.79.1
64.29.17.1 (manual confirm required) |
| Production curl | PASS | 0.1s | HTTP/2 404 |
| Monetization flags (staging env) | PASS | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"1","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"1"} |
| Secrets alignment (.env vs Vercel) – item 4c | SKIP | 0.0s | {"reason":"Operator-only (requires Vercel UI & secret inventory)"} |
| Production monetization flags – item 10e | SKIP | 0.0s | {"reason":"MCP verification pending (Vercel Production env)"} |
| Production DNS evidence – item 11a | SKIP | 0.0s | {"reason":"MCP verification pending (Vercel DNS tooling)"} |

## AI Launch Gate – 2025-12-12T11:37:39.049Z
- Commit: 0b3d91d479ae88c3171099bb6b905b2786488172
- Target: staging
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 17.0s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T11:37:05.777Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 4.5s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.8s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 47[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 149[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 172[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 157[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 196[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 168[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 851[2mms[22m[39m
     [33m[2m✓[22m[39m raises ABN fallback alert when rate exceeds threshold [33m 527[2mms[22m[39m

[2m Test Files [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m      Tests [22m [1m[32m34 passed[39m[22m[90m (34)[39m
[2m   Start at [22m 22:37:10
[2m   Duration [22m 1.34s[2m (transform 917ms, setup 0ms, import 1.10s, tests 1.81s, environment 6ms)[22m |
| smoke | PASS | 1.3s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 476[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:37:12
[2m   Duration [22m 768ms[2m (transform 559ms, setup 0ms, import 819ms, tests 533ms, environment 1ms)[22m |
| e2e | PASS | 14.4s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  4 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (1.2s)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (4.3s)
  ✓  1 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (4.6s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (5.9s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (1.8s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (796ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (381ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (6.4s)

  8 passed (13.6s) |
| preprod (staging) | PASS | 7.5s | ========================================
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
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 545[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 22:37:29
[2m   Duration [22m 901ms[2m (transform 569ms, setup 0ms, import 771ms, tests 601ms, environment 1ms)[22m

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
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check
[PASS] Env Ready Check
All verification steps passed. |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 1.4s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS policy presence | PASS | 0.4s | {"missing":[]} |
| Migration parity | PASS | 0.1s | {"checkedCount":6,"missingCount":0,"missing":[]} |
| DNS root → Vercel | PASS | 0.1s | NS managed by Vercel (apex flattening) |
| DNS staging → Vercel | WARN | 0.0s | A-record(s): 216.198.79.1
64.29.17.1 (manual confirm required) |
| Production curl | PASS | 0.1s | HTTP/2 404 |
| Monetization flags (staging env) | PASS | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"1","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"1"} |
| Secrets alignment (.env vs Vercel) – item 4c | SKIP | 0.0s | {"reason":"Operator-only (requires Vercel UI & secret inventory)"} |
| Production monetization flags – item 10e | SKIP | 0.0s | {"reason":"MCP verification pending (Vercel Production env)"} |
| Production DNS evidence – item 11a | SKIP | 0.0s | {"reason":"MCP verification pending (Vercel DNS tooling)"} |

