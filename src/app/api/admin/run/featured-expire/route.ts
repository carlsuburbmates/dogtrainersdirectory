import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Server-side only helper — call internal featured/expire endpoint using CRON_SECRET
    if (!process.env.CRON_SECRET && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server cron/service key required' }, { status: 401 })
    }

    // Call internal endpoint using server-side fetch with CRON secret
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const url = `${base.replace(/\/$/, '')}/api/admin/featured/expire`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-vercel-cron-secret': process.env.CRON_SECRET || ''
      }
    })

    const json = await res.json()
    return NextResponse.json({ success: res.ok, data: json }, { status: res.ok ? 200 : 500 })
  } catch (err: any) {
    console.error('Admin run featured-expire failed', err)
    return NextResponse.json({ success: false, error: err?.message ?? 'Unknown' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
