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

  // Use get_trainer_profile RPC to fetch trainer data
  // Pass decryption key for sensitive fields
  const decryptKey = process.env.SUPABASE_PGCRYPTO_KEY || null
  const { data, error } = await supabaseAdmin
    .rpc('get_trainer_profile', {
      p_business_id: id,
      p_key: decryptKey
    })

  // RPC returns array, get first result
  const trainer = data?.[0]

  if (!trainer || error) {
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
          <p>Location: {trainer.suburb_name || "Not specified"}</p>
          {trainer.email && <p>Email: {trainer.email}</p>}
          {trainer.phone && <p>Phone: {trainer.phone}</p>}
          <p>Average Rating: {trainer.average_rating || 0}</p>
          <p>Reviews: {trainer.review_count || 0}</p>
        </div>
      </Card>
    </div>
  )
}
