import { supabaseAdmin } from '@/lib/supabase'

// Simple UI components for admin reviews page
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export default async function AdminReviewsPage() {
  // Fetch reviews that need attention
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .limit(10)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Reviews</h1>
      <Card className="p-4">
        <p className="text-sm text-gray-600">
          Reviews admin page (placeholder - fully implemented in separate PR)
        </p>
        <div className="mt-4">
          <p>Total reviews: {reviews?.length || 0}</p>
        </div>
      </Card>
    </div>
  )
}