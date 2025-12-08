import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // Get hours parameter for time window (default to 24 hours)
    const url = new URL(request.url)
    const hours = parseInt(url.searchParams.get('hours') || '24')
    const operation = url.searchParams.get('operation') || undefined

    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 168) {
      return NextResponse.json(
        { error: 'Hours parameter must be between 1 and 168 (7 days)' },
        { status: 400 }
      )
    }

    // Query latency statistics using the helper function
    const { data, error } = await supabaseAdmin.rpc('get_search_latency_stats', {
      hours_back: hours,
      operation_filter: operation ? operation : null
    })

    if (error) {
      console.error('Error retrieving latency stats:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve latency statistics' },
        { status: 500 }
      )
    }

    // If no data, return zeroed values
    const latencyStats = data?.[0] || {
      p50_latency: 0,
      p95_latency: 0,
      avg_latency: 0,
      total_operations: 0,
      success_rate: 100.0
    }

    // Check if P95 exceeds alerting threshold (200ms)
    const p95ExceedsThreshold = latencyStats.p95_latency > 200

    return NextResponse.json({
      ...latencyStats,
      timeWindowHours: hours,
      alertThresholdExceeded: p95ExceedsThreshold,
      timestampGenerated: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Latency stats endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal error', message: error?.message },
      { status: 500 }
    )
  }
}