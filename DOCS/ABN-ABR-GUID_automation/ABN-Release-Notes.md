# ABN Verification — Release Notes

Version: 2025-12-01

## Release summary
- ABN verification aligned across onboarding route, scheduled re-check, and the ops-only controlled batch runner.
- Canonical mapping applied consistently across codepaths:
  - no ABR entity → verification_status = 'rejected'
  - ABNStatus === 'Active' → verification_status = 'verified'
  - otherwise → verification_status = 'manual_review'
- matched_json now stores parsed ABR JSON when available; if parsing fails but the ABR returned a raw payload we store it as `{ "raw": "<payload>" }`.
- For detailed behaviour and canonical flow, see DOCS/ABR-ABN-Lookup.md (section “1.1 Canonical ABN Verification Flow (Owner Contract)”).

## Migration checklist (for DB owners / product owners)
Prerequisites
- Confirm that the `matched_json` column exists in `abn_verifications` (migration file: `supabase/migrations/20251130000001_add_abn_matched_json.sql`). Apply this migration to the target DB before enabling automated writes.

Steps
1. Verify migration applied in the target environment (Supabase migration applied and `abn_verifications.matched_json` present).
2. Run a small controlled batch in a non-production environment using `scripts/abn_controlled_batch.py` (dry-run first) or provide an allowlist file for a few businessId/ABN pairs.
   - Confirm recorded statuses for those rows: `verified`, `manual_review`, `rejected` as appropriate.
   - Confirm `matched_json` contains either parsed ABR object or a `{ "raw": ... }` wrapper for non-JSON ABR responses.
3. After the above verification succeeds, enable `AUTO_APPLY=true` in a non-prod environment for the scheduled re-check job and re-run with a small batch to validate writes.
4. When satisfied (after low-risk non-prod tests), schedule a controlled, small apply in staging or production following your org release process.

Notes
- This release only updates server-side verification logic and DB writes. It does NOT trigger any automated deployment; deployment must be scheduled separately.

## Owner-facing: how to oversee ABN verification
- Monitor daily runs of `.github/workflows/abn-recheck.yml` and the script logs for ABR connectivity issues or parsing warnings.
- Watch distribution of `abn_verifications.status` (verified/manual_review/rejected) in your analytics to detect sudden shifts indicating ABR issues or bad data.
- Use `scripts/abn_controlled_batch.py` for small, manual writes when you need to backfill or audit — this is intentionally ops-only (dry-run by default, requires `AUTO_APPLY=true` + `SUPABASE_SERVICE_ROLE_KEY` to write).
- If an ABN status looks wrong, inspect the `abn_verifications` row — fields to check: `status`, `matched_json`, `similarity_score`, `updated_at`.
- Keep the ABR GUID secret; do not expose it to client code or public logs.

## How to prepare allowlists (CSV → JSON)
For controlled ops or one-off writes we prefer a human-curated CSV workflow. Two CSV templates exist in the repo:

- `DOCS/abn_allowlist.staging.csv` — staging allowlist template
- `DOCS/abn_allowlist.prod.csv` — production allowlist template

Use the generator to validate and produce the JSON file used by the controlled batch runner:

```bash
# generate staging JSON
npm run allowlist:staging
# generate prod JSON
npm run allowlist:prod
# the generator writes -> scripts/controlled_abn_list.staging.json / scripts/controlled_abn_list.prod.json
```

## Tests to run before enabling automated writes
- `npm test` (TypeScript unit/integration tests)
- `python3 scripts/test_abn_recheck.py -q`

---

Note: Integration tests that assert `matched_json` shapes are encouraged; if you want to add such a test, add it to the onboarding/integration test harness or a mocked Supabase flow and run during CI.