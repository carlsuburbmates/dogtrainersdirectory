import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateLLMResponse } from '@/lib/llm'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, useFallback = false } = body
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
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
      { error: 'AI test failed', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'