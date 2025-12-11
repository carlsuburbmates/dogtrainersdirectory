'use client'

// Reviews management admin dashboard
export default function AdminReviewsPage() {
  const reviewStats = {
    total: 128,
    pending: 23,
    approved: 95,
    rejected: 10
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Review Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card-border p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Reviews</h3>
            <p className="text-3xl font-bold">{reviewStats.total}</p>
          </div>
          <div className="card-border p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{reviewStats.pending}</p>
          </div>
          <div className="card-border p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Approved</h3>
            <p className="text-3xl font-bold text-green-600">{reviewStats.approved}</p>
          </div>
          <div className="card-border p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Rejected</h3>
            <p className="text-3xl font-bold text-red-600">{reviewStats.rejected}</p>
          </div>
        </div>

        <div className="card-border p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Pending Reviews</h3>
          <div className="text-sm text-gray-500 mb-4">
            <em>Review functionality coming soon. AI-powered review system will be available here.</em>
          </div>
        </div>
      </div>
    </div>
  )
}
