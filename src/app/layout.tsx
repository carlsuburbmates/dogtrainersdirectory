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
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <AppHeader />
          <main className="flex-grow">
            {children}
          </main>
          <AppFooter />
        </div>
      </body>
    </html>
  )
}
