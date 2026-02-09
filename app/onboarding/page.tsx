import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import { OnboardingForm } from "./onboarding-form"
import { BadgeCheck, Users, TrendingUp, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "List Your Dog Training Business | Melbourne Directory",
  description:
    "Join Melbourne's leading dog training directory. Get discovered by thousands of dog owners looking for qualified trainers in their area.",
}

export default function OnboardingPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero */}
        <section className="border-b border-border bg-primary/5 px-4 py-10 md:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              List Your Dog Training Business
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Join Melbourne{"'"}s fastest-growing directory of verified dog
              trainers. Get discovered by dog owners in your area and grow your
              client base.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                {
                  icon: Users,
                  label: "Thousands of Monthly Visitors",
                },
                {
                  icon: BadgeCheck,
                  label: "Verified Badge",
                },
                {
                  icon: TrendingUp,
                  label: "SEO Optimised Profile",
                },
                {
                  icon: Shield,
                  label: "Free to List",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 shadow-sm"
                >
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="text-center text-xs font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="px-4 py-10 md:py-14">
          <div className="mx-auto max-w-2xl">
            <OnboardingForm />
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </>
  )
}
