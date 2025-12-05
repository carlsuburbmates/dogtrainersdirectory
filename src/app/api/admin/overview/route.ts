import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateDailyDigest } from '@/lib/digest'
import { isAiEnabled } from '@/lib/llm'

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
    // Use Promise.allSettled so a single failed query doesn't make the whole
    // admin overview 500 — we'll log and fall back gracefully.
    const settled = await Promise.allSettled([
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
        .limit(1)
    ])

    const getCountOrZero = (r: PromiseSettledResult<any>) => {
      if (r.status === 'fulfilled') {
        if (!r.value || r.value.error) {
          console.warn('/api/admin/overview: supabase query returned error', r.value?.error)
          return 0
        }
        return r.value.count ?? 0
      }
      console.warn('/api/admin/overview: supabase query failed', r.reason)
      return 0
    }

    const getDataOrEmpty = (r: PromiseSettledResult<any>) => {
      if (r.status === 'fulfilled') {
        if (!r.value || r.value.error) {
          console.warn('/api/admin/overview: supabase query returned error', r.value?.error)
          return []
        }
        return r.value.data ?? []
      }
      console.warn('/api/admin/overview: supabase query failed', r.reason)
      return []
    }

    const trainerCountsCount = getCountOrZero(settled[0])
    const trainerVerifiedCount = getCountOrZero(settled[1])
    const emergencyResourcesCount = getCountOrZero(settled[2])
    const emergencyPendingCount = getCountOrZero(settled[3])
    const triageMetricsData = getDataOrEmpty(settled[4])
    const pendingLogsData = getDataOrEmpty(settled[5])
    const lastVerificationRunData = getDataOrEmpty(settled[6])

    const aiEnabled = isAiEnabled()

    // Try to fetch latest persisted digest (if table present and has rows)
    let latestDigest: { text: string; createdAt: string } | null = null
    try {
      const { data: latest, error } = await supabaseAdmin
        .from('daily_ops_digests')
        .select('summary, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      if (!error && latest && latest.length > 0) {
        latestDigest = { text: latest[0].summary ?? '', createdAt: latest[0].created_at }
      }
    } catch (err) {
      // ignore — table may not exist in this dev environment
      console.warn('admin/overview: could not fetch latest daily_ops_digests row', err)
    }

    return NextResponse.json({
      digest,
      trainerSummary: {
        total: trainerCountsCount ?? 0,
        verified: trainerVerifiedCount ?? 0
      },
      emergencySummary: {
        resources: emergencyResourcesCount ?? 0,
        pendingVerification: emergencyPendingCount ?? 0,
        lastVerificationRun: lastVerificationRunData?.[0] ?? null
      },
      triageSummary: {
        weeklyMetrics: triageMetricsData?.[0] ?? null,
        pendingLogs: pendingLogsData ?? []
      },
      latestDigest,
      aiEnabled
    })
  } catch (error: any) {
    console.error('Admin overview error', error)
    return NextResponse.json({ error: 'Unable to load admin overview' }, { status: 500 })
  }
}
