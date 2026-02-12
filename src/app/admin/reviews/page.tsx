'use client'

import { useState, useEffect, useCallback } from 'react'

interface Review {
  id: number
  business_id: number
  reviewer_name: string
  reviewer_email: string
  rating: number
  title?: string
  content?: string
  is_approved?: boolean
  is_rejected?: boolean
  rejection_reason?: string
  created_at: string
  updated_at: string
  business_name?: string
  ai_decision?: string | null
  ai_reason?: string | null
  ai_confidence?: number | null
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'
type FilterRating = 'all' | '1' | '2' | '3' | '4' | '5'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending')
  const [ratingFilter, setRatingFilter] = useState<FilterRating>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch reviews from database
      const response = await fetch('/api/admin/reviews/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusFilter,
          rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, ratingFilter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleAction = async (reviewId: number, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(reviewId)

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })

      if (!response.ok) {
        throw new Error('Failed to perform action')
      }

      // Refresh the list
      await fetchReviews()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (review: Review) => {
    if (review.is_approved) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>
    }
    if (review.is_rejected) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
  }

  const getAIDecisionBadge = (aiDecision: string | null | undefined) => {
    if (!aiDecision) return null
    
    const colors: Record<string, string> = {
      'approve': 'bg-green-50 text-green-700 border-green-200',
      'reject': 'bg-red-50 text-red-700 border-red-200',
      'manual_review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'manual_approve': 'bg-blue-50 text-blue-700 border-blue-200',
      'manual_reject': 'bg-gray-50 text-gray-700 border-gray-200'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[aiDecision] || 'bg-gray-50 text-gray-700'}`}>
        AI: {aiDecision.replace('_', ' ')}
      </span>
    )
  }

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  // Filter and paginate reviews
  const filteredReviews = reviews.filter(review => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        review.reviewer_name?.toLowerCase().includes(search) ||
        review.title?.toLowerCase().includes(search) ||
        review.content?.toLowerCase().includes(search) ||
        review.business_name?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage)
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, ratingFilter, searchTerm])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Moderation</h1>
        <p className="text-gray-600">Manage and moderate user reviews for trainer profiles</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Reviews</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label htmlFor="ratingFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <select
              id="ratingFilter"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as FilterRating)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="searchTerm"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by reviewer, title, content, or business..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {paginatedReviews.length} of {filteredReviews.length} reviews
            {filteredReviews.length !== reviews.length && ` (filtered from ${reviews.length} total)`}
          </span>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      )}

      {/* Reviews List */}
      {!loading && paginatedReviews.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">No reviews found matching your filters.</p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setRatingFilter('all')
                setSearchTerm('')
              }}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {!loading && paginatedReviews.length > 0 && (
        <div className="space-y-4">
          {paginatedReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{review.reviewer_name}</h3>
                    {getStatusBadge(review)}
                    {getAIDecisionBadge(review.ai_decision)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{getRatingStars(review.rating)} ({review.rating}/5)</span>
                    <span>•</span>
                    <span>Review #{review.id}</span>
                    <span>•</span>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.business_name && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Business:</span> {review.business_name} (ID: {review.business_id})
                    </p>
                  )}
                </div>
              </div>

              {review.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}

              {review.content && (
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.content}</p>
              )}

              {/* AI Moderation Info */}
              {review.ai_reason && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">AI Analysis:</span> {review.ai_reason}
                    {review.ai_confidence && (
                      <span className="ml-2 text-xs">
                        (Confidence: {(review.ai_confidence * 100).toFixed(0)}%)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Rejection Reason */}
              {review.is_rejected && review.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-900">
                    <span className="font-semibold">Rejection Reason:</span> {review.rejection_reason}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {!review.is_approved && !review.is_rejected && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleAction(review.id, 'approve')}
                    disabled={actionLoading === review.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === review.id ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason (optional):')
                      if (reason !== null) {
                        handleAction(review.id, 'reject', reason || 'Manual rejection')
                      }
                    }}
                    disabled={actionLoading === review.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === review.id ? 'Processing...' : '✕ Reject'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter notes for manual review:')
                      if (reason) {
                        alert('Manual review flagging coming soon!')
                      }
                    }}
                    disabled={actionLoading === review.id}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    🚩 Flag for Review
                  </button>
                </div>
              )}

              {/* Display action taken */}
              {(review.is_approved || review.is_rejected) && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {review.is_approved ? '✓ This review has been approved' : '✕ This review has been rejected'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
