import { NextResponse } from 'next/server'
import {
  generateLLMResponse,
  getConfiguredLlmProviderNames,
  getPrimaryLlmProviderLabel
} from '@/lib/llm'
import { recordLatencyMetric } from '@/lib/telemetryLatency'

// GET /api/health/llm - Returns LLM provider health status
export async function GET() {
  const start = Date.now()
  const finish = async (payload: unknown, status = 200) => {
    await recordLatencyMetric({
      area: 'ai_health_endpoint',
      route: '/api/health/llm',
      durationMs: Date.now() - start,
      statusCode: status,
      success: status < 500
    })
    return NextResponse.json(payload, { status })
  }

  try {
    const configuredProviders = getConfiguredLlmProviderNames()
    const llmProvider = getPrimaryLlmProviderLabel()
    const model = process.env.LLM_DEFAULT_MODEL || 'gpt-5-mini'

    if (configuredProviders.length === 0) {
      return finish(
        { error: 'LLM not configured', status: 'misconfigured' },
        503
      )
    }

    const testPrompt = 'Health check'

    try {
      const startTime = Date.now()
      const response = await generateLLMResponse({
        userPrompt: testPrompt,
        maxTokens: 16
      })

      const latency = Date.now() - startTime
      const success = response.provider !== 'deterministic'
      const activeProvider = response.provider || llmProvider
      const usedFallback =
        success &&
        activeProvider === 'gemini' &&
        configuredProviders.includes('openai')

      return finish({
        status: success ? (usedFallback ? 'degraded' : 'healthy') : 'down',
        metrics: {
          successRate: success ? 100 : 0,
          avgLatency: latency,
          errorTrend: 0,
          totalCalls: 0
        },
        provider: activeProvider,
        configuredProviders,
        tokenUsage: 0,
        model: success ? response.model || model : model,
        lastCheck: new Date().toISOString(),
        message: success
          ? usedFallback
            ? 'OpenAI unavailable; Gemini fallback operational'
            : 'Health check successful'
          : response.text
      })
    } catch (error) {
      console.error('LLM health check failed:', error)
      return finish(
        { error: 'Service unavailable', status: '503' },
        503
      )
    }
  } catch (error) {
    console.error('Unexpected error in LLM health check:', error)
    return finish(
      { error: 'Service unavailable', status: '503' },
      503
    )
  }
}
