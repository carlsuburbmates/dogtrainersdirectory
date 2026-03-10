import Link from 'next/link'
import { getAuthenticatedUser } from '@/lib/auth'
import { getOwnedBusinessProfile } from '@/lib/businessProfileManagement'
import BusinessProfileForm from './business-profile-form'

const primaryLinkClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-md border border-[hsl(var(--ds-accent-primary))] bg-[hsl(var(--ds-accent-primary))] px-4 py-2 text-base font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:bg-[hsl(var(--ds-accent-primary)/0.9)]'
const secondaryLinkClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-md border border-[hsl(var(--ds-accent-primary)/0.65)] bg-[hsl(var(--ds-background-surface))] px-4 py-2 text-base font-medium text-[hsl(var(--ds-accent-primary))] transition-colors hover:bg-[hsl(var(--ds-accent-primary)/0.08)]'

function SignInState({ businessId }: { businessId: string }) {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Business profile management</h1>
        <p className="mt-3 text-sm text-slate-600">
          Sign in to manage your owned business profile. This surface keeps publication,
          verification, and featured placement outcomes unchanged while you update your own profile
          details.
        </p>
        <div className="mt-6">
          <Link className={primaryLinkClass} href={`/login?redirectTo=/account/business/${businessId}`}>
            Continue to sign-in
          </Link>
        </div>
      </div>
    </main>
  )
}

function MissingState() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Business record not available</h1>
        <p className="mt-3 text-sm text-slate-600">
          That business profile is not available in this signed-in account. Choose another owned
          business record or return to onboarding if you have not created one yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={primaryLinkClass} href="/account/business">
            Back to business management
          </Link>
          <Link className={secondaryLinkClass} href="/onboarding">
            Go to onboarding
          </Link>
        </div>
      </div>
    </main>
  )
}

export default async function BusinessProfilePage({
  params
}: {
  params: { businessId: string }
}) {
  const resolvedParams = await Promise.resolve(params as any)
  const userId = await getAuthenticatedUser()

  if (!userId) {
    return <SignInState businessId={resolvedParams.businessId} />
  }

  const businessId = Number(resolvedParams.businessId)
  if (!Number.isInteger(businessId) || businessId <= 0) {
    return <MissingState />
  }

  const profile = await getOwnedBusinessProfile(userId, businessId)
  if (!profile) {
    return <MissingState />
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-3">
          <Link href="/account/business" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            Back to business management
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{profile.businessName}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Maintain the owned listing details that affect profile quality and completeness.
              Verification, publication, scaffold review, featured placement, and billing are
              intentionally outside this surface.
            </p>
          </div>
        </header>

        <BusinessProfileForm profile={profile} />
      </div>
    </main>
  )
}
