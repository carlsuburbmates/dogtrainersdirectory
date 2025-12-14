import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['tests/e2e/**']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
