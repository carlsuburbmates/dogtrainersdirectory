type Review = {
  id: string
  reviewer_name: string
  rating: number
  content: string
  created_at: string
  title?: string
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No reviews yet. Be the first to leave a review!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review.id} className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{review.reviewer_name || 'Anonymous'}</span>
              <div className="flex text-yellow-400 text-sm">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(review.created_at).toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          {review.title && <h4 className="font-medium mb-1">{review.title}</h4>}
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{review.content}</p>
        </article>
      ))}
    </div>
  )
}