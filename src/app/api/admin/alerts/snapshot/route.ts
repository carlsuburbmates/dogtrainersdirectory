import { NextResponse } from 'next/server'
import { evaluateAlerts } from '@/lib/alerts'

export async function GET() {
  const snapshot = await evaluateAlerts()
  return NextResponse.json(snapshot)
}

export const dynamic = 'force-dynamic'
