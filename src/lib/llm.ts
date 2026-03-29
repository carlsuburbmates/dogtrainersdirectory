import { resolveAiAutomationMode } from './ai-automation'

export interface LlmResponse {
  text: string
  model?: string | null
  provider?: string | null
}

type LlmRequest = {
  systemPrompt?: string
  userPrompt: string
  model?: string
  maxTokens?: number
  temperature?: number
}

type LlmProvider = 'openai' | 'gemini'

type ConfiguredLlmProvider = {
  provider: LlmProvider
  apiKey: string
  baseUrl: string
  model: string
}

type AttemptResult =
  | {
      ok: true
      response: LlmResponse
    }
  | {
      ok: false
      reason: string
    }

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_OPENAI_MODEL = 'gpt-5-mini'
const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const RATE_LIMIT_DELAY_MS = 1000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildFallback = (model: string, reason: string): LlmResponse => ({
  text: `LLM unavailable (${reason}). Operating in deterministic mode.`,
  model,
  provider: 'deterministic'
})

function resolveOpenAiChatCompletionsUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  if (trimmedBaseUrl.endsWith('/chat/completions')) {
    return trimmedBaseUrl
  }

  return `${trimmedBaseUrl}/chat/completions`
}

function resolveGeminiGenerateContentUrl(baseUrl: string, model: string): string {
  const trimmedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  if (trimmedBaseUrl.includes(':generateContent')) {
    return trimmedBaseUrl
  }

  if (trimmedBaseUrl.includes('/models/')) {
    return `${trimmedBaseUrl}:generateContent`
  }

  return `${trimmedBaseUrl}/models/${model}:generateContent`
}

function resolveConfiguredLlmProviders(modelOverride?: string): ConfiguredLlmProvider[] {
  const providers: ConfiguredLlmProvider[] = []

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: resolveOpenAiChatCompletionsUrl(
        process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL
      ),
      model: modelOverride || process.env.LLM_DEFAULT_MODEL || DEFAULT_OPENAI_MODEL
    })
  }

  if (process.env.GEMINI_API_KEY) {
    const geminiModel =
      process.env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_MODEL

    providers.push({
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: resolveGeminiGenerateContentUrl(
        process.env.GEMINI_BASE_URL || DEFAULT_GEMINI_BASE_URL,
        geminiModel
      ),
      model: geminiModel
    })
  }

  return providers
}

export function hasConfiguredLlmProvider(): boolean {
  return resolveConfiguredLlmProviders().length > 0
}

export function getConfiguredLlmProviderNames(): LlmProvider[] {
  return resolveConfiguredLlmProviders().map((entry) => entry.provider)
}

export function getPrimaryLlmProviderLabel(): string {
  const [primaryProvider] = getConfiguredLlmProviderNames()
  return primaryProvider ?? 'deterministic'
}

async function requestOpenAiResponse(
  config: ConfiguredLlmProvider,
  { systemPrompt, userPrompt, maxTokens, temperature }: LlmRequest
): Promise<AttemptResult> {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: userPrompt }
  ]

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_completion_tokens: maxTokens
    })
  })

  if (!response.ok) {
    return {
      ok: false,
      reason: `openai upstream ${response.status}`
    }
  }

  const payload = await response.json().catch(() => null)
  const content =
    payload?.choices?.[0]?.message?.content ??
    payload?.choices?.[0]?.text

  if (!content || typeof content !== 'string') {
    return {
      ok: false,
      reason: 'openai empty response'
    }
  }

  return {
    ok: true,
    response: {
      text: content,
      model: config.model,
      provider: 'openai'
    }
  }
}

async function requestGeminiResponse(
  config: ConfiguredLlmProvider,
  { systemPrompt, userPrompt, maxTokens, temperature }: LlmRequest
): Promise<AttemptResult> {
  const response = await fetch(`${config.baseUrl}?key=${config.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...(systemPrompt
        ? {
            system_instruction: {
              parts: [{ text: systemPrompt }]
            }
          }
        : {}),
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    })
  })

  if (!response.ok) {
    return {
      ok: false,
      reason: `gemini upstream ${response.status}`
    }
  }

  const payload = await response.json().catch(() => null)
  const content = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim()

  if (!content) {
    return {
      ok: false,
      reason: 'gemini empty response'
    }
  }

  return {
    ok: true,
    response: {
      text: content,
      model: config.model,
      provider: 'gemini'
    }
  }
}

async function requestProviderResponse(
  config: ConfiguredLlmProvider,
  params: LlmRequest
): Promise<AttemptResult> {
  if (config.provider === 'openai') {
    return requestOpenAiResponse(config, params)
  }

  return requestGeminiResponse(config, params)
}

export async function generateLLMResponse({
  systemPrompt,
  userPrompt,
  model,
  maxTokens = 512,
  temperature = 0.2
}: LlmRequest): Promise<LlmResponse> {
  const configuredProviders = resolveConfiguredLlmProviders(model)
  const resolvedModel = model || process.env.LLM_DEFAULT_MODEL || DEFAULT_OPENAI_MODEL

  if (configuredProviders.length === 0) {
    return buildFallback(
      resolvedModel,
      'missing OPENAI_API_KEY and GEMINI_API_KEY'
    )
  }

  let lastFailureReason = 'request failed'

  for (const providerConfig of configuredProviders) {
    try {
      await sleep(RATE_LIMIT_DELAY_MS)
      const attempt = await requestProviderResponse(providerConfig, {
        systemPrompt,
        userPrompt,
        model,
        maxTokens,
        temperature
      })

      if (attempt.ok) {
        return attempt.response
      }

      lastFailureReason = attempt.reason
    } catch (error) {
      console.error(`${providerConfig.provider} LLM request failed:`, error)
      lastFailureReason = `${providerConfig.provider} request failed`
    }
  }

  return buildFallback(resolvedModel, lastFailureReason)
}

export const __testing = {
  resolveConfiguredLlmProviders,
  resolveGeminiGenerateContentUrl,
  resolveOpenAiChatCompletionsUrl
}

export async function generateLLMResponseWithRetry(
  params: LlmRequest,
  retries = 2
): Promise<LlmResponse> {
  let response = await generateLLMResponse(params)
  for (let attempt = 0; attempt < retries; attempt++) {
    if (response.provider !== 'deterministic') {
      return response
    }
    await sleep(500)
    response = await generateLLMResponse(params)
  }
  return response
}

export function resolveLlmMode(pipeline: string): string {
  if (pipeline === 'digest') {
    return resolveAiAutomationMode('ops_digest').effectiveMode
  }

  return resolveAiAutomationMode(pipeline as LlmPipeline).effectiveMode
}

export type LlmPipeline = 'triage' | 'moderation' | 'verification' | 'ops_digest'

export async function checkLLMHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'down'
  message: string
}> {
  const configuredProviders = getConfiguredLlmProviderNames()

  if (configuredProviders.length === 0) {
    return {
      status: 'degraded',
      message: 'LLM not configured (OPENAI_API_KEY and GEMINI_API_KEY missing)'
    }
  }

  try {
    const response = await generateLLMResponse({
      userPrompt: 'Respond with OK',
      maxTokens: 10
    })

    if (response.provider === 'deterministic') {
      return {
        status: 'degraded',
        message: `LLM unavailable: ${response.text}`
      }
    }

    if (response.provider === 'gemini' && configuredProviders.includes('openai')) {
      return {
        status: 'degraded',
        message: 'OpenAI unavailable; Gemini fallback operational'
      }
    }

    return {
      status: 'healthy',
      message: `LLM operational (${response.provider})`
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      status: 'down',
      message: `LLM health check failed: ${message}`
    }
  }
}
