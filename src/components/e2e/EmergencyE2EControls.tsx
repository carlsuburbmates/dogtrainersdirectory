"use client"

import React, { useState } from 'react'

export default function EmergencyE2EControls() {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <div className="mt-4 p-4 border rounded bg-white">
      <button
        onClick={() => setEnabled(!enabled)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {enabled ? 'Disable Emergency Mode' : 'Enable Emergency Mode'}
      </button>

      <div className="mt-4">
        <textarea
          placeholder="Emergency message or instructions..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-2 rounded h-28"
        />
      </div>
    </div>
  )
}
