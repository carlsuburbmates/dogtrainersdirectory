import { test, expect, type Page, type Route } from '@playwright/test'

const screenshotOptions = { fullPage: true, maxDiffPixelRatio: 0.02 }
const healthPayload = {
  status: 'healthy',
  metrics: {
    successRate: 100,
    avgLatency: 1200,
    errorTrend: 0,
    totalCalls: 15
  },
  message: 'LLM health check succeeded',
  lastCheck: new Date().toISOString()
}

const telemetryState = {
  override: null as null | { service: string; status: string; reason?: string | null; expires_at: string }
}

type SubscriptionState = {
  status: 'inactive' | 'active' | 'past_due'
}

const monetizationState: SubscriptionState = {
  status: 'inactive'
}

function buildMonetizationPayload() {
  const counts = {
    active: monetizationState.status === 'active' ? 1 : 0,
    past_due: monetizationState.status === 'past_due' ? 1 : 0,
    cancelled: 0,
    inactive: monetizationState.status === 'inactive' ? 1 : 0,
    other: 0
  }
  return {
    summary: {
      counts,
      failureRate: 0,
      failureCount: 0,
      syncErrorCount: 0,
      totalEvents: 1,
      health: monetizationState.status === 'active' ? 'ok' : 'attention'
    },
    statuses: [
      {
        business_id: 101,
        plan_id: 'price_test',
        status: monetizationState.status,
        current_period_end: null,
        last_event_received: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        business: { name: 'Calm Companion', verification_status: 'verified' }
      }
    ],
    recentFailures: [],
    syncErrors: []
  }
}

async function wireAdminBasics(page: Page) {
  const overviewPayload = {
    digest: { summary: 'Ops digest (stub)', metrics: { onboarding_today: 0 } },
    trainerSummary: { total: 0, verified: 0 },
    emergencySummary: { resources: 0, pendingVerification: 0, lastVerificationRun: null },
    triageSummary: { weeklyMetrics: null, pendingLogs: [] },
    dlqSummary: { failedJobs: [], totalEvents: 0, recentFailures: 0, webhookFailures: [] }
  }

  await page.route('**/api/health/llm', async (route: Route) => {
    await route.fulfill({ json: healthPayload })
  })

  await page.route('**/api/admin/health**', async (route: Route) => {
    await route.fulfill({
      json: {
        overall: 'healthy',
        components: {
          cron: { status: 'healthy', message: 'Cron jobs nominal' },
          supabase: { status: 'healthy', message: 'DB ok' },
          llm: { status: 'healthy', message: 'LLM ok' }
        },
        metrics: healthPayload.metrics,
        schedule: ['*/5 * * * * — Emergency verify'],
        telemetry: {
          overrides: telemetryState.override ? [telemetryState.override] : [],
          abnRecheck: { lastSuccess: new Date().toISOString(), lastFailure: null },
          emergencyCron: { lastSuccess: new Date().toISOString(), lastFailure: null }
        }
      }
    })
  })

  await page.route('**/api/admin/ops/overrides**', async (route: Route) => {
    const request = route.request()
    if (request.method() === 'GET') {
      await route.fulfill({ json: { overrides: telemetryState.override ? [telemetryState.override] : [] } })
      return
    }
    if (request.method() === 'POST') {
      const body = (await request.postDataJSON()) as { service: string; status: string; reason?: string }
      telemetryState.override = {
        service: body.service,
        status: body.status,
        reason: body.reason ?? null,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
      await route.fulfill({ json: { override: telemetryState.override } })
      return
    }
    if (request.method() === 'DELETE') {
      telemetryState.override = null
      await route.fulfill({ json: { success: true } })
      return
    }
    await route.continue()
  })

  await page.route('**/api/admin/overview', async (route: Route) => {
    await route.fulfill({ json: overviewPayload })
  })

  await page.route('**/api/admin/telemetry/latency', async (route: Route) => {
    await route.fulfill({
      json: { generatedAt: new Date().toISOString(), metrics: {} }
    })
  })

  await page.route('**/api/admin/queues', async (route: Route) => {
    await route.fulfill({
      json: { reviews: [], abn_verifications: [], flagged_businesses: [] }
    })
  })

  await page.route('**/api/admin/scaffolded', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ json: { success: true } })
      return
    }
    await route.fulfill({ json: { scaffolded: [] } })
  })

  await page.route('**/api/admin/abn/fallback-stats', async (route: Route) => {
    await route.fulfill({ json: { fallbackCount: 0, verificationCount: 0, rate: 0, windowHours: 24, events: [] } })
  })
}

test.describe('Monetization upgrade flow', () => {
  test.beforeEach(async ({ page }) => {
    monetizationState.status = 'inactive'

    await page.route('**/api/stripe/create-checkout-session', async (route: Route) => {
      await route.fulfill({
        json: {
          checkoutUrl: 'https://checkout.stripe.com/test-e2e?session=stub',
          sessionId: 'test_e2e_session'
        }
      })
    })

    await page.route('**/api/webhooks/stripe', async (route: Route) => {
      monetizationState.status = 'active'
      await route.fulfill({ json: { received: true } })
    })

    await page.route('**/api/admin/monetization/overview', async (route: Route) => {
      await route.fulfill({ json: buildMonetizationPayload() })
    })

    await page.route('**/api/admin/monetization/resync', async (route: Route) => {
      monetizationState.status = 'active'
      await route.fulfill({ json: { status: 'active' } })
    })

    await wireAdminBasics(page)
  })

  test('provider upgrade and admin subscription tab', async ({ page }) => {
    await page.goto('/promote?businessId=101')
    await expect(page.getByRole('heading', { name: 'Promote my listing' })).toBeVisible()
    await page.getByRole('button', { name: 'Upgrade now' }).click()
    await expect(page.getByText('E2E preview: would redirect')).toBeVisible()

    // Simulate Stripe webhook to activate subscription
    const webhookOk = await page.evaluate(async () => {
      const res = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'evt_test', type: 'customer.subscription.updated' })
      })
      return res.ok
    })
    expect(webhookOk).toBeTruthy()

    await page.goto('/admin')
    await page.getByRole('button', { name: 'MONETIZATION' }).click()
    await expect(page.getByText('Calm Companion')).toBeVisible()
    const activeCard = page.locator('div').filter({ hasText: 'Active subscriptions' }).first()
    await expect(activeCard).toContainText('1')
    await expect(page).toHaveScreenshot('monetization-upgrade.png', screenshotOptions)
  })

  test('hides upgrade CTA when feature flag disabled', async ({ page }) => {
    await page.goto('/promote?businessId=101&flag=off')
    await expect(page.getByText('Monetization is currently disabled')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upgrade now' })).toHaveCount(0)
  })

  test('requires ABN verification before upgrade', async ({ page }) => {
    await page.goto('/promote?businessId=101&abn=0')
    await expect(page.getByText('Complete ABN verification', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upgrade now' })).toHaveCount(0)
  })
})
