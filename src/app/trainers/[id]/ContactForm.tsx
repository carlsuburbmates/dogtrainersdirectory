'use client'

import { useState } from 'react'
import {
  buildContactMailtoLink,
  insertSuggestedDraft
} from './contactFormHelpers'

interface ContactFormProps {
  trainerName: string
  trainerEmail?: string
  draftMessage: string
  suggestedQuestions: string[]
}

export default function ContactForm({
  trainerName,
  trainerEmail,
  draftMessage,
  suggestedQuestions
}: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailDraftOpened, setEmailDraftOpened] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setEmailDraftOpened(false)

    try {
      if (trainerEmail) {
        const mailtoLink = buildContactMailtoLink({
          trainerEmail,
          trainerName,
          name,
          email,
          phone,
          message
        })

        window.location.href = mailtoLink
        setEmailDraftOpened(true)
      } else {
        setError('No contact email available for this trainer')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  const questionBlock = suggestedQuestions.map((question) => `- ${question}`).join('\n')

  const handleUseDraft = () => {
    setMessage((current) => insertSuggestedDraft(current, draftMessage))
  }

  const handleAddQuestions = () => {
    setMessage((current) => {
      if (!questionBlock) {
        return current
      }

      if (current.includes(questionBlock)) {
        return current
      }

      if (!current.trim()) {
        return questionBlock
      }

      return `${current.trim()}\n\nQuestions to confirm:\n${questionBlock}`
    })
  }

  const guidancePanel = (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        Suggested first draft
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Use this as a starting point, then edit it before you send anything.
      </p>
      <pre className="mt-3 whitespace-pre-wrap rounded-md bg-white p-3 text-sm leading-6 text-slate-700">
        {draftMessage}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleUseDraft}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Insert suggested draft
        </button>
        {suggestedQuestions.length > 0 && (
          <button
            type="button"
            onClick={handleAddQuestions}
            className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100"
          >
            Add suggested questions
          </button>
        )}
      </div>
      {suggestedQuestions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Suggested questions to include
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
            {suggestedQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  if (!trainerEmail) {
    return (
      <div className="space-y-4">
        {guidancePanel}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Please use the phone number or other contact methods above to reach this trainer.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {guidancePanel}
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Send a Message</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
            Your Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
            Your Email *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
            Your Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            placeholder="Tell the trainer about your dog and what you're looking for..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}

        {emailDraftOpened && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-xs text-green-800">
              Your email app was asked to open a draft. Nothing has been sent yet. Review and send it there, or keep editing here and open the draft again.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {submitting ? 'Opening draft...' : 'Open Email Draft'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          This only opens your email client. Nothing is sent until you confirm there.
        </p>
      </form>
    </div>
  )
}
