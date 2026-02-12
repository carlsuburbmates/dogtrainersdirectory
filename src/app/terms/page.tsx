export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Terms of use</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-AU')}</p>
        </header>

        <section className="space-y-3 text-gray-700">
          <p>
            By using Dog Trainers Directory you agree to use the service lawfully and respectfully. Listings are provided
            by businesses and verified according to the platform’s policies.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>We do our best to keep information current, but we do not guarantee accuracy or availability.</li>
            <li>You are responsible for verifying services directly with trainers or emergency providers.</li>
            <li>We may update or remove listings that breach platform standards.</li>
            <li>Payments for featured placements are handled through Stripe and subject to its terms.</li>
          </ul>
          <p>
            If you do not agree with these terms, please do not use the service.
          </p>
        </section>
      </div>
    </main>
  )
}
