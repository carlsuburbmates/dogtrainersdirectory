import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

// Simple UI components for trainer page
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export default async function TrainerPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (isNaN(id)) return notFound()

  // Fetch trainer data
  const { data: trainer } = await supabaseAdmin
    .from('trainers')
    .select('*')
    .eq('id', id)
    .single()

  if (!trainer) return notFound()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{trainer.business_name || "Trainer"}</h1>
      <Card className="p-4">
        <p className="text-sm text-gray-600">
          Trainer profile page (placeholder - fully implemented in separate PR)
        </p>
        <div className="mt-4">
          <p>Trainer ID: {id}</p>
          <p>Location: {trainer.suburb || "Not specified"}</p>
        </div>
      </Card>
    </div>
  )
}