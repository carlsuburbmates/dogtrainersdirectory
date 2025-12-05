import { NextResponse } from 'next/server'
import { getOrCreateDailyDigest } from '@/lib/digest'

export async function POST(request: Request) {
  try {
    // Only admin/service-role allowed — be tolerant and informative when missing
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY required to run ops digest' }, { status: 400 })
    }

    const digest = await getOrCreateDailyDigest(true) // Force regeneration

    return NextResponse.json({ 
        digest: digest.summary, 
        aiEnabled: true, 
        metrics: digest.metrics 
    }, { status: 200 })

  } catch (error: any) {
    console.error('ops-digest error', error)
    return NextResponse.json({ error: 'Unable to create ops digest' }, { status: 500 })
  }
}

export const runtime = 'nodejs' // Switch to nodejs as lib/digest uses process.env widely and might not be edge safe yet
