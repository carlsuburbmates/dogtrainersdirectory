import { describe, expect, it } from 'vitest'

import { enforceStatusRules } from '../../scripts/verify_launch'

describe('enforceStatusRules', () => {
  it('keeps WARN status for DNS checks', () => {
    expect(enforceStatusRules('DNS root → Vercel', 'WARN')).toBe('WARN')
  })

  it('converts WARN to FAIL for non-DNS checks', () => {
    expect(enforceStatusRules('ABN fallback rate', 'WARN')).toBe('FAIL')
  })

  it('leaves PASS statuses unchanged', () => {
    expect(enforceStatusRules('lint', 'PASS')).toBe('PASS')
  })
})
