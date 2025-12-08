// Admin API: List Triage Logs
// Allows admins to view and filter triage classification results

import { NextRequest, NextResponse } from 'next/server'
import { listTriageLogs, TriageLogFilters } from '@/lib/triageLog'
import { logAPIError } from '@/lib/errorLog'

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const filters: TriageLogFilters = {
      limit: Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20'))),
      offset: Math.max(0, Number(searchParams.get('offset') || '0')),
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      classification: searchParams.get('classification') as any || undefined,
      urgency: searchParams.get('urgency') as any || undefined,
      isMedical: searchParams.get('isMedical') ? searchParams.get('isMedical') === 'true' : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',').filter(Boolean) : undefined
    }

    const result = await listTriageLogs(filters)

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      filters
    })
  } catch (error) {
    await logAPIError('/api/admin/triage/logs', 'GET', 500, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch triage logs',
        success: false
      },
      { status: 500 }
    )
  }
}