import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import ReviewList from '@/components/ReviewList'

export const revalidate = 3600

type TrainerProfile = {
  business_id: number
  business_name: string
  abn_verified: boolean
  verification_status: string
  address: string | null
  website: string | null
  email: string | null
  phone: string | null
  bio: string | null
  pricing: string | null
  featured_until: string | null
  suburb_name: string
  suburb_postcode: string
  council_name: string
  region: string
  average_rating: number
  review_count: number
  age_specialties: string[]
  behavior_issues: string[]
  services: string[]
}

const formatTag = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export async function getTrainerProfile(id: number) {
  const { data, error } = await supabaseAdmin.rpc('get_trainer_profile', {
    p_business_id: id,
    p_key: process.env.SUPABASE_PGCRYPTO_KEY ?? null
  })

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0] as TrainerProfile
}

export default async function TrainerProfilePage({ params }: { params: { id: string } }) {
  const businessId = Number(params.id)
  if (!businessId) {
    notFound()
  }

  const profile = await getTrainerProfile(businessId)
  if (!profile) {
    notFound()
  }

  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('id, reviewer_name, rating, content, created_at, title')
    .eq('business_id', businessId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="card space-y-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-bold text-gray-900">{profile.business_name}</h1>
              {profile.abn_verified && <span className="badge badge-blue">✓ ABN Verified</span>}
              {profile.featured_until && new Date(profile.featured_until) > new Date() && (
                <span className="badge badge-gold">🏆 Featured</span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {profile.suburb_name} {profile.suburb_postcode} · {profile.council_name} · {profile.region}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <span>
                ⭐ {profile.average_rating?.toFixed(1) ?? 'N/A'} ({profile.review_count} reviews)
              </span>
              <span>Status: {profile.verification_status}</span>
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {profile.bio && (
              <section className="card space-y-2">
                <h2 className="text-xl font-semibold">About</h2>
                <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
              </section>
            )}
            <section className="card space-y-4">
              <h2 className="text-xl font-semibold">Specialties</h2>
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500">Age groups</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.age_specialties.map((age) => (
                    <span key={age} className="badge badge-blue">
                      {formatTag(age)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500">Behaviour issues</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.behavior_issues.map((issue) => (
                    <span key={issue} className="badge badge-orange">
                      {formatTag(issue)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500">Services</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.services.map((service) => (
                    <span key={service} className="badge badge-purple">
                      {formatTag(service)}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {profile.pricing && (
              <section className="card space-y-2">
                <h2 className="text-xl font-semibold">Pricing</h2>
                <p className="text-gray-700 whitespace-pre-line">{profile.pricing}</p>
              </section>
            )}

            <section className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Reviews</h2>
                <span className="text-sm text-gray-500">{profile.review_count} total</span>
              </div>
              <ReviewList reviews={reviews ?? []} />
            </section>
          </div>

          <aside className="space-y-6">
            <section className="card space-y-3">
              <h3 className="text-lg font-semibold">Contact</h3>
              <div className="text-sm text-gray-700 space-y-2">
                {profile.phone && (
                  <p>
                    📞{' '}
                    <a href={`tel:${profile.phone}`} className="text-blue-600 underline">
                      {profile.phone}
                    </a>
                  </p>
                )}
                {profile.email && (
                  <p>
                    ✉️{' '}
                    <a href={`mailto:${profile.email}`} className="text-blue-600 underline">
                      {profile.email}
                    </a>
                  </p>
                )}
                {profile.website && (
                  <p>
                    🌐{' '}
                    <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      Visit website
                    </a>
                  </p>
                )}
                {profile.address && <p>📍 {profile.address}</p>}
              </div>
            </section>
            <section className="card space-y-3">
              <h3 className="text-lg font-semibold">Need help?</h3>
              <p className="text-sm text-gray-600">
                Contact the admin team for manual onboarding assistance or ABN verification help.
              </p>
              <Link href="/onboarding" className="btn-secondary w-full text-center">
                Update your listing
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
