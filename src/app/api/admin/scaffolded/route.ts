import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const RESEND_API_KEY = process.env.RESEND_API_KEY

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('id, name, verification_status, is_scaffolded, bio')
    .eq('is_scaffolded', true)
    .eq('verification_status', 'manual_review')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Unable to fetch scaffolded listings' }, { status: 500 })
  }
  return NextResponse.json({ scaffolded: data || [] })
}

export type ReviewAction = 'approve' | 'reject'

export async function POST(request: NextRequest) {
  const { id, action } = await request.json() as { id: number; action: ReviewAction }
  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
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

  const { error } = await supabaseAdmin.from('businesses').update(updates).eq('id', id)
  if (error) {
    return NextResponse.json({ error: 'Failed to update scaffolded listing' }, { status: 500 })
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
      await fetch('https://api.resend.com/emails', {
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
<p>If you haven’t already, <a href="https://dogtrainersdirectory.com/trainer">log in to your dashboard</a> to confirm your profile details and share your availability.</p>
<p>Thanks,<br/>dogtrainersdirectory</p>
`
        })
      })
    }
  }

  return NextResponse.json({ success: true })
}

export const config = {
  runtime: 'edge',
}
