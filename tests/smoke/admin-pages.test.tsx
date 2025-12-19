import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'

import { AiHealthDashboard } from '@/components/admin/AiHealthDashboard'
import { CronHealthDashboard } from '@/components/admin/CronHealthDashboard'

describe('admin dashboard smoke render', () => {
  it('renders AI health dashboard without crashing', () => {
    const html = renderToString(
      <AiHealthDashboard
        providerName="zai"
        baseUrl="https://api.z.ai/test"
        model="glm-4.6"
        initialSnapshot={{
          status: 'ok',
          message: 'All systems nominal',
          metrics: { successRate: 99, avgLatency: 200, errorTrend: 0, totalCalls: 123 }
        }}
      />
    )
    expect(html).toContain('AI Integration Health Status')
  })

  it('renders cron health dashboard without crashing', () => {
    const html = renderToString(
      <CronHealthDashboard
        initialSnapshot={{
          status: 'ok',
          message: 'Crons healthy',
          metrics: { successRate: 100, avgLatency: 100, errorTrend: 0, totalRuns: 100 }
        }}
      />
    )
    expect(html).toContain('Cron Job Health Status')
  })
})
