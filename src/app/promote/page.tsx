import { supabaseAdmin } from '@/lib/supabase'
import { isMonetizationEnabled } from '@/lib/monetization'
import { isE2ETestMode, e2eTrainerProfile } from '@/lib/e2eTestUtils'
import { PromotePanel } from './promote-panel'

type PromoteSearchParams = {
  businessId?: string
  status?: string
  flag?: string
  abn?: string
}

type PromotePageProps = {
  searchParams?: Promise<PromoteSearchParams>
}

export const dynamic = 'force-dynamic'

async function loadBusiness(businessId?: number) {
  if (!businessId) return null
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('id, name, abn_verified, verification_status, suburb_name, featured_until')
    .eq('id', businessId)
    .maybeSingle()

  if (error) {
    console.warn('Unable to load business for promote page', error)
    return null
  }

  return data
}

export default async function PromotePage({ searchParams }: PromotePageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const serverFlag = isMonetizationEnabled()
  const clientFlag = process.env.NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED === '1'
  const e2eMode = isE2ETestMode()
  const featureFlagOverride = e2eMode && resolvedParams.flag === 'off'
  const featureEnabled = serverFlag && clientFlag && !featureFlagOverride

  if (!featureEnabled) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Promote My Listing</h1>
          <p className="text-gray-600">
            Monetization is currently disabled in this environment. Enable <code>FEATURE_MONETIZATION_ENABLED</code>{' '}
            and <code>NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED</code> to preview the upgrade flow.
          </p>
        </div>
      </main>
    )
  }

  const businessIdParam = resolvedParams.businessId ? Number(resolvedParams.businessId) : undefined
  const statusParam =
    resolvedParams.status === 'success' || resolvedParams.status === 'cancelled' ? resolvedParams.status : null

  let business = null

  if (e2eMode) {
    business = {
      id: e2eTrainerProfile.business_id,
      name: e2eTrainerProfile.business_name,
      suburb_name: e2eTrainerProfile.suburb_name,
      abn_verified: resolvedParams.abn === '0' ? false : true,
      verification_status: 'verified',
      featured_until: null
    }
  } else {
    business = await loadBusiness(Number.isFinite(businessIdParam) ? businessIdParam : undefined)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <PromotePanel
          business={
            business
              ? {
                  id: business.id,
                  name: business.name ?? `Business #${business.id}`,
                  suburb: business.suburb_name ?? 'Melbourne',
                  abnVerified: Boolean(business.abn_verified),
                  verificationStatus: business.verification_status ?? 'pending',
                  featuredUntil: business.featured_until ?? null
                }
              : null
          }
          businessId={business?.id ?? (Number.isFinite(businessIdParam) ? businessIdParam : undefined)}
          statusParam={statusParam}
        />
      </div>
    </main>
  )
}
