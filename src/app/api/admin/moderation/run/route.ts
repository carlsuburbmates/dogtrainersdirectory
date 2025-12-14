import { NextResponse } from 'next/server'
import { runModerationCycle } from '@/lib/services/moderation-service'

/**
 * Moderation Cron Endpoint
 * 
 * POST /api/admin/moderation/run
 * 
 * Triggers a moderation cycle on pending reviews.
 * Designed to be called by Vercel Cron (every 10 minutes) or manually from admin UI.
 * 
 * Authentication:
 * - Requires SUPABASE_SERVICE_ROLE_KEY (server-only)
 * - OR Vercel cron secret header
 */
export async function POST(request: Request) {
  try {
    // Auth check: require either a valid Bearer token (with service role) or a valid cron secret
    // Note: Bearer auth requires BOTH authHeader AND serviceRoleKey to be present
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-vercel-cron-secret')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const expectedCronSecret = process.env.CRON_SECRET
    
    const isBearerAuth =
      !!authHeader &&
      authHeader.startsWith('Bearer ') &&
      serviceRoleKey &&
      authHeader.slice('Bearer '.length).trim() === serviceRoleKey
    const isCronAuth =
      !!cronSecret &&
      expectedCronSecret &&
      cronSecret === expectedCronSecret
    const isAuthorized = isBearerAuth || isCronAuth

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: valid SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET required' },
        { status: 401 }
      )
    }

    // Run the moderation cycle
    const result = await runModerationCycle()

    if (!result.success) {
      return NextResponse.json(
        {
          message: 'Moderation cycle completed with errors',
          ...result
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Moderation cycle completed successfully',
        ...result
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Moderation cron endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Moderation cycle failed',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Vercel cron configuration (also added to vercel.json)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
