import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const locationQuery = url.searchParams.get('location') || url.searchParams.get('q')
    const resourceType = url.searchParams.get('resource_type') || url.searchParams.get('type')

    let query = supabaseAdmin
      .from('emergency_resources')
      .select('*')
      .eq('is_active', true)

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (locationQuery) {
      const safeLocation = locationQuery.trim()
      if (safeLocation) {
        query = query.or(`name.ilike.%${safeLocation}%,address.ilike.%${safeLocation}%`)
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

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
