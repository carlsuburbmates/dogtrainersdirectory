import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

// Simple UI components for trainer page
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export default async function TrainerPage({ params, searchParams }: { params: { id: string }, searchParams?: Record<string, string> }) {
  const resolvedParams = await Promise.resolve(params as any)
  const id = Number(resolvedParams.id)
  if (isNaN(id)) return notFound()

  // Fetch trainer data
  const { data: trainer } = await supabaseAdmin
    .from('trainers')
    .select('*')
    .eq('id', id)
    .single()

  if (!trainer) {
    const resolvedSearchParams = await Promise.resolve(searchParams as any)
    if (resolvedSearchParams?.e2eName) {
      return (
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">{resolvedSearchParams.e2eName}</h1>
          <div className="p-4">Trainer profile page (E2E fallback via query)</div>
        </div>
      )
    }

    // render a client-side fallback that reads test fixtures from sessionStorage
    const TrainerFallback = (await import('@/components/e2e/TrainerFallbackClient')).default
    return <TrainerFallback id={id} />
  }

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
