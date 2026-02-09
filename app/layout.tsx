import type { Metadata, Viewport } from "next"
import { DM_Sans, JetBrains_Mono } from "next/font/google"
import { ChatWidget } from "@/components/chat-widget"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Dog Trainers Directory | Melbourne's #1 Dog Training Resource",
  description:
    "Find verified, force-free dog trainers and behaviour consultants across Melbourne. Search by suburb, behaviour issue, or dog age. Emergency resources available 24/7.",
  keywords: [
    "dog trainer Melbourne",
    "puppy training",
    "dog behaviour consultant",
    "force-free dog training",
    "Melbourne dog directory",
  ],
  openGraph: {
    title: "Dog Trainers Directory Melbourne",
    description:
      "Find the perfect trainer for your dog. Verified professionals across all Melbourne suburbs.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0f9b8e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans min-h-dvh flex flex-col">
        {children}
        <ChatWidget />
      </body>
    </html>
  )
}
