import Link from 'next/link'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dog Trainers Directory Melbourne',
  description: 'Find qualified dog trainers, behavior consultants, and emergency resources across Melbourne metropolitan area'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear()
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-200">
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                Dog Trainers Directory
              </Link>
              <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
                <Link href="/" className="hover:text-gray-900">
                  Home
                </Link>
                <Link href="/trainers" className="hover:text-gray-900">
                  Find a trainer
                </Link>
                <Link href="/emergency" className="hover:text-gray-900">
                  Emergency help
                </Link>
                <Link href="/onboarding" className="btn-primary text-xs sm:text-sm">
                  List your services
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-gray-900 text-gray-300">
            <div className="container mx-auto flex flex-col gap-2 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
              <p>© {currentYear} Dog Trainers Directory · Melbourne, AU</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/trainers" className="hover:text-white">
                  Browse trainers
                </Link>
                <Link href="/onboarding" className="hover:text-white">
                  Add your business
                </Link>
                <Link href="/admin" className="hover:text-white">
                  Admin
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
