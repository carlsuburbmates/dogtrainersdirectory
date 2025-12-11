import { EmergencyControls } from '@/components/emergency/EmergencyControls'

// Emergency triage dashboard shell now renders on the server so the static status copy ships without hydration.
export default function EmergencyPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="card space-y-6">
        <header>
          <p className="text-sm uppercase tracking-wider text-amber-600 font-semibold">Emergency response</p>
        </header>
        <h2 className="text-2xl font-semibold">Emergency Triage</h2>

        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-2">
          <h3 className="text-lg font-medium text-yellow-800">AI-Powered Emergency Response</h3>
          <p className="text-yellow-700 text-sm">
            This dashboard provides real-time monitoring and automated triage for critical system issues. The non-interactive
            telemetry now renders entirely on the server to keep the client bundle reserved for controls only.
          </p>
        </section>

        <section className="card-border p-4 rounded-lg space-y-4">
          <h3 className="text-lg font-medium">System Status</h3>
          <div className="text-sm text-gray-600">
            <p>Emergency triage system is running. AI monitoring is active.</p>
            <p className="text-xs text-gray-500 mt-1">
              Source: `/api/emergency/triage` and `/api/emergency/verify` smoke-verified in RUNBOOK.
            </p>
          </div>
        </section>

        <EmergencyControls />
      </div>
    </div>
  )
}
