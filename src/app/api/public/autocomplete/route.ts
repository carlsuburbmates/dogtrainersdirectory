import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Search for businesses and trainers matching query
    const { businesses } = await searchBusinesses(query)
    const { suburbs } = await searchSuburbs(query)
    
    return NextResponse.json({
      suggestions: [
        ...businesses.map((b) => ({ type: 'business', display: b.business_name, id: b.id })),
        ...suburbs.map((s) => ({ type: 'suburb', display: s.suburb, id: s.suburb }))
      ]
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Autocomplete search failed', message: error.message },
      { status: 500 }
    )
  }
}

async function searchBusinesses(query: string) {
  type BusinessRow = { id: number; business_name: string; suburb: string | null }
  const { data: businesses, error } = await supabaseAdmin
    .from('businesses')
    .select('id, business_name, suburb')
    .ilike('business_name', `%${query}%`)
    .eq('is_active', true)
    .limit(5)
  
  return { businesses: ((businesses ?? []) as BusinessRow[]) }
}

async function searchSuburbs(query: string) {
  type SuburbRow = { suburb: string | null }
  const { data: suburbs, error } = await supabaseAdmin
    .from('businesses')
    .select('suburb')
    .ilike('suburb', `%${query}%`)
    .not('suburb', 'is', null)
    .limit(5)

  // Remove duplicates
  const suburbsList = ((suburbs ?? []) as SuburbRow[])
  const uniqueSuburbs = suburbsList.filter((item, index, arr) =>
    arr.findIndex((t) => t.suburb === item.suburb) === index
  )

  return { suburbs: uniqueSuburbs }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
