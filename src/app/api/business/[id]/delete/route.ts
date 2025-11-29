import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
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
