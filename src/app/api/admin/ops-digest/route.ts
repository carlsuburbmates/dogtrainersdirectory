import { NextResponse } from 'next/server'
import { getOrCreateDailyDigest } from '@/lib/digest'

export async function POST(request: Request) {
  try {
    // Check if force flag is set
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'
    
    // Generate daily digest
    const digest = await getOrCreateDailyDigest(force)
    
    return NextResponse.json({
      success: true,
      digest: digest
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate ops digest', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'