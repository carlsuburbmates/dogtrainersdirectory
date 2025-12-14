import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessId, rating, comment } = body
    
    if (!businessId || !rating) {
      return NextResponse.json(
        { error: 'Missing businessId or rating' },
        { status: 400 }
      )
    }
    
    // Insert test review
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        business_id: businessId,
        rating: Number(rating),
        comment: comment || 'Test review',
        reviewer_name: 'Test User',
        is_approved: false, // Starts as pending
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create test review', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      review: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Review seeding failed', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'