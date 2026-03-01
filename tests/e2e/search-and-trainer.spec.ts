import { test, expect } from '@playwright/test'
import { e2eSearchResults } from '@/lib/e2eTestUtils'

const searchFixtures = {
  results: e2eSearchResults,
  params: { suburbId: 999 }
}

const secondPageResult = {
  ...e2eSearchResults[0],
  business_id: e2eSearchResults[0].business_id + 1,
  business_name: `${e2eSearchResults[0].business_name} Follow Up`
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
    expect(requestUrl.searchParams.get('page')).toBe('1')
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

  test('auto-search starts on page one and load more advances to page two', async ({ page }) => {
    await page.route('**/api/public/search**', async (route) => {
      const requestUrl = new URL(route.request().url())
      const pageParam = requestUrl.searchParams.get('page')

      if (pageParam === '1') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            results: [e2eSearchResults[0]],
            metadata: {
              total: 2,
              limit: 1,
              offset: 0,
              page: 1,
              hasMore: true,
              has_more: true
            }
          })
        })
        return
      }

      if (pageParam === '2') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            results: [secondPageResult],
            metadata: {
              total: 2,
              limit: 1,
              offset: 1,
              page: 2,
              hasMore: false,
              has_more: false
            }
          })
        })
        return
      }

      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: `Unexpected page ${pageParam}` })
      })
    })

    const firstRequestPromise = page.waitForRequest((request) =>
      request.url().includes('/api/public/search') &&
      new URL(request.url()).searchParams.get('page') === '1'
    )

    await page.goto('/search?q=steady')

    const firstRequest = await firstRequestPromise
    expect(new URL(firstRequest.url()).searchParams.get('page')).toBe('1')

    await expect(page.getByRole('heading', { name: e2eSearchResults[0].business_name }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Load More Results' })).toBeVisible()

    const secondRequestPromise = page.waitForRequest((request) =>
      request.url().includes('/api/public/search') &&
      new URL(request.url()).searchParams.get('page') === '2'
    )

    await page.getByRole('button', { name: 'Load More Results' }).click()

    const secondRequest = await secondRequestPromise
    expect(new URL(secondRequest.url()).searchParams.get('page')).toBe('2')
    await expect(page.getByRole('heading', { name: secondPageResult.business_name }).first()).toBeVisible()
  })
})
