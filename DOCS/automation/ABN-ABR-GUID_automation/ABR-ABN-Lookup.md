# ABN Lookup Integration Spec — ABR / Web Services

Version: 2025-12-01

This document describes how to integrate ABN validation and look-up functionality from ABR into a web application. It is intended for backend developers implementing directory and registration features (e.g. business signup, directory auto-validation, periodic re-verification).

## 1. Purpose & Scope

This document covers: obtaining a GUID, calling ABN/ACN/Name lookup methods, interpreting results (including edge cases), handling data caching/rate-limiting, and recommended usage patterns (dev vs production).

Use cases: ABN validation, pre-fill business data on form submission, synchronise and refresh business details stored in your database.

## 1.1 Canonical ABN Verification Flow (Owner Contract)

This section describes the non-negotiable behaviour of ABN verification in the product. Support tooling (batch scripts, flags, runbooks) must not change this contract.

1. User submits or updates an ABN
   - When a business owner enters or updates their ABN:
     - The backend calls ABR (ABN Lookup) once on the server using our GUID.
     - The ABN is treated as **verified** only if:
       - ABR returns an entity for that ABN, and
       - ABN status is `Active` (or another explicitly whitelisted status defined in code).
    - The verification outcome is stored in `abn_verifications` and `matched_json` contains the raw or parsed ABR payload.
      - Note: the documentation sometimes uses the word "invalid ABN"; in the database this is represented as verification_status = 'rejected'.
      - Valid outcomes: `verified`, `manual_review`, `rejected` (rejected = invalid ABN)

2. API responsibilities
   - The primary API endpoint for this flow (e.g. `/api/abn/verify`) MUST:
     - Validate ABN format server-side.
     - Call ABR via SOAP (preferred) or JSON/JSONP (fallback) on the server only (GUID never exposed to clients).
     - Map ABR response into an internal type (e.g. `abnData`) and verification flags.
     - Persist the outcome and raw payload when automated writes are enabled.

3. Scheduled re-check job
   - A scheduled job periodically re-checks stored ABNs:
     - Uses the same lookup rules as the API (same “verified” definition).
     - Updates `abn_verifications` rows when ABN status or key public fields change (e.g. `Active` → `Cancelled`).
     - Runs in dry-run mode by default in new environments and in apply mode once validated.

4. Ops-only batch script
   - The controlled batch runner (`scripts/abn_controlled_batch.py`) uses a generated allowlist file (scripts/controlled_abn_list.{staging,prod}.json) — example archived at `scripts/examples/controlled_abn_list.example.json`. This runner is **operations-only**:
     - Used for small backfills, audits, or owner-approved batches.
     - Defaults to dry-run, requires `AUTO_APPLY=true` + service-role key + explicit flags for writes.
     - Must never be used as the primary user-facing verification path.

## 2. Overview of ABR Web Services

- ABR provides a public Web Services API for ABN/ACN/name lookup. Access requires registration and a GUID.
- The service is read-only. Use it to fetch public ABN records (not for any write operations).

## 3. Methods / API Variants

### 3.1 SOAP / XML Web Methods

- Full SOAP/XML endpoints exist with WSDL. Prefer the latest method (e.g., SearchByABNv202001 when supported).
- Typical parameters:
  - searchString: the ABN to validate
  - includeHistoricalDetails: "Y" or "N"
  - authenticationGuid: your registered GUID

### 3.2 JSON / JSONP Endpoint (lightweight)

- ABR also provides a JSONP-style endpoint for quick lookups, for example:
  `AbnDetails.aspx?abn=<ABN>&guid=<GUID>&callback=<callbackName>`
- JSONP responses are wrapped in a callback (e.g. `callback({...})`) — strip the wrapper on the server-side before parsing.

## 4. Data Returned & Public vs Suppressed Fields

- On success you typically get a `Business entity` object containing fields such as ABN (11-digit), ABN status, GST registration status, legal/entity name, main state/postcode, business names and other optional baked-in attributes.
- Suppressed ABNs: the ABR may return minimal data for suppressed ABNs; code must tolerate missing fields and fail gracefully.

## 5. Limitations & Compliance Notes

- ABR endpoints are read-only and return only public data. Do not expect to retrieve private contact details.
- Trading names are deprecated; prefer entity/legal name when making verification decisions.

## 6. Integration Design Recommendations

Recommended pattern for backend integration:

1. Store GUID securely (env var or secret). Do not expose the GUID to frontend clients.
2. Local pre-validation: validate ABN format using a checksum algorithm locally to reduce unnecessary API calls.
3. Use server-side calls to ABR (SOAP or JSONP), prefer backend-to-backend for full reliability.
4. Parse responses carefully and handle suppressed/partial responses.
5. Cache results and rate-limit lookups (e.g., Redis or short-lived DB cache).
6. Persist returned data and timestamp into your DB (and schedule re-verification jobs).
  - Persist the full raw ABR payload into a json/jsonb column (repo uses `abn_verifications.matched_json`). A migration exists at `supabase/migrations/20251130000001_add_abn_matched_json.sql` — apply via Supabase Dashboard if CI runners cannot reach the DB directly.
7. Handle ABR errors with clear fallback / manual review instructions.
8. Ensure you follow ABR usage terms and do not leak the GUID.

## 7. Sample Module (TypeScript / Node.js)

Below is a small sample showing how to call the JSONP endpoint and strip the wrapper. This is intentionally small — in production add retries, caching and robust error handling.

```ts
// abr-lookup.ts
import fetch from 'node-fetch';

const ABR_JSON_BASE = 'https://abr.business.gov.au/json/AbnDetails.aspx';

export interface AbrBusinessInfo {
  abn: string;
  abnStatus: string;
  abnStatusEffective?: string;
  entityName?: string;
  gstFrom?: string | null;
  mainState?: string;
  mainPostcode?: string;
  businessNames?: string[];
}

function stripJsonp(text: string): string {
  const m = text.trim().match(/^[^(]+\((.*)\)[^)]*$/s);
  if (!m) throw new Error('Unexpected ABR response format');
  return m[1];
}

export async function lookupABN(abn: string, guid: string): Promise<AbrBusinessInfo | null> {
  const url = `${ABR_JSON_BASE}?abn=${encodeURIComponent(abn)}&guid=${encodeURIComponent(guid)}&callback=callback`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`ABR request failed: HTTP ${resp.status}`);
  const raw = await resp.text();
  const json = JSON.parse(stripJsonp(raw));
  const d = json.AbnDetails;
  if (!d) return null;
  return {
    abn,
    abnStatus: d.AbnStatus,
    abnStatusEffective: d.AbnStatusFrom,
    entityName: d.EntityName || undefined,
    gstFrom: d.GstFrom || null,
    mainState: d.MainBusinessAddress?.State || undefined,
    mainPostcode: d.MainBusinessAddress?.Postcode || undefined,
    businessNames: Array.isArray(d.BusinessName) ? d.BusinessName : (d.BusinessName ? [d.BusinessName] : []),
  };
}
```

## 8. Suggested Project Placement

- Canonical path: `DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md` so developer onboarding and audits reference it.
- Implement a service module in your backend (e.g. `/lib/abr-lookup.ts`) and keep GUID in env/secrets.
  - Ensure `matched_json` (jsonb) is added to `abn_verifications` before enabling automated writes. See `supabase/migrations/20251130000001_add_abn_matched_json.sql`.
  - Runbook for manually applying the migration (Supabase Dashboard) is available at `DOCS/ABR-migration-matched_json.md`.

## 9. References & Links

- ABR Lookup Web Services documentation
- ABR JSON / JSONP endpoints examples

---

If you'd like, I can:
- Add `/lib/abr-lookup.ts` (TypeScript wrapper) to the repo with caching/ rate-limit stubs, or
- Add a small integration test or example server-side endpoint that calls ABR with the GUID (dry-run only).

## Controlled Rollout — small, manual, safe write tests

When you're ready to do small, human-triggered writes to `abn_verifications.matched_json` use the controlled batch runner in `scripts/abn_controlled_batch.py`.

Purpose: run a very small, explicit set of `business_id` + `abn` pairs, verify the ABR responses and optionally write the results to the DB in a tightly controlled way. This runner is an ops-only tool for controlled batches; it does not replace the normal per-request ABN verification flow used by the product. The script defaults to dry-run and refuses large batches unless you explicitly opt-in.

Quick checklist:

- Pre-conditions:
  - `supabase/migrations/20251130000001_add_abn_matched_json.sql` applied and verified in production or target DB.
  - ABR credentials available (ABR_GUID) and SUPABASE_SERVICE_ROLE_KEY present for writes.

- Dry run (recommended first):
  1. Add or review your small list of `businessId` + `abn` pairs by running the generator to produce `scripts/controlled_abn_list.staging.json` or `scripts/controlled_abn_list.prod.json`, or edit `scripts/abn_controlled_batch.py` DEFAULT_ALLOWLIST. An archived example is at `scripts/examples/controlled_abn_list.example.json`.
  2. Run:
     ```bash
     SUPABASE_CONNECTION_STRING="<your_conn>" ABR_GUID="<your_guid>" python3 scripts/abn_controlled_batch.py
     ```
  3. Confirm no DB writes occurred and the logs show results for each pair.

- Single small apply (one-off):
  1. Ensure `AUTO_APPLY=true` is set in your environment when running (do NOT set it globally yet!).
  2. Ensure SUPABASE_SERVICE_ROLE_KEY is present (server-side service role) in the environment.
  3. Run the script in apply mode:
     ```bash
     AUTO_APPLY=true SUPABASE_CONNECTION_STRING="<your_conn>" SUPABASE_SERVICE_ROLE_KEY="<srk>" ABR_GUID="<your_guid>" python3 scripts/abn_controlled_batch.py --apply
     ```
  4. Verify `matched_json` is populated and the `abn_verifications` rows reflect the expected `verified`/`manual_review` state.

- Observability — what to look for:
  - Script log entries for each ABN: ABNStatus, verified/manual_review decisions and whether the script attempted insert/update.
  - Supabase changes: `SELECT id, abn, matched_json FROM abn_verifications WHERE matched_json IS NOT NULL LIMIT 20;`
  - Error patterns: timeouts, HTTP 5xx from ABR, or HTTP 4xx/5xx from Supabase REST.

- Decision point:
  - If small patches look good, consider enabling `AUTO_APPLY=true` for a controlled cron job with limited batch size.
  - NEVER enable AUTO_APPLY globally in CI before you've validated behavior with this script.

Script safeguards (highlights):
 - Default dry-run mode.
 - Requires `AUTO_APPLY=true` and `SUPABASE_SERVICE_ROLE_KEY` to perform writes.
 - Refuses to process more than 20 items without `--allow-bulk`.
 - Script avoids printing secrets; do not echo environment variable values in logs.

Location and quick run examples
 - Script: `scripts/abn_controlled_batch.py`
 - Example dry-run:
   - `SUPABASE_CONNECTION_STRING="<conn>" ABR_GUID="<guid>" python3 scripts/abn_controlled_batch.py`
 - Example apply one-off:
   - `AUTO_APPLY=true SUPABASE_CONNECTION_STRING="<conn>" SUPABASE_SERVICE_ROLE_KEY="<srk>" ABR_GUID="<guid>" python3 scripts/abn_controlled_batch.py --apply`

Use this script to validate small write tests before enabling automated/cron updates.

How to prepare the allowlist file
--------------------------------

- Create a JSON file with an explicit, minimal list of businessId / ABN pairs you want to test. Example (do NOT include sensitive production data unless you are ready to write):

```json
[
  { "business_id": 123, "abn": "11122233344" },
  { "business_id": 456, "abn": "55566677788" }
]
```

- Save it somewhere safe (for example, create `scripts/controlled_abn_list.staging.json` or `scripts/controlled_abn_list.prod.json`, or consult the archived example at `scripts/examples/controlled_abn_list.example.json`) and pass `--file` to the script, or edit `DEFAULT_ALLOWLIST` carefully. You must manually provide/verify the real values — **do not** rely on the repository to populate this list for you.

Interpreting the output
-----------------------

After running the script (dry-run or apply), the script prints a JSON summary and logs one line per input pair. For each record you should check:

- ABN — the ABN that was sent to ABR.
- ABNStatus — ABR's returned status string (e.g., `Active`, `Cancelled`, `NotFound`, or `Suppressed`).
- verified/manual_review — the script's decision about whether the ABN is treated as `verified` (ABNStatus === 'Active') or requires manual review.
- planned action — what the script would/attempted to do: `insert` (no existing row) / `update id=<n>` (row exists) / `no_response` / `dry-run`.

What a good dry-run looks like
 - Each entry returns a clear ABNStatus from ABR and a planned action of `insert` or `update` (or `no_response` if ABR had no answer).
 - No rows in the DB are modified and matched_json remains untouched.

What should make you stop & investigate
 - ABR responses are missing or inconsistent across runs (e.g., timeouts or parsing errors).
 - The script's planned action looks unexpectedly destructive (e.g., would update many rows, or mismatch business_id pairing).
 - You see `ABNStatus` values that don't align with available documentation for expected ABNs (e.g. an Active ABN you expect is NotFound).

If any of the above happens, stop and fix the input list or investigate the ABR responses before running with `--apply`.

Tell me which next step you prefer and I'll take care of it.
