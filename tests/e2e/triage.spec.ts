import { test, expect } from '@playwright/test'
import { e2eSearchResults } from '@/lib/e2eTestUtils'

const suburbFixture = {
  id: 42,
  name: 'Richmond',
  postcode: '3121',
  latitude: -37.823,
  longitude: 144.998,
  council_id: 7,
}

test.describe('/triage journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/functions/v1/suburbs', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON?.() ?? null
      const url = new URL(request.url())
      const idParam = url.searchParams.get('id')
      const queryParam = url.searchParams.get('query') || url.searchParams.get('q')

      const bodyId = postData && typeof postData.id === 'number' ? postData.id : null
      const bodyQuery = postData && typeof postData.query === 'string'
        ? postData.query
        : postData && typeof postData.q === 'string'
          ? postData.q
          : null

      const requestedId = bodyId ?? (idParam ? Number(idParam) : null)
      const requestedQuery = (bodyQuery ?? queryParam ?? '').toLowerCase()

      const suburbs =
        requestedId === suburbFixture.id || requestedQuery.includes('rich')
          ? [suburbFixture]
          : []

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          suburbs,
          count: suburbs.length,
        }),
      })
    })
  })

  test('completes the normal flow and hands suburb data to /search', async ({ page }) => {
    await page.route('**/api/emergency/triage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          triage: {
            classification: 'normal',
          },
        }),
      })
    })

    await page.route('**/api/public/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          results: e2eSearchResults,
          metadata: {
            total: e2eSearchResults.length,
            limit: 20,
            offset: 0,
            hasMore: false,
            has_more: false,
          },
        }),
      })
    })

    await page.goto('/triage')

    await page.getByRole('button', { name: /Puppies/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByRole('button', { name: 'Socialisation' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByPlaceholder('Start typing a suburb…').fill('Rich')
    await page.getByRole('button', { name: /Richmond/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByText('Richmond (3121)')).toBeVisible()

    const searchRequest = page.waitForRequest((request) =>
      request.url().includes('/api/public/search') && request.method() === 'GET'
    )

    await page.getByRole('button', { name: 'See matching trainers' }).click()

    const request = await searchRequest
    const requestUrl = new URL(request.url())
    expect(requestUrl.searchParams.get('suburbId')).toBe('42')
    expect(requestUrl.searchParams.get('suburbName')).toBe('Richmond')
    expect(requestUrl.searchParams.get('postcode')).toBe('3121')
    expect(requestUrl.searchParams.get('lat')).toBe(String(suburbFixture.latitude))
    expect(requestUrl.searchParams.get('lng')).toBe(String(suburbFixture.longitude))
    expect(requestUrl.searchParams.get('flow_source')).toBe('triage')

    await expect(page).toHaveURL(/\/search\?/)
    await expect(page.getByRole('heading', { name: e2eSearchResults[0].business_name }).first()).toBeVisible()
  })

  test('rehydrates location from canonical suburbId on load', async ({ page }) => {
    await page.goto('/triage?step=location&suburbId=42')

    await expect(page.locator('input[value="Richmond (3121)"]')).toBeVisible()
  })

  test('routes emergency issues to /emergency', async ({ page }) => {
    await page.goto('/triage?step=issues&age=puppies_0_6m')

    await page.getByRole('button', { name: /Mouthing\/nipping\/biting/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByText('Medical emergency?')).toBeVisible()
    await page.getByRole('button', { name: 'Find an emergency vet' }).click()

    await expect(page).toHaveURL(/\/emergency\?flow=medical/)
  })
})
