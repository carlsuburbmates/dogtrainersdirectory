'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!email.trim()) {
      setError('Please enter an email address.')
      return
    }

    setLoading(true)
    try {
      const redirectTo = searchParams.get('redirectTo') || '/admin'
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTo}`
        }
      })

      if (signInError) {
        throw signInError
      }

      setMessage('Check your email for a sign-in link. It will take you back to the admin area once verified.')
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Admin sign-in</h1>
          <p className="text-gray-600">
            This area is for approved operators only. We use a one-time email link to sign you in.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@yourbusiness.com.au"
              required
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full px-4 py-2"
          >
            {loading ? 'Sending link…' : 'Send sign-in link'}
          </button>
        </form>

        <p className="text-xs text-gray-500">
          If you do not receive the email within a few minutes, check your spam folder or contact the product owner for access.
        </p>
      </div>
    </main>
  )
}
