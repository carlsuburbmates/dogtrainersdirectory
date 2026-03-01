import { NextResponse } from 'next/server'
import {
  getCommercialFunnelSummary,
  getLatencySnapshot,
  type LatencyArea
} from '@/lib/telemetryLatency'

const AREAS: Array<{ key: LatencyArea; label: string }> = [
  { key: 'commercial_funnel', label: 'Commercial funnel' },
  { key: 'search_triage', label: 'Search → trainer API' },
  { key: 'trainer_profile_page', label: 'Trainer profile SSR' },
  { key: 'emergency_triage_api', label: 'Emergency triage API' },
  { key: 'emergency_verify_api', label: 'Emergency verify API' },
  { key: 'emergency_weekly_api', label: 'Emergency weekly summary' },
  { key: 'admin_health_endpoint', label: 'Admin /health endpoint' },
  { key: 'ai_health_endpoint', label: 'AI health endpoint' },
  { key: 'abn_verify_api', label: 'ABN verification API' },
  { key: 'onboarding_api', label: 'Onboarding flow' }
]

export async function GET() {
  const metrics: Record<string, any> = {}

  await Promise.all(
    AREAS.map(async ({ key, label }) => {
      const summary = await getLatencySnapshot(key)
      metrics[key] = {
        label,
        summary,
        ...(key === 'commercial_funnel'
          ? { funnel: await getCommercialFunnelSummary() }
          : {})
      }
    })
  )

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    metrics
  })
}

export const dynamic = 'force-dynamic'
