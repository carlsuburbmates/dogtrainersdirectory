import type { ReactNode } from 'react'
import AdminStatusStrip from '@/components/admin/AdminStatusStrip'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">{children}</div>
      <AdminStatusStrip />
    </div>
  )
}
