import { describe, expect, it } from 'vitest'
import {
  buildContactMailtoLink,
  insertSuggestedDraft
} from '@/app/trainers/[id]/contactFormHelpers'

describe('contact form helpers', () => {
  it('builds a reversible mailto draft without claiming it has sent anything', () => {
    const href = buildContactMailtoLink({
      trainerEmail: 'trainer@example.com',
      trainerName: 'Calm Paws',
      name: 'Casey',
      email: 'casey@example.com',
      phone: '0400 000 000',
      message: 'We need help with recall.'
    })

    expect(href).toContain('mailto:trainer@example.com')
    expect(href).toContain('Inquiry%20about%20Calm%20Paws')
    expect(href).toContain('We%20need%20help%20with%20recall.')
  })

  it('inserts the suggested draft without overwriting an owner-written message', () => {
    const draft = 'Hello, I would like to ask about your availability.'

    expect(insertSuggestedDraft('', draft)).toBe(draft)
    expect(insertSuggestedDraft('I have a rescue dog.', draft)).toBe(
      'I have a rescue dog.\n\nHello, I would like to ask about your availability.'
    )
    expect(insertSuggestedDraft(`I have a rescue dog.\n\n${draft}`, draft)).toBe(
      `I have a rescue dog.\n\n${draft}`
    )
  })
})
