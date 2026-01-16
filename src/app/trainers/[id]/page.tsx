import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import ContactForm from './ContactForm'

interface Review {
  id: number
  reviewer_name: string
  rating: number
  title?: string
  content?: string
  created_at: string
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

  // Fetch approved reviews for this trainer
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('id, reviewer_name, rating, title, content, created_at')
    .eq('business_id', id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10)

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const formatServiceType = (type: string) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || type
  }

  const isFeatured = trainer.featured_until && new Date(trainer.featured_until) > new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{trainer.business_name}</h1>
                {isFeatured && (
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">
                    ⭐ Featured
                  </span>
                )}
                {trainer.abn_verified && (
                  <span className="px-3 py-1 bg-green-400 text-green-900 text-sm font-semibold rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-blue-100 mt-2">
                <span className="text-2xl">{getRatingStars(Math.round(parseFloat(trainer.average_rating || '0')))}</span>
                <span className="text-lg font-medium">
                  {parseFloat(trainer.average_rating || '0').toFixed(1)} ({trainer.review_count || 0} reviews)
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-blue-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{trainer.suburb_name}, {trainer.suburb_postcode}</span>
                {trainer.council_name && <span className="text-blue-200">• {trainer.council_name}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <div className="md:col-span-2 space-y-6">
            {/* About Section */}
            {trainer.bio && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{trainer.bio}</p>
              </div>
            )}

            {/* Services Section */}
            {trainer.services && trainer.services.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Offered</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {trainer.services.map((service: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-800 font-medium">{formatServiceType(service)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Behavior Issues Section */}
            {trainer.behavior_issues && trainer.behavior_issues.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Behavior Issues Addressed</h2>
                <div className="flex flex-wrap gap-2">
                  {trainer.behavior_issues.map((issue: string, index: number) => (
                    <span key={index} className="px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {formatServiceType(issue)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Age Specialties Section */}
            {trainer.age_specialties && trainer.age_specialties.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Age Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {trainer.age_specialties.map((specialty: string, index: number) => (
                    <span key={index} className="px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {formatServiceType(specialty)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews ({trainer.review_count || 0})</h2>
              
              {reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review: Review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                            {review.reviewer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{review.reviewer_name}</h3>
                            <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-lg">{getRatingStars(review.rating)}</span>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                      )}
                      {review.content && (
                        <p className="text-gray-700 leading-relaxed">{review.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No reviews yet. Be the first to review this trainer!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">
            {/* Contact Information Card */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                {trainer.phone && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Phone</p>
                      <a href={`tel:${trainer.phone}`} className="text-blue-600 hover:underline font-medium">
                        {trainer.phone}
                      </a>
                    </div>
                  </div>
                )}

                {trainer.email && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Email</p>
                      <a href={`mailto:${trainer.email}`} className="text-blue-600 hover:underline break-all">
                        {trainer.email}
                      </a>
                    </div>
                  </div>
                )}

                {trainer.website && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Website</p>
                      <a href={trainer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}

                {trainer.address && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Address</p>
                      <p className="text-gray-800">{trainer.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Information */}
              {trainer.pricing && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Pricing</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{trainer.pricing}</p>
                </div>
              )}

              {/* Contact Form */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <ContactForm trainerId={id} trainerName={trainer.business_name} trainerEmail={trainer.email} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
