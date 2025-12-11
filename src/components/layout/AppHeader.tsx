import Link from 'next/link'

const navLinks = [
  { label: 'Search Trainers', href: '/search', variant: 'ghost' as const },
  { label: 'Emergency Help', href: '/emergency', variant: 'ghost' as const },
  { label: 'For Trainers', href: '/onboarding', variant: 'ghost' as const },
  { label: 'Add Your Business', href: '/onboarding', variant: 'primary' as const }
]

export const AppHeader = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Dog Trainers Directory
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                  link.variant === 'primary'
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-transparent text-gray-800 border-transparent hover:text-blue-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <details className="md:hidden relative">
            <summary className="list-none flex items-center justify-center rounded-md border border-gray-200 p-2">
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
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
              <nav className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={`${link.label}-mobile`}
                    href={link.href}
                    className={`rounded-md border px-4 py-2 text-sm font-medium ${
                      link.variant === 'primary'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-800 border-transparent'
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
