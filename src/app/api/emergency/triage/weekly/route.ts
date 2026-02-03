import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    type EmergencyTriageLogRow = {
      classification: string
      priority: string
      decision_source: string
    }

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

    const triages = ((allTriages ?? []) as EmergencyTriageLogRow[])

    // Classification breakdown
    const classifications = triages.reduce((acc: Record<string, number>, triage) => {
      acc[triage.classification] = (acc[triage.classification] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Priority breakdown
    const priorities = triages.reduce((acc: Record<string, number>, triage) => {
      acc[triage.priority] = (acc[triage.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Decision source breakdown
    const decisionSources = triages.reduce((acc: Record<string, number>, triage) => {
      acc[triage.decision_source] = (acc[triage.decision_source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate accuracy percentage
    const llmCount = decisionSources?.llm || 0
    const totalCount = triages.length
    const accuracyPercentage = totalCount > 0 ? Math.round((llmCount / totalCount) * 100) : 0

    return NextResponse.json({
      success: true,
      metrics: {
        week_start: sevenDaysAgo.toISOString(),
        total_triages: triages.length,
        classification_breakdown: classifications || {},
        priority_breakdown: priorities || {},
        decision_source_breakdown: decisionSources || {},
        accuracy_percentage: accuracyPercentage
      }
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
