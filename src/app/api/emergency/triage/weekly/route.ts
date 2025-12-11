import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveLlmMode, generateLLMResponse } from '@/lib/llm'
import { recordLatencyMetric } from '@/lib/telemetryLatency'

// Handle both GET (for cron) and POST (for manual execution)
export async function GET() {
  return handleWeeklyTriageSummary()
}

export async function POST() {
  return handleWeeklyTriageSummary()
}

async function handleWeeklyTriageSummary() {
  const start = Date.now()
  const respond = async (payload: any, status = 200) => {
    await recordLatencyMetric({
      area: 'emergency_weekly_api',
      route: '/api/emergency/triage/weekly',
      durationMs: Date.now() - start,
      statusCode: status,
      success: status < 500
    })
    return NextResponse.json(payload, { status })
  }

  try {
    // Get weekly emergency triage metrics
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Total triages in last 7 days
    const { data: allTriages, error: triageError } = await supabaseAdmin
      .from('emergency_triage_logs')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
    
    if (triageError) {
      return respond(
        { error: 'Failed to fetch weekly metrics', message: triageError.message },
        500
      )
    }

    // Classification breakdown
    const triageRows = (allTriages ?? []) as Array<Record<string, any>>
    const accumulateByKey = (key: string) => {
      const result: Record<string, number> = {}
      for (const triage of triageRows) {
        const bucket = (triage?.[key] as string) || 'unknown'
        result[bucket] = (result[bucket] ?? 0) + 1
      }
      return result
    }

    const classifications = accumulateByKey('classification')
    const priorities = accumulateByKey('priority')
    const decisionSources = accumulateByKey('decision_source')

    // Calculate accuracy percentage
    const llmCount = decisionSources?.llm || 0
    const totalCount = allTriages?.length || 0
    const accuracyPercentage = totalCount > 0 ? Math.round((llmCount / totalCount) * 100) : 0

    // Store weekly metrics in database
    const weeklyMetrics = {
      week_start: sevenDaysAgo.toISOString(),
      week_end: new Date().toISOString(),
      total_triages: allTriages?.length || 0,
      classification_breakdown: classifications || {},
      priority_breakdown: priorities || {},
      decision_source_breakdown: decisionSources || {},
      accuracy_percentage: accuracyPercentage
    }

    const { error: insertError } = await supabaseAdmin
      .from('emergency_triage_weekly_metrics')
      .insert([weeklyMetrics])

    if (insertError) {
      console.error('Failed to store weekly metrics:', insertError)
      // Continue with response even if insert fails
    }

    // Generate AI summary if LLM is available
    let aiSummary = null
    const llmConfig = tryResolveLlmConfig()
    if (llmConfig) {
      try {
        const prompt = `Summarize this weekly emergency triage performance:
        
        Week: ${sevenDaysAgo.toLocaleDateString()} to ${new Date().toLocaleDateString()}
        Total triages: ${allTriages?.length || 0}
        Classifications: ${JSON.stringify(classifications || {})}
        Priorities: ${JSON.stringify(priorities || {})}
        Decision sources: ${JSON.stringify(decisionSources || {})}
        AI accuracy: ${accuracyPercentage}%
        
        Provide a 2-3 sentence summary highlighting key trends and any areas that need attention.`
        
        const llmResponse = await generateLLMResponse({
          systemPrompt: 'You are summarizing emergency triage performance for administrators. Be concise and actionable.',
          userPrompt: prompt
        })
        
        aiSummary = llmResponse.text
      } catch (summaryError) {
        console.error('Failed to generate AI summary:', summaryError)
        // Continue without AI summary
      }
    }

    return respond({
      success: true,
      metrics: weeklyMetrics,
      aiSummary,
      stored: !insertError
    })
  } catch (error: any) {
    return respond(
      { error: 'Server error', message: error.message },
      500
    )
  }
}

const tryResolveLlmConfig = () => {
  try {
    return resolveLlmMode()
  } catch (error) {
    console.warn('LLM not configured for weekly summary:', error)
    return null
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
