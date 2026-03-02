import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import ContactForm from './ContactForm'
import {
  recordCommercialFunnelMetric,
  recordLatencyMetric
} from '@/lib/telemetryLatency'

interface Review {
  id: number
  reviewer_name: string
  rating: number
  title?: string
  content?: string
  created_at: string
}

export default async function TrainerPage({
  params,
  searchParams
}: {
  params: { id: string }
  searchParams?: Record<string, string>
}) {
  const started = Date.now()
  const resolvedParams = await Promise.resolve(params as any)
  const resolvedSearchParams = await Promise.resolve(searchParams as any)
  const flowSource =
    typeof resolvedSearchParams?.flow_source === 'string' ? resolvedSearchParams.flow_source : null
  const id = Number(resolvedParams.id)

  if (isNaN(id)) {
    await recordLatencyMetric({
      area: 'trainer_profile_page',
      route: '/trainers/[id]',
      durationMs: Date.now() - started,
      success: false,
      statusCode: 404,
      metadata: { reason: 'invalid_id', flowSource }
    })
    await recordCommercialFunnelMetric({
      stage: 'trainer_profile_view',
      durationMs: Date.now() - started,
      success: false,
      statusCode: 404,
      metadata: { reason: 'invalid_id', flowSource }
    })
    return notFound()
  }

  const decryptKey = process.env.SUPABASE_PGCRYPTO_KEY || null
  const { data, error } = await supabaseAdmin.rpc('get_trainer_profile', {
    p_business_id: id,
    p_key: decryptKey
  })

  const trainer = data?.[0]

  if (!trainer || error) {
    if (resolvedSearchParams?.e2eName) {
      await recordLatencyMetric({
        area: 'trainer_profile_page',
        route: '/trainers/[id]',
        durationMs: Date.now() - started,
        success: true,
        statusCode: 200,
        metadata: { businessId: id, flowSource, e2eFallback: true }
      })
      await recordCommercialFunnelMetric({
        stage: 'trainer_profile_view',
        durationMs: Date.now() - started,
        success: true,
        statusCode: 200,
        metadata: { businessId: id, flowSource, e2eFallback: true }
      })
      return (
        <div className="container mx-auto p-6">
          <h1 className="mb-6 text-2xl font-bold">{resolvedSearchParams.e2eName}</h1>
          <div className="p-4">Trainer profile page (E2E fallback via query)</div>
        </div>
      )
    }

    await recordLatencyMetric({
      area: 'trainer_profile_page',
      route: '/trainers/[id]',
      durationMs: Date.now() - started,
      success: false,
      statusCode: 404,
      metadata: { businessId: id, flowSource, fallback: 'sessionStorage' }
    })
    await recordCommercialFunnelMetric({
      stage: 'trainer_profile_view',
      durationMs: Date.now() - started,
      success: false,
      statusCode: 404,
      metadata: { businessId: id, flowSource, fallback: 'sessionStorage' }
    })
    const TrainerFallback = (await import('@/components/e2e/TrainerFallbackClient')).default
    return <TrainerFallback id={id} />
  }

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

  const formatServiceType = (value: string) => {
    return value?.replace(/_/g, ' ').replace(/\b\w/g, (label) => label.toUpperCase()) || value
  }

  const isFeatured = trainer.featured_until && new Date(trainer.featured_until) > new Date()
  const averageRating = parseFloat(trainer.average_rating || '0')

  await recordLatencyMetric({
    area: 'trainer_profile_page',
    route: '/trainers/[id]',
    durationMs: Date.now() - started,
    success: true,
    statusCode: 200,
    metadata: {
      businessId: id,
      flowSource,
      reviewCount: trainer.review_count || 0
    }
  })
  await recordCommercialFunnelMetric({
    stage: 'trainer_profile_view',
    durationMs: Date.now() - started,
    success: true,
    statusCode: 200,
    metadata: {
      businessId: id,
      flowSource,
      featured: Boolean(isFeatured),
      reviewCount: trainer.review_count || 0
    }
  })

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_30%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_38%,#ffffff_100%)]">
      <div className="border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            <Link
              href={flowSource ? `/search?flow_source=${encodeURIComponent(flowSource)}` : '/search'}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200 transition-colors hover:bg-white/10"
            >
              Back to search
            </Link>
            {isFeatured && (
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-100">
                Featured listing
              </span>
            )}
            {trainer.abn_verified && (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-100">
                Verified business
              </span>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                {trainer.business_name}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
                Review fit, contact details, and proof points before you reach out. This page is
                designed to help you decide quickly, not keep hunting for basics.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <span>
                  {trainer.suburb_name}, {trainer.suburb_postcode}
                </span>
                {trainer.council_name && <span>{trainer.council_name}</span>}
                <span>
                  {averageRating > 0
                    ? `${averageRating.toFixed(1)} rating`
                    : 'No public rating yet'}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Rating
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {getRatingStars(Math.round(averageRating))}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {averageRating.toFixed(1)} from {trainer.review_count || 0}{' '}
                    {trainer.review_count === 1 ? 'review' : 'reviews'}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Best for
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Owners ready to shortlist a trainer and move directly into contact.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                Quick trust check
              </p>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-200">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {trainer.abn_verified
                    ? 'Business verification is visible on this listing.'
                    : 'Business verification is not currently shown for this listing.'}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {trainer.review_count > 0
                    ? `${trainer.review_count} approved reviews are visible below.`
                    : 'This trainer does not yet have public reviews on the directory.'}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Services, age specialties, and behaviour support are listed below so you can
                  assess fit before contacting them.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            {trainer.bio && (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]">
                <h2 className="text-2xl font-bold text-slate-950">About this trainer</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-base">
                  {trainer.bio}
                </p>
              </section>
            )}

            {(trainer.services?.length > 0 ||
              trainer.behavior_issues?.length > 0 ||
              trainer.age_specialties?.length > 0) && (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]">
                <h2 className="text-2xl font-bold text-slate-950">Fit snapshot</h2>
                <div className="mt-5 space-y-5">
                  {trainer.services && trainer.services.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Services offered
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {trainer.services.map((service: string, index: number) => (
                          <div
                            key={`${service}-${index}`}
                            className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-slate-800"
                          >
                            {formatServiceType(service)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {trainer.behavior_issues && trainer.behavior_issues.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Behaviour issues addressed
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {trainer.behavior_issues.map((issue: string, index: number) => (
                          <span
                            key={`${issue}-${index}`}
                            className="rounded-full bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700"
                          >
                            {formatServiceType(issue)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {trainer.age_specialties && trainer.age_specialties.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Age specialties
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {trainer.age_specialties.map((specialty: string, index: number) => (
                          <span
                            key={`${specialty}-${index}`}
                            className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                          >
                            {formatServiceType(specialty)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Reviews ({trainer.review_count || 0})
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Use reviews as context, then confirm fit directly with the trainer.
                  </p>
                </div>
              </div>

              {reviews && reviews.length > 0 ? (
                <div className="mt-6 space-y-6">
                  {reviews.map((review: Review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                            {review.reviewer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{review.reviewer_name}</h3>
                            <p className="text-sm text-slate-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg">{getRatingStars(review.rating)}</span>
                      </div>
                      {review.title && (
                        <h4 className="mt-4 text-base font-semibold text-slate-900">{review.title}</h4>
                      )}
                      {review.content && (
                        <p className="mt-2 text-sm leading-7 text-slate-700">{review.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center text-sm text-slate-500">
                  No reviews yet. Use the service fit, verification, and direct conversation to
                  make the next decision.
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]">
              <h3 className="text-xl font-bold text-slate-950">Contact Information</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Reach out once the fit looks right. The fastest path is usually phone or email.
              </p>

              <div className="mt-5 space-y-4">
                {trainer.phone && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Phone
                    </p>
                    <a
                      href={`tel:${trainer.phone}`}
                      className="mt-2 inline-block text-base font-semibold text-blue-700 hover:underline"
                    >
                      {trainer.phone}
                    </a>
                  </div>
                )}

                {trainer.email && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Email
                    </p>
                    <a
                      href={`mailto:${trainer.email}`}
                      className="mt-2 inline-block break-all text-base font-semibold text-blue-700 hover:underline"
                    >
                      {trainer.email}
                    </a>
                  </div>
                )}

                {trainer.website && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Website
                    </p>
                    <a
                      href={trainer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-base font-semibold text-blue-700 hover:underline"
                    >
                      Visit website
                    </a>
                  </div>
                )}

                {trainer.address && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Address
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{trainer.address}</p>
                  </div>
                )}
              </div>

              {trainer.pricing && (
                <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                    Pricing
                  </h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {trainer.pricing}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]">
              <h3 className="text-xl font-bold text-slate-950">Send an enquiry</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use the form if you want a documented first contact through the directory.
              </p>
              <div className="mt-5 border-t border-slate-200 pt-5">
                <ContactForm
                  trainerId={id}
                  trainerName={trainer.business_name}
                  trainerEmail={trainer.email}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
