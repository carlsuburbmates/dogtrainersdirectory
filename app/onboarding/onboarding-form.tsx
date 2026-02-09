"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { formatServiceType, formatBehaviorIssue, formatAgeSpecialty } from "@/lib/utils"

const SERVICE_TYPES = [
  "puppy_training",
  "obedience_training",
  "behaviour_consultations",
  "group_classes",
  "private_training",
]

const BEHAVIOR_ISSUES = [
  "pulling_on_lead",
  "separation_anxiety",
  "excessive_barking",
  "dog_aggression",
  "leash_reactivity",
  "jumping_up",
  "destructive_behaviour",
  "recall_issues",
  "anxiety_general",
  "resource_guarding",
  "mouthing_nipping_biting",
  "rescue_dog_support",
  "socialisation",
]

const AGE_SPECIALTIES = [
  "puppies_0_6m",
  "adolescent_6_18m",
  "adult_18m_7y",
  "senior_7y_plus",
  "rescue_dogs",
]

type Step = 1 | 2 | 3

export function OnboardingForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    suburb: "",
    bio: "",
    shortBio: "",
    pricing: "",
    services: [] as string[],
    behaviorIssues: [] as string[],
    ageSpecialties: [] as string[],
    yearsExperience: "",
    certifications: "",
    languages: "English",
    isMobile: false,
    serviceRadiusKm: "",
  })

  function updateField(field: string, value: string | boolean | string[]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleArray(field: "services" | "behaviorIssues" | "ageSpecialties", value: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
          serviceRadiusKm: form.serviceRadiusKm ? parseInt(form.serviceRadiusKm) : null,
          certifications: form.certifications
            ? form.certifications.split(",").map((c) => c.trim())
            : [],
          languages: form.languages
            ? form.languages.split(",").map((l) => l.trim())
            : ["English"],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Submission failed")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <h2 className="text-2xl font-bold text-card-foreground">
          Listing Submitted!
        </h2>
        <p className="text-muted-foreground">
          Thank you for joining the Dog Trainers Directory. Your listing is
          under review and will be live within 24-48 hours.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(s as Step)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </button>
            {s < 3 && (
              <div
                className={`h-0.5 w-12 rounded ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            Basic Information
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Business Name *
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Pawsitive Behaviours Melbourne"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Phone *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="0412 345 678"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://yoursite.com.au"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Suburb</label>
              <input
                type="text"
                value={form.suburb}
                onChange={(e) => updateField("suburb", e.target.value)}
                placeholder="e.g. Carlton"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Street address"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-2 self-end rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Next: Services
          </button>
        </div>
      )}

      {/* Step 2: Services & Specialties */}
      {step === 2 && (
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            Services & Specialties
          </h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Services Offered
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArray("services", s)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    form.services.includes(s)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {formatServiceType(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Behaviour Issues You Handle
            </label>
            <div className="flex flex-wrap gap-2">
              {BEHAVIOR_ISSUES.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleArray("behaviorIssues", i)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    form.behaviorIssues.includes(i)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {formatBehaviorIssue(i)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Dog Age Specialties
            </label>
            <div className="flex flex-wrap gap-2">
              {AGE_SPECIALTIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleArray("ageSpecialties", a)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    form.ageSpecialties.includes(a)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {formatAgeSpecialty(a)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isMobile"
              checked={form.isMobile}
              onChange={(e) => updateField("isMobile", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <label htmlFor="isMobile" className="text-sm text-foreground">
              I offer mobile / in-home training
            </label>
          </div>

          {form.isMobile && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Service Radius (km)
              </label>
              <input
                type="number"
                value={form.serviceRadiusKm}
                onChange={(e) => updateField("serviceRadiusKm", e.target.value)}
                placeholder="e.g. 15"
                className="w-32 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Next: Profile
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Bio & Submit */}
      {step === 3 && (
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            Your Profile
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Short Bio (shown on cards)
            </label>
            <textarea
              value={form.shortBio}
              onChange={(e) => updateField("shortBio", e.target.value)}
              placeholder="A one-line summary that appears on trainer cards..."
              rows={2}
              maxLength={200}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Full Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Tell dog owners about your experience, approach, and what makes you unique..."
              rows={5}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Pricing</label>
            <textarea
              value={form.pricing}
              onChange={(e) => updateField("pricing", e.target.value)}
              placeholder="e.g. Private session: $150 | Group class: $35 | 6-week course: $450"
              rows={2}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Years of Experience
              </label>
              <input
                type="number"
                value={form.yearsExperience}
                onChange={(e) => updateField("yearsExperience", e.target.value)}
                placeholder="e.g. 8"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Languages (comma separated)
              </label>
              <input
                type="text"
                value={form.languages}
                onChange={(e) => updateField("languages", e.target.value)}
                placeholder="English, Mandarin"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Certifications (comma separated)
            </label>
            <input
              type="text"
              value={form.certifications}
              onChange={(e) => updateField("certifications", e.target.value)}
              placeholder="e.g. Delta Cert IV, Fear Free Certified, PPGA Member"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Listing
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
