import { z } from 'zod'

// Configuration types
const LLMConfigSchema = z.object({
  apiKey: z.string().min(1, "Z.ai API key is required"),
  model: z.string().default("glm-4.6"),
  baseUrl: z.string().default("https://api.z.ai/v1/chat/completions"),
  maxTokens: z.number().default(1000),
  temperature: z.number().min(0).max(1).default(0.7)
})

type LLMConfig = z.infer<typeof LLMConfigSchema>

// Response types
export type LLMResponse = {
  text: string
  model: string
  provider: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

// Runtime configuration
function getConfig(): LLMConfig {
  const result = LLMConfigSchema.safeParse({
    apiKey: process.env.ZAI_API_KEY,
    model: process.env.ZAI_MODEL || "glm-4.6",
    baseUrl: process.env.ZAI_BASE_URL || "https://api.z.ai/v1/chat/completions",
    maxTokens: parseInt(process.env.ZAI_MAX_TOKENS || "1000"),
    temperature: parseFloat(process.env.ZAI_TEMPERATURE || "0.7")
  })

  if (!result.success) {
    throw new Error(`LLM configuration error: ${result.error.message}`)
  }
  return result.data
}

/**
 * Generate LLM response using Z.ai API
 * @param params - Request parameters
 * @returns Promise<LLMResponse>
 */
export async function generateLLMResponse(params: {
  systemPrompt?: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}): Promise<LLMResponse> {
  const config = getConfig()
  const startTime = Date.now()

  try {
    // Build messages array
    const messages = []
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt })
    }
    messages.push({ role: 'user', content: params.userPrompt })

    // Call Z.ai API
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: params.maxTokens || config.maxTokens,
        temperature: params.temperature || config.temperature
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const error = new Error(`Z.ai API error: ${response.status} - ${errorData.error || response.statusText}`)
      
      // Log the error with LLM-specific logging
      try {
        const { logLLMError } = await import('./errorLog')
        await logLLMError(
          params.userPrompt,
          errorData,
          Date.now() - startTime,
          error,
          { route: '/api/llm/complete', method: 'POST' }
        )
      } catch (logError) {
        console.error('Failed to log LLM error:', logError)
      }
      
      throw error
    }

    const data = await response.json()
    const text = data.choices[0]?.message?.content || ''

    if (!text) {
      const error = new Error('Empty response from Z.ai API')
      
      // Log the error with LLM-specific logging
      try {
        const { logLLMError } = await import('./errorLog')
        await logLLMError(
          params.userPrompt,
          data,
          Date.now() - startTime,
          error,
          { route: '/api/llm/complete', method: 'POST' }
        )
      } catch (logError) {
        console.error('Failed to log LLM error:', logError)
      }
      
      throw error
    }

    const duration = Date.now() - startTime
    console.log(`Z.ai API call completed in ${duration}ms, model: ${config.model}`)

    // Log successful LLM call (optional)
    try {
      const { logLLMError } = await import('./errorLog')
      await logLLMError(
        params.userPrompt,
        data,
        duration
      )
    } catch (logError) {
      console.error('Failed to log LLM success:', logError)
    }

    // Check if usage information is available
    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    } : undefined

    return {
      text: text.trim(),
      model: config.model,
      provider: 'z.ai',
      usage
    }
  } catch (error) {
    console.error('LLM generation failed:', error)
    
    // Return fallback response for critical infrastructure
    return {
      text: `Error: Unable to generate AI response. ${error instanceof Error ? error.message : 'Unknown error'}`,
      model: 'fallback',
      provider: 'deterministic'
    }
  }
}

/**
 * Enhanced generateLLMResponse with retry logic for critical operations
 * @param params - Request parameters
 * @param retries - Number of retry attempts (default: 2)
 * @returns Promise<LLMResponse>
 */
export async function generateLLMResponseWithRetry(
  params: {
    systemPrompt?: string
    userPrompt: string
    maxTokens?: number
    temperature?: number
  },
  retries = 2
): Promise<LLMResponse> {
  let lastError: Error | unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retrying LLM generation, attempt ${attempt + 1}/${retries + 1}`)
        // Add exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
      }
      return await generateLLMResponse(params)
    } catch (error) {
      lastError = error
      console.warn(`LLM generation attempt ${attempt + 1} failed:`, error)
    }
  }

  // All retries exhausted, return fallback
  console.error(`LLM generation failed after ${retries + 1} attempts`)
  return {
    text: `Service temporarily unavailable. Please try again later.`,
    model: 'fallback',
    provider: 'deterministic'
  }
}

/**
 * Rate limiting helper to prevent excessive API usage
 * @returns Promise<void>
 */
export class RateLimiter {
  private lastCall = 0
  private minInterval = 1000 // 1 second between calls

  constructor(minInterval = 1000) {
    this.minInterval = minInterval
  }

  async wait(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCall

    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastCall = Date.now()
  }
}

// Default rate limiter instance
export const rateLimiter = new RateLimiter(1000) // 1 second min between calls

/**
 * LLM response with built-in rate limiting
 * @param params - Request parameters
 * @returns Promise<LLMResponse>
 */
export async function generateLLMResponseLimited(params: {
  systemPrompt?: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}): Promise<LLMResponse> {
  await rateLimiter.wait()
  return generateLLMResponse(params)
}

/**
 * Check LLM Provider Health Status
 * @returns Promise<{status: 'healthy'|'degraded'|'down', message: string}>
 */
export async function checkLLMHealth(): Promise<{status: 'healthy'|'degraded'|'down', message: string}> {
  try {
    const config = getConfig()
    if (!config.apiKey) {
      return { status: 'down', message: 'LLM API key not configured' }
    }

    // Try a simple API call to check connectivity
    const testResponse = await generateLLMResponseLimited({
      userPrompt: 'test',
      maxTokens: 10,
      temperature: 0
    })

    if (testResponse.text.includes('Service temporarily unavailable')) {
      return { status: 'down', message: 'LLM service is down or experiencing errors' }
    }

    if (testResponse.provider === 'deterministic') {
      return { status: 'degraded', message: 'LLM service returned fallback response' }
    }

    return { status: 'healthy', message: `LLM service operational using ${config.model}` }
  } catch (error) {
    return { status: 'down', message: `LLM health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Health check function defined above
