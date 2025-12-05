# ABN Verification — Release Notes

Version: 2025-12-01

## Release summary
- ABN verification aligned across onboarding route, scheduled re-check, and the ops-only controlled batch runner.
- Canonical mapping applied consistently across codepaths:
  - no ABR entity → verification_status = 'rejected'
  - ABNStatus === 'Active' → verification_status = 'verified'
  - otherwise → verification_status = 'manual_review'
- matched_json now stores parsed ABR JSON when available; if parsing fails but the ABR returned a raw payload we store it as `{ "raw": "<payload>" }`.
- For detailed behaviour and canonical flow, see DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md (section “1.1 Canonical ABN Verification Flow (Owner Contract)”).

## Migration checklist (for DB owners / product owners)
Prerequisites
- Confirm that the `matched_json` column exists in `abn_verifications` (migration file: `supabase/migrations/20251130000001_add_abn_matched_json.sql`). Apply this migration to the target DB before enabling automated writes.

Steps
1. Verify migration applied in the target environment (Supabase migration applied and `abn_verifications.matched_json` present).
2. Run a small controlled batch in a non-production environment using `scripts/abn_controlled_batch.py`:
   - First: run in dry-run mode (no AUTO_APPLY, no service-role key).
   - Then: run a single small apply with AUTO_APPLY=true + service-role key and a tiny allowlist.
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

## Tests to run before enabling automated writes
- `npm test` (TypeScript unit/integration tests)
- `python3 scripts/test_abn_recheck.py -q`

---

If you want, I can also add a short integration test that validates `matched_json` shapes into `abn_verifications` in a mocked Supabase flow; tell me if you'd like that added as part of this release.
