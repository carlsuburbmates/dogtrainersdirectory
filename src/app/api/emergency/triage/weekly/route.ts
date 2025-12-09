import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveLlmMode } from '@/lib/llm'
import { generateLLMResponse } from '@/lib/llm'

// Handle both GET (for cron) and POST (for manual execution)
export async function GET() {
  return handleWeeklyTriageSummary()
}

export async function POST() {
  return handleWeeklyTriageSummary()
}

async function handleWeeklyTriageSummary() {
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
      return NextResponse.json(
        { error: 'Failed to fetch weekly metrics', message: triageError.message },
        { status: 500 }
      )
    }

    // Classification breakdown
    const classifications = allTriages?.reduce((acc, triage) => {
      acc[triage.classification] = (acc[triage.classification] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Priority breakdown
    const priorities = allTriages?.reduce((acc, triage) => {
      acc[triage.priority] = (acc[triage.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Decision source breakdown
    const decisionSources = allTriages?.reduce((acc, triage) => {
      acc[triage.decision_source] = (acc[triage.decision_source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

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
    const mode = resolveLlmMode('summary')
    if (mode === 'live') {
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

    return NextResponse.json({
      success: true,
      metrics: weeklyMetrics,
      aiSummary,
      stored: !insertError
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'