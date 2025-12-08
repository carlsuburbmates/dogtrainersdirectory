// Error Statistics API for Admin Dashboard
// Provides metrics and trends for monitoring

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ErrorLevel, ErrorCategory } from '@/lib/errorLog'

// GET /api/admin/errors/stats - Get error statistics and trends
export async function GET(request: NextRequest) {
  try {
// NOTE: Admin authentication temporarily disabled
    // TODO: Implement proper admin authentication

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '24h' // 24h, 7d, 30d
    const detailed = searchParams.get('detailed') === 'true'

    // Calculate time range based on period
    let hours = 24
    if (period === '7d') hours = 24 * 7
    if (period === '30d') hours = 24 * 30
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Get basic stats
    const [
      errorCount,
      levelBreakdown,
      categoryBreakdown,
      errorsPerMinute
    ] = await Promise.all([
      // Total error count
      supabaseAdmin
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startTime),
      
      // Breakdown by error level
      supabaseAdmin
        .from('error_logs')
        .select('level')
        .gte('created_at', startTime),
      
      // Breakdown by category
      supabaseAdmin
        .from('error_logs')
        .select('category')
        .gte('created_at', startTime),
      
      // Errors per minute for last hour
      supabaseAdmin
        .rpc('check_error_rate_alert', { minutes_ago: 60, threshold: 1, consecutive_minutes: 1 })
        .then(({ data }) => data)
        .catch(() => [])
    ])

    // Process level breakdown
    const levelCounts: Record<string, number> = { debug: 0, info: 0, warn: 0, error: 0, critical: 0 }
    levelBreakdown.data?.forEach((item: any) => {
      const key = item.level as ErrorLevel
      if (levelCounts[key] !== undefined) {
        levelCounts[key]++
      }
    })

    // Process category breakdown
    const categoryCounts: Record<string, number> = { api: 0, llm: 0, validation: 0, db: 0, client: 0, other: 0 }
    categoryBreakdown.data?.forEach((item: any) => {
      const key = item.category as ErrorCategory
      if (categoryCounts[key] !== undefined) {
        categoryCounts[key]++
      }
    })

    // Build response
    const stats = {
      period,
      totalErrors: errorCount.count || 0,
      errorsPerMinute: calculateAverageErrors(errorsPerMinute),
      levelBreakdown: levelCounts,
      categoryBreakdown: categoryCounts,
      topErrors: await getTopErrors(startTime, 10),
    }

    // Add detailed data if requested
    if (detailed) {
      stats.errorsPerHour = await getErrorsPerHour(startTime, hours)
      stats.llmErrors = await getLLMErrors(startTime)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching error stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error statistics' },
      { status: 500 }
    )
  }
}

// Helper to calculate average errors per minute
function calculateAverageErrors(errorData: any[]): number {
  if (!errorData.length) return 0
  
  const totalErrors = errorData.reduce((sum, item: any) => sum + (item.error_rate || 0), 0)
  return parseFloat((totalErrors / errorData.length).toFixed(2))
}

// Helper to get top errors by frequency
async function getTopErrors(startTime: string, limit: number) {
  try {
    const { data } = await supabaseAdmin
      .from('error_logs')
      .select('message, level, category, route, count() as frequency')
      .gte('created_at', startTime)
      .group('message, level, category, route')
      .order('frequency', { ascending: false })
      .limit(limit)
    
    return data || []
  } catch (error) {
    console.error('Error fetching top errors:', error)
    return []
  }
}

// Helper to get errors per hour for detailed view
async function getErrorsPerHour(startTime: string, hours: number) {
  try {
    // Using direct SQL for more complex grouping
    const { data, error } = await supabaseAdmin
      .rpc('get_errors_per_hour', {
        start_at: startTime,
        hours_count: hours
      })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error fetching errors per hour:', error)
    // Fallback: return empty array
    return []
  }
}

// Helper to get LLM-specific errors
async function getLLMErrors(startTime: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .eq('category', 'llm')
      .gte('created_at', startTime)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error fetching LLM errors:', error)
    return []
  }
}

// Database function for errors per hour - we'll create this in our migration
const errorsPerHourFunction = `
CREATE OR REPLACE FUNCTION public.get_errors_per_hour(
  start_at timestamptz,
  hours_count integer DEFAULT 24
)
RETURNS TABLE (
  hour timestamp with time zone,
  error_count bigint,
  errors_by_level jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hour timestamptz;
  end_hour timestamptz;
BEGIN
  end_hour := start_at + make_interval(hours => hours_count);
  
  -- Create a temporary table to hold results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_hourly_errors (
    hour timestamptz,
    error_count bigint,
    errors_by_level jsonb
  );
  
  -- Clean previous data
  DELETE FROM temp_hourly_errors;
  
  -- Loop through each hour
  FOR current_hour IN 
    SELECT generate_series(
      date_trunc('hour', start_at),
      date_trunc('hour', end_hour) - make_interval(hours => 1),
      '1 hour'::interval
    )
  LOOP
    INSERT INTO temp_hourly_errors
    SELECT 
      current_hour AS hour,
      COUNT(*) as error_count,
      json_object_agg(level, level_count) as errors_by_level
    FROM (
      SELECT 
        level,
        COUNT(*) as level_count
      FROM public.error_logs
      WHERE created_at >= current_hour 
        AND created_at < current_hour + make_interval(hours => 1)
      GROUP BY level
    ) level_counts;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT * FROM temp_hourly_errors ORDER BY hour;
  
  -- Clean up
  DROP TABLE IF EXISTS temp_hourly_errors;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_errors_per_hour(timestamptz, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_errors_per_hour(timestamptz, integer) TO authenticated;
`;