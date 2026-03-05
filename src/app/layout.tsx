import './globals.css'
import { Inter } from 'next/font/google'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dog Trainers Directory Melbourne',
  description: 'Find qualified dog trainers, behavior consultants, and emergency resources across Melbourne metropolitan area',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="public-shell-root">
          <div className="living-field-layer" aria-hidden>
            <div className="living-field living-field--mesh" />
            <div className="living-field living-field--contour" />
            <div className="living-field living-field--grain" />
          </div>
          <div className="public-shell-chrome">
          <AppHeader />
          <main className="public-shell-main">
            {children}
          </main>
          <AppFooter />
          </div>
        </div>
      </body>
    </html>
  )
}
