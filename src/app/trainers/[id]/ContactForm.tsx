'use client'

import { useState } from 'react'

interface ContactFormProps {
  trainerId: number
  trainerName: string
  trainerEmail?: string
}

export default function ContactForm({ trainerId, trainerName, trainerEmail }: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      // For now, just show success message with mailto link
      // In production, this would send via API or email service
      if (trainerEmail) {
        const subject = encodeURIComponent(`Inquiry about ${trainerName}`)
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`)
        const mailtoLink = `mailto:${trainerEmail}?subject=${subject}&body=${body}`
        
        // Open mailto link
        window.location.href = mailtoLink
        
        setSuccess(true)
        setName('')
        setEmail('')
        setPhone('')
        setMessage('')
      } else {
        setError('No contact email available for this trainer')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  if (!trainerEmail) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Please use the phone number or other contact methods above to reach this trainer.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800 font-medium">
          ✓ Your email client should have opened. If not, please contact the trainer directly.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-sm text-green-700 hover:text-green-900 underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div>
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

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {submitting ? 'Sending...' : 'Send Message'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          This will open your email client
        </p>
      </form>
    </div>
  )
}
