import { supabaseAdmin } from './supabase'

type FallbackReason =
  | 'onboarding_manual_review'
  | 'onboarding_abn_invalid'
  | 'abn_verify_manual_review'
  | 'abn_verify_inactive'
  | 'abn_verify_error'

export async function recordAbnFallbackEvent({
  businessId,
  reason
}: {
  businessId?: number | null
  reason: FallbackReason
}) {
  try {
    if (!supabaseAdmin) return

    await supabaseAdmin.from('abn_fallback_events').insert({
      business_id: businessId ?? null,
      reason,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.warn('Failed to record ABN fallback event', error)
  }
}
