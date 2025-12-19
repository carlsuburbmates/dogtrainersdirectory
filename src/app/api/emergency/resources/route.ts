import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('emergency_resources')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch emergency resources', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ resources: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'