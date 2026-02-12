export default function DisclaimerPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Disclaimer</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-AU')}</p>
        </header>

        <section className="space-y-3 text-gray-700">
          <p>
            Dog Trainers Directory provides general information and a matching service only. We do not provide
            veterinary or legal advice.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>If your dog is in immediate danger, contact a qualified emergency vet or emergency services.</li>
            <li>Any triage guidance is informational and should not replace professional judgement.</li>
            <li>We are not responsible for services provided by third-party trainers or businesses.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
