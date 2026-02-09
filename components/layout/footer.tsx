import Link from "next/link"
import { PawPrint } from "lucide-react"

const footerLinks = {
  Directory: [
    { href: "/search", label: "Find a Trainer" },
    { href: "/directory", label: "Browse All" },
    { href: "/emergency", label: "Emergency Help" },
  ],
  "For Trainers": [
    { href: "/onboarding", label: "List Your Business" },
    { href: "/promote", label: "Get Featured" },
  ],
  About: [
    { href: "#", label: "How It Works" },
    { href: "#", label: "Our Mission" },
    { href: "#", label: "Contact Us" },
  ],
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <PawPrint className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">
                Dog Trainers Directory
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Connecting Melbourne dog owners with verified, force-free trainers
              and behaviour consultants since 2024.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <div className="flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            {new Date().getFullYear()} Dog Trainers Directory Melbourne. This is
            a directory service only. We do not provide veterinary or behavioural
            advice. Always consult a qualified professional.
          </p>
        </div>
      </div>
    </footer>
  )
}
