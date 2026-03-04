import type { ReactNode } from 'react'
import Link from 'next/link'
import AdminStatusStrip from '@/components/admin/AdminStatusStrip'

const adminNavLinks = [
  { label: 'Overview', href: '/admin' },
  { label: 'AI Health', href: '/admin/ai-health' },
  { label: 'Cron Health', href: '/admin/cron-health' },
  { label: 'Reviews', href: '/admin/reviews' },
  { label: 'Triage', href: '/admin/triage' },
  { label: 'Errors', href: '/admin/errors' }
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <style>{`
        #public-site-header,
        #public-site-footer {
          display: none !important;
        }
      `}</style>

      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Operator Console
              </p>
              <div className="text-2xl font-semibold">DTD Admin</div>
              <p className="text-sm text-slate-600">
                Verification, moderation, and operational monitoring for the live directory.
              </p>
            </div>
            <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
              View public site
            </Link>
          </div>

          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Admin sections">
            {adminNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
      </div>
      <AdminStatusStrip />
    </div>
  )
}
