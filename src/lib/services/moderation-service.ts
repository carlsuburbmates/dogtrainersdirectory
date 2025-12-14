/**
 * Moderation Service
 * 
 * Pure service module for AI-powered review moderation.
 * Extracted from admin UI to enable cron scheduling and better testability.
 * 
 * @module services/moderation-service
 */

import { supabaseAdmin } from '@/lib/supabase'
import { moderatePendingReviews } from '@/lib/moderation'

export interface ModerationRunResult {
  success: boolean
  processedCount: number
  autoApproved: number
  autoRejected: number
  manualReview: number
  errors: string[]
  startedAt: Date
  completedAt: Date
  durationMs: number
}

export interface ModerationOptions {
  batchSize?: number
  mode?: 'live' | 'shadow' | 'disabled'
  dryRun?: boolean
}

// Default configuration constants
const DEFAULT_BATCH_SIZE = 50
const DEFAULT_MODE = 'live'

/**
 * Runs a full moderation cycle on pending reviews.
 * 
 * @param options - Configuration for the moderation run
 * @returns Structured result with counts and timing
 */
export async function runModerationCycle(
  options: ModerationOptions = {}
): Promise<ModerationRunResult> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    mode = (process.env.MODERATION_AI_MODE as 'live' | 'shadow' | 'disabled') || DEFAULT_MODE,
    dryRun = false
  } = options

  const startedAt = new Date()
  const errors: string[] = []
  
  let processedCount = 0
  let autoApproved = 0
  let autoRejected = 0
  let manualReview = 0

  // Log run start to cron_job_runs table
  let runId: number | null = null
  try {
    const { data: runRow } = await supabaseAdmin
      .from('cron_job_runs')
      .insert({
        job_name: 'moderation',
        started_at: startedAt.toISOString(),
        status: 'running',
        metadata: { batchSize, mode, dryRun }
      })
      .select('id')
      .single()
    
    runId = runRow?.id ?? null
  } catch (err) {
    console.warn('Failed to create cron_job_runs entry (non-fatal):', err)
  }

  try {
    // Mode check: if disabled, skip AI entirely but return informational status (not an error)
    if (mode === 'disabled') {
      const completedAt = new Date()
      const durationMs = completedAt.getTime() - startedAt.getTime()
      
      // Update run status
      if (runId) {
        await supabaseAdmin
          .from('cron_job_runs')
          .update({
            status: 'success',
            completed_at: completedAt.toISOString(),
            duration_ms: durationMs,
            metadata: { mode: 'disabled', skipped: true }
          })
          .eq('id', runId)
      }

      return {
        success: true,
        processedCount: 0,
        autoApproved: 0,
        autoRejected: 0,
        manualReview: 0,
        errors: [], // Not an error - just disabled
        startedAt,
        completedAt,
        durationMs
      }
    }

    // Run moderation - the function fetches reviews internally with the provided limit
    const results = await moderatePendingReviews(batchSize)

    processedCount = results.processed
    autoApproved = results.autoApproved
    autoRejected = results.autoRejected
    manualReview = results.manualFlagged

    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startedAt.getTime()

    // Update run status to success
    if (runId) {
      await supabaseAdmin
        .from('cron_job_runs')
        .update({
          status: 'success',
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs,
          metadata: {
            processedCount,
            autoApproved,
            autoRejected,
            manualReview,
            mode
          }
        })
        .eq('id', runId)
    }

    return {
      success: true,
      processedCount,
      autoApproved,
      autoRejected,
      manualReview,
      errors,
      startedAt,
      completedAt,
      durationMs
    }
  } catch (error: any) {
    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startedAt.getTime()
    const errorMessage = error?.message || 'Unknown error during moderation'
    
    errors.push(errorMessage)

    // Update run status to failed
    if (runId) {
      await supabaseAdmin
        .from('cron_job_runs')
        .update({
          status: 'failed',
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs,
          error_message: errorMessage
        })
        .eq('id', runId)
        .catch((err: any) => console.error('Failed to update cron_job_runs on error:', err))
    }

    return {
      success: false,
      processedCount,
      autoApproved,
      autoRejected,
      manualReview,
      errors,
      startedAt,
      completedAt,
      durationMs
    }
  }
}

/**
 * Get the last N moderation runs for monitoring/debugging.
 */
export async function getRecentModerationRuns(limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('cron_job_runs')
    .select('*')
    .eq('job_name', 'moderation')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch recent moderation runs:', error)
    return []
  }

  return data || []
}
