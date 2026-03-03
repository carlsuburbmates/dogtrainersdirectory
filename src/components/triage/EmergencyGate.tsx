import React from 'react'
import { Button } from '@/components/ui/Button'
import { Warning } from '@/components/ui/Callout'
import type { BehaviorIssue } from '@/types/database'
import { inferEmergencyFlow } from '@/lib/triageEmergency'

interface EmergencyGateProps {
  selectedIssues: BehaviorIssue[]
  onContinueNormal: () => void
  onEmergencyFlow: (type: 'medical' | 'stray' | 'crisis') => void
  onClose: () => void
}

export const EmergencyGate = ({ selectedIssues, onContinueNormal, onEmergencyFlow, onClose }: EmergencyGateProps) => {
  const branch = inferEmergencyFlow(selectedIssues)

  const copy = {
    medical: {
      title: 'Medical emergency?',
      body: 'For severe aggression, bites, injury, or urgent medical concern, contact a 24‑hour vet immediately.',
      primaryAction: {
        text: 'Find an emergency vet',
        onClick: () => onEmergencyFlow('medical')
      },
      secondaryAction: {
        text: 'Continue to search anyway',
        onClick: () => onContinueNormal()
      }
    },
    stray: {
      title: 'Dog appears lost or stray?',
      body: 'If you’ve found a stray or in‑danger dog, check with local shelters and councils.',
      primaryAction: {
        text: 'Find emergency shelter',
        onClick: () => onEmergencyFlow('stray')
      },
      secondaryAction: {
        text: 'Continue to trainers',
        onClick: () => onContinueNormal()
      }
    },
    crisis: {
      title: 'Crisis situation?',
      body: 'If there is immediate danger to a person or animal, call emergency services or an urgent crisis line.',
      primaryAction: {
        text: 'Get crisis support',
        onClick: () => onEmergencyFlow('crisis')
      },
      secondaryAction: {
        text: 'Continue anyway',
        onClick: () => onContinueNormal()
      }
    }
  }

  const messaging = branch ? copy[branch] : null

  if (!messaging) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xl max-w-md w-full">
        <div className="mb-4">
          <Warning>
            <div className="text-sm font-medium">{messaging.title}</div>
            <div className="mt-1 text-sm">{messaging.body}</div>
          </Warning>
        </div>

        <div className="space-y-3">
          <Button onClick={messaging.primaryAction.onClick} variant="danger" className="w-full">
            {messaging.primaryAction.text}
          </Button>
          <Button onClick={messaging.secondaryAction.onClick} variant="outline" className="w-full">
            {messaging.secondaryAction.text}
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
