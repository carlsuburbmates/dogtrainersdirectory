import { test, expect } from '@playwright/test'

test('alerts snapshot healthy baseline', async ({ request }) => {
  const response = await request.get('/api/admin/alerts/snapshot')
  expect(response.ok()).toBeTruthy()
  const payload = await response.json()
  expect(Array.isArray(payload.alerts)).toBe(true)
  expect(payload.alerts.length).toBe(0)
})
