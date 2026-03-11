import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAiAutomationRuntimeResolutions } from '@/lib/ai-rollouts'

export async function GET() {
  const { authorized } = await requireAdmin()
  if (!authorized) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  const workflows = await getAiAutomationRuntimeResolutions()
  return NextResponse.json({
    workflows,
    fetchedAt: new Date().toISOString()
  })
}

export const dynamic = 'force-dynamic'
