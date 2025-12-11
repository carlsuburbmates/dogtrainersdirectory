import { test, expect } from '@playwright/test'
import { e2eSearchResults } from '@/lib/e2eTestUtils'

const searchFixtures = {
  results: e2eSearchResults,
  params: { suburbId: 999 }
}

const screenshotOptions = { fullPage: true, maxDiffPixelRatio: 0.02 }

test.describe('Search → Trainer profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ results, params }) => {
      sessionStorage.setItem('searchResults', JSON.stringify(results))
      sessionStorage.setItem('searchParams', JSON.stringify(params))
    }, searchFixtures)
  })

  test('navigates from search results to trainer profile', async ({ page }) => {
    await page.goto('/search')

    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible()
    await expect(page.getByText('Found 1 trainer')).toBeVisible()
    await expect(page).toHaveScreenshot('search-results.png', screenshotOptions)

    await page.getByRole('button', { name: 'View Profile' }).first().click()
    await expect(page).toHaveURL(/\/trainers\//)
    await expect(page.getByRole('heading', { name: e2eSearchResults[0].business_name })).toBeVisible()
    await expect(page).toHaveScreenshot('trainer-profile.png', screenshotOptions)
  })
})
