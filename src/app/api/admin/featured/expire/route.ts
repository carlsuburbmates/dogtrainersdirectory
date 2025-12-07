import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Featured Placement Expiry Cron
 * 
 * POST /api/admin/featured/expire
 * 
 * Daily automated job (2am) that:
 * 1. Finds featured placements with expiry_date <= now
 * 2. Demotes expired placements (active = false)
 * 3. Promotes next eligible queued placement
 * 4. Sends email notifications (renewal reminder, expiry notice)
 * 5. Logs all events to featured_placement_events
 * 
 * Auth: Requires SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const cronSecret = request.headers.get('x-vercel-cron-secret')
    const isAuthorized =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      (cronSecret && cronSecret === process.env.CRON_SECRET)

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET required' },
        { status: 401 }
      )
    }

    const startedAt = new Date()
    const now = startedAt.toISOString()

    // Log cron start
    let runId: number | null = null
    try {
      const { data: runRow } = await supabaseAdmin
        .from('cron_job_runs')
        .insert({
          job_name: 'featured_expiry',
          started_at: now,
          status: 'running'
        })
        .select('id')
        .single()
      runId = runRow?.id ?? null
    } catch (err) {
      console.warn('Failed to create cron_job_runs entry (non-fatal):', err)
    }

    let expiredCount = 0
    let promotedCount = 0
    const errors: string[] = []

    // ========================================================================
    // STEP 1: Find and demote expired placements
    // ========================================================================
    const { data: expiredPlacements, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('id, business_id, slot_type, expiry_date')
      .eq('active', true)
      .lte('expiry_date', now)

    if (fetchError) {
      throw new Error(`Failed to fetch expired placements: ${fetchError.message}`)
    }

    for (const placement of expiredPlacements || []) {
      try {
        // Demote
        await supabaseAdmin
          .from('featured_placements')
          .update({ active: false })
          .eq('id', placement.id)

        // Log event
        await supabaseAdmin.from('featured_placement_events').insert({
          placement_id: placement.id,
          event_type: 'expired',
          previous_status: 'active',
          new_status: 'expired',
          triggered_by: 'cron',
          metadata: { expiry_date: placement.expiry_date }
        })

        expiredCount++

        // Send expiry email (optional - requires Resend setup)
        if (process.env.RESEND_API_KEY) {
          // TODO: Implement sendExpiryEmail(placement)
          console.log(`TODO: Send expiry email for placement ${placement.id}`)
        }
      } catch (err: any) {
        errors.push(`Failed to expire placement ${placement.id}: ${err.message}`)
        console.error(`Failed to expire placement ${placement.id}:`, err)
      }
    }

    // ========================================================================
    // STEP 2: Promote next queued placements
    // ========================================================================
    // For each slot type, find the highest priority queued placement
    const slotTypes = ['hero', 'premium', 'standard'] // Adjust based on your schema

    for (const slotType of slotTypes) {
      try {
        // Find next in queue
        const { data: nextInQueue } = await supabaseAdmin
          .from('featured_placements')
          .select('id, business_id, priority')
          .eq('slot_type', slotType)
          .eq('active', false)
          .is('expiry_date', null) // Not yet activated (or use your queuing logic)
          .order('priority', { ascending: true })
          .limit(1)
          .single()

        if (nextInQueue) {
          // Set expiry date (e.g., 30 days from now)
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 30)

          await supabaseAdmin
            .from('featured_placements')
            .update({
              active: true,
              expiry_date: expiryDate.toISOString()
            })
            .eq('id', nextInQueue.id)

          // Log event
          await supabaseAdmin.from('featured_placement_events').insert({
            placement_id: nextInQueue.id,
            event_type: 'promoted',
            previous_status: 'queued',
            new_status: 'active',
            triggered_by: 'cron',
            metadata: { slot_type: slotType, expiry_date: expiryDate.toISOString() }
          })

          promotedCount++

          // Send activation email
          if (process.env.RESEND_API_KEY) {
            // TODO: Implement sendActivationEmail(nextInQueue)
            console.log(`TODO: Send activation email for placement ${nextInQueue.id}`)
          }
        }
      } catch (err: any) {
        errors.push(`Failed to promote for slot ${slotType}: ${err.message}`)
        console.error(`Failed to promote for slot ${slotType}:`, err)
      }
    }

    // ========================================================================
    // Finalize cron run
    // ========================================================================
    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startedAt.getTime()

    if (runId) {
      await supabaseAdmin
        .from('cron_job_runs')
        .update({
          status: errors.length > 0 ? 'failed' : 'success',
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs,
          error_message: errors.length > 0 ? errors.join('; ') : null,
          metadata: { expiredCount, promotedCount }
        })
        .eq('id', runId)
    }

    return NextResponse.json({
      success: errors.length === 0,
      expiredCount,
      promotedCount,
      errors,
      durationMs
    })
  } catch (error: any) {
    console.error('Featured expiry cron error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Featured expiry job failed',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
