# ABN Lookup Integration Spec — ABR / Web Services

Version: 2025-12-01

This document describes how to integrate ABN validation and look-up functionality from ABR into a web application. It is intended for backend developers implementing directory and registration features (e.g. business signup, directory auto-validation, periodic re-verification).

## 1. Purpose & Scope

This document covers: obtaining a GUID, calling ABN/ACN/Name lookup methods, interpreting results (including edge cases), handling data caching/rate-limiting, and recommended usage patterns (dev vs production).

Use cases: ABN validation, pre-fill business data on form submission, synchronise and refresh business details stored in your database.

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

- Put this file at `/DOCS/ABR-ABN-Lookup.md` so developer onboarding and audits reference it.
- Implement a service module in your backend (e.g. `/lib/abr-lookup.ts`) and keep GUID in env/secrets.

## 9. References & Links

- ABR Lookup Web Services documentation
- ABR JSON / JSONP endpoints examples

---

If you'd like, I can:
- Add `/lib/abr-lookup.ts` (TypeScript wrapper) to the repo with caching/ rate-limit stubs, or
- Add a small integration test or example server-side endpoint that calls ABR with the GUID (dry-run only).

Tell me which next step you prefer and I'll take care of it.
