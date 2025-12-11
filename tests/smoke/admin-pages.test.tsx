import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'

import AiHealthPage from '@/app/admin/ai-health/page'
import CronHealthPage from '@/app/admin/cron-health/page'
import { AiHealthDashboard } from '@/components/admin/AiHealthDashboard'
import { CronHealthDashboard } from '@/components/admin/CronHealthDashboard'

describe('admin dashboard smoke render', () => {
  it('renders AI health page without crashing', () => {
    const html = renderToString(<AiHealthPage />)
    expect(html).toContain('AI Integration Health Status')
  })

  it('renders cron health page without crashing', () => {
    const html = renderToString(<CronHealthPage />)
    expect(html).toContain('Cron Job Health Status')
  })
})

describe('admin dashboard failure simulations', () => {
  it('shows degraded copy when AI health snapshot reports down', () => {
    const html = renderToString(
      <AiHealthDashboard
        providerName="zai"
        baseUrl="https://api.z.ai/test"
        model="glm-4.6"
        initialSnapshot={{
          status: 'down',
          message: 'LLM timeout detected',
          metrics: { successRate: 0, avgLatency: 5000, errorTrend: 12, totalCalls: 0 }
        }}
      />
    )
    expect(html).toContain('LLM timeout detected')
    expect(html).toContain('DOWN')
  })

  it('shows warning when cron health snapshot is degraded', () => {
    const html = renderToString(
      <CronHealthDashboard
        initialSnapshot={{
          status: 'degraded',
          message: 'ABN recheck backlog > 5 minutes',
          metrics: { successRate: 80, avgLatency: 2400, errorTrend: 5, totalRuns: 128 },
          scheduleSummary: ['*/5 * * * * — Emergency verification cron']
        }}
      />
    )
    expect(html).toContain('ABN recheck backlog &gt; 5 minutes')
    expect(html).toContain('DEGRADED')
  })
})
