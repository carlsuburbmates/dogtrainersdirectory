// Admin API: Triage Statistics
// Provides aggregated metrics for the admin dashboard

import { NextRequest, NextResponse } from 'next/server'
import { getTriageStats, getTriageMetrics } from '@/lib/triageLog'
import { logAPIError } from '@/lib/errorLog'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeHorizonHours = Math.max(1, Math.min(168, Number(searchParams.get('hours') || '24'))) // cap at 7 days
    const includeHourly = searchParams.get('hourly') === 'true'

    const [stats, hourlyMetrics] = await Promise.all([
      getTriageStats(timeHorizonHours),
      includeHourly ? getTriageMetrics(timeHorizonHours) : Promise.resolve([])
    ])

    return NextResponse.json({
      success: true,
      timeHorizonHours,
      stats,
      hourlyMetrics: includeHourly ? hourlyMetrics : undefined
    })
  } catch (error) {
    await logAPIError('/api/admin/triage/stats', 'GET', 500, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch triage statistics',
        success: false
      },
      { status: 500 }
    )
  }
}