import { supabaseAdmin } from './supabase'
import { apiService } from './api'
import type { SearchResult } from './api'
import type { BehaviorIssue, DistanceFilter } from '../types/database'

export type EmergencyFlow = 'medical' | 'stray' | 'crisis' | 'normal'

export type EmergencyResource = {
  id: number
  name: string
  phone?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  suburb?: string | null
  council?: string | null
  region?: string | null
  emergency_hours?: string | null
  emergency_services?: string[] | null
  cost_indicator?: string | null
  capacity_notes?: string | null
  distance_km?: number | null
}

export type CouncilContact = {
  council_id: number
  council_name: string
  phone: string | null
  after_hours_phone: string | null
  report_url: string | null
}

const MEDICAL_KEYWORDS = ['bleeding', 'collapsed', 'poison', 'seizure', 'unresponsive', 'hit by', 'broken bone', 'choking', 'emergency', 'trauma', 'heatstroke']
const STRAY_KEYWORDS = ['stray', 'found dog', 'wandering', 'lost dog', 'unknown dog', 'no collar', 'microchip', 'council']
const CRISIS_KEYWORDS = ['aggressive', 'biting', 'attacked', 'lunging', 'fight', 'crisis', 'sudden aggression', 'panic', 'reactive']

const keywordScore = (text: string, keywords: string[]) => {
  return keywords.reduce((score, keyword) => (text.includes(keyword) ? score + 1 : score), 0)
}

export function classifyEmergency(description: string): { category: EmergencyFlow; confidence: number; reasoning: string } {
  const normalized = description.trim().toLowerCase()
  if (!normalized) {
    return { category: 'normal', confidence: 0.2, reasoning: 'No description provided' }
  }

  const medicalScore = keywordScore(normalized, MEDICAL_KEYWORDS)
  const strayScore = keywordScore(normalized, STRAY_KEYWORDS)
  const crisisScore = keywordScore(normalized, CRISIS_KEYWORDS)

  const topScore = Math.max(medicalScore, strayScore, crisisScore)
  if (topScore === 0) {
    return { category: 'normal', confidence: 0.35, reasoning: 'No emergency keywords detected' }
  }

  if (medicalScore === topScore) {
    return { category: 'medical', confidence: Math.min(0.5 + medicalScore * 0.1, 0.95), reasoning: 'Matched medical emergency keywords' }
  }
  if (strayScore === topScore) {
    return { category: 'stray', confidence: Math.min(0.5 + strayScore * 0.1, 0.9), reasoning: 'Matched stray/lost dog keywords' }
  }
  return { category: 'crisis', confidence: Math.min(0.5 + crisisScore * 0.1, 0.9), reasoning: 'Matched behaviour crisis keywords' }
}

export async function logEmergencyClassification(payload: {
  description: string
  predicted_category: EmergencyFlow
  recommended_flow: EmergencyFlow
  confidence?: number
  suburbId?: number
  user_lat?: number
  user_lng?: number
}): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('emergency_triage_logs')
    .insert({
      description: payload.description,
      predicted_category: payload.predicted_category,
      recommended_flow: payload.recommended_flow,
      confidence: payload.confidence ?? null,
      user_suburb_id: payload.suburbId ?? null,
      user_lat: payload.user_lat ?? null,
      user_lng: payload.user_lng ?? null
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to log emergency triage payload', error)
    return null
  }
  return data?.id ?? null
}

export async function upsertEmergencyResolution(logId: number, selectedFlow: EmergencyFlow, predictedFlow?: EmergencyFlow) {
  if (!logId) return
  const wasCorrect = predictedFlow ? selectedFlow === predictedFlow : null
  await supabaseAdmin
    .from('emergency_triage_logs')
    .update({
      resolution_category: selectedFlow,
      was_correct: wasCorrect ?? undefined,
      resolved_at: new Date().toISOString()
    })
    .eq('id', logId)
}

const DEFAULT_LIMIT = 50

const FLOW_FILTERS: Record<EmergencyFlow, string[]> = {
  medical: ['emergency_vet', 'urgent_care'],
  stray: ['emergency_shelter'],
  crisis: ['trainer', 'behaviour_consultant'],
  normal: ['trainer', 'behaviour_consultant']
}

const CRISIS_BEHAVIOUR_FOCUS: BehaviorIssue[] = ['dog_aggression', 'anxiety_general']

async function getSuburbCoordinates(suburbId?: number): Promise<{ lat: number; lng: number } | null> {
  if (!suburbId) return null
  const { data, error } = await supabaseAdmin
    .from('suburbs')
    .select('latitude, longitude')
    .eq('id', suburbId)
    .single()
  if (error || !data) return null
  return { lat: Number(data.latitude), lng: Number(data.longitude) }
}

export async function fetchEmergencyResources(flow: EmergencyFlow, options: { suburbId?: number; limit?: number } = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT
  const coords = await getSuburbCoordinates(options.suburbId)
  const filters = FLOW_FILTERS[flow]

  if (flow === 'crisis' || flow === 'normal') {
    // reuse trainer search for crisis flow
    const distanceFilter: DistanceFilter = coords ? '0-5' : 'greater'
    const request = {
      ageFilters: undefined,
      includeRescue: flow === 'crisis',
      issues: flow === 'crisis' ? CRISIS_BEHAVIOUR_FOCUS : undefined,
      suburbId: options.suburbId,
      distanceFilter,
      verifiedOnly: true,
      limit
    }
    const trainers = (await apiService.getTriageResults(request)) as SearchResult[]
    return { trainers } as const
  }

  const { data, error } = await supabaseAdmin.rpc('search_emergency_resources', {
    user_lat: coords?.lat ?? null,
    user_lng: coords?.lng ?? null,
    resource_filters: filters,
    limit_entries: limit
  })

  if (error) {
    console.error('search_emergency_resources failed', error)
  }

  const resources: EmergencyResource[] = (data || []).map((item: any) => ({
    id: item.business_id,
    name: item.business_name,
    phone: item.business_phone,
    email: item.business_email,
    website: item.website,
    address: item.address,
    suburb: item.suburb_name,
    council: item.council_name,
    region: item.region,
    emergency_hours: item.emergency_hours,
    emergency_services: item.emergency_services,
    cost_indicator: item.cost_indicator,
    capacity_notes: item.capacity_notes,
    distance_km: item.distance_km ? Number(item.distance_km) : null
  }))

  let council: CouncilContact | null = null
  if (options.suburbId) {
    const { data: suburbWithCouncil } = await supabaseAdmin
      .from('suburbs')
      .select('council_id, councils ( name ), id')
      .eq('id', options.suburbId)
      .single()
    if (suburbWithCouncil?.council_id) {
      const { data: councilRow } = await supabaseAdmin
        .from('council_contacts')
        .select('council_id, phone, after_hours_phone, report_url, councils!inner(name)')
        .eq('council_id', suburbWithCouncil.council_id)
        .single()
      if (councilRow) {
        const councilRelation = (councilRow as any)?.councils
        council = {
          council_id: councilRow.council_id,
          council_name: Array.isArray(councilRelation)
            ? councilRelation[0]?.name ?? 'Your council'
            : councilRelation?.name ?? 'Your council',
          phone: councilRow.phone,
          after_hours_phone: councilRow.after_hours_phone,
          report_url: councilRow.report_url
        }
      }
    }
  }

  return { resources, council } as const
}

export type DailyDigestMetrics = {
  onboarding_today: number
  pending_abn_manual: number
  emergency_logs_today: number
  emergency_accuracy_pct: number
  emergency_pending_verifications: number
  errors_last24h: number
}

export async function fetchDigestMetrics(): Promise<DailyDigestMetrics> {
  // If no SUPABASE_SERVICE_ROLE_KEY present, return zeroed metrics for safe local/dev workflows
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('fetchDigestMetrics: SUPABASE_SERVICE_ROLE_KEY missing — returning zeroed metrics for digest')
    return {
      onboarding_today: 0,
      pending_abn_manual: 0,
      emergency_logs_today: 0,
      emergency_accuracy_pct: 0,
      emergency_pending_verifications: 0,
      errors_last24h: 0
    }
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [onboarding, abnPending, emergencyLogs, accuracy, verifications] = await Promise.all([
    supabaseAdmin
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('resource_type', 'trainer')
      .gte('created_at', since),
    supabaseAdmin
      .from('abn_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'manual_review'),
    supabaseAdmin
      .from('emergency_triage_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since),
    supabaseAdmin
      .from('emergency_triage_weekly_metrics')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(1),
    supabaseAdmin
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .in('resource_type', ['emergency_vet', 'urgent_care', 'emergency_shelter'])
      .eq('emergency_verification_status', 'manual_review')
  ])

  const onboardingCount = onboarding.count ?? 0
  const abnManualCount = abnPending.count ?? 0
  const emergencyCount = emergencyLogs.count ?? 0
  const verificationCount = verifications.count ?? 0
  const accuracyRow = accuracy.data?.[0] as { accuracy_pct?: number } | undefined
  const accuracyPct = accuracyRow?.accuracy_pct ? Number(accuracyRow.accuracy_pct) : 0

  return {
    onboarding_today: onboardingCount,
    pending_abn_manual: abnManualCount,
    emergency_logs_today: emergencyCount,
    emergency_accuracy_pct: accuracyPct,
    emergency_pending_verifications: verificationCount,
    errors_last24h: 0
  }
}
