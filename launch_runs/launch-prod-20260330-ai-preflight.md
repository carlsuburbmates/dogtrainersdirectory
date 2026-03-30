<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->
# Launch Run – production – 20260330

---
## AI Launch Gate – 2026-03-30T18:38:06.083Z (sha 77fae39c347619bc0caf86cc11c178143760bdab, target staging)
- Commit: 77fae39c347619bc0caf86cc11c178143760bdab
- Target: staging
- DNS_STATUS: PASS
- Result counts: PASS 2 / WARN 0 / SKIP 1 / FAIL 4
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7421:1653:2d92:a846:1e55/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| ABN fallback rate | SKIP | 0.3s | Insufficient verification volume in last 24h |
| Database schema presence | PASS | 0.8s | {"missing":[]} |
| RLS status | FAIL | 0.5s | {"missing":["abn_verifications"],"tableStatuses":[{"table":"businesses","rlsEnabled":true},{"table":"profiles","rlsEnabled":true},{"table":"abn_verifications","rlsEnabled":false},{"table":"abn_fallback_events","rlsEnabled":true},{"table":"ops_overrides","rlsEnabled":true}]} |
| Policy coverage | FAIL | 0.5s | {"missing":["abn_verifications"],"overlyPermissive":[],"perTablePolicies":[{"table":"businesses","policies":[{"name":"Active businesses are viewable by everyone","permissive":true,"usingClause":"(is_active = true)","command":"select"},{"name":"Admins can view all businesses","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))","command":"select"},{"name":"Trainers can insert own businesses","permissive":true,"usingClause":"true","command":"insert"},{"name":"Trainers can update own businesses","permissive":true,"usingClause":"(auth.uid() = profile_id)","command":"update"}]},{"table":"profiles","policies":[{"name":"Admins can view all profiles","permissive":true,"usingClause":"(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))","command":"select"},{"name":"Users can update own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"update"},{"name":"Users can view own profile","permissive":true,"usingClause":"(auth.uid() = id)","command":"select"}]},{"table":"abn_verifications","policies":[]},{"table":"abn_fallback_events","policies":[{"name":"service-role-abn-fallback-events","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]},{"table":"ops_overrides","policies":[{"name":"service-role-ops-overrides","permissive":true,"usingClause":"(auth.role() = 'service_role'::text)","command":"all"}]}]} |
| Migration parity | FAIL | 0.1s | {"totalMigrations":18,"appliedCount":24,"checkedAfterBaseline":12,"missing":["20251219110000_extend_emergency_triage_logs","20260203171000_add_missing_ops_and_emergency_tables","20260203182000_add_encrypt_sensitive_function","20260311120000_create_ai_automation_rollout_controls","20260317090000_allow_distinct_ops_digest_runs","20260317091000_drop_daily_ops_digest_unique_index"],"recentApplied":["20260203171000 (name: add_missing_ops_and_emergency_tables, appliedAt: not tracked)","20260203182000 (name: add_encrypt_sensitive_function, appliedAt: not tracked)","20260311120000 (name: create_ai_automation_rollout_controls, appliedAt: not tracked)","20260317090000 (name: allow_distinct_ops_digest_runs, appliedAt: not tracked)","20260317091000 (name: drop_daily_ops_digest_unique_index, appliedAt: not tracked)"],"baselineVersion":20251100000000,"timestampSource":"schema_migrations has no inserted_at column"} |
| Launch inventory gate | FAIL | 0.3s | counted=0 councils=0 suburbs=0 age=0 services=0 issues=0 |

---
## AI Launch Gate – 2026-03-30T18:39:14.794Z (sha 77fae39c347619bc0caf86cc11c178143760bdab, target staging)
- Commit: 77fae39c347619bc0caf86cc11c178143760bdab
- Target: staging
- DNS_STATUS: PASS
- Result counts: PASS 1 / WARN 0 / SKIP 0 / FAIL 1
- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)

| Check | Status | Duration | Details |
| --- | --- | --- | --- |
| DB target | PASS | 0.1s | {"urlHost":"db.xqytwtmdilipxnjetvoe.supabase.co","urlDatabase":"postgres","resolvedHost":"db.xqytwtmdilipxnjetvoe.supabase.co","runtimeHost":"2406:da18:243:7421:1653:2d92:a846:1e55/128","runtimeDatabase":"postgres","runtimeRole":"postgres","runtimePort":5432} |
| Launch inventory gate | FAIL | 0.2s | counted=0 councils=0 suburbs=0 age=0 services=0 issues=0 |

