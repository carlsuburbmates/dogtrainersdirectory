import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth'
import { listOwnedBusinesses } from '@/lib/businessProfileManagement'

const primaryLinkClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-md border border-[hsl(var(--ds-accent-primary))] bg-[hsl(var(--ds-accent-primary))] px-4 py-2 text-base font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:bg-[hsl(var(--ds-accent-primary)/0.9)]'

function SignInState() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Business profile management</h1>
        <p className="mt-3 text-sm text-slate-600">
          Sign in to review your owned business profile, check completeness, and update your
          listing details. Verification, publication, and featured placement stay managed
          elsewhere.
        </p>
        <div className="mt-6">
          <Link className={primaryLinkClass} href="/login?redirectTo=/account/business">
            Continue to sign-in
          </Link>
        </div>
      </div>
    </main>
  )
}

export default async function BusinessAccountIndexPage() {
  const userId = await getAuthenticatedUser()

  if (!userId) {
    return <SignInState />
  }

  const ownedBusinesses = await listOwnedBusinesses(userId)

  if (ownedBusinesses.length === 1) {
    redirect(`/account/business/${ownedBusinesses[0].id}`)
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Business profile management</h1>
          <p className="text-sm text-slate-600">
            Choose the owned business record you want to maintain. This surface updates your
            profile details only. Verification, publication, and monetisation controls are not
            managed here.
          </p>
        </header>

        {ownedBusinesses.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No owned business record yet</h2>
            <p className="mt-3 text-sm text-slate-600">
              Finish onboarding first to create your business listing, then return here to manage
              profile quality and completeness.
            </p>
            <div className="mt-6">
              <Link className={primaryLinkClass} href="/onboarding">
                Go to onboarding
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-4">
            {ownedBusinesses.map((business) => (
              <article
                key={business.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{business.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Verification: {business.verificationStatus}. Public listing:{' '}
                      {business.isActive ? 'active' : 'inactive'}.
                    </p>
                  </div>
                  <Link className={primaryLinkClass} href={`/account/business/${business.id}`}>
                    Manage profile
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
