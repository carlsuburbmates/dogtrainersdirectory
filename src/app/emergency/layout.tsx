export const metadata = { title: 'Emergency' }

export default function EmergencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" data-theme="emergency">
      {children}
    </div>
  )
}
