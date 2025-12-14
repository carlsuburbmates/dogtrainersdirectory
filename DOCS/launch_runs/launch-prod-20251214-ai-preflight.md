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

