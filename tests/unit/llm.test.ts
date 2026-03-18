import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/ai-automation', () => ({
  resolveAiAutomationMode: vi.fn(() => ({ effectiveMode: 'shadow' }))
}))

import { __testing, generateLLMResponse } from '@/lib/llm'

describe('llm provider path resolution', () => {
  beforeEach(() => {
    process.env.LLM_PROVIDER = 'zai'
    process.env.ZAI_API_KEY = 'test-api-key'
    process.env.LLM_DEFAULT_MODEL = 'glm-4.6'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.LLM_PROVIDER
    delete process.env.ZAI_API_KEY
    delete process.env.LLM_DEFAULT_MODEL
    delete process.env.ZAI_BASE_URL
  })

  it('appends the chat completions path when the configured ZAI URL is a base path', async () => {
    process.env.ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'LLM response'
            }
          }
        ]
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateLLMResponse({
      userPrompt: 'Reply with OK',
      maxTokens: 16
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.z.ai/api/paas/v4/chat/completions',
      expect.objectContaining({
        method: 'POST'
      })
    )
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(requestBody.thinking).toEqual({ type: 'disabled' })
    expect(result.provider).toBe('zai')
    expect(result.text).toBe('LLM response')
  })

  it('keeps the configured endpoint when chat completions is already included', () => {
    expect(
      __testing.resolveZaiChatCompletionsUrl(
        'https://api.z.ai/api/paas/v4/chat/completions'
      )
    ).toBe('https://api.z.ai/api/paas/v4/chat/completions')
  })
})
