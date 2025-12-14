<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->
# Launch Run – production – 20251214

---
## AI Launch Gate – 2025-12-14T14:46:22.584Z (sha 3f3fba7c4c2410e6cd6f9ab855aad17404308b79, target staging)
- Commit: 3f3fba7c4c2410e6cd6f9ab855aad17404308b79
- Target: staging
- DNS_STATUS: PASS
- Result counts: PASS 7 / WARN 0 / SKIP 11 / FAIL 6
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | FAIL | 0.4s | ========================================
Phase 9B Verification Harness
========================================

[FAIL] Environment Variables: Missing: SUPABASE_CONNECTION_STRING, STRIPE_SECRET_KEY, FEATURE_MONETIZATION_ENABLED


---

## Automated Verification Snapshot – Phase 9B

- **Date:** 2025-12-14T14:46:05.360Z
- **Checks:**
  - ❌ Environment Variables: Missing: SUPABASE_CONNECTION_STRING, STRIPE_SECRET_KEY, FEATURE_MONETIZATION_ENABLED

**Overall:** ❌ AUTOMATION FAILED
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 3.1s |  |
| test | PASS | 1.0s | [1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 76[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 96[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 96[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 97[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 99[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 102[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/unit/verifyLaunchClassifier.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 1[2mms[22m[39m
 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[… |
| smoke | PASS | 0.7s | [1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 67[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 5[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 01:46:09
[2m   Duration [22m 230ms[2m (transform 324ms, setup 0ms, import 424ms, tests 88ms, environment 0ms)[22m |
| e2e | PASS | 6.5s | Running 8 tests using 4 workers

  ✓  2 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (235ms)
  ✓  1 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (1.4s)
  ✓  4 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (1.6s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (1.9s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (370ms)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (747ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (2.4s)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (260ms)

  8 passed (5.8s) |
| preprod (staging) | FAIL | 5.1s | ========================================
Running Type Check
[PASS] Type Check
========================================
Running Smoke Tests

[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 60[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 01:46:18
[2m   Duration [22m 204ms[2m (transform 316ms, setup 0ms, import 418ms, tests 82ms, environment 0ms)[22m

[PASS] Smoke Tests
========================================
Running Lint
[PASS] Lint
========================================
Running Doc Divergence Detector
::error ::New/modified DOCS markdown files must include an SSOT badge, archive banner, or the explicit opt-out comment.
  - DOCS/automation/LAUNCH_WORKFLOW_N1.md
[FAIL] Doc Divergence Detector
========================================
Running Env Ready Check
========================================
Runnin… |
| check_env_ready staging | FAIL | 0.0s | ========================================
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
| alerts dry-run | FAIL | 0.5s | /Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/lib/helpers.ts:86
    throw new Error('supabaseUrl is required.')
          ^


Error: supabaseUrl is required.
    at validateSupabaseUrl (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/lib/helpers.ts:86:11)
    at new SupabaseClient (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/SupabaseClient.ts:117:40)
    at createClient (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/index.ts:54:10)
    at <anonymous> (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/src/lib/supabase.ts:6:25)
    at ModuleJob.run (node:internal/modules/esm/module_job:263:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:540:24)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v20.19.2 |
| DB target | FAIL | 0.0s | SUPABASE_CONNECTION_STRING not set |
| DNS root → Vercel | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","64.29.17.65"],"aaaaRecords":[],"optional":false} |
| DNS www → Vercel (optional) | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.1","64.29.17.65"],"aaaaRecords":[],"optional":true} |
| DNS staging preview model | SKIP | 0.0s | Staging uses Vercel Preview deployments; no staging subdomain by design. |
| Production curl | PASS | 0.1s | HTTP/2 307 |
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

---
## AI Launch Gate – 2025-12-14T14:49:12.056Z (sha a4994df17e4f1102cef38d1d34aa14e241fd23b0, target staging)
- Commit: a4994df17e4f1102cef38d1d34aa14e241fd23b0
- Target: staging
- DNS_STATUS: PASS
- Result counts: PASS 7 / WARN 0 / SKIP 11 / FAIL 6
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | FAIL | 0.4s | > dtd@1.0.0 verify:phase9b
> tsx scripts/verify_phase9b.ts

========================================
Phase 9B Verification Harness
========================================

[FAIL] Environment Variables: Missing: SUPABASE_CONNECTION_STRING, STRIPE_SECRET_KEY, FEATURE_MONETIZATION_ENABLED


---

## Automated Verification Snapshot – Phase 9B

- **Date:** 2025-12-14T14:48:52.212Z
- **Checks:**
  - ❌ Environment Variables: Missing: SUPABASE_CONNECTION_STRING, STRIPE_SECRET_KEY, FEATURE_MONETIZATION_ENABLED

**Overall:** ❌ AUTOMATION FAILED
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 4.0s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.3s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 163[2mms[22m[39m
 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 77[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 245[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 246[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 249[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 258[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 257[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/unit/verifyLaunchClassifier.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/smoke/t… |
| smoke | PASS | 0.8s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 96[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 01:48:57
[2m   Duration [22m 311ms[2m (transform 426ms, setup 0ms, import 556ms, tests 123ms, environment 0ms)[22m |
| e2e | PASS | 7.5s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (376ms)
  ✓  4 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (1.8s)
  ✓  3 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (1.9s)
  ✓  2 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (2.5s)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (824ms)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (316ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (2.5s)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (258ms)

  8 passed (6.8s) |
| preprod (staging) | FAIL | 5.6s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 74[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 01:49:07
[2m   Duration [22m 216ms[2m (transform 352ms, setup 0ms, import 452ms, tests 97ms, environment 0ms)[22m

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
Running … |
| check_env_ready staging | FAIL | 0.0s | ========================================
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
| alerts dry-run | FAIL | 0.5s | /Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/lib/helpers.ts:86
    throw new Error('supabaseUrl is required.')
          ^


Error: supabaseUrl is required.
    at validateSupabaseUrl (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/lib/helpers.ts:86:11)
    at new SupabaseClient (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/SupabaseClient.ts:117:40)
    at createClient (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/node_modules/@supabase/supabase-js/src/index.ts:54:10)
    at <anonymous> (/Users/carlg/Documents/PROJECTS/Project-dev/DTD/src/lib/supabase.ts:6:25)
    at ModuleJob.run (node:internal/modules/esm/module_job:263:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:540:24)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v20.19.2 |
| DB target | FAIL | 0.0s | SUPABASE_CONNECTION_STRING not set |
| DNS root → Vercel | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.65","216.198.79.1"],"aaaaRecords":[],"optional":false} |
| DNS www → Vercel (optional) | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.65","216.198.79.1"],"aaaaRecords":[],"optional":true} |
| DNS staging preview model | SKIP | 0.0s | Staging uses Vercel Preview deployments; no staging subdomain by design. |
| Production curl | PASS | 0.1s | HTTP/2 307 |
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

---
## AI Launch Gate – 2025-12-14T15:14:18.133Z (sha a4994df17e4f1102cef38d1d34aa14e241fd23b0, target staging)
- Commit: a4994df17e4f1102cef38d1d34aa14e241fd23b0
- Target: staging
- DNS_STATUS: PASS
- Result counts: PASS 17 / WARN 0 / SKIP 12 / FAIL 0
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 9.7s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-14T15:13:57.383Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 3.5s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.2s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 64[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 88[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 90[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 88[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 95[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/unit/verifyLaunchClass… |
| smoke | PASS | 0.9s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 404[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 02:14:02
[2m   Duration [22m 546ms[2m (transform 329ms, setup 0ms, import 430ms, tests 426ms, environment 0ms)[22m |
| e2e | PASS | 6.0s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (228ms)
  ✓  4 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (1.4s)
  ✓  2 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (1.7s)
  ✓  3 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (1.8s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (255ms)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (506ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (192ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (2.5s)

  8 passed (5.4s) |
| preprod (staging) | PASS | 5.1s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 385[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 02:14:10
[2m   Duration [22m 500ms[2m (transform 319ms, setup 0ms, import 420ms, tests 406ms, environment 0ms)[22m

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
Runnin… |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 0.5s | No actionable alerts to report. |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | SKIP | 0.3s | Insufficient verification volume in last 24h |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.5s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.5s | {"missing":[],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","216.198.79.65"],"aaaaRecords":[],"optional":false} |
| DNS www → Vercel (optional) | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","64.29.17.1"],"aaaaRecords":[],"optional":true} |
| DNS staging preview model | SKIP | 0.0s | Staging uses Vercel Preview deployments; no staging subdomain by design. |
| Production curl | PASS | 0.1s | HTTP/2 307 |
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
## AI Launch Gate – 2025-12-14T15:17:09.221Z (sha a4994df17e4f1102cef38d1d34aa14e241fd23b0, target staging)
- Commit: a4994df17e4f1102cef38d1d34aa14e241fd23b0
- Target: staging
- DNS_STATUS: PASS
- Result counts: PASS 17 / WARN 0 / SKIP 12 / FAIL 0
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 9.6s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-14T15:16:50.102Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 3.1s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.0s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 63[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 71[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 80[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 75[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 74[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/unit/verifyLaunchClass… |
| smoke | PASS | 0.9s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 465[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 02:16:54
[2m   Duration [22m 606ms[2m (transform 263ms, setup 0ms, import 361ms, tests 490ms, environment 0ms)[22m |
| e2e | PASS | 6.0s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  4 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (327ms)
  ✓  1 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (1.3s)
  ✓  3 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (1.5s)
  ✓  2 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (1.7s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (303ms)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (654ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (215ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (2.2s)

  8 passed (5.4s) |
| preprod (staging) | PASS | 4.6s | ========================================
Running Type Check

> dtd@1.0.0 type-check
> tsc --noEmit

[PASS] Type Check
========================================
Running Smoke Tests

> dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 435[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 02:17:02
[2m   Duration [22m 610ms[2m (transform 248ms, setup 0ms, import 356ms, tests 457ms, environment 0ms)[22m

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
Runnin… |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 0.4s | No actionable alerts to report. |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | SKIP | 0.3s | Insufficient verification volume in last 24h |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.4s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.5s | {"missing":[],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","216.198.79.65"],"aaaaRecords":[],"optional":false} |
| DNS www → Vercel (optional) | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","64.29.17.1"],"aaaaRecords":[],"optional":true} |
| DNS staging preview model | SKIP | 0.0s | Staging uses Vercel Preview deployments; no staging subdomain by design. |
| Production curl | PASS | 0.1s | HTTP/2 307 |
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
## AI Launch Gate – 2025-12-14T15:20:12.185Z (sha a4994df17e4f1102cef38d1d34aa14e241fd23b0, target staging)
- Commit: a4994df17e4f1102cef38d1d34aa14e241fd23b0
- Target: staging
- DNS_STATUS: PASS
- Result counts: PASS 17 / WARN 0 / SKIP 12 / FAIL 0
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| verify:phase9b | PASS | 8.7s | > dtd@1.0.0 verify:phase9b
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

- **Date:** 2025-12-14T15:19:52.334Z
- **Checks:**
  - ✅ Environment Variables: All required vars present (3 checked)
  - ✅ Build (npm run build): Next.js build succeeded
  - ✅ Tests (npm test): Tests passed (unknown tests)
  - ✅ Database Schema: All required tables present (payment_audit, business_subscription_status)

**Overall:** ✅ AUTOMATION PASS
> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.
> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue. |
| lint | PASS | 2.9s | > dtd@1.0.0 lint
> eslint . |
| test | PASS | 1.0s | > dtd@1.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m src/app/api/admin/ops/overrides/route.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 80[2mms[22m[39m
 [32m✓[39m src/app/api/onboarding/route.integration.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 82[2mms[22m[39m
 [32m✓[39m src/app/api/abn/verify/route.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 85[2mms[22m[39m
 [32m✓[39m src/app/directory/fetchDirectoryRegions.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 90[2mms[22m[39m
 [32m✓[39m src/app/trainers/get_trainer_profile.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 98[2mms[22m[39m
 [32m✓[39m src/lib/abr.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/monetization.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/unit/verifyLaunchClass… |
| smoke | PASS | 0.9s | > dtd@1.0.0 smoke
> vitest run tests/smoke


[1m[46m RUN [49m[22m [36mv4.0.15 [39m[90m/Users/carlg/Documents/PROJECTS/Project-dev/DTD[39m

 [32m✓[39m tests/smoke/error-logging.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/smoke/trainers.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 454[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 02:19:56
[2m   Duration [22m 593ms[2m (transform 340ms, setup 0ms, import 441ms, tests 477ms, environment 0ms)[22m |
| e2e | PASS | 6.0s | > dtd@1.0.0 e2e
> playwright test


Running 8 tests using 4 workers

  ✓  1 [chromium] › tests/e2e/alerts-snapshot.spec.ts:3:1 › alerts snapshot healthy baseline (271ms)
  ✓  4 [chromium] › tests/e2e/emergency.spec.ts:5:1 › Emergency controls toggle state and capture screenshot (1.4s)
  ✓  3 [chromium] › tests/e2e/admin-dashboards.spec.ts:86:3 › Admin dashboards › AI health dashboard shows override state (1.6s)
  ✓  2 [chromium] › tests/e2e/monetization.spec.ts:178:3 › Monetization upgrade flow › provider upgrade and admin subscription tab (1.8s)
  ✓  7 [chromium] › tests/e2e/monetization.spec.ts:203:3 › Monetization upgrade flow › hides upgrade CTA when feature flag disabled (211ms)
  ✓  6 [chromium] › tests/e2e/admin-dashboards.spec.ts:99:3 › Admin dashboards › Cron health dashboard renders schedule snapshot (520ms)
  ✓  8 [chromium] › tests/e2e/monetization.spec.ts:209:3 › Monetization upgrade flow › requires ABN verification before upgrade (192ms)
  ✓  5 [chromium] › tests/e2e/search-and-trainer.spec.ts:19:3 › Search → Trainer profile › navigates from search results to trainer profile (2.3s)

  8 passed (5.5s) |
| preprod (staging) | PASS | 5.1s | ========================================
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
 [32m✓[39m tests/smoke/admin-pages.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/smoke/emergency-api.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/smoke/alerts.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 436[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m   Start at [22m 02:20:04
[2m   Duration [22m 632ms[2m (transform 341ms, setup 0ms, import 443ms, tests 458ms, environment 0ms)[22m

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
Runnin… |
| check_env_ready staging | PASS | 0.0s | ========================================
Running Env Ready Check (target: staging)
All required variables are set.
[PASS] Env Ready Check |
| alerts dry-run | PASS | 0.5s | No actionable alerts to report. |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7427:54d8:9466:9e8a:e018/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | SKIP | 0.3s | Insufficient verification volume in last 24h |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | PASS | 0.5s | {"missing":[],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":true},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | PASS | 0.5s | {"missing":[],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[{"name":"service-role-abn-verifications","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | PASS | 0.1s | {"totalMigrations":13,"appliedCount":11,"checkedAfterBaseline":6,"missing":[],"recentApplied":["20251209093000_add_latency_metrics (name: add_latency_metrics, appliedAt: not tracked)","20251209101000_create_payment_tables (name: create_payment_tables, appliedAt: not tracked)","20251212111500_create_abn_fallback_events (name: create_abn_fallback_events, appliedAt: not tracked)","20251212113000_secure_abn_tables (name: secure_abn_tables, appliedAt: not tracked)","20251212114500_create_ops_overrides (name: create_ops_overrides, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| DNS root → Vercel | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["216.198.79.1","216.198.79.65"],"aaaaRecords":[],"optional":false} |
| DNS www → Vercel (optional) | PASS | 0.1s | {"expected":"cname.vercel-dns.com.","cnameRecords":[],"aRecords":["64.29.17.65","64.29.17.1"],"aaaaRecords":[],"optional":true} |
| DNS staging preview model | SKIP | 0.0s | Staging uses Vercel Preview deployments; no staging subdomain by design. |
| Production curl | PASS | 0.1s | HTTP/2 307 |
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

