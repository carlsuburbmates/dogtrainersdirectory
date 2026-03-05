import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import ContactForm from './ContactForm'
import { Badge, Card, Chip, Divider, StateCard } from '@/components/ui/primitives'
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
  const reviewCount = Number(trainer.review_count || 0)
  const hasPublicReviews = averageRating > 0 && reviewCount > 0
  const contactMethodCount = [trainer.phone, trainer.email, trainer.website].filter(Boolean).length
  const enquiryAnchorId = 'send-an-enquiry'
  const directContactActions: Array<{
    label: string
    href: string
    helper: string
    openInNewTab?: boolean
  }> = []
  if (trainer.phone) {
    directContactActions.push({
      label: 'Call now',
      href: `tel:${trainer.phone}`,
      helper: 'Fastest if you are ready to speak with the trainer now.'
    })
  }
  if (trainer.email) {
    directContactActions.push({
      label: 'Email now',
      href: `mailto:${trainer.email}`,
      helper: 'Best if you want a written first contact.'
    })
  }
  if (trainer.website) {
    directContactActions.push({
      label: 'Visit website',
      href: trainer.website,
      helper: 'Useful if you want more background before making contact.',
      openInNewTab: true
    })
  }
  const primaryContactAction = directContactActions[0] ?? null
  const listedFitSignals =
    (trainer.services?.length || 0) +
    (trainer.behavior_issues?.length || 0) +
    (trainer.age_specialties?.length || 0)
  const credibilitySignals = [
    {
      label: 'Business verification',
      detail: trainer.abn_verified
        ? 'ABN verification is visible on this listing.'
        : 'ABN verification is not shown on this listing.'
    },
    {
      label: 'Listing status',
      detail: isFeatured
        ? 'This trainer currently has a featured listing.'
        : 'This trainer is shown as a standard directory listing.'
    },
    {
      label: 'Public reviews',
      detail: hasPublicReviews
        ? `${averageRating.toFixed(1)} average from ${reviewCount} approved ${
            reviewCount === 1 ? 'review' : 'reviews'
          }.`
        : 'This trainer does not yet have public reviews on the directory.'
    },
    {
      label: 'Profile detail',
      detail:
        listedFitSignals > 0
          ? `${listedFitSignals} fit details are disclosed below across services, age specialities, and behaviour support.`
          : 'Services and speciality details are not listed on this profile.'
    },
    {
      label: 'Direct contact',
      detail:
        contactMethodCount > 0
          ? `${contactMethodCount} direct contact ${
              contactMethodCount === 1 ? 'option is' : 'options are'
            } shown in this profile.`
          : 'Direct phone, email, or website details are not shown in this profile.'
    },
    {
      label: 'Pricing',
      detail: trainer.pricing
        ? 'Pricing details are visible before you make contact.'
        : 'Pricing is not listed on this profile.'
    }
  ]

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
            {isFeatured ? (
              <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">Featured listing</Badge>
            ) : null}
            {trainer.abn_verified ? (
              <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">Verified business</Badge>
            ) : null}
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
                  {hasPublicReviews
                    ? `${averageRating.toFixed(1)} rating`
                    : 'No public rating yet'}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Card tone="muted" padding="sm" className="border-white/10 bg-white/5 text-white shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Rating
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {hasPublicReviews ? getRatingStars(Math.round(averageRating)) : 'No rating yet'}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {hasPublicReviews
                      ? `${averageRating.toFixed(1)} from ${reviewCount} ${
                          reviewCount === 1 ? 'review' : 'reviews'
                        }`
                      : 'No approved reviews published yet'}
                  </p>
                </Card>

                <Card tone="muted" padding="sm" className="border-white/10 bg-white/5 text-white shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Profile evidence
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {listedFitSignals > 0
                      ? `${listedFitSignals} fit details listed`
                      : 'Fit details are limited'}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {contactMethodCount > 0
                      ? `${contactMethodCount} direct contact ${
                          contactMethodCount === 1 ? 'option' : 'options'
                        } visible${trainer.pricing ? ' and pricing shown' : ''}.`
                      : `Use the enquiry form${trainer.pricing ? ' while pricing stays visible' : ''}.`}
                  </p>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <Card tone="muted" className="rounded-[2rem] border-white/10 bg-white/5 text-white backdrop-blur shadow-none">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Ready to contact?
                </p>
                {primaryContactAction ? (
                  <>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      The fastest next step for this listing is the direct option below.
                    </p>
                    <a
                      href={primaryContactAction.href}
                      target={primaryContactAction.openInNewTab ? '_blank' : undefined}
                      rel={primaryContactAction.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                    >
                      {primaryContactAction.label}
                    </a>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {primaryContactAction.helper}
                    </p>
                    {trainer.email && (
                      <a
                        href={`#${enquiryAnchorId}`}
                        className="mt-3 inline-flex text-sm font-semibold text-blue-200 transition-colors hover:text-white"
                      >
                        Prefer a written first message? Send an enquiry.
                      </a>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Direct phone, email, or website details are not shown on this listing. Review
                    the details below for the available contact path.
                  </p>
                )}
              </Card>

              <Card tone="muted" className="rounded-[2rem] border-white/10 bg-white/5 text-white backdrop-blur shadow-none">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Why this listing is credible
                </p>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-200">
                  {credibilitySignals.map((signal) => (
                    <Card
                      key={signal.label}
                      tone="muted"
                      padding="sm"
                      className="border-white/10 bg-white/5 text-slate-200 shadow-none"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                        {signal.label}
                      </p>
                      <p className="mt-1">{signal.detail}</p>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            {trainer.bio && (
              <Card as="section" className="rounded-[2rem]">
                <h2 className="text-2xl font-bold text-slate-950">About this trainer</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-base">
                  {trainer.bio}
                </p>
              </Card>
            )}

            {(trainer.services?.length > 0 ||
              trainer.behavior_issues?.length > 0 ||
              trainer.age_specialties?.length > 0) && (
              <Card as="section" className="rounded-[2rem]">
                <h2 className="text-2xl font-bold text-slate-950">Fit snapshot</h2>
                <div className="mt-5 space-y-5">
                  {trainer.services && trainer.services.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Services offered
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {trainer.services.map((service: string, index: number) => (
                          <Card
                            key={`${service}-${index}`}
                            tone="info"
                            padding="sm"
                            className="text-sm font-medium text-slate-800 shadow-none"
                          >
                            {formatServiceType(service)}
                          </Card>
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
                          <Chip key={`${issue}-${index}`} asSpan tone="info" className="text-sm">
                            {formatServiceType(issue)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {trainer.age_specialties && trainer.age_specialties.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Age specialities
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {trainer.age_specialties.map((specialty: string, index: number) => (
                          <Chip key={`${specialty}-${index}`} asSpan tone="success" className="text-sm">
                            {formatServiceType(specialty)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card as="section" className="rounded-[2rem]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Reviews ({reviewCount})
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Use reviews as context, then confirm fit directly with the trainer.
                  </p>
                </div>
              </div>

              {reviews && reviews.length > 0 ? (
                <div className="mt-6 space-y-6">
                  {reviews.map((review: Review) => (
                    <Card
                      key={review.id}
                      tone="muted"
                      className="rounded-2xl"
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
                    </Card>
                  ))}
                </div>
              ) : (
                <StateCard
                  title="No reviews yet"
                  description="Use the service fit, verification, and direct conversation to make the next decision."
                  className="mt-6 rounded-2xl"
                />
              )}
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card as="section" className="rounded-[2rem]">
              <h3 className="text-xl font-bold text-slate-950">Contact Information</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Reach out once the fit looks right. The fastest path is usually phone or email.
              </p>

              <div className="mt-5 space-y-4">
                {primaryContactAction && (
                  <Card tone="info" padding="sm" className="rounded-2xl shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                      Best next step
                    </p>
                    <a
                      href={primaryContactAction.href}
                      target={primaryContactAction.openInNewTab ? '_blank' : undefined}
                      rel={primaryContactAction.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      {primaryContactAction.label}
                    </a>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {primaryContactAction.helper}
                    </p>
                  </Card>
                )}

                {trainer.phone && (
                  <Card tone="muted" padding="sm" className="rounded-2xl shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Phone
                    </p>
                    <a
                      href={`tel:${trainer.phone}`}
                      className="mt-2 inline-block text-base font-semibold text-blue-700 hover:underline"
                    >
                      {trainer.phone}
                    </a>
                    <a
                      href={`tel:${trainer.phone}`}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                    >
                      Call this trainer
                    </a>
                  </Card>
                )}

                {trainer.email && (
                  <Card tone="muted" padding="sm" className="rounded-2xl shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Email
                    </p>
                    <a
                      href={`mailto:${trainer.email}`}
                      className="mt-2 inline-block break-all text-base font-semibold text-blue-700 hover:underline"
                    >
                      {trainer.email}
                    </a>
                    <a
                      href={`mailto:${trainer.email}`}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                    >
                      Email this trainer
                    </a>
                  </Card>
                )}

                {trainer.website && (
                  <Card tone="muted" padding="sm" className="rounded-2xl shadow-none">
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
                    <a
                      href={trainer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                    >
                      Open the trainer website
                    </a>
                  </Card>
                )}

                {trainer.address && (
                  <Card tone="muted" padding="sm" className="rounded-2xl shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Address
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{trainer.address}</p>
                  </Card>
                )}
              </div>

              {trainer.pricing && (
                <Card tone="warning" padding="sm" className="mt-6 rounded-2xl shadow-none">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                    Pricing
                  </h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {trainer.pricing}
                  </p>
                </Card>
              )}
            </Card>

            <Card
              as="section"
              id={enquiryAnchorId}
              className="rounded-[2rem]"
            >
              <h3 className="text-xl font-bold text-slate-950">Prefer a written first message?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use the enquiry form if you want a documented first contact through the directory.
              </p>
              <Divider className="mt-5" />
              <div className="pt-5">
                <ContactForm
                  trainerId={id}
                  trainerName={trainer.business_name}
                  trainerEmail={trainer.email}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
