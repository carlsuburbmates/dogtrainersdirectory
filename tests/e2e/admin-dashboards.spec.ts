import { test, expect, type Page, type Route } from '@playwright/test'

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

const cronSnapshot = {
  jobName: 'emergency/verify',
  checkedAt: new Date().toISOString(),
  lastSuccess: new Date().toISOString(),
  lastFailure: null,
  failureMessage: null
}

const telemetryState = {
  override: null as null | { service: string; status: string; reason?: string | null; expires_at: string }
}

const screenshotOptions = { fullPage: true, maxDiffPixelRatio: 0.02 }

async function wireAdminRoutes(page: Page) {
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
          abnRecheck: cronSnapshot,
          emergencyCron: cronSnapshot
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
      await route.fulfill({
        json: { override: telemetryState.override }
      })
      return
    }

    if (request.method() === 'DELETE') {
      telemetryState.override = null
      await route.fulfill({ json: { success: true } })
      return
    }

    await route.continue()
  })
}

test.describe('Admin dashboards', () => {
  test('AI health dashboard shows override state', async ({ page }) => {
    await wireAdminRoutes(page)

    await page.goto('/admin/ai-health')
    await expect(page.getByRole('heading', { name: 'AI Integration Health Status' })).toBeVisible()
    await expect(page.getByText('Service status', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Mark Down' }).click()
    await expect(page.getByText('Override:', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByText('Override:', { exact: false })).toHaveCount(0)
    await expect(page).toHaveScreenshot('admin-ai-health.png', screenshotOptions)
  })

  test('Cron health dashboard renders schedule snapshot', async ({ page }) => {
    telemetryState.override = null
    await wireAdminRoutes(page)

    await page.goto('/admin/cron-health')
    await expect(page.getByRole('heading', { name: 'Cron Job Health Status' })).toBeVisible()
    await expect(page.getByText('Scheduled Jobs')).toBeVisible()
    await expect(page).toHaveScreenshot('admin-cron-health.png', screenshotOptions)
  })
})
