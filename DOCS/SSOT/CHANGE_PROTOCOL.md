# Change Protocol — How to Modify Post-launch Truth

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. When this protocol applies
Any change that affects:
- routes (public or admin)
- API contracts
- database schema, RPCs, enums
- monetisation (Stripe, prices, entitlements)
- AI automation modes or behaviour
- operational runbooks, cron schedules
must follow this protocol.

## 2. Required PR structure
1) **Change description**
2) **SSOT impact statement**
   - which sections/files change and why
3) **Contract diff**
   - schema/RPC/env var deltas
4) **Verification evidence**
   - build + tests + any harness output relevant to the change

## 3. Hard rules
- If schema changes are required, include explicit migrations (or stop and escalate).
- Never introduce new “concepts” in docs that do not exist in code.
- Never change database identifiers to match AU spelling (keep US identifiers).

## 4. Documentation authority rules
- Canonical documentation lives in `DOCS/SSOT/` only.
- `README.md`, `README_DEVELOPMENT.md`, and `supabase/LOCAL_SETUP.md` are pointer-only summaries.
- Operational procedures belong in `08_OPS_RUNBOOK.md`.
- Deployment and environment details belong in `09_DEPLOYMENT.md`.

## 5. Open items tracking
Any “known gap” (e.g., referenced but unconfirmed tables/RPCs) must be tracked as an explicit item and either:
- verified in code/schema and added to `03_DATA_CONTRACTS.md`, or
- removed from code/docs if it is dead.
