import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/ai-automation', () => ({
  resolveAiAutomationMode: vi.fn(() => ({ effectiveMode: 'shadow' }))
}))

import { __testing, generateLLMResponse } from '@/lib/llm'

describe('llm provider path resolution', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.LLM_DEFAULT_MODEL = 'gpt-5-mini'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.OPENAI_API_KEY
    delete process.env.OPENAI_BASE_URL
    delete process.env.LLM_DEFAULT_MODEL
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_BASE_URL
    delete process.env.GEMINI_FALLBACK_MODEL
  })

  it('appends the chat completions path when the configured OpenAI URL is a base path', async () => {
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1'
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
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST'
      })
    )
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(requestBody.max_completion_tokens).toBe(16)
    expect(result.provider).toBe('openai')
    expect(result.text).toBe('LLM response')
  })

  it('keeps the configured endpoint when chat completions is already included', () => {
    expect(
      __testing.resolveOpenAiChatCompletionsUrl(
        'https://api.openai.com/v1/chat/completions'
      )
    ).toBe('https://api.openai.com/v1/chat/completions')
  })

  it('falls back to Gemini when OpenAI is unavailable', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key'
    process.env.GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Gemini fallback response' }]
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

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=test-gemini-key',
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(result.provider).toBe('gemini')
    expect(result.model).toBe('gemini-2.5-flash')
    expect(result.text).toBe('Gemini fallback response')
  })
})
