import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const nowIso = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('ops_overrides')
      .select('id, service, status, reason, expires_at, created_at')
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ overrides: data ?? [] })
  } catch (error) {
    console.error('Failed to fetch ops overrides', error)
    return NextResponse.json({ overrides: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, status, reason } = body ?? {}
    if (!service || !status) {
      return NextResponse.json({ error: 'service and status are required' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabaseAdmin
      .from('ops_overrides')
      .insert({
        service,
        status,
        reason: reason || null,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ override: data })
  } catch (error) {
    console.error('Failed to create override', error)
    return NextResponse.json({ error: 'Unable to create override' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const service = url.searchParams.get('service')
    if (!service) {
      return NextResponse.json({ error: 'service is required' }, { status: 400 })
    }

    await supabaseAdmin
      .from('ops_overrides')
      .delete()
      .eq('service', service)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete override', error)
    return NextResponse.json({ error: 'Unable to delete override' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
