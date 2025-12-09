import { supabaseAdmin } from '@/lib/supabase'

// Simple UI components for emergency page
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export default async function EmergencyPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Emergency Assistance</h1>
      <Card className="p-4">
        <p className="text-sm text-gray-600">
          Emergency assistance page (placeholder - fully implemented in separate PR)
        </p>
        <div className="mt-4">
          <p>If your dog needs immediate help, please contact your local veterinarian.</p>
        </div>
      </Card>
    </div>
  )
}