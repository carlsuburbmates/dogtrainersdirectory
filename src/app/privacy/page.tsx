export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Privacy policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-AU')}</p>
        </header>

        <section className="space-y-3 text-gray-700">
          <p>
            Dog Trainers Directory collects only the information needed to provide the directory, triage, and
            admin verification services. We do not sell personal data.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Contact details submitted in listings are stored securely and may be encrypted.</li>
            <li>Search and triage activity is logged for operational monitoring and product improvement.</li>
            <li>We share data only with service providers required to operate the platform (for example, Supabase and Stripe).</li>
            <li>Admin access is restricted and audited.</li>
          </ul>
          <p>
            If you would like to access or delete your data, please contact the site operator. We will respond within a
            reasonable timeframe in line with Australian Privacy Principles.
          </p>
        </section>
      </div>
    </main>
  )
}
