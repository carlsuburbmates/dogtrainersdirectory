import { supabaseAdmin } from '@/lib/supabase'

// Simple UI components for trainers page
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export default async function TrainersPage() {
  // Fetch trainers data
  const { data: trainers } = await supabaseAdmin
    .from('trainers')
    .select('*')
    .limit(10)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dog Trainers</h1>
      <Card className="p-4">
        <p className="text-sm text-gray-600">
          Trainers directory page (placeholder - fully implemented in separate PR)
        </p>
        <div className="mt-4">
          <p>Total trainers: {trainers?.length || 0}</p>
        </div>
      </Card>
    </div>
  )
}