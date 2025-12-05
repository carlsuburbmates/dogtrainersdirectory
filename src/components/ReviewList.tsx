'use client'

import { useState } from 'react'

type Review = {
  id: number
  reviewer_name: string
  rating: number
  content: string | null
  created_at: string
  title: string | null
}

interface ReviewListProps {
  reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [visibleCount, setVisibleCount] = useState(5)
  const visibleReviews = reviews.slice(0, visibleCount)

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500">No reviews published yet. Be the first to leave feedback.</p>
  }

  return (
    <div className="space-y-4">
      {visibleReviews.map((review) => (
        <article key={review.id} className="border border-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
              <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-yellow-500 font-semibold">{'⭐'.repeat(review.rating)}</div>
          </div>
          {review.title && <p className="mt-2 font-semibold">{review.title}</p>}
          {review.content && <p className="text-sm text-gray-700 mt-1">{review.content}</p>}
        </article>
      ))}
      {visibleCount < reviews.length && (
        <button
          type="button"
          className="btn-outline w-full"
          onClick={() => setVisibleCount((prev) => Math.min(prev + 5, reviews.length))}
        >
          Load more reviews
        </button>
      )}
    </div>
  )
}
