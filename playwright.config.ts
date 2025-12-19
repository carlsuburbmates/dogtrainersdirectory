import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  ...(process.env.SKIP_PLAYWRIGHT_WEBSERVER === '1' ? {} : {
    webServer: {
      command: `PORT=${PORT} NEXT_TELEMETRY_DISABLED=1 E2E_TEST_MODE=1 npm run dev -- --hostname 127.0.0.1 --port ${PORT}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon',
        SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost',
        SUPABASE_PGCRYPTO_KEY: process.env.SUPABASE_PGCRYPTO_KEY || 'test-key',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-role-key',
        FEATURE_MONETIZATION_ENABLED: '1',
        NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED: '1',
        STRIPE_PRICE_FEATURED: 'price_test_e2e',
        E2E_TEST_MODE: '1',
        NEXT_PUBLIC_E2E_TEST_MODE: '1'
      }
    }
  }),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
