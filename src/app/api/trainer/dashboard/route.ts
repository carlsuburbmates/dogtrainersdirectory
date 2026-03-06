import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { isE2ETestMode } from '@/lib/e2eTestUtils'

export async function GET(request: Request) {
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

  const { authorized } = isE2ETestMode() ? { authorized: true } : await requireAdmin()
  if (!authorized) {
    return NextResponse.json(
      {
        success: false,
        error: 'Not implemented',
        message: 'Trainer dashboard analytics are not available yet.',
      },
      { status: 501 }
    )
  }

  const url = new URL(request.url)
  const businessId = Number(url.searchParams.get('businessId'))
  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'Missing businessId query parameter' },
      { status: 400 }
    )
  }

  const { data: business, error: businessError } = await supabaseAdmin
    .from('businesses')
    .select('id, name, abn_verified, verification_status, featured_until, suburb_id')
    .eq('id', businessId)
    .single()

  if (businessError || !business) {
    return NextResponse.json(
      { success: false, error: 'Business not found' },
      { status: 404 }
    )
  }

  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('business_id', businessId)
    .eq('is_approved', true)

  const typedReviews = (reviews ?? []) as { rating: number }[]

  const averageRating = typedReviews.length > 0
    ? Number((typedReviews.reduce((sum, review) => sum + review.rating, 0) / typedReviews.length).toFixed(1))
    : null

  return NextResponse.json({
    success: true,
    business,
    analytics: {
      totalViews: null,
      totalProfileClicks: null,
      totalInquiries: null,
      averageRating,
      reviewCount: typedReviews.length,
      note: 'Profile view analytics are not available yet.',
    }
  })
}
