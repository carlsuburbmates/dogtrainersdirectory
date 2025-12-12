<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->
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

## AI Launch Gate – 2025-12-12T16:34:08.396Z
- Commit: 74bab9b41749f086309818e775c8836adb54ecef
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 5 / WARN 2 / SKIP 10 / FAIL 6
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | FAIL | 0.5s | > dtd@1.0.0 verify:phase9b
> tsx scripts/verify_phase9b.ts

========================================
Phase 9B Verification Harness
========================================

[FAIL] Environment Variables: Missing: SUPABASE_CONNECTION_STRING, STRIPE_SECRET_KEY, FEATURE_MONETIZATION_ENABLED


---

## Automated Verification Snapshot – Phase 9B

- **Date:** 2025-12-12T16:33:19.320Z
- **Checks:**
  - ❌ Environment Variables: Missing: SUPABASE_CONNECTION_STRING, STRIPE_SECRET_KEY, FEATURE_MONETIZATION_ENABLED

**Overall:** ❌ AUTOMATION FAILED
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 9.4s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 2.5s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 125[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 313[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 306[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 366[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 363[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 369[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 353[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 382[2mms[22m[39m
     [33m[2m✓[22m[39m stores matched_json parsed object and status=verified for Active ABN [33m 361[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 383[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 403[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 3… |
| smoke | PASS | 1.7s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 213[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 17[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:33:31
[2m   Duration [22m 923ms[2m (transform 1.03s, setup 0ms, import 1.41s, tests 291ms, environment 1ms)[22m |
| e2e | PASS | 22.7s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  2 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (1.8s)
  ✓  1 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (5.4s)
  ✓  4 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (6.0s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (8.5s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (2.9s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (915ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (565ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (9.5s)

  8 passed (21.4s) |
| preprod (staging) | FAIL | 11.4s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 245[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 27[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 18[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:33:59
[2m   Duration [22m 833ms[2m (transform 941ms, setup 0ms, import 1.33s, tests 324ms, environment 1ms)[22m

[PASS] Smoke Tests
========================================
Running Lint

> dtd@1.0.0 lint
> eslint .

[PASS] Lint
========================================
Running Doc Divergence Detector
::error ::New/modified DOCS markdown files must include an SSOT badge, archive banner, or the explicit opt-out comment.
  - DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md
  - DOCS/db/MI… |
| check_env_ready staging | FAIL | 0.1s | ========================================
Running Env Ready Check (target: staging)
Missing environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_PGCRYPTO_KEY
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_CONNECTION_STRING
  - ABR_GUID
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - RESEND_API_KEY
  - ZAI_API_KEY
  - ZAI_BASE_URL
  - LLM_DEFAULT_MODEL
  - FEATURE_MONETIZATION_ENABLED
  - NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED
  - STRIPE_PRICE_FEATURED
  - STRIPE_PRICE_PRO
  - ALERTS_EMAIL_TO
  - ALERTS_SLACK_WEBHOOK_URL
[FAIL] Env Ready Check |
| alerts dry-run | FAIL | 1.0s | /Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/lib/helpers.ts:86
    throw new Error('supabaseUrl is required.')
          ^


Error: supabaseUrl is required.
    at validateSupabaseUrl (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/lib/helpers.ts:86:11)
    at new SupabaseClient (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/SupabaseClient.ts:117:40)
    at createClient (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/index.ts:54:10)
    at <anonymous> (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/src/lib/supabase.ts:6:25)
    at ModuleJob.run (node:internal/modules/esm/module_job:371:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:683:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.7.0 |
| DB target | FAIL | 0.0s | SUPABASE_CONNECTION_STRING not set |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","216.198.79.65"]} |
| Production curl | PASS | 0.1s | HTTP/2 404 |
| Monetization flags (staging env) | FAIL | 0.0s | {"FEATURE_MONETIZATION_ENABLED":"unset","NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED":"unset"} |
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

## AI Launch Gate – 2025-12-12T16:36:00.035Z
- Commit: 74bab9b41749f086309818e775c8836adb54ecef
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 12 / WARN 2 / SKIP 10 / FAIL 4
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

- **Date:** 2025-12-12T16:34:56.595Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 7.0s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 3.1s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 681[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 648[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 773[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 760[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 782[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 778[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 800[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 769[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 811[2mms[22m[39m
     [33m[2m✓[22m[39m stores matched_json parsed object and status=verified for Active ABN [33m 777[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 … |
| smoke | PASS | 2.3s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 38[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 40[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 727[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:35:07
[2m   Duration [22m 1.45s[2m (transform 1.14s, setup 0ms, import 1.51s, tests 832ms, environment 1ms)[22m |
| e2e | PASS | 26.7s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (2.4s)
  ✓  4 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (9.1s)
  ✓  2 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (9.6s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (12.5s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (3.0s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (716ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (585ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (11.8s)

  8 passed (25.6s) |
| preprod (staging) | FAIL | 18.9s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 42[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 780[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:35:41
[2m   Duration [22m 1.75s[2m (transform 1.25s, setup 0ms, import 1.80s, tests 875ms, environment 1ms)[22m

[PASS] Smoke Tests
========================================
Running Lint

> dtd@1.0.0 lint
> eslint .

[PASS] Lint
========================================
Running Doc Divergence Detector
::error ::New/modified DOCS markdown files must include an SSOT badge, archive banner, or the explicit opt-out comment.
  - DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md
  - DOCS/db/M… |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 2.1s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | FAIL | 0.6s | {"missing":["payment_audit","business_subscription_status"],"tableStatuses":[{"table":"payment_audit","rlsEnabled":false},{"table":"business_subscription_status","rlsEnabled":false},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | FAIL | 0.5s | {"missing":["payment_audit","business_subscription_status"],"policies":[{"table":"payment_audit","policyCount":0},{"table":"business_subscription_status","policyCount":0},{"table":"abn_fallback_events","policyCount":1},{"table":"abn_verifications","policyCount":1},{"table":"businesses","policyCount":4},{"table":"profiles","policyCount":3}]} |
| Migration parity | FAIL | 0.1s | column "inserted_at" does not exist |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.0s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","216.198.79.65"]} |
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

## AI Launch Gate – 2025-12-12T16:39:41.253Z
- Commit: 74bab9b41749f086309818e775c8836adb54ecef
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 14 / WARN 2 / SKIP 10 / FAIL 2
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 35.1s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T16:39:09.992Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 7.4s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.4s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 43[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 120[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 164[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 201[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 201[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 201[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.te… |
| smoke | PASS | 1.0s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 418[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:39:19
[2m   Duration [22m 629ms[2m (transform 436ms, setup 0ms, import 576ms, tests 455ms, environment 0ms)[22m |
| e2e | PASS | 10.7s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  3 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (743ms)
  ✓  4 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (2.6s)
  ✓  1 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (2.8s)
  ✓  2 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (3.8s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (1.5s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (544ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (4.4s)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (454ms)

  8 passed (10.1s) |
| preprod (staging) | FAIL | 6.5s | ========================================
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
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 434[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:39:32
[2m   Duration [22m 683ms[2m (transform 503ms, setup 0ms, import 708ms, tests 475ms, environment 0ms)[22m

[PASS] Smoke Tests
========================================
Running Lint

> dtd@1.0.0 lint
> eslint .

[PASS] Lint
========================================
Running Doc Divergence Detector
::error ::New/modified DOCS markdown files must include an SSOT badge, archive banner, or the explicit opt-out comment.
  - DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md
  - DOCS/db/MIG… |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 1.4s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.4s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.4s | {"missing":[],"policies":[{"table":"businesses","policyCount":4},{"table":"profiles","policyCount":3},{"table":"abn_verifications","policyCount":1},{"table":"abn_fallback_events","policyCount":1},{"table":"ops_overrides","policyCount":1}]} |
| Migration parity | FAIL | 0.1s | {"totalMigrations":13,"missing":["1702059300000_week_3_error_logging","1702075200000_week_4_triage_logs","20241208020000_search_telemetry","20250210143000_fix_decrypt_sensitive_nullsafe","20250210152000_add_decrypt_sensitive_key_arg","20250210153000_search_trainers_accept_key","20250210160000_get_trainer_profile_accept_key"],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.0s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.0s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","216.198.79.65"]} |
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

## AI Launch Gate – 2025-12-12T16:41:12.786Z
- Commit: 74bab9b41749f086309818e775c8836adb54ecef
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 15 / WARN 2 / SKIP 10 / FAIL 1
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 9.8s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T16:40:47.863Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 3.3s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.9s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 51[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 92[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 101[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 112[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 113[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 115[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test… |
| smoke | PASS | 0.9s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 402[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:40:53
[2m   Duration [22m 571ms[2m (transform 369ms, setup 0ms, import 496ms, tests 431ms, environment 0ms)[22m |
| e2e | PASS | 9.0s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  3 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (417ms)
  ✓  4 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (2.0s)
  ✓  1 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (2.2s)
  ✓  2 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (2.9s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (1.1s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (467ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (263ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (4.1s)

  8 passed (8.4s) |
| preprod (staging) | FAIL | 5.8s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 409[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:41:04
[2m   Duration [22m 668ms[2m (transform 441ms, setup 0ms, import 595ms, tests 442ms, environment 0ms)[22m

[PASS] Smoke Tests
========================================
Running Lint

> dtd@1.0.0 lint
> eslint .

[PASS] Lint
========================================
Running Doc Divergence Detector
::error ::New/modified DOCS markdown files must include an SSOT badge, archive banner, or the explicit opt-out comment.
  - DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md
  - DOCS/db/MIGR… |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 1.1s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.4s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.5s | {"missing":[],"policies":[{"table":"businesses","policyCount":4},{"table":"profiles","policyCount":3},{"table":"abn_verifications","policyCount":1},{"table":"abn_fallback_events","policyCount":1},{"table":"ops_overrides","policyCount":1}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","216.198.79.65"]} |
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
## AI Launch Gate – 2025-12-12T16:43:53.747Z
- Commit: 74bab9b41749f086309818e775c8836adb54ecef
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 16 / WARN 2 / SKIP 10 / FAIL 0
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 23.1s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T16:43:22.665Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 4.4s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 2.2s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 42[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 162[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 299[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 304[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 314[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 312[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 327[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 306[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 780[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 24[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[3… |
| smoke | PASS | 1.4s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 24[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 514[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:43:29
[2m   Duration [22m 906ms[2m (transform 734ms, setup 0ms, import 1.01s, tests 579ms, environment 1ms)[22m |
| e2e | PASS | 13.0s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (784ms)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (3.0s)
  ✓  3 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (3.1s)
  ✓  4 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (4.0s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (1.2s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (534ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (340ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (4.9s)

  8 passed (12.1s) |
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

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 421[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:43:45
[2m   Duration [22m 678ms[2m (transform 428ms, setup 0ms, import 578ms, tests 456ms, environment 1ms)[22m

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
| alerts dry-run | PASS | 1.1s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.4s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.4s | {"missing":[],"policies":[{"table":"businesses","policyCount":4},{"table":"profiles","policyCount":3},{"table":"abn_verifications","policyCount":1},{"table":"abn_fallback_events","policyCount":1},{"table":"ops_overrides","policyCount":1}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.0s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.0s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","216.198.79.65"]} |
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
## AI Launch Gate – 2025-12-12T16:59:13.643Z (sha f091995db6d54bd93e2f35fb8b9ef709f3617b95, target staging)
- Commit: f091995db6d54bd93e2f35fb8b9ef709f3617b95
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 15 / WARN 2 / SKIP 10 / FAIL 1
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 36.8s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T16:57:49.540Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 14.1s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 4.7s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 432[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 426[2mms[22m[39m
 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 271[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 559[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 556[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 571[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 549[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 583[2mms[22m[39m
     [33m[2m✓[22m[39m stores matched_json parsed object and status=verified for Active ABN [33m 566[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 582[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 552[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 1… |
| smoke | PASS | 3.1s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 39[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 821[2mms[22m[39m
     [33m[2m✓[22m[39m raises ABN fallback alert when rate exceeds threshold [33m 326[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:58:09
[2m   Duration [22m 1.94s[2m (transform 1.39s, setup 0ms, import 2.43s, tests 930ms, environment 1ms)[22m |
| e2e | PASS | 36.7s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (2.9s)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (7.7s)
  ✓  4 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (8.4s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (5.3s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (14.4s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (1.7s)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (1.4s)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (16.1s)

  8 passed (34.2s) |
| preprod (staging) | PASS | 20.4s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 34[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 747[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 03:58:55
[2m   Duration [22m 1.72s[2m (transform 1.38s, setup 0ms, import 1.89s, tests 836ms, environment 1ms)[22m

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
Ru… |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 2.3s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.4s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | FAIL | 0.1s | column "polpermissive" does not exist |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","216.198.79.65"]} |
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
## AI Launch Gate – 2025-12-12T17:01:58.173Z (sha f091995db6d54bd93e2f35fb8b9ef709f3617b95, target staging)
- Commit: f091995db6d54bd93e2f35fb8b9ef709f3617b95
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 15 / WARN 2 / SKIP 10 / FAIL 1
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 38.5s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T17:00:31.959Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 15.3s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 6.3s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 737[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 711[2mms[22m[39m
 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 319[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 875[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 867[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 892[2mms[22m[39m
     [33m[2m✓[22m[39m stores matched_json parsed object and status=verified for Active ABN [33m 868[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 908[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 890[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 950[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 910[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 2… |
| smoke | PASS | 3.7s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 173[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 36[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 25[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 1032[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 04:00:55
[2m   Duration [22m 2.20s[2m (transform 2.33s, setup 0ms, import 3.24s, tests 1.28s, environment 1ms)[22m |
| e2e | PASS | 35.9s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (4.1s)
  ✓  4 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (7.3s)
  ✓  2 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (8.0s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (3.8s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (12.1s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (832ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (11.2s)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (1.1s)

  8 passed (33.6s) |
| preprod (staging) | PASS | 19.8s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 61[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 1163[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 04:01:39
[2m   Duration [22m 2.12s[2m (transform 2.56s, setup 0ms, import 3.16s, tests 1.30s, environment 1ms)[22m

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
R… |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 2.0s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.4s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | FAIL | 0.5s | {"missing":["payment_audit"],"overlyPermissive":[{"table":"businesses","policies":["Trainers can insert own businesses"]}],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)"}]},{"table":"payment_audit","policies":[]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.65","64.29.17.1"]} |
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
## AI Launch Gate – 2025-12-12T17:04:41.159Z (sha f091995db6d54bd93e2f35fb8b9ef709f3617b95, target staging)
- Commit: f091995db6d54bd93e2f35fb8b9ef709f3617b95
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 15 / WARN 2 / SKIP 10 / FAIL 1
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 41.3s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T17:03:03.758Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 13.2s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 7.2s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 131[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 452[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 436[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 617[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 611[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 621[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 597[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 693[2mms[22m[39m
     [33m[2m✓[22m[39m stores matched_json parsed object and status=verified for Active ABN [33m 661[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 682[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 645[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 48[2mms… |
| smoke | PASS | 5.6s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 88[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 24[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 107[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 40[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 1516[2mms[22m[39m
     [33m[2m✓[22m[39m raises ABN fallback alert when rate exceeds threshold [33m 446[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 04:03:27
[2m   Duration [22m 2.57s[2m (transform 2.85s, setup 0ms, import 4.57s, tests 1.78s, environment 2ms)[22m |
| e2e | PASS | 43.5s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  3 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (5.1s)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (8.3s)
  ✓  1 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (9.2s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (4.0s)
  ✓  4 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (13.4s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (799ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (10.2s)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (1.2s)

  8 passed (40.5s) |
| preprod (staging) | PASS | 22.0s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 31[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 24[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 811[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 04:04:20
[2m   Duration [22m 1.92s[2m (transform 1.47s, setup 0ms, import 2.07s, tests 905ms, environment 4ms)[22m

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
Ru… |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 2.3s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.5s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | FAIL | 0.5s | {"missing":[],"overlyPermissive":[{"table":"businesses","policies":["Trainers can insert own businesses"]}],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","216.198.79.1"]} |
| Production curl | PASS | 0.6s | HTTP/2 404 |
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
## AI Launch Gate – 2025-12-12T17:07:53.681Z (sha f091995db6d54bd93e2f35fb8b9ef709f3617b95, target staging)
- Commit: f091995db6d54bd93e2f35fb8b9ef709f3617b95
- Target: staging
- DNS_STATUS: WARN (operator confirmation required)
- Result counts: PASS 16 / WARN 2 / SKIP 10 / FAIL 0
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 46.6s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-12T17:06:15.566Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 19.7s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 5.8s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 124[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 440[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 423[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 645[2mms[22m[39m
     [33m[2m✓[22m[39m passes p_key from env when SUPABASE_PGCRYPTO_KEY is set [33m 637[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 643[2mms[22m[39m
     [33m[2m✓[22m[39m stores matched_json parsed object and status=verified for Active ABN [33m 630[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 637[2mms[22m[39m
     [33m[2m✓[22m[39m returns verification results and does not write when AUTO_APPLY=false [33m 620[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 634[2mms[22m[39m
     [33m[2m✓[22m[39m calls ABR and persists matched_json when creating a business [33m 633[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 1… |
| smoke | PASS | 4.2s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 35[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 869[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 04:06:42
[2m   Duration [22m 2.78s[2m (transform 1.99s, setup 0ms, import 2.70s, tests 965ms, environment 5ms)[22m |
| e2e | PASS | 42.4s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (3.7s)
  ✓  2 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (11.8s)
  ✓  3 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (13.4s)
  ✓  4 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (18.7s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (5.4s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (1.3s)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (686ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (19.0s)

  8 passed (40.4s) |
| preprod (staging) | PASS | 20.3s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 36[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 53[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 952[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 04:07:35
[2m   Duration [22m 1.92s[2m (transform 1.73s, setup 0ms, import 2.45s, tests 1.08s, environment 1ms)[22m

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
Ru… |
| check_env_ready staging | PASS | 0.1s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 2.1s | DRY RUN ALERT SUMMARY:
- [CRITICAL] emergency_cron: Emergency cron has no recorded successes |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | PASS | 0.3s | {"fallbackCount24h":1,"verifiedCount24h":6,"fallbackCount7d":1,"threshold":0.15} |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.5s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.5s | {"missing":[],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","64.29.17.1"]} |
| DNS staging → Vercel | WARN | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","216.198.79.1"]} |
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

