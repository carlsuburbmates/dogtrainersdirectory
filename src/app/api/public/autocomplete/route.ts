import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AGE_STAGE_OPTIONS, ISSUE_OPTIONS } from '@/lib/triage'

const SUGGESTION_LIMIT = 5

export async function GET(request: Request) {
  const url = new URL(request.url)
  const rawQuery = url.searchParams.get('q') ?? ''
  const query = rawQuery.trim()

  if (!query) {
    return NextResponse.json({
      query: '',
      suggestions: { trainers: [], issues: ISSUE_OPTIONS.slice(0, 3), suburbs: [], ages: [] }
    })
  }

  const queryLower = query.toLowerCase()

  const [trainerResult, suburbResult] = await Promise.all([
    supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .in('resource_type', ['trainer', 'behaviour_consultant'])
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(SUGGESTION_LIMIT),
    supabaseAdmin
      .from('suburbs')
      .select('id, name, postcode, councils ( name, region )')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(SUGGESTION_LIMIT)
  ])

  type TrainerRow = { id: number; name: string }
  type SuburbRow = {
    id: number
    name: string
    postcode: string
    councils?: { name: string; region: string } | { name: string; region: string }[] | null
  }

  const trainerRows: TrainerRow[] = trainerResult.data ?? []
  const suburbRows: SuburbRow[] = suburbResult.data ?? []

  const trainerSuggestions = trainerRows.map((item) => ({ id: item.id, name: item.name }))

  const suburbSuggestions = suburbRows.map((item) => {
    const council = Array.isArray(item.councils) ? item.councils[0] : item.councils
    return {
      id: item.id,
      name: item.name,
      postcode: item.postcode,
      council_name: council?.name ?? '',
      region: council?.region ?? ''
    }
  })

  const issueSuggestions = ISSUE_OPTIONS.filter(
    (issue) =>
      issue.label.toLowerCase().includes(queryLower) ||
      issue.value.toLowerCase().includes(queryLower)
  ).slice(0, SUGGESTION_LIMIT)

  const ageSuggestions = AGE_STAGE_OPTIONS.filter(
    (age) =>
      age.label.toLowerCase().includes(queryLower) ||
      age.value.toLowerCase().includes(queryLower)
  ).slice(0, SUGGESTION_LIMIT)

  return NextResponse.json({
    query,
    suggestions: {
      trainers: trainerSuggestions,
      issues: issueSuggestions,
      suburbs: suburbSuggestions,
      ages: ageSuggestions
    }
  })
}
