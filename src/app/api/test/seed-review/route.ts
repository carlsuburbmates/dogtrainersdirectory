import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { isE2ETestMode } from '@/lib/e2eTestUtils'

async function enforceTestWriteAccess() {
  if (isE2ETestMode()) return null

  const { authorized } = await requireAdmin()
  if (authorized) return null

  return NextResponse.json(
    {
      success: false,
      error: 'Forbidden',
      message: 'This endpoint is restricted to operators.',
    },
    { status: 403 }
  )
}

export async function POST(request: Request) {
  try {
    const gate = await enforceTestWriteAccess()
    if (gate) return gate

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service unavailable',
          message: 'Server configuration is missing.',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { businessId, rating, title, content, reviewerName, reviewerEmail } = body
    
    if (!businessId || !rating) {
      return NextResponse.json(
        { success: false, error: 'Missing businessId or rating' },
        { status: 400 }
      )
    }

    const numericRating = Number(rating)
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }
    
    // Insert test review
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        business_id: businessId,
        rating: numericRating,
        title: typeof title === 'string' ? title : 'Seeded review (test)',
        content: typeof content === 'string' ? content : 'Seeded review for test verification.',
        reviewer_name: typeof reviewerName === 'string' ? reviewerName : 'DTD Test Operator',
        reviewer_email: typeof reviewerEmail === 'string' ? reviewerEmail : 'test@dogtrainersdirectory.com.au',
        is_approved: false,
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create test review', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      review: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Review seeding failed', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
