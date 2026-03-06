import { NextResponse } from 'next/server'
import { generateLLMResponse } from '@/lib/llm'
import { requireAdmin } from '@/lib/auth'
import { isE2ETestMode } from '@/lib/e2eTestUtils'

async function enforceTestAccess() {
  if (isE2ETestMode()) return null

  const { authorized } = await requireAdmin()
  if (authorized) return null

  return NextResponse.json(
    {
      success: false,
      error: 'Forbidden',
      message: 'This endpoint is restricted to operators.',
    },
    { status: 403 }
  )
}

export async function POST(request: Request) {
  try {
    const gate = await enforceTestAccess()
    if (gate) return gate

    const body = await request.json()
    const { prompt, useFallback = false } = body
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt' },
        { status: 400 }
      )
    }

    let result
    if (useFallback) {
      // Use deterministic fallback
      result = {
        text: `Fallback response for: ${prompt}`,
        model: 'deterministic',
        provider: 'fallback'
      }
    } else {
      // Try AI
      result = await generateLLMResponse({
        systemPrompt: 'You are a helpful assistant for the Dog Trainers Directory.',
        userPrompt: prompt
      })
    }

    return NextResponse.json({
      success: true,
      response: result,
      mode: useFallback ? 'deterministic' : 'llm'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'AI test failed', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
