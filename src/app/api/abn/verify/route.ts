import { NextRequest, NextResponse } from 'next/server'
import abrLib from '@/lib/abr'
import { supabaseAdmin } from '@/lib/supabase'
import { recordAbnFallbackEvent } from '@/lib/abnFallback'
import type { AbrSearchResponse } from '../../../../../types/abr'
import { recordLatencyMetric } from '@/lib/telemetryLatency'

type RequestBody = {
  abn: string
  businessName?: string
  businessId?: number
}

// Simple normalizer for name matching
const normalizeName = (s?: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenOverlapScore = (a: string, b: string) => {
  if (!a || !b) return 0
  const at = Array.from(new Set(a.split(' ').filter(Boolean)))
  const bt = Array.from(new Set(b.split(' ').filter(Boolean)))
  const inter = at.filter((x) => bt.includes(x)).length
  return inter === 0 ? 0 : inter / Math.max(at.length, bt.length)
}

export async function POST(request: NextRequest) {
  const start = Date.now()
  const finish = async (status: number, success: boolean, meta?: Record<string, unknown>) => {
    await recordLatencyMetric({
      area: 'abn_verify_api',
      route: '/api/abn/verify',
      durationMs: Date.now() - start,
      statusCode: status,
      success,
      metadata: meta
    })
  }

  try {
    const body = (await request.json()) as RequestBody
    const { abn, businessName } = body
    if (!abn) {
      await finish(400, false, { reason: 'missing_abn' })
      return NextResponse.json({ error: 'Missing abn' }, { status: 400 })
    }

    // Validate ABN format server-side (checksum + length)
    if (!abrLib.isValidAbn(abn)) {
      await finish(400, false, { reason: 'invalid_format' })
      return NextResponse.json({ error: 'Invalid ABN format' }, { status: 400 })
    }

    const guid = process.env.ABR_GUID || undefined

    const { status, body: raw, parsed } = await abrLib.fetchAbrJson(abn, guid)

    // parsed may be null when the ABR response isn't JSON or parse failed
    let abnData: AbrSearchResponse | any | null = parsed ?? null

    // find candidate name(s)
    const entity = abnData?.Response?.ResponseBody ?? null
    const candidateName = (entity?.EntityName || (entity?.BusinessName && entity.BusinessName[0]) || null) as string | null

    const normalClaim = normalizeName(businessName)
    const normalCandidate = normalizeName(candidateName ?? undefined)
    const similarity = Math.max(tokenOverlapScore(normalClaim, normalCandidate), normalClaim === normalCandidate ? 1 : 0)

    // Canonical rule: ABNStatus is authoritative. Mark verified if ABNStatus === 'Active'.
    const abnStatus = entity?.ABNStatus || null
    const verified = Boolean(abnStatus === 'Active')
    const requiresManualReview = !verified

    const response = {
      verified,
      similarity: Math.round((similarity || 0) * 100) / 100,
      abnData,
      requiresManualReview
    }

    if (!verified) {
      let reason: 'abn_verify_inactive' | 'abn_verify_manual_review' | 'abn_verify_error' = 'abn_verify_manual_review'
      if (!entity || status >= 400) {
        reason = 'abn_verify_error'
      } else if (abnStatus && abnStatus !== 'Active') {
        reason = 'abn_verify_inactive'
      }
      await recordAbnFallbackEvent({
        businessId: body.businessId ?? null,
        reason
      })
    }

    // Persist a record in abn_verifications when server-side writing is enabled.
    // We only write when all of these apply:
    // - AUTO_APPLY env var is truthy
    // - supabaseAdmin (service-role) is available
    // - caller supplied a businessId so we know which record to update/insert
    try {
      const envAuto = (process.env.AUTO_APPLY || '').toLowerCase()
      const autoApply = ['1', 'true', 'yes'].includes(envAuto)

      if (autoApply && supabaseAdmin && body.businessId) {
        // Build payload for db persist. matched_json should be JSON-friendly.
        const matchedJson = abnData ?? (() => {
          try { return JSON.parse(raw) } catch { return { raw: raw } }
        })()

        const values = {
          business_id: body.businessId,
          abn,
          business_name: businessName ?? null,
          matched_name: candidateName ?? null,
          similarity_score: Number(Math.round((similarity || 0) * 100) / 100),
          verification_method: 'api',
          status: verified ? 'verified' : requiresManualReview ? 'manual_review' : 'pending',
          matched_json: matchedJson
        }

        // Try to find existing verification row for this business & ABN.
        const { data: existing } = await supabaseAdmin
          .from('abn_verifications')
          .select('id')
          .eq('business_id', body.businessId)
          .eq('abn', abn)
          .limit(1)
          .maybeSingle()

        if (existing && (existing as any).id) {
          await supabaseAdmin.from('abn_verifications').update(values).eq('id', (existing as any).id)
        } else {
          await supabaseAdmin.from('abn_verifications').insert(values)
        }
      }
    } catch (err) {
      // Do not fail the request if persistence fails - log server-side only
      // (nextjs server runtime will log to platform logs). Keep endpoint behaviour unchanged.
      console.error('abn verify persistence failed', err)
    }

    await finish(200, true, { abn, businessId: body.businessId ?? null, verified })
    return NextResponse.json(response)
  } catch (err: any) {
    await finish(500, false, { error: err?.message })
    return NextResponse.json({ error: 'Internal error', message: err?.message ?? 'unknown' }, { status: 500 })
  }
}

// runtime is nodejs by default for app dir
