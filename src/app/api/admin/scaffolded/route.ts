import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
  return NextResponse.json({ success: true })
}

export const config = {
  runtime: 'edge',
}
