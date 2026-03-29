import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  buildOperatorScaffoldReviewGuidanceCandidate,
  buildOperatorScaffoldReviewGuidanceForListing,
  recordOperatorScaffoldReviewGuidanceShadowTrace,
  type ScaffoldReviewQueueItem
} from '@/lib/operatorScaffoldReviewGuidanceShadow'

const RESEND_API_KEY = process.env.RESEND_API_KEY

function getScaffoldApprovalLoginHref() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dogtrainersdirectory.com.au').replace(/\/$/, '')
  const loginUrl = new URL('/login', `${baseUrl}/`)
  loginUrl.searchParams.set('redirectTo', '/account/business')
  return loginUrl.toString()
}

type ScaffoldedListing = {
  id: number
  name: string
  verification_status: string
  is_scaffolded: boolean
  bio: string | null
  guidance_checks?: string[]
  next_action?: string
  guidance_source?: 'shadow_trace'
}

function scaffoldedErrorResponse(
  error: string,
  status: number,
  message?: string
) {
  return NextResponse.json(
    {
      success: false,
      scaffolded: [],
      error,
      ...(message ? { message } : {}),
    },
    { status }
  )
}

export async function GET() {
  const started = Date.now()
  try {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('id, name, verification_status, is_scaffolded, bio')
      .eq('is_scaffolded', true)
      .eq('verification_status', 'manual_review')
      .order('created_at', { ascending: false })

    if (error) {
      await recordOperatorScaffoldReviewGuidanceShadowTrace({
        route: '/api/admin/scaffolded',
        durationMs: Date.now() - started,
        scaffoldedQueue: [],
        errorMessage: error.message
      })
      return scaffoldedErrorResponse(
        'Unable to fetch scaffolded listings',
        500,
        error.message
      )
    }

    const scaffoldedQueue = (data || []) as unknown as ScaffoldReviewQueueItem[]
    const guidanceCandidate = buildOperatorScaffoldReviewGuidanceCandidate(scaffoldedQueue)
    const guidanceByBusinessId = new Map(
      (guidanceCandidate?.sample || []).map((sample) => [sample.businessId, sample.checks])
    )

    await recordOperatorScaffoldReviewGuidanceShadowTrace({
      route: '/api/admin/scaffolded',
      durationMs: Date.now() - started,
      scaffoldedQueue
    })

    return NextResponse.json({
      success: true,
      scaffolded: scaffoldedQueue.map((listing) => {
        const fallbackGuidance = buildOperatorScaffoldReviewGuidanceForListing(listing)
        const checks = guidanceByBusinessId.get(listing.id) || fallbackGuidance.checks

        return {
          ...listing,
          guidance_checks: checks,
          next_action: fallbackGuidance.nextAction,
          guidance_source: 'shadow_trace',
        } satisfies ScaffoldedListing
      }),
    })
  } catch (error: any) {
    console.error('Scaffolded GET failed', error)
    await recordOperatorScaffoldReviewGuidanceShadowTrace({
      route: '/api/admin/scaffolded',
      durationMs: Date.now() - started,
      scaffoldedQueue: [],
      errorMessage: error?.message ?? null
    })
    return scaffoldedErrorResponse(
      'Unable to fetch scaffolded listings',
      500,
      error?.message
    )
  }
}

export type ReviewAction = 'approve' | 'reject'

export async function POST(request: NextRequest) {
  try {
    const { id, action } = await request.json() as {
      id: number
      action: ReviewAction
    }
    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing id or action' },
        { status: 400 }
      )
    }

    const updates =
      action === 'approve'
        ? {
            is_scaffolded: false,
            is_claimed: true,
            verification_status: 'verified',
            abn_verified: true,
          }
        : {
            verification_status: 'manual_review',
            is_scaffolded: true,
            is_claimed: false,
          }

    const { error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('id', id)
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update scaffolded listing',
          message: error.message,
        },
        { status: 500 }
      )
    }

    if (action === 'approve' && RESEND_API_KEY) {
      const { data: businessData } = await supabaseAdmin
        .from('businesses')
        .select(
          `name, pgp_sym_decrypt(email_encrypted::text, current_setting('pgcrypto.key')) as email`
        )
        .eq('id', id)
        .single()
      const email = businessData?.email
      if (email) {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Team <team@dogtrainersdirectory.com.au>',
            to: email,
            subject: 'Your scaffolded listing is live',
            html: `
<p>Hi ${businessData.name},</p>
<p>Your scaffolded listing has now been approved and appears live on dogtrainersdirectory.com.au.</p>
<p>If you haven’t already, <a href="${getScaffoldApprovalLoginHref()}">sign in to your business dashboard</a> to confirm your profile details and share your availability.</p>
<p>Thanks,<br/>dogtrainersdirectory</p>
`
          })
        })

        if (!resendResponse.ok) {
          console.warn('Scaffold approval email failed to send', await resendResponse.text())
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Scaffolded POST failed', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update scaffolded listing',
        message: error?.message,
      },
      { status: 500 }
    )
  }
}

// runtime is edge by default for app dir
