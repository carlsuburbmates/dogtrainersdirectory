# ABN Verification Rollout Checklist

Version: 2025-12-01

This checklist is an operational runbook for safely rolling out the canonical ABN verification changes introduced in this release (see DOCS/ABN-Release-Notes.md and DOCS/ABR-ABN-Lookup.md). It is aimed at product owners, SREs, and DB owners and is intentionally implementation-agnostic.

---

## Links
- Canonical contract / owner contract: DOCS/ABR-ABN-Lookup.md
- Release summary & migration notes: DOCS/ABN-Release-Notes.md
- Re-check automation workflow: `.github/workflows/abn-recheck.yml`
- Scripts:
  - `scripts/abn_recheck.py` (scheduled re-check runner)
  - `scripts/abn_controlled_batch.py` (ops-only controlled batch)

---

# STAGING ROLLOUT CHECKLIST (step-by-step)

Context / assumptions:
- Staging mirrors production schema and credentials are available for a staging Supabase project.
- The code on `main` contains the canonical ABN mapping + `matched_json` behaviour.

1) Confirm `matched_json` migration applied in staging
   - Migration reference: `supabase/migrations/20251130000001_add_abn_matched_json.sql` (see DOCS/ABR-ABN-Lookup.md runbook).
   - If not applied: follow the runbook to apply via Supabase Dashboard or CLI. Confirm column present:
     ```sql
     -- connect to staging DB and run
     SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_name = 'abn_verifications' AND column_name = 'matched_json';
     ```
   - Expected: matched_json column exists (jsonb).

2) Run tests in the staging context (CI or local dev environment configured for staging):
   - TypeScript tests (unit + integration):
     ```bash
     npm test
     ```
   - Re-check Python tests:
     ```bash
     python3 scripts/test_abn_recheck.py -q
     ```
   - Tests must be green before proceeding.

3) Prepare a small controlled allowlist for staging
   - Option A (quick JSON): create a tiny JSON allowlist (2–3 entries) with known ABNs (non-sensitive test data) and corresponding staging business IDs, e.g. `staging_allowlist.json` — same format as below.
   - Option B (CSV → JSON generator, preferred for repeatability): edit `DOCS/abn_allowlist.staging.csv` (CSV template provided in the repo), then generate the JSON file used by the batch with the included helper scripts:

     - Edit the CSV `DOCS/abn_allowlist.staging.csv` and add 2–3 rows (header present). When ready, run:
       ```bash
       npm run allowlist:staging
       # writes -> scripts/controlled_abn_list.staging.json
       ```

     - The generator validates CSV values and writes `scripts/controlled_abn_list.staging.json`. Use that file for the controlled batch runner.

4) Controlled batch in staging — dry-run then single apply
   - Dry-run first (no writes). If using the generated file, run the convenience script:
     ```bash
     # dry-run (no writes)
     npm run abn:batch:staging
     # or the explicit command
     SUPABASE_CONNECTION_STRING="<staging_conn>" ABR_GUID="<staging_guid>" \
       python3 scripts/abn_controlled_batch.py --file=scripts/controlled_abn_list.staging.json
     ```
   - Inspect the printed JSON summary and logs for parsing / ABNStatus values & planned actions.
   - Apply single small write with service-role and AUTO_APPLY enabled (one-off):
     ```bash
     # explicit apply using the generated file
     AUTO_APPLY=true SUPABASE_CONNECTION_STRING="<staging_conn>" \
       SUPABASE_SERVICE_ROLE_KEY="<staging_srk>" ABR_GUID="<staging_guid>" \
       python3 scripts/abn_controlled_batch.py --apply --file=scripts/controlled_abn_list.staging.json

     # or using the npm convenience helper
     AUTO_APPLY=true SUPABASE_CONNECTION_STRING="<staging_conn>" \
       SUPABASE_SERVICE_ROLE_KEY="<staging_srk>" ABR_GUID="<staging_guid>" \
       npm run abn:batch:staging:apply
     ```
   - Confirm upserts completed and reply is successful.

5) Verify staging DB entries
   - Check distribution and matched_json content for test rows:
     ```sql
     -- check specific business ids
     SELECT id, business_id, abn, status AS verification_status, similarity_score, matched_json
     FROM abn_verifications
     WHERE business_id IN (1000, 1010);

     -- quick status distribution for the test set
     SELECT status, COUNT(*)
     FROM abn_verifications
     WHERE business_id IN (1000, 1010)
     GROUP BY status;
     ```
   - Verify `matched_json` for each row is either a parsed object with `Response.ResponseBody` or a JSON wrapper like `{ "raw": "<payload>" }` for XML/JSONP responses.

6) Inspect staging logs and job runs
   - Scheduled job logs / workflow logs:
     - `.github/workflows/abn-recheck.yml` run logs (if staged runs use pipeline) — check for any failures, timeouts or parsing warnings.
     - Staging instance logs for `scripts/abn_recheck.py` job — check for ABR HTTP errors or exceptions and ensure parsing warnings are rare.
   - Metrics to check:
     - Count of `rejected` / `manual_review` / `verified` for your test rows.
     - Any unexpected spikes in parsing errors or empty ABR responses.

7) Staging sign-off
   - If the controlled apply finds expected statuses and matched_json shape, and logs show no unexpected errors, sign off that staging is healthy and proceed to Production checklist.

---

# PRODUCTION ROLLOUT CHECKLIST (conservative, step-by-step)

Preconditions (must be satisfied before proceeding):
- Staging rollout completed and signed off.
- Backups/snapshots scheduled and ready for quick rollback. Confirm snapshot availability for the `abn_verifications` table/DB.
- A maintenance / rollout window selected and communicated to relevant stakeholders.

1) Confirm backups / snapshots
   - Take a DB snapshot or ensure a recent point-in-time backup exists. Capture the backup ID and retention policy.
   - Document rollback steps and owner in the runbook.

2) Confirm `matched_json` migration applied in production
   - Verify that migration `supabase/migrations/20251130000001_add_abn_matched_json.sql` has been successfully applied.
   - Run the same check as in staging:
     ```sql
     SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_name = 'abn_verifications' AND column_name = 'matched_json';
     ```

3) Pre-flight tests
   - Ensure CI tests are green (local/CI):
     ```bash
     npm test
     python3 scripts/test_abn_recheck.py -q
     ```
   - Validate connectivity to ABR and Supabase REST from the production environment in a small smoke test (non-destructive check).

4) Very small initial controlled apply in production (one-off)
   - Prepare a tiny selected allowlist (1–5 low-risk businessId/ABN pairs) — ideally entries under a test organization or specially flagged owners.
   - Option A (quick JSON) : prepare `prod_small_allowlist.json` with 1–5 entries and run the dry-run as shown below.
   - Option B (CSV → JSON generator, preferred): edit `DOCS/abn_allowlist.prod.csv`, then run the generator to produce `scripts/controlled_abn_list.prod.json`:

     ```bash
     npm run allowlist:prod
     # writes -> scripts/controlled_abn_list.prod.json
     ```

   - Run dry-run first to see the planned actions (generated file example):
     ```bash
     # dry-run via convenience script
     npm run abn:batch:prod
     # or explicit command using the generated JSON
     SUPABASE_CONNECTION_STRING="<prod_conn>" ABR_GUID="<prod_guid>" \
       python3 scripts/abn_controlled_batch.py --file=scripts/controlled_abn_list.prod.json
     ```
   - If results look good, run a single small apply (explicit flags required):
     ```bash
     # explicit apply using the generated file
     AUTO_APPLY=true SUPABASE_CONNECTION_STRING="<prod_conn>" \
       SUPABASE_SERVICE_ROLE_KEY="<prod_srk>" ABR_GUID="<prod_guid>" \
       python3 scripts/abn_controlled_batch.py --apply --file=scripts/controlled_abn_list.prod.json

     # or using the npm convenience helper
     AUTO_APPLY=true SUPABASE_CONNECTION_STRING="<prod_conn>" \
       SUPABASE_SERVICE_ROLE_KEY="<prod_srk>" ABR_GUID="<prod_guid>" \
       npm run abn:batch:prod:apply
     ```
   - Confirm updated rows in `abn_verifications` for those business IDs.

5) Enable AUTO_APPLY for scheduled re-check (controlled)
   - Option A (manual stage): Leave `AUTO_APPLY` disabled and run the scheduled job manually once daily for the first few cycles.
   - Option B (controlled automatic): Toggle `AUTO_APPLY=true` in the scheduled runner environment BUT only after verifying the small apply.
   - Strong recommendation: enable `AUTO_APPLY` in production gradually (e.g., start with a small maintenance window daily, then widen scope after 48–72 hours of monitoring).

6) Post-apply verification / safety checks
   - Immediately run queries to verify the test rows statuses, and confirm `matched_json` has been set as expected:
     ```sql
     SELECT business_id, abn, status, matched_json
     FROM abn_verifications
     WHERE business_id IN (<list_of_test_business_ids>);
     ```
   - Check status distribution for the affected records and run counts to ensure no unexpected bulk updates.

7) Monitoring for the first 24–72 hours (what to watch)
   - Key metrics / thresholds to watch:
     - Failure rate of scheduled re-check jobs (timeouts, HTTP 5xx from ABR). Any sustained increase > 0.5% should trigger investigation.
     - Spike in `rejected` or `manual_review` proportions compared to baseline — investigate whether ABR responses changed or parsing issues occurred.
     - DB write errors or rate-limit issues from Supabase REST.
   - Alerts / logs to check:
     - Job logs (cron / CI workflow logs) for `abn_recheck.py` and `abn_controlled_batch.py` runs.
     - Supabase audit logs for writes to `abn_verifications`.
     - Application error logs for any downstream effects.

8) Rollback plan
   - If unexpected bulk changes or data corruption occur, follow the rollback plan using the DB snapshot (restore to previous state), then disable `AUTO_APPLY` and revert PR if needed.

---

# Owner-facing note: final verification & governance
- After rollout, schedule a 24–72 hour validation: export a sample of updated `abn_verifications` rows and sample matched_json for manual audit.
- If any data correction is required, use `scripts/abn_controlled_batch.py` with allowlist to re-run corrections on a per-record basis rather than bulk edits.
- Keep an eye on ABR downstream changes — if ABR modifies schema or payload shapes (rare), update the parsing logic and re-run the controlled tests before widening `AUTO_APPLY` scope.

---

This checklist is saved in:
- `DOCS/ABN-Rollout-Checklist.md` (this file) — cross-references: `DOCS/ABR-ABN-Lookup.md`, `DOCS/ABN-Release-Notes.md`.

If you want, I can also add a short templated allowlist file for staging + prod to make the small-apply steps easier — tell me and I’ll add it (dry-run default, sensitive values left blank).
