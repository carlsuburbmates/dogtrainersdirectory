import { expect, test } from '@playwright/test'

test.describe('Admin dashboards', () => {
  test('AI health dashboard shows supervision state', async ({ page }) => {
    await page.goto('/admin/ai-health')
    await expect(page.getByRole('heading', { name: 'AI supervision' })).toBeVisible()
    await expect(page.getByText('Control model')).toBeVisible()
    await expect(page.getByText('Dashboard-first supervision', { exact: false })).toBeVisible()
    await expect(page.getByText('Shadow-capped', { exact: true }).first()).toBeVisible()
  })

  test('Cron health dashboard renders the current summary shell', async ({ page }) => {
    await page.goto('/admin/cron-health')
    await expect(page.getByRole('heading', { name: 'Cron Job Health' })).toBeVisible()
    await expect(page.getByText('Automated job execution status and error tracking')).toBeVisible()
  })
})
