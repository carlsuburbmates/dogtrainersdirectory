import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateAiAutomationRolloutState } from '@/lib/ai-rollouts'
import {
  isAiAutomationRolloutState,
  isAiAutomationWorkflow
} from '@/lib/ai-automation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workflow: string }> }
) {
  const { authorized, userId } = await requireAdmin()
  if (!authorized || !userId) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  const resolvedParams = await params
  if (!isAiAutomationWorkflow(resolvedParams.workflow)) {
    return NextResponse.json({ error: 'Unknown workflow' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const targetState = body?.targetState
  const reason = typeof body?.reason === 'string' ? body.reason : ''
  const reviewOwner =
    typeof body?.reviewOwner === 'string' ? body.reviewOwner : null
  const metadata =
    body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata
      : null

  if (!isAiAutomationRolloutState(targetState)) {
    return NextResponse.json({ error: 'targetState is invalid' }, { status: 400 })
  }

  try {
    const result = await updateAiAutomationRolloutState({
      workflow: resolvedParams.workflow,
      mutation: {
        targetState,
        reason,
        reviewOwner,
        metadata
      },
      actingAdminUserId: userId
    })

    return NextResponse.json(result)
  } catch (error) {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : 500

    const message = error instanceof Error ? error.message : 'Unable to update rollout state'

    return NextResponse.json({ error: message }, { status })
  }
}

export const dynamic = 'force-dynamic'
