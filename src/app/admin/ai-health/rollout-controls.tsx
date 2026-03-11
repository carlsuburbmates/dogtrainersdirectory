'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type {
  AiAutomationRolloutResolution,
  AiAutomationRolloutState
} from '@/lib/ai-automation'

type RolloutControlsProps = {
  resolution: AiAutomationRolloutResolution
}

type ActionConfig = {
  label: string
  targetState: AiAutomationRolloutState
  needsReviewOwner?: boolean
}

function getActionsForResolution(
  resolution: AiAutomationRolloutResolution
): ActionConfig[] {
  if (resolution.shadowCapped) {
    return resolution.rolloutState === 'disabled'
      ? [{ label: 'Return to shadow-only', targetState: 'shadow_only' }]
      : [{ label: 'Disable', targetState: 'disabled' }]
  }

  const actions: ActionConfig[] = []

  if (resolution.rolloutState !== 'disabled') {
    actions.push({ label: 'Disable', targetState: 'disabled' })
  }

  if (resolution.rolloutState !== 'paused_after_review') {
    actions.push({ label: 'Pause', targetState: 'paused_after_review' })
  }

  if (resolution.rolloutState !== 'shadow') {
    actions.push({ label: 'Return to shadow', targetState: 'shadow' })
  }

  if (resolution.controlledLiveCandidate && resolution.rolloutState === 'shadow') {
    actions.push({
      label: 'Mark ready for review',
      targetState: 'shadow_live_ready',
      needsReviewOwner: true
    })
  }

  if (
    resolution.controlledLiveCandidate &&
    resolution.workflow === 'ops_digest' &&
    resolution.rolloutState === 'shadow_live_ready'
  ) {
    actions.push({
      label: 'Enable controlled live',
      targetState: 'controlled_live'
    })
  }

  return actions
}

export function RolloutControls({ resolution }: RolloutControlsProps) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [reviewOwner, setReviewOwner] = useState(resolution.reviewOwner ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const actions = getActionsForResolution(resolution)

  if (actions.length === 0) {
    return null
  }

  const runAction = (action: ActionConfig) => {
    if (!reason.trim()) {
      setError('Reason is required.')
      return
    }

    if (action.needsReviewOwner && !reviewOwner.trim()) {
      setError('Review owner is required for readiness review.')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/ai-rollouts/${resolution.workflow}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            targetState: action.targetState,
            reason,
            reviewOwner: action.needsReviewOwner ? reviewOwner : undefined
          })
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          setError(payload?.error ?? 'Unable to update rollout state.')
          return
        }

        setReason('')
        router.refresh()
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : 'Unable to update rollout state.'
        )
      }
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Operator controls</h3>
        <p className="mt-1 text-xs text-gray-600">
          Env mode remains the hard ceiling. These controls narrow, pause, or stage rollout within that ceiling.
        </p>
      </div>

      <label className="block text-xs text-gray-700">
        Reason
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Explain the rollout change or rollback decision."
        />
      </label>

      {actions.some((action) => action.needsReviewOwner) ? (
        <label className="block text-xs text-gray-700">
          Review owner
          <input
            value={reviewOwner}
            onChange={(event) => setReviewOwner(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Name or role responsible for review"
          />
        </label>
      ) : null}

      {error ? <p className="text-xs text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => runAction(action)}
            disabled={isPending}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
