import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const EMERGENCY_TYPES = ['emergency_vet', 'urgent_care', 'emergency_shelter']
const FETCH_TIMEOUT = 5000

type VerificationOutcome = {
  ok: boolean
  reason?: string
}

function checkPhone(phone?: string | null): VerificationOutcome {
  if (!phone) {
    return { ok: false, reason: 'Missing emergency phone number' }
  }
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) {
    return { ok: false, reason: 'Phone number too short' }
  }
  return { ok: true }
}

async function checkWebsite(url?: string | null): Promise<VerificationOutcome> {
  if (!url) {
    return { ok: false, reason: 'Missing website URL' }
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` }
    }
    return { ok: true }
  } catch (error: any) {
    return { ok: false, reason: error?.message || 'Request failed' }
  }
}

export async function POST() {
  try {
    // Cron-only endpoint — require service role key (server-only)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required to run emergency verification' }, { status: 400 })
    }

    const { data: resources, error } = await supabaseAdmin
      .from('businesses')
      .select('id, name, website, phone, resource_type')
      .in('resource_type', EMERGENCY_TYPES)
      .eq('is_deleted', false)

    if (error) {
      return NextResponse.json({ error: 'Unable to load emergency resources' }, { status: 500 })
    }

    const now = new Date().toISOString()
    let autoUpdates = 0
    let flagged = 0

    const verificationEvents: any[] = []

    // Create a verification run record first so events can reference it (best-effort)
    let runId: number | null = null
    try {
      const { data: runRow, error: runErr } = await supabaseAdmin
        .from('emergency_resource_verification_runs')
        .insert({ started_at: now })
        .select('id')
        .single()

      if (!runErr && runRow) runId = runRow.id
    } catch (e) {
      // table may not exist in this environment — continue without run id
      console.warn('verification run record not created (ignored)', e)
    }

    for (const resource of resources ?? []) {
      const preferredPhone = resource.emergency_phone || resource.phone
      const phoneOutcome = checkPhone(preferredPhone)
      const websiteOutcome = await checkWebsite(resource.website)
      const failures = [phoneOutcome, websiteOutcome].filter((result) => !result.ok)
      let statusAfter = failures.length === 0 ? 'verified' : 'manual_review'

      // Optionally ask an LLM for guidance on ambiguous cases (best-effort)
      let llmProvider: string | null = null
      let llmModel: string | null = null

      try {
        // Use LLM only for non-trivial cases (one failure or contradictory signals)
        const useLlm = failures.length > 0 && Boolean(process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY)
        if (useLlm) {
          const llmResp = await (await import('@/lib/llm')).callLlm({
            purpose: 'triage',
            systemPrompt: 'You classify emergency resource verification outcomes. Given the checks performed (phone/website) on a resource, recommend either `verified` or `manual_review` and provide a short reasoning in JSON { action: string, reason: string }',
            userPrompt: JSON.stringify({ resource: { id: resource.id, name: resource.name, website: resource.website, phone: preferredPhone }, checks: { phoneOutcome, websiteOutcome } }),
            responseFormat: 'json',
            temperature: 0,
            maxTokens: 200
          })

          llmProvider = llmResp.provider ?? null
          llmModel = llmResp.model ?? null

          if (llmResp.ok && llmResp.json && typeof llmResp.json === 'object') {
            const parsed: any = llmResp.json as any
            if (parsed.action === 'verified' || parsed.action === 'manual_review') {
              statusAfter = parsed.action
            }
          } else if (llmResp.reason === 'ai_disabled') {
            // AI disabled — leave heuristic decision
          } else if (!llmResp.ok) {
            console.warn('LLM moderation guidance failed — falling back to deterministic checks', llmResp.errorMessage)
          }
        }
      } catch (err) {
        console.warn('LLM guidance threw — proceeding with deterministic checks', err)
      }

      const notes = failures.map((failure) => failure.reason).filter(Boolean).join(' | ') || 'Website and phone verified automatically'

      // Update business status (tolerant)
      try {
        await supabaseAdmin
          .from('businesses')
          .update({
            emergency_verification_status: statusAfter,
            emergency_last_verified_at: now,
            emergency_verification_notes: notes
          })
          .eq('id', resource.id)
      } catch (err) {
        console.warn('Failed to write business verification status (ignored)', err)
      }

      for (const [checkType, outcome] of [
        ['phone', phoneOutcome],
        ['website', websiteOutcome]
      ] as const) {
        verificationEvents.push({
          run_id: runId,
          business_id: resource.id,
          check_type: checkType,
          result: outcome.ok ? 'pass' : 'fail',
          status_before: resource.emergency_verification_status,
          status_after: statusAfter,
          details: outcome.reason ? { reason: outcome.reason } : null,
          ai_provider: llmProvider,
          ai_model: llmModel,
          created_at: now
        })
      }

      if (failures.length === 0) {
        autoUpdates += 1
      } else {
        flagged += 1
      }
    }

    if (verificationEvents.length) {
      try {
        await supabaseAdmin.from('emergency_resource_verification_events').insert(verificationEvents)
      } catch (err) {
        console.warn('Failed to persist verification events (ignored)', err)
      }
    }

    // Finalise run record — update existing run if we created one, otherwise insert new
    let runInsertedId: number | null = null
    try {
      if (runId) {
        await supabaseAdmin
          .from('emergency_resource_verification_runs')
          .update({ total_resources: resources?.length ?? 0, auto_updates: autoUpdates, flagged_manual: flagged, completed_at: now })
          .eq('id', runId)
        runInsertedId = runId
      } else {
        const { data: run } = await supabaseAdmin
          .from('emergency_resource_verification_runs')
          .insert({
            total_resources: resources?.length ?? 0,
            auto_updates: autoUpdates,
            flagged_manual: flagged,
            completed_at: now
          })
          .select('id')
          .single()
        runInsertedId = run?.id ?? null
      }
    } catch (err) {
      console.warn('Failed to persist verification run final record (ignored)', err)
    }

    return NextResponse.json({
      success: true,
      runId: runInsertedId,
      resourcesChecked: resources?.length ?? 0,
      verified: autoUpdates,
      flagged,
      aiEnabled: Boolean(process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY)
    })
  } catch (error: any) {
    console.error('Emergency verify job error', error)
    return NextResponse.json({ error: 'Verification job failed' }, { status: 500 })
  }
}
