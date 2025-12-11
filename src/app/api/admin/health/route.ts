import { NextResponse } from 'next/server'
import { checkLLMHealth } from '@/lib/llm'
import { supabaseAdmin } from '@/lib/supabase'
import { recordLatencyMetric } from '@/lib/telemetryLatency'

export async function GET(request: Request) {
  const start = Date.now()
  const respond = async (payload: any, status = 200) => {
    await recordLatencyMetric({
      area: 'admin_health_endpoint',
      route: '/api/admin/health',
      durationMs: Date.now() - start,
      statusCode: status,
      success: status < 500
    })
    return NextResponse.json(payload, { status })
  }

  try {
    const url = new URL(request.url)
    const includeExtended = url.searchParams.get('extended') === '1'

    // Health status for each critical dependency
    const [llmHealth, supabaseHealth, webhookHealth] = await Promise.all([
      checkLLMHealth(),
      checkSupabaseHealth(),
      checkStripeHealth()
    ])

    // Determine overall system health
    const allHealthy = llmHealth.status === 'healthy' && 
                    supabaseHealth.status === 'healthy' && 
                    webhookHealth.status === 'healthy'

    // If any component is degraded or down, include details
    const components = {
      llm: llmHealth,
      supabase: supabaseHealth,
      webhook: webhookHealth
    }

    const hasWarnings = Object.values(components).some(c => c.status === 'degraded')
    const hasFailures = Object.values(components).some(c => c.status === 'down')

    const response: Record<string, unknown> = {
      overall: allHealthy ? 'healthy' : hasFailures ? 'down' : 'degraded',
      timestamp: new Date().toISOString(),
      components,
      summary: generateHealthSummary(components)
    }

    if (includeExtended) {
      const [abnRecheck, emergencyCron, overrides] = await Promise.all([
        getLatestJobSnapshot('abn_recheck'),
        getLatestJobSnapshot('emergency/verify'),
        getActiveOverrides()
      ])
      response.telemetry = {
        overrides,
        abnRecheck,
        emergencyCron
      }
    }

    // Return appropriate HTTP status based on overall health
    return respond(response, allHealthy ? 200 : hasFailures ? 503 : 200)

  } catch (error: any) {
    console.error('Health check failed:', error)
    return respond(
      {
        overall: 'down',
        timestamp: new Date().toISOString(),
        error: error?.message || 'Unknown error'
      },
      503
    )
  }
}

async function checkSupabaseHealth(): Promise<{ status: 'healthy' | 'degraded' | 'down', message: string }> {
  try {
    // Simple test query to verify we can connect
    const { error } = await supabaseAdmin
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    
    if (error) {
      return {
        status: 'down',
        message: `Database connection failed: ${error.message}`
      }
    }

    // Check if we can access critical tables
    const criticalTables = ['businesses', 'suburbs', 'reviews', 'daily_ops_digests']
    const checks = await Promise.all(
      criticalTables.map(async (table) => {
        try {
          const { error } = await supabaseAdmin
            .from(table)
            .select('id', { count: 'exact', head: true })
            .limit(1)
          return { table, success: !error, error }
        } catch (e) {
          return { table, success: false, error: (e as Error).message }
        }
      })
    )

    const failedTables = checks.filter(c => !c.success)
    if (failedTables.length === 0) {
      return { status: 'healthy', message: 'All database components operational' }
    }

    // Some tables might exist but not be accessible
    if (failedTables.length <= 1) {
      return { 
        status: 'degraded', 
        message: `Minor database issues: ${failedTables.map(t => t.table).join(', ')}`
      }
    }

    return {
      status: 'down',
      message: `Critical database failures: ${failedTables.map(t => t.table).join(', ')}`
    }
  } catch (e: any) {
    return {
      status: 'down',
      message: `Database health check failed: ${e?.message || 'Unknown error'}`
    }
  }
}

async function checkStripeHealth(): Promise<{ status: 'healthy' | 'degraded' | 'down', message: string }> {
  // Check if Stripe is configured
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey) {
    return { 
      status: 'degraded', 
      message: 'Stripe not configured (webhooks will be disabled)' 
    }
  }

  try {
    // Perform a simple API test with a test request ID
    const testAccountId = 'cus_test123456'
    const response = await fetch('https://api.stripe.com/v1/customers/' + testAccountId, {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/json'
      }
    })

    // 404 is expected for test customer (doesn't exist) 
    // Any other error indicates API issues
    if (response.status === 404) {
      // Customer not found is expected for test
      return {
        status: 'healthy',
        message: 'Stripe API connection working (test customer not found as expected)'
      }
    } else {
      const text = await response.text()
      return {
        status: response.ok ? 'healthy' : 'down',
        message: response.ok ? 'Stripe API operational' : `Stripe API error: ${response.status} - ${text}`
      }
    }
  } catch (error: any) {
    return {
      status: 'down',
      message: `Stripe API connection failed: ${error?.message || 'Unknown error'}`
    }
  }
}

function generateHealthSummary(components: Record<string, { status: string; message: string }>): string {
  const issues: string[] = []
  
  Object.entries(components).forEach(([name, comp]) => {
    if (comp.status !== 'healthy') {
      issues.push(`${name}: ${comp.message}`)
    }
  })

  if (issues.length === 0) {
    return 'All systems operational'
  }
  
  return `Degraded: ${issues.join('; ')}`
}

async function getActiveOverrides() {
  try {
    const nowIso = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('ops_overrides')
      .select('id, service, status, reason, expires_at, created_at')
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.warn('Failed to load ops overrides', error)
    return []
  }
}

async function getLatestJobSnapshot(jobName: string) {
  try {
    const nowIso = new Date().toISOString()
    const [{ data: successData }, { data: failureData }] = await Promise.all([
      supabaseAdmin
        .from('cron_job_runs')
        .select('status, started_at, completed_at')
        .eq('job_name', jobName)
        .eq('status', 'success')
        .order('started_at', { ascending: false })
        .limit(1),
      supabaseAdmin
        .from('cron_job_runs')
        .select('status, started_at, error_message')
        .eq('job_name', jobName)
        .eq('status', 'failed')
        .order('started_at', { ascending: false })
        .limit(1)
    ])

    return {
      jobName,
      checkedAt: nowIso,
      lastSuccess: successData?.[0]?.completed_at ?? null,
      lastFailure: failureData?.[0]?.started_at ?? null,
      failureMessage: failureData?.[0]?.error_message ?? null
    }
  } catch (error) {
    console.warn(`Failed to fetch cron snapshot for ${jobName}`, error)
    return {
      jobName,
      checkedAt: new Date().toISOString(),
      lastSuccess: null,
      lastFailure: null,
      failureMessage: 'Unable to load cron history'
    }
  }
}
