import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard | Dog Trainers Directory",
  description: "Admin panel for managing the Dog Trainers Directory.",
  robots: "noindex, nofollow",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
