import { NextResponse } from 'next/server'
import { runModerationCycle } from '@/lib/services/moderation-service'

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server service role key required' }, { status: 401 })
    }

    const result = await runModerationCycle()
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('Admin run moderation failed', err)
    return NextResponse.json({ success: false, error: err?.message ?? 'Unknown' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
