import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueueCard } from '@/app/admin/queue-card'

describe('QueueCard', () => {
  it('renders summary text and explicit next-safe-action guidance', () => {
    const onReview = vi.fn()

    const html = renderToStaticMarkup(
      <QueueCard
        title="Verification & ABN Weekly Loop"
        description="One bounded weekly exception pass."
        summary="Start with ABN manual reviews, then clear the remaining verification exceptions."
        items={[
          {
            id: 12,
            title: 'Calm Dogs Pty Ltd (12 345 678 901)',
            meta: 'ABN manual review • Business 7 • Similarity 93%',
            body: 'Manual review is queued after recent fallback reason: abn_verify_manual_review.',
            kindLabel: 'ABN',
            nextAction: 'Compare the ABR match against the business legal name, then approve only if the ABN record lines up cleanly.',
            action: 'review'
          }
        ]}
        onReview={onReview}
      />
    )

    expect(html).toContain('Verification &amp; ABN Weekly Loop')
    expect(html).toContain('One bounded weekly exception pass.')
    expect(html).toContain('Start with ABN manual reviews')
    expect(html).toContain('Next safe action:')
    expect(html).toContain('approve only if the ABN record lines up cleanly')
    expect(html).toContain('ABN')
    expect(html).toContain('Approve')
    expect(html).toContain('Reject')
  })

  it('renders advisory notes and checklist guidance when provided', () => {
    const html = renderToStaticMarkup(
      <QueueCard
        title="Scaffolded Listings"
        description="Assistive scaffold-review guidance shown at decision time."
        items={[
          {
            id: 44,
            title: 'Demo Trainer Listing',
            meta: 'Status manual_review',
            body: 'Scaffolded listing with limited source content.',
            kindLabel: 'Shadow guidance',
            advisoryNote:
              'Shadow guidance only. Approval or rejection still requires your explicit operator action.',
            checks: [
              'Bio is very short. Confirm services offered, locality, and contact expectations before approving.',
              'Business name looks like a placeholder. Confirm this is not a test or spam record.',
            ],
            nextAction:
              'Confirm the listing is a real business first. Reject it or keep it pending if the record still looks like a placeholder or spam.',
            action: 'review',
          },
        ]}
      />
    )

    expect(html).toContain('Shadow guidance only')
    expect(html).toContain('Business name looks like a placeholder')
    expect(html).toContain('Confirm the listing is a real business first')
  })
})
