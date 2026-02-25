import { test, expect } from '@playwright/test'
import { e2eSearchResults } from '@/lib/e2eTestUtils'

const searchFixtures = {
  results: e2eSearchResults,
  params: { suburbId: 999 }
}

test.describe('Search → Trainer profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ results, params }) => {
      sessionStorage.setItem('searchResults', JSON.stringify(results))
      sessionStorage.setItem('searchParams', JSON.stringify(params))
      if (results?.[0]?.business_id) {
        sessionStorage.setItem(
          `e2e_trainer_${results[0].business_id}`,
          JSON.stringify({
            business_name: results[0].business_name,
            suburb: results[0].suburb_name
          })
        )
      }
    }, searchFixtures)
  })

  test('navigates from search results to trainer profile', async ({ page }) => {
    await page.route('**/api/public/search**', async (route) => {
      const requestUrl = new URL(route.request().url())
      const pageParam = Number(requestUrl.searchParams.get('page') || '1')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: e2eSearchResults,
          metadata: {
            total: e2eSearchResults.length,
            limit: 20,
            page: pageParam,
            hasMore: false
          }
        })
      })
    })

    const requestPromise = page.waitForRequest((request) =>
      request.url().includes('/api/public/search') && request.method() === 'GET'
    )

    await page.goto('/search?q=calm')

    const searchRequest = await requestPromise
    const requestUrl = new URL(searchRequest.url())
    expect(requestUrl.searchParams.get('q')).toBe('calm')
    expect(requestUrl.searchParams.get('query')).toBeNull()
    expect(requestUrl.searchParams.get('page')).toMatch(/^\d+$/)
    expect(requestUrl.searchParams.get('offset')).toBeNull()

    await expect(page.getByPlaceholder('Search by name, location, or specialty...')).toHaveValue('calm')
    await expect(page.getByRole('heading', { name: e2eSearchResults[0].business_name }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'View Profile' }).first()).toBeVisible()

    const profileHref = await page.getByRole('link', { name: 'View Profile' }).first().getAttribute('href')
    expect(profileHref).toMatch(/\/trainers\/\d+/)
    await page.goto(profileHref!)
    await expect(page).toHaveURL(/\/trainers\//)
    await expect(page.getByRole('heading', { name: e2eSearchResults[0].business_name })).toBeVisible()
  })
})
