// Error Metrics API for Admin Dashboard
// Provides access to error data with filtering and statistics

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ErrorLevel, ErrorCategory } from '@/lib/errorLog'

// GET /api/admin/errors - List errors with filtering and pagination
export async function GET(request: NextRequest) {
  try {
// NOTE: Admin authentication temporarily disabled
    // TODO: Implement proper admin authentication

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as ErrorLevel | null
    const category = searchParams.get('category') as ErrorCategory | null
    const route = searchParams.get('route')
    const before = searchParams.get('before')
    const after = searchParams.get('after')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
      .from('error_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (level) {
      query = query.eq('level', level)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (route) {
      query = query.eq('route', route)
    }

    if (before) {
      query = query.lt('created_at', before)
    }

    if (after) {
      query = query.gte('created_at', after)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Get summary counts for filters
    const [levelCounts, categoryCounts, routeCounts] = await Promise.all([
      supabaseAdmin
        .from('error_logs')
        .select('level')
        .then(({ data }: { data: Array<{ level: string }> | null }) => {
          const counts: Record<string, number> = { debug: 0, info: 0, warn: 0, error: 0, critical: 0 }
          data?.forEach(item => {
            const key = item.level as ErrorLevel
            if (counts[key] !== undefined) {
              counts[key]++
            }
          })
          return counts
        }),
      
      supabaseAdmin
        .from('error_logs')
        .select('category')
        .then(({ data }: { data: Array<{ category: string }> | null }) => {
          const counts: Record<string, number> = { api: 0, llm: 0, validation: 0, db: 0, client: 0, other: 0 }
          data?.forEach(item => {
            const key = item.category as ErrorCategory
            if (counts[key] !== undefined) {
              counts[key]++
            }
          })
          return counts
        }),
      
      supabaseAdmin
        .from('error_logs')
        .select('route')
        .not('route', 'is', null)
        .then(({ data }: { data: Array<{ route: string }> | null }) => {
          const counts: Record<string, number> = {}
          data?.forEach(item => {
            if (item.route) {
              counts[item.route] = (counts[item.route] || 0) + 1
            }
          })
          return Object.fromEntries(
            Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10)
          )
        })
    ])

    return NextResponse.json({
      errors: data || [],
      summary: {
        total: count || 0,
        levelCounts,
        categoryCounts,
        routeCounts,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching error logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    )
  }
}

// POST /api/admin/errors - Manually log an error (for testing)
export async function POST(request: NextRequest) {
  try {
// NOTE: Admin authentication temporarily disabled
    // TODO: Implement proper admin authentication

    const body = await request.json()
    const { message, level, category, context } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Import and use the logging function
    const { logError } = await import('@/lib/errorLog')
    
    await logError(message, context, level, category)
    
    return NextResponse.json({
      message: 'Error logged successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging manual error:', error)
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    )
  }
}