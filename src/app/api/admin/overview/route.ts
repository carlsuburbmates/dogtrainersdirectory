import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateDailyDigest } from '@/lib/digest'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const forceDigest = url.searchParams.get('force') === '1'
    let digest
    try {
      digest = await getOrCreateDailyDigest(forceDigest)
    } catch (e) {
      console.warn('getOrCreateDailyDigest failed in admin overview (continuing):', e)
      // fallback digest so UI can render without 500
      digest = {
        id: -1,
        digest_date: new Date().toISOString().slice(0, 10),
        summary: 'AI digest unavailable — operating in non-AI mode',
        metrics: {
          onboarding_today: 0,
          pending_abn_manual: 0,
          emergency_logs_today: 0,
          emergency_accuracy_pct: 0,
          emergency_pending_verifications: 0,
          errors_last24h: 0
        },
        model: 'fallback',
        generated_by: 'deterministic',
        created_at: new Date().toISOString()
      }
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    // Get latency statistics
    let latencyStats = null
    try {
      const latencyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/api/admin/latency?hours=24`)
      if (latencyResponse.ok) {
        latencyStats = await latencyResponse.json()
      }
    } catch (e) {
      console.warn('Failed to fetch latency stats for admin overview', e)
    }
    
    // Get system health status
    let healthStatus = null
    try {
      const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/api/admin/health`)
      if (healthResponse.ok) {
        healthStatus = await healthResponse.json()
      }
    } catch (e) {
      console.warn('Failed to fetch health status for admin overview', e)
    }
    
    const [trainerCounts, trainerVerified, emergencyResources, emergencyPending, triageMetrics, pendingLogs, lastVerificationRun, failedJobs, webhookFailures, dlqTotals] = await Promise.all([
      supabaseAdmin
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .in('resource_type', ['trainer', 'behaviour_consultant'])
        .eq('is_deleted', false),
      supabaseAdmin
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .in('resource_type', ['trainer', 'behaviour_consultant'])
        .eq('is_deleted', false)
        .eq('verification_status', 'verified'),
      supabaseAdmin
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .in('resource_type', ['emergency_vet', 'urgent_care', 'emergency_shelter'])
        .eq('is_deleted', false),
      supabaseAdmin
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .in('resource_type', ['emergency_vet', 'urgent_care', 'emergency_shelter'])
        .eq('emergency_verification_status', 'manual_review')
        .eq('is_deleted', false),
      supabaseAdmin
        .from('emergency_triage_weekly_metrics')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(1),
      supabaseAdmin
        .from('emergency_triage_logs')
        .select('id, description, predicted_category, created_at, resolution_category')
        .gte('created_at', since)
        .is('resolution_category', null)
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('emergency_resource_verification_runs')
        .select('id, started_at, completed_at, total_resources, auto_updates, flagged_manual')
        .order('started_at', { ascending: false })
        .limit(1),
      supabaseAdmin
        .from('cron_job_runs')
        .select('job_name, started_at, error_message, status')
        .eq('status', 'failed')
        .gte('started_at', since)
        .order('started_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('featured_placement_events')
        .select('id, event_type, metadata, created_at')
        .ilike('event_type', '%webhook%')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('cron_job_runs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('started_at', since)
    ])

    return NextResponse.json({
      digest,
      trainerSummary: {
        total: trainerCounts.count ?? 0,
        verified: trainerVerified.count ?? 0
      },
      emergencySummary: {
        resources: emergencyResources.count ?? 0,
        pendingVerification: emergencyPending.count ?? 0,
        lastVerificationRun: lastVerificationRun.data?.[0] ?? null
      },
      latencySummary: latencyStats ? {
        p50: latencyStats.p50_latency || 0,
        p95: latencyStats.p95_latency || 0,
        avg: latencyStats.avg_latency || 0,
        successRate: latencyStats.success_rate || 100,
        totalOperations: latencyStats.total_operations || 0,
        alertThresholdExceeded: latencyStats.alertThresholdExceeded || false
      } : {
        p50: 0,
        p95: 0,
        avg: 0,
        successRate: 100,
        totalOperations: 0,
        alertThresholdExceeded: false
      },
      healthSummary: healthStatus ? {
        overall: healthStatus.overall,
        components: healthStatus.components,
        summary: healthStatus.summary,
        lastChecked: healthStatus.timestamp
      } : {
        overall: 'unknown',
        components: null,
        summary: 'Health check unavailable',
        lastChecked: null
      },
      triageSummary: {
        weeklyMetrics: triageMetrics.data?.[0] ?? null,
        pendingLogs: pendingLogs.data ?? []
      },
      dlqSummary: {
        failedJobs: failedJobs.data ?? [],
        totalEvents: dlqTotals.count ?? 0,
        recentFailures: failedJobs.data?.length ?? 0,
        webhookFailures: webhookFailures.data ?? []
      }
    })
  } catch (error: any) {
    console.error('Admin overview error', error)
    return NextResponse.json({ error: 'Unable to load admin overview' }, { status: 500 })
  }
}
