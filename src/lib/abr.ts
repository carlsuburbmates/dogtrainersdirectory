/*
 *  ABR / ABN Lookup integration — developer note
 *
 *  Source: Australian Business Register ABRXMLSearch Web Services
 *  ---------------------------------------------------------------
 *  - We use the SOAP method “SearchByABNv202001” for ABN validation.
 *  - Requests require an authentication GUID (secret, do not expose to clients).
 *  - ABR data is public-only. Returned fields beyond ABN & ABNStatus are optional:
 *      • businessName(s), GST status, address (state/postcode), ACN/ASIC, historical names, etc.
 *      • Full street address, contact info, private data are NOT provided.
 *  - ABR is read-only: we cannot update business records via API.
 *  - ABR registry is updated hourly — treat cached/ stored data as potentially stale after ~1 hr.
 *
 *  Usage guidelines:
 *  - Only mark ABN “verified” when ABN exists AND ABNStatus === 'Active'.
 *  - Always treat all non-required fields as optional. Use optional chaining / null checks.
 *  - Persist raw API payload (XML or JSON) for audit / future re-verification (e.g. in matched_json column).
 *  - Do not rely on businessName or address for mandatory profile completeness or user onboarding approval.
 *
 *  If ABR returns minimal or no data (suppressed entry):
 *  - Fallback to manual review or require user-supplied documentation/verification.
 */
/**
 * ABR / SearchByABNv202001 — integration guidelines
 * -------------------------------------------------
 * IMPORTANT (developer note): ABR Web Services are an authoritative, read-only
 * government dataset. This module provides helpers that parse ABR responses
 * (JSON/JSONP and SOAP/XML) and map the most important public fields into a
 * lightweight AbrSearchResponse-like object used by our verification flows.
 *
 * Key constraints and guarantees you must respect when changing this file:
 * - ABR is READ-ONLY: you may only fetch public data for ABNs. Do not attempt
 *   to write or claim ABNs via the ABR API — it only exposes public fields.
 * - Minimal guarantees: except for ABN and ABNStatus, most fields in ABR
 *   responses are OPTIONAL and many ABNs may be "suppressed". Do NOT assume
 *   businessName, GST, address, or contact details will be present.
 * - SOAP preference: use SearchByABNv202001 (SOAP) for richest payloads.
 *   The JSON endpoints are a lightweight fallback (they return JSONP wrappers
 *   in many cases) — backends must strip the wrapper before parsing.
 * - Always persist the raw ABR payload (XML or the stripped JSON) to
 *   `abn_verifications.matched_json` (jsonb/text) for audit and re-verification.
 * - Database schema must accept null/missing values for optional fields —
 *   never invent or backfill private data that ABR does not return.
 * - Verification rule: mark an ABN as VERIFIED only when ABN exists and
 *   ABNStatus indicates it is `Active`. Name matching is secondary and may be
 *   used for confidence scoring, but absence of a name must not prevent a
 *   correct status evaluation (ABN + ABNStatus is authoritative).
 * - Secrets: ABR GUID/API keys are server-side only. Never expose them to
 *   frontend or logs. Treat them as sensitive repo/CI secrets.
 *
 * Testing & safety:
 * - Add unit tests (mocked SOAP responses) for full/partial/suppressed/invalid
 *   ABN cases. This module ships safe parsing helpers but not full network
 *   management (i.e. retries/rate-limiting should be handled by call sites).
 * - Keep this parser conservative: it maps key public fields and returns
 *   optional values so the caller can decide verification / manual review.
 */
import type { AbrSearchResponse } from '../../types/abr'

/**
 * Strip a JSONP wrapper if present. Example: callback({...}) -> {...}
 */
export function stripJsonp(raw: string): string {
  const trimmed = raw.trim()
  // Match callbackName({...}) optional trailing semicolon/newlines
  // Accept any callback name and capture contents between the parentheses.
  // Use [\s\S]* instead of the /s flag for broader TS target compatibility.
  const m = trimmed.match(/^[A-Za-z_$][A-Za-z0-9_$]*\(([\s\S]*)\);?$/)
  if (m && m[1]) {
    return m[1].trim()
  }
  return raw
}

/** Validate ABN format using the official algorithm (11 digits + checksum). */
export function isValidAbn(abn: string): boolean {
  if (!abn) return false
  const digits = (abn + '').replace(/\D/g, '')
  if (digits.length !== 11) return false
  // Weight factors per ABN algorithm
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  const nums = digits.split('').map((d) => parseInt(d, 10))
  // Subtract 1 from the first digit
  nums[0] = nums[0] - 1
  let sum = 0
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i] * weights[i]
  }
  return sum % 89 === 0
}

/** Best-effort parse of ABR JSON responses. Will strip JSONP and attempt JSON.parse. */
export function parseAbrJson(raw: string): AbrSearchResponse | any | null {
  try {
    const stripped = stripJsonp(raw)
    const parsed = JSON.parse(stripped)
    // If payload looks like ABR SOAP->JSON mapping, return as AbrSearchResponse
    if (parsed && (parsed.Response || parsed.AbnDetails || parsed.AbnDetails)) {
      return parsed as AbrSearchResponse | any
    }
    return parsed
  } catch (err) {
    return null
  }
}

/**
 * Minimal namespace-agnostic SOAP XML parser for ABR SearchByABN responses.
 * This is intentionally conservative — it extracts the most important public
 * fields (ABN, ABNStatus, EntityName, BusinessName[], PreviousAbn[], Gst, MainBusinessAddress).
 */
export function parseAbrSoap(xml: string): AbrSearchResponse | null {
  try {
    // Remove namespace prefixes (e.g., xmlns:abr) and collapse the xml to ease regex searches
    const clean = xml
      .replace(/xmlns:[^=]+="[^"]+"/g, '')
      .replace(/<[A-Za-z0-9_\-]+:/g, '<')
      .replace(/<\/?[A-Za-z0-9_\-]+:/g, '<')

    const extractSingle = (tag: string) => {
      // match optional namespace prefix e.g. <ns:Tag>value</ns:Tag> or <Tag>value</Tag>
      const re = new RegExp(`<(?:[A-Za-z0-9_\\-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_\\-]+:)?${tag}[^>]*>`, 'i')
      const m = clean.match(re)
      return m ? m[1].trim() : undefined
    }

    const extractAll = (tag: string) => {
      const re = new RegExp(`<(?:[A-Za-z0-9_\\-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_\\-]+:)?${tag}[^>]*>`, 'gi')
      const matches: string[] = []
      for (let match = re.exec(clean); match !== null; match = re.exec(clean)) {
        matches.push(match[1].trim())
      }
      return matches
    }

    const abn = extractSingle('ABN') || extractSingle('abn')
    const abnStatus = extractSingle('ABNStatus') || extractSingle('abnStatus')
    const entityName = extractSingle('EntityName') || extractSingle('entityName') || extractSingle('LegalName')
    const businessNames = extractAll('BusinessName').length ? extractAll('BusinessName') : extractAll('businessName')
    const previousAbn = extractAll('PreviousAbn').length ? extractAll('PreviousAbn') : extractAll('previousAbn')

    const gstFlag = extractSingle('GstFlag') || extractSingle('gstFlag')
    const gstFrom = extractSingle('GstEffectiveFrom') || extractSingle('gstFrom')

    const state = extractSingle('State') || extractSingle('state')
    const postcode = extractSingle('Postcode') || extractSingle('postcode')

    const body: any = {
      Response: {
        ResponseBody: {
          ABN: abn,
          ABNStatus: abnStatus,
          EntityName: entityName,
          BusinessName: businessNames.length ? businessNames : undefined,
          PreviousAbn: previousAbn.length ? previousAbn : undefined,
          Gst: gstFlag || gstFrom ? { GstFlag: gstFlag, GstEffectiveFrom: gstFrom } : undefined,
          MainBusinessAddress: state || postcode ? { State: state, Postcode: postcode } : undefined
        }
      }
    }

    return body as AbrSearchResponse
  } catch (err) {
    return null
  }
}

/**
 * Fetch ABR JSON endpoint (which commonly returns JSONP). Will return { status, body, parsed }.
 * Keep this lightweight and robust — SOAP handling is planned next.
 */
export async function fetchAbrJson(abn: string, guid?: string): Promise<{ status: number; body: string; parsed?: AbrSearchResponse | any | null }>{
  const base = 'https://abr.business.gov.au/json/AbnDetails.aspx'
  const params = new URLSearchParams({ abn })
  if (guid) params.set('guid', guid)
  // Some ABR clients add callback to force JSONP; we'll not set it by default so we may receive raw JSON or JSONP — parser handles both
  const url = `${base}?${params.toString()}`

  const res = await fetch(url, { method: 'GET' })
  const body = await res.text()
  const parsed = parseAbrJson(body)
  return { status: res.status, body, parsed }
}

const abrHelpers = {
  stripJsonp,
  parseAbrJson,
  fetchAbrJson,
  isValidAbn
}

export default abrHelpers
