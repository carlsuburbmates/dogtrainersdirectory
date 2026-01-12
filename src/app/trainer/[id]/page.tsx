import { redirect } from 'next/navigation'

/**
 * Redirect /trainer/[id] to /trainers/[id] (plural)
 * Maintains backward compatibility while standardizing on plural form
 */
export default async function TrainerRedirectPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params as any)
  const id = resolvedParams.id
  
  // Redirect to plural form
  redirect(`/trainers/${id}`)
}
