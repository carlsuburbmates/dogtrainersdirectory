'use client'

type QueueCardProps = {
  title: string
  items: { id: number; title: string; meta: string; body: string; action?: 'review' }[]
  onReview?: (id: number, action: 'approve' | 'reject') => Promise<void>
}

export function QueueCard({ title, items, onReview }: QueueCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing pending at the moment.</p>
      ) : (
        items.map((item) => (
          <article key={item.id} className="rounded-lg border border-dashed border-gray-200 p-4 space-y-1">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-xs text-gray-500 uppercase">{item.meta}</p>
            <p className="text-sm text-gray-600">{item.body}</p>
            {item.action === 'review' && onReview && (
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onReview(item.id, 'approve')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onReview(item.id, 'reject')}
                >
                  Reject
                </button>
              </div>
            )}
          </article>
        ))
      )}
    </div>
  )
}