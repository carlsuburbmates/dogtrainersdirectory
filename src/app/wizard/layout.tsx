export const metadata = { title: 'Wizard' }

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" data-wizard="true">
      {children}
    </div>
  )
}
