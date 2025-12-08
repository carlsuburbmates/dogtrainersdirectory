// Input normalization utilities for profile data (phone, email, address)
// These functions provide consistent formatting and validation across the app.

// Normalize Australian phone numbers: keep only digits, format as +61 or 0X
export function normalizePhone(input: string | undefined | null): { value: string | null; valid: boolean; reason?: string } {
  if (!input) return { value: null, valid: false, reason: 'Missing phone' }
  const digits = input.replace(/\D+/g, '')

  // Remove leading 61 if present and convert to local format
  let local = digits
  if (digits.startsWith('61')) {
    local = '0' + digits.slice(2)
  }
  if (!local.startsWith('0')) {
    local = '0' + local
  }

  // Validate basic Australian phone number formats
  // Mobile: 04xxxxxxxx (10 digits), Landline: 0[2|3|7|8]xxxxxxx (10 digits)
  const isMobile = /^04\d{8}$/.test(local)
  const isLandline = /^0(2|3|7|8)\d{8}$/.test(local)

  if (!(isMobile || isLandline)) {
    return { value: local, valid: false, reason: 'Invalid AU phone format' }
  }

  return { value: local, valid: true }
}

// Basic email normalization: trim + lowercase + simple regex validation
export function normalizeEmail(input: string | undefined | null): { value: string | null; valid: boolean } {
  if (!input) return { value: null, valid: false }
  const email = String(input).trim().toLowerCase()
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return { value: email, valid: isValid }
}

// Address normalization: collapse spaces, standardize commas, optional postcode check
export function normalizeAddress(input: string | undefined | null): { value: string | null; valid: boolean } {
  if (!input) return { value: null, valid: false }
  let addr = input.trim()
  addr = addr.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ')
  // optional: simple postcode validation at end (3000-3999)
  const postcodeMatch = addr.match(/(\b3\d{3}\b)$/)
  const valid = postcodeMatch ? /^3\d{3}$/.test(postcodeMatch[1]) : true
  return { value: addr, valid }
}

export function dedupeStrings(values: (string | null | undefined)[]): string[] {
  const set = new Set<string>()
  for (const v of values) {
    const s = (v || '').trim()
    if (s) set.add(s)
  }
  return Array.from(set)
}
