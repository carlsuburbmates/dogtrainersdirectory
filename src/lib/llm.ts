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

const DEFAULT_BASE_URL = 'https://api.z.ai/api/paas/v4'
const DEFAULT_MODEL = 'glm-4.6'
const RATE_LIMIT_DELAY_MS = 1000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildFallback = (model: string, reason: string): LlmResponse => ({
  text: `LLM unavailable (${reason}). Operating in deterministic mode.`,
  model,
  provider: 'deterministic'
})

function resolveZaiChatCompletionsUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  if (trimmedBaseUrl.endsWith('/chat/completions')) {
    return trimmedBaseUrl
  }

  return `${trimmedBaseUrl}/chat/completions`
}

export async function generateLLMResponse({
  systemPrompt,
  userPrompt,
  model,
  maxTokens = 512,
  temperature = 0.2
}: LlmRequest): Promise<LlmResponse> {
  const provider = process.env.LLM_PROVIDER || 'zai'
  const apiKey = process.env.ZAI_API_KEY
  const configuredBaseUrl = process.env.ZAI_BASE_URL || DEFAULT_BASE_URL
  const baseUrl = resolveZaiChatCompletionsUrl(configuredBaseUrl)
  const resolvedModel = model || process.env.LLM_DEFAULT_MODEL || DEFAULT_MODEL

  if (!apiKey) {
    return buildFallback(resolvedModel, 'missing API key')
  }

  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: userPrompt }
  ]
  const requestBody =
    provider === 'zai'
      ? {
          model: resolvedModel,
          messages,
          thinking: {
            type: 'disabled'
          },
          temperature,
          max_tokens: maxTokens
        }
      : {
          model: resolvedModel,
          messages,
          temperature,
          max_tokens: maxTokens
        }

  try {
    await sleep(RATE_LIMIT_DELAY_MS)
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      return buildFallback(resolvedModel, `upstream ${response.status}`)
    }

    const payload = await response.json().catch(() => null)
    const content =
      payload?.choices?.[0]?.message?.content ??
      payload?.choices?.[0]?.text

    if (!content || typeof content !== 'string') {
      return buildFallback(resolvedModel, 'empty response')
    }

    return {
      text: content,
      model: resolvedModel,
      provider
    }
  } catch (error) {
    console.error('LLM request failed:', error)
    return buildFallback(resolvedModel, 'request failed')
  }
}

export const __testing = {
  resolveZaiChatCompletionsUrl
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


export async function checkLLMHealth(): Promise<{ status: 'healthy' | 'degraded' | 'down', message: string }> {
  const provider = process.env.LLM_PROVIDER || 'zai'
  const apiKey = process.env.ZAI_API_KEY
  
  if (!apiKey) {
    return {
      status: 'degraded',
      message: 'LLM not configured (API key missing)'
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

    return {
      status: 'healthy',
      message: `LLM operational (${provider})`
    }
  } catch (error: any) {
    return {
      status: 'down',
      message: `LLM health check failed: ${error?.message || 'Unknown error'}`
    }
  }
}
