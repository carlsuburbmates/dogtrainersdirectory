import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = Number(rawId)
  if (!id) return NextResponse.json({ error: 'Invalid business id' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('businesses')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Delete failed', message: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, business: data?.[0] })
}

export const config = { runtime: 'edge' }
