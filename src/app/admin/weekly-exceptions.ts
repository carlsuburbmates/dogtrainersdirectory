export type WeeklyAdminException = {
  label: string
  count: number
  href: string
  order: string
  note: string
}

export function buildWeeklyAdminExceptions(input: {
  verificationLoopCount: number
  reviewCount: number
  scaffoldedCount: number
  flaggedCount: number
}): WeeklyAdminException[] {
  return [
    {
      label: 'Verification & ABN loop',
      count: input.verificationLoopCount,
      href: '#verification-abn',
      order: '1',
      note: 'Clear manual ABN reviews and verification exceptions.',
    },
    {
      label: 'Review moderation loop',
      count: input.reviewCount,
      href: '/admin/reviews',
      order: '2',
      note: 'Work the ordered moderation loop and approve or reject explicitly.',
    },
    {
      label: 'Scaffolded listings',
      count: input.scaffoldedCount,
      href: '#scaffolded',
      order: '3',
      note: 'Use the assistive checklist, then approve or reject explicitly.',
    },
    {
      label: 'Flagged profiles',
      count: input.flaggedCount,
      href: '#flagged-profiles',
      order: '4',
      note: 'Review manual-review profiles and clear what you can.',
    },
  ]
}

