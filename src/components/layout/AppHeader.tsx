import Link from 'next/link'

const navLinks = [
  { label: 'Search Trainers', href: '/search', variant: 'ghost' as const },
  { label: 'Emergency Help', href: '/emergency', variant: 'ghost' as const },
  { label: 'For Trainers', href: '/onboarding', variant: 'ghost' as const },
  { label: 'Add Your Business', href: '/onboarding', variant: 'primary' as const }
]

export const AppHeader = () => {
  return (
    <header id="public-site-header" className="shell-header">
      <div className="shell-container">
        <div className="shell-header__bar">
          <div className="flex items-center">
            <Link href="/" className="shell-brand">
              Dog Trainers Directory
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`shell-nav-link ${
                  link.variant === 'primary'
                    ? 'shell-nav-link--primary'
                    : 'shell-nav-link--ghost'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <details className="md:hidden relative">
            <summary className="list-none flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[hsl(var(--ds-border-subtle))] bg-white/70 p-2 text-[hsl(var(--ds-text-primary))]">
              <span className="sr-only">Toggle navigation</span>
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[hsl(var(--ds-border-subtle))] bg-white/95 p-4 shadow-[0_16px_30px_-24px_hsl(var(--ds-shadow-pop)/0.55)]">
              <nav className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={`${link.label}-mobile`}
                    href={link.href}
                    className={`shell-nav-link ${
                      link.variant === 'primary'
                        ? 'shell-nav-link--primary'
                        : 'shell-nav-link--ghost'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
