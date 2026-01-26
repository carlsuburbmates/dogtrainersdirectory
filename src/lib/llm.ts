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

const DEFAULT_BASE_URL = 'https://api.z.ai/v1/chat/completions'
const DEFAULT_MODEL = 'glm-4.6'
const RATE_LIMIT_DELAY_MS = 1000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildFallback = (model: string, reason: string): LlmResponse => ({
  text: `LLM unavailable (${reason}). Operating in deterministic mode.`,
  model,
  provider: 'deterministic'
})

export async function generateLLMResponse({
  systemPrompt,
  userPrompt,
  model,
  maxTokens = 512,
  temperature = 0.2
}: LlmRequest): Promise<LlmResponse> {
  const provider = process.env.LLM_PROVIDER || 'zai'
  const apiKey = process.env.ZAI_API_KEY
  const baseUrl = process.env.ZAI_BASE_URL || DEFAULT_BASE_URL
  const resolvedModel = model || process.env.LLM_DEFAULT_MODEL || DEFAULT_MODEL

  if (!apiKey) {
    return buildFallback(resolvedModel, 'missing API key')
  }

  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: userPrompt }
  ]

  try {
    await sleep(RATE_LIMIT_DELAY_MS)
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature,
        max_tokens: maxTokens
      })
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
  const globalMode = process.env.AI_GLOBAL_MODE || 'live'
  const pipelineVars = {
    triage: process.env.TRIAGE_AI_MODE,
    moderation: process.env.MODERATION_AI_MODE,
    verification: process.env.VERIFICATION_AI_MODE,
    digest: process.env.DIGEST_AI_MODE,
    ops_digest: process.env.DIGEST_AI_MODE
  }
  const pipelineOverride = pipelineVars[pipeline as keyof typeof pipelineVars]
  return pipelineOverride || globalMode
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