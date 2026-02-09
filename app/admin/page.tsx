import type { Metadata } from "next"
import { AdminDashboard } from "./admin-dashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard | Dog Trainers Directory",
}

export default function AdminPage() {
  return <AdminDashboard />
}
