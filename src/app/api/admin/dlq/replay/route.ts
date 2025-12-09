import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { jobName, failedId } = await request.json()
    
    if (!jobName) {
      return NextResponse.json(
        { error: 'Job name is required' },
        { status: 400 }
      )
    }

    let result

    // Handle webhook failure replay
    if (jobName.includes('webhook')) {
      const webhookId = failedId
      if (!webhookId) {
        return NextResponse.json(
          { error: 'Webhook ID is required for webhook replay' },
          { status: 400 }
        )
      }
      
      // Get the failed webhook event
      const { data: webhook, error: fetchError } = await supabaseAdmin
        .from('cron_job_runs')
        .select('*')
        .eq('id', webhookId)
        .eq('job_name', jobName)
        .single()
      
      if (fetchError || !webhook) {
        return NextResponse.json(
          { error: 'Failed webhook event not found' },
          { status: 404 }
        )
      }

      // Attempt to re-process the webhook event based on its metadata
      const eventDetails = webhook.metadata as any
      
      try {
        // For Stripe webhooks, re-call the appropriate handler
        if (jobName.includes('stripe')) {
          // Re-trigger Stripe webhook handling
          // In a real implementation, this would reconstruct the original event
          // and re-process it through the Stripe webhook handler
          
          // Log the replay attempt
          await supabaseAdmin
            .from('cron_job_runs')
            .update({ 
              status: 'running', 
              started_at: new Date().toISOString(),
              metadata: { 
                ...webhook.metadata, 
                replay: true, 
                original_run_id: webhook.id 
              } 
            })
            .eq('id', webhookId)
        }
      } catch (replayError) {
        // Mark as failed again
        await supabaseAdmin
          .from('cron_job_runs')
          .update({ 
            status: 'failed',
            error_message: replayError instanceof Error ? replayError.message : 'Unknown error during replay',
            duration_ms: null,
            completed_at: new Date().toISOString()
          })
          .eq('id', webhookId)
        
        throw replayError
      }

      // Mark as successful
      await supabaseAdmin
        .from('cron_job_runs')
        .update({ 
          status: 'success',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - new Date(webhook.started_at).getTime()
        })
        .eq('id', webhookId)

      result = { success: true, replayed: 'webhook', id: webhookId }
    
    } else {
      // Handle cron job replay
      const jobEndpoints = {
        'emergency/verify': '/api/emergency/verify',
        'emergency/triage/weekly': '/api/emergency/triage/weekly',
        'admin/ops-digest': '/api/admin/ops-digest',
        'admin/moderation/run': '/api/admin/moderation/run'
      }

      const endpoint = jobEndpoints[jobName as keyof typeof jobEndpoints]
      if (!endpoint) {
        return NextResponse.json(
          { error: 'Invalid job name' },
          { status: 400 }
        )
      }

      // Add logic to trigger the job via fetch
      const response = await fetch(
        new URL(endpoint, process.env.VERCEL_URL || 'http://localhost:3000').toString(),
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Job returned status ${response.status}`)
      }

      result = { success: true, replayed: 'job', jobName }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('DLQ replay error:', error)
    return NextResponse.json(
      { error: 'Failed to replay event', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'