import { test, expect } from '@playwright/test'

const screenshotOptions = { fullPage: true, maxDiffPixelRatio: 0.02 }

test('Emergency controls toggle state and capture screenshot', async ({ page }) => {
  await page.goto('/emergency')

  const toggleButton = page.getByRole('button', { name: 'Enable Emergency Mode' })
  await expect(toggleButton).toBeVisible()
  await toggleButton.click()
  await expect(page.getByRole('button', { name: 'Disable Emergency Mode' })).toBeVisible()

  const textarea = page.getByPlaceholder('Emergency message or instructions...')
  await textarea.fill('Simulated triage drill instructions for E2E test')
  await expect(textarea).toHaveValue('Simulated triage drill instructions for E2E test')

  await expect(page).toHaveScreenshot('emergency-controls.png', screenshotOptions)
})
