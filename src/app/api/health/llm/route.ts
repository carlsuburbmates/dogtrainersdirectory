import { NextResponse } from 'next/server'
import { recordLatencyMetric } from '@/lib/telemetryLatency'

// GET /api/health/llm - Returns LLM provider health status
export async function GET() {
  const start = Date.now()
  const finish = async (payload: any, status = 200) => {
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
    const llmProvider = process.env.LLM_PROVIDER || 'zai'
    const baseUrl = process.env.ZAI_BASE_URL || 'https://api.z.ai/v1/chat/completions'
    const apiKey = process.env.ZAI_API_KEY
    const model = process.env.LLM_DEFAULT_MODEL || 'glm-4.6'
    
    if (!apiKey) {
      return finish(
        { error: 'LLM not configured', status: 'misconfigured' },
        503
      )
    }
    
    // Simple health check by calling the LLM API
    const testPrompt = "Health check"
    let latency = 0
    let success = false
    
    try {
      const startTime = Date.now()
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: testPrompt }],
          model: model
        }),
        signal: undefined
      })
      
      latency = Date.now() - startTime
      success = response.ok
      
      // Extract token usage if available from the response
      let tokenCount = 0
      let usage = response.headers.get('x-use')
      
      try {
        if (usage && typeof usage === 'string') {
          const tokenMatch = usage.match(/token usage:\s+\d+}/g)
          if (tokenMatch && tokenMatch.length) {
            tokenCount = parseInt(tokenMatch[1])
          }
        }
      } catch {
        // No token information available
        tokenCount = 0
      }
      
      return finish({
        status: success ? 'healthy' : 'unhealthy',
        metrics: {
          successRate: success ? 100 : 0,
          avgLatency: latency ? latency : 0,
          errorTrend: 0,
          totalCalls: tokenCount
        },
        provider: llmProvider,
        tokenUsage: tokenCount,
        lastCheck: new Date().toISOString(),
        message: 'Health check successful'
      })
      
    } catch (error) {
      console.error('LLM health check failed:', error)
      return finish(
        { error: 'Service unavailable', status: '503' },
        503
      )
    }
  } catch (e) {
    console.error('Unexpected error in LLM health check:', e)
    return finish(
      { error: 'Service unavailable', status: '503' },
      503
    )
  }
}
