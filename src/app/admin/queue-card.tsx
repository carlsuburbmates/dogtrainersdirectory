'use client'

type QueueCardProps = {
  title: string
  description?: string
  summary?: string
  items: {
    id: number | string
    title: string
    meta: string
    body: string
    kindLabel?: string
    nextAction?: string
    action?: 'review'
  }[]
  onReview?: (id: number, action: 'approve' | 'reject') => Promise<void>
}

export function QueueCard({ title, description, summary, items, onReview }: QueueCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description ? <p className="text-sm text-gray-600">{description}</p> : null}
      </div>
      {summary ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {summary}
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing pending at the moment.</p>
      ) : (
        items.map((item) => (
          <article key={item.id} className="rounded-lg border border-dashed border-gray-200 p-4 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              {item.kindLabel ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                  {item.kindLabel}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-500 uppercase">{item.meta}</p>
            <p className="text-sm text-gray-600">{item.body}</p>
            {item.nextAction ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span className="font-semibold">Next safe action:</span> {item.nextAction}
              </div>
            ) : null}
            {item.action === 'review' && onReview && (
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onReview(Number(item.id), 'approve')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onReview(Number(item.id), 'reject')}
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
