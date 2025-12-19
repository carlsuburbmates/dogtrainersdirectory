import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Store feedback about emergency triage classification
    const { triageId, wasHelpful, feedback } = body
    
    if (!triageId) {
      return NextResponse.json(
        { error: 'Missing triage ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('emergency_triage_feedback')
      .insert({ 
        triage_id: triageId,
        was_helpful: wasHelpful,
        feedback_text: feedback,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save feedback', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, feedback: data?.[0] })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'