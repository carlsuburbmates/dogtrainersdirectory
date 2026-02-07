'use client'

import { useState } from 'react'

interface EmergencyControlsProps {
  defaultMessage?: string
}

export function EmergencyControls({ defaultMessage = '' }: EmergencyControlsProps) {
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [triggerMessage, setTriggerMessage] = useState(defaultMessage)

  return (
    <div className="card-border p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Emergency Controls</h3>
      <div className="space-y-4">
        <div>
          <button
            className={`btn-${emergencyMode ? 'danger' : 'primary'}`}
            onClick={() => setEmergencyMode((prev) => !prev)}
          >
            {emergencyMode ? 'Disable Emergency Mode' : 'Enable Emergency Mode'}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Toggling this switch simulates the ops-only kill switch described in DOCS/SSOT/08_OPS_RUNBOOK.md.
          </p>
        </div>
        <div>
          <textarea
            className="w-full text-sm p-3 border rounded"
            placeholder="Emergency message or instructions..."
            value={triggerMessage}
            onChange={(e) => setTriggerMessage(e.target.value)}
            rows={4}
          />
          <p className="mt-1 text-xs text-gray-500">
            Messages are stored locally only; runtime systems still rely on the ops API inputs logged in Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
