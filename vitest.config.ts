import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.test.{ts,tsx,js,jsx}',
      'src/**/*.spec.{ts,tsx,js,jsx}',
      'tests/**/*.test.{ts,tsx,js,jsx}',
      'tests/**/*.spec.{ts,tsx,js,jsx}'
    ],
    exclude: ['tests/e2e/**', 'node_modules/**']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
