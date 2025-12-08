import { NextResponse } from 'next/server'
import { logError, logAPIError, logLLMError, logValidationError, logDBError } from '@/lib/errorLog'
import { ErrorLevel, ErrorCategory } from '@/lib/errorLog'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    switch (type) {
      case 'general':
        await logError('Test error', { route: '/api/test/errors', method: 'POST' })
        break
      case 'api':
        await logAPIError('/api/test/errors', 'POST', 500, 'Test API error')
        break
      case 'llm':
        await logLLMError('Test prompt', 'Test response', 1200, 'Test LLM error')
        break
      case 'validation':
        await logValidationError('testField', 'Test validation error', 'invalid data')
        break
      case 'db':
        await logDBError('testOperation', 'Test DB error')
        break
      default:
        return NextResponse.json({ error: 'Invalid error type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Test error endpoint failed:', error)
    return NextResponse.json({ error: 'Failed to log test error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test all logging functions
    await Promise.all([
      logError('Test error 1'),
      logAPIError('/test/route', 'GET', 400, 'Not found'),
      logLLMError('Test prompt', 'Test response', 1500),
      logValidationError('email', 'Invalid email format', 'not.an.email'),
      logDBError('SELECT', 'Connection timeout')
    ])

    return NextResponse.json({ 
      success: true, 
      message: 'All error logging functions tested',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}