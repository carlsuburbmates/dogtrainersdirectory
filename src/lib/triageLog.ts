// Triage Log Library
// Handles persistence and retrieval of triage classification results

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { logError } from '@/lib/errorLog'

export type TriageCategory = 'medical' | 'stray' | 'crisis_training' | 'other'
export type TriageUrgency = 'immediate' | 'urgent' | 'moderate' | 'low'
export type TriageAction = 'vet' | 'shelter' | 'trainer' | 'other'
export type TriageSource = 'api' | 'admin' | 'seed'

export interface TriageClassification {
  classification: TriageCategory
  confidence: number
  summary: string
  recommended_action: TriageAction
  urgency: TriageUrgency
}

export interface MedicalResult {
  is_medical: boolean
  severity: 'life_threatening' | 'serious' | 'moderate' | 'minor'
  symptoms: string[]
  recommended_resources: ('24hr_vet' | 'poison_control' | 'emergency_clinic')[]
  vet_wait_time_critical: boolean
}

export interface CreateTriageLogParams {
  message: string
  suburbId?: number
  classification: TriageClassification
  medical?: MedicalResult | null
  llmProvider?: string
  llmModel?: string
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  durationMs: number
  source?: TriageSource
  tags?: string[]
  requestMeta?: Record<string, any>
  errorId?: string
}

export interface TriageLogFilters {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  classification?: TriageCategory
  urgency?: TriageUrgency
  isMedical?: boolean
  tags?: string[]
}

// Helper: get SB client configured for server-side
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Helper: Convert classification to DB format
const classificationToDb = (c: TriageClassification) => ({
  classification: c.classification,
  confidence: c.confidence,
  summary: c.summary,
  recommended_action: c.recommended_action,
  urgency: c.urgency
})

// Helper: create a triage log entry with error handling
export async function createTriageLog(params: CreateTriageLogParams): Promise<string | null> {
  try {
    const dbRow = {
      source: params.source || 'api',
      message: params.message,
      suburb_id: params.suburbId || null,
      ...classificationToDb(params.classification),
      medical: params.medical || {},
      llm_provider: params.llmProvider || null,
      llm_model: params.llmModel || null,
      tokens_prompt: params.tokens?.prompt || null,
      tokens_completion: params.tokens?.completion || null,
      tokens_total: params.tokens?.total || null,
      duration_ms: params.durationMs,
      request_meta: params.requestMeta || {},
      tags: params.tags || [],
      error_id: params.errorId || null
    }

    const { data, error } = await supabase
      .from('triage_logs')
      .insert(dbRow)
      .select('id')
      .single()

    if (error) {
      await logError('Failed to insert triage log', { error: error.message, params }, 'error', 'db')
      return null
    }

    return data.id
  } catch (err) {
    await logError('Exception in createTriageLog', { error: (err as Error).message, params }, 'error', 'db')
    return null
  }
}

// Helper: create step-level event
export async function createTriageEvent(
  triageLogId: string,
  stage: 'llm_call' | 'heuristics' | 'postprocess' | 'persist' | 'error',
  payload: Record<string, any> = {},
  durationMs?: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('triage_events')
      .insert({
        triage_log_id: triageLogId,
        stage,
        payload,
        duration_ms: durationMs || null
      })

    if (error) {
      await logError('Failed to insert triage event', { error: error.message, triageLogId, stage }, 'error', 'db')
      return false
    }

    return true
  } catch (err) {
    await logError('Exception in createTriageEvent', { error: (err as Error).message, triageLogId, stage }, 'error', 'db')
    return false
  }
}

// List triage logs with optional filters
export async function listTriageLogs(filters: TriageLogFilters = {}) {
  try {
    let query = supabase
      .from('triage_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters.limit) query = query.limit(filters.limit)
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    if (filters.classification) query = query.eq('classification', filters.classification)
    if (filters.urgency) query = query.eq('urgency', filters.urgency)
    if (filters.isMedical !== undefined) query = query.eq('medical->>is_medical', filters.isMedical)
    if (filters.tags && filters.tags.length > 0) query = query.contains('tags', filters.tags)
    if (filters.startDate || filters.endDate) {
      if (filters.startDate) query = query.gte('created_at', filters.startDate)
      if (filters.endDate) query = query.lte('created_at', filters.endDate)
    }

    const { data, error, count } = await query

    if (error) {
      await logError('Failed to fetch triage logs', { error: error.message, filters }, 'error', 'db')
      return { logs: [], total: 0 }
    }

    return { logs: data || [], total: count || 0 }
  } catch (err) {
    await logError('Exception in listTriageLogs', { error: (err as Error).message, filters }, 'error', 'db')
    return { logs: [], total: 0 }
  }
}

// Get aggregated stats for admin dashboard
export async function getTriageStats(hours: number = 24) {
  try {
    const startDate = new Date()
    startDate.setHours(startDate.getHours() - hours)
    
    // Use the client to fetch data with aggregation
    const { data, error } = await supabase
      .from('triage_logs')
      .select('created_at, classification, urgency, medical, duration_ms, tokens_total')
      .gte('created_at', startDate.toISOString())
    
    if (error) {
      await logError('Failed to fetch triage stats', { error: error.message, hours }, 'error', 'db')
      return null
    }
    
    // Calculate stats client-side
    const stats = {
      total: data?.length || 0,
      medical_count: data?.filter(row => row.classification === 'medical').length || 0,
      immediate_count: data?.filter(row => row.urgency === 'immediate').length || 0,
      is_medical_true: data?.filter(row => row.medical?.is_medical === true).length || 0,
      avg_latency_ms: data && data.length > 0 ? 
        Math.round(data.reduce((sum, row) => sum + (row.duration_ms || 0), 0) / data.length) : 0,
      total_tokens: data?.reduce((sum, row) => sum + (row.tokens_total || 0), 0) || 0
    }
    
    return stats
  } catch (err) {
    await logError('Exception in getTriageStats', { error: (err as Error).message, hours }, 'error', 'db')
    return null
  }
}

// Helper: get hourly metrics from our view
export async function getTriageMetrics(hours: number = 24) {
  try {
    const start = new Date()
    start.setHours(start.getHours() - hours)
    
    const { data, error } = await supabase
      .from('triage_metrics_hourly')
      .select('*')
      .gte('hour', start.toISOString())
      .order('hour', { ascending: false })

    if (error) {
      await logError('Failed to fetch triage metrics hourly', { error: error.message, hours }, 'error', 'db')
      return []
    }

    return data || []
  } catch (err) {
    await logError('Exception in getTriageMetrics', { error: (err as Error).message, hours }, 'error', 'db')
    return []
  }
}