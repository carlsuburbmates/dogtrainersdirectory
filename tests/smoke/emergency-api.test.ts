import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => {
  const mockClient = {
    rpc: vi.fn(),
    from: vi.fn()
  }
  return { supabaseAdmin: mockClient, supabase: mockClient }
})

vi.mock('@/lib/emergencyTriage', () => ({
  classifyEmergency: vi.fn(async () => ({
    classification: 'medical',
    confidence: 0.92,
    summary: 'Detected severe medical issue',
    recommended_action: 'vet',
    urgency: 'immediate'
  }))
}))

vi.mock('@/lib/medicalDetector', () => ({
  detectMedicalEmergency: vi.fn(async () => ({
    is_medical: true,
    severity: 'serious',
    symptoms: ['bleeding'],
    recommended_resources: ['24hr_vet'],
    vet_wait_time_critical: true
  }))
}))

vi.mock('@/lib/errorLog', () => ({
  logAPIError: vi.fn(),
  logError: vi.fn()
}))

vi.mock('@/lib/triageLog', () => ({
  createTriageLog: vi.fn(async () => 'triage-log-1'),
  createTriageEvent: vi.fn(async () => true)
}))

vi.mock('@/lib/llm', () => ({
  resolveLlmMode: vi.fn(() => { throw new Error('LLM disabled for smoke tests') }),
  generateLLMResponse: vi.fn()
}))

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { POST as emergencyTriagePOST } from '@/app/api/emergency/triage/route'
import { POST as emergencyVerifyPOST } from '@/app/api/emergency/verify/route'
import { GET as weeklyGET } from '@/app/api/emergency/triage/weekly/route'

vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

const tableHandlers = new Map<string, () => any>()

const registerTable = (table: string, handler: () => any) => {
  tableHandlers.set(table, handler)
}

beforeEach(() => {
  tableHandlers.clear()
  supabaseAdmin.from.mockImplementation((table: string) => {
    const handler = tableHandlers.get(table)
    if (!handler) {
      throw new Error(`No mock handler registered for table ${table}`)
    }
    return handler()
  })
})

describe('emergency triage API smoke test', () => {
  it('returns classification payload', async () => {
    const request = new NextRequest('http://localhost/api/emergency/triage', {
      method: 'POST',
      body: JSON.stringify({ message: 'Dog bleeding badly', suburbId: 15 })
    })

    const response = await emergencyTriagePOST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.classification.classification).toBe('medical')
    expect(body.medical?.severity).toBe('serious')
  })
})

describe('emergency verification cron smoke test', () => {
  beforeEach(() => {
    registerTable('emergency_resources', () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 1, phone: '+61 3 5555 1111', website: 'https://vet.test' }],
        error: null
      })
    }))

    registerTable('emergency_resource_verification_events', () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'verification-1' }, error: null })
    }))
  })

  it('writes verification event for a resource', async () => {
    const request = new NextRequest('http://localhost/api/emergency/verify', {
      method: 'POST',
      body: JSON.stringify({ resourceId: 1, phone: '+61 3 5555 1111', website: 'https://vet.test' })
    })

    const response = await emergencyVerifyPOST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.verification.verificationMethod).toBe('deterministic')
    expect(body.verification.resourceId).toBe(1)
  })
})

describe('weekly triage summary smoke test', () => {
  beforeEach(() => {
    registerTable('emergency_triage_logs', () => ({
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        data: [
          { classification: 'medical', priority: 'high', decision_source: 'llm' },
          { classification: 'stray', priority: 'medium', decision_source: 'human' }
        ],
        error: null
      })
    }))

    registerTable('emergency_triage_weekly_metrics', () => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  })

  it('aggregates seven-day metrics', async () => {
    const response = await weeklyGET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.metrics.total_triages).toBe(2)
    expect(body.metrics.classification_breakdown.medical).toBe(1)
  })
})
