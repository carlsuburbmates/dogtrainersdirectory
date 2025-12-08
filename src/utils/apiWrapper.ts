// API Wrapper providing automatic error logging for all API routes
import { logError, ErrorContext, ErrorLevel } from '@/lib/errorLog'
import { NextRequest, NextResponse } from 'next/server'

// Options for API wrapper
export interface ApiWrapperOptions {
  routeName?: string
  logLevel?: ErrorLevel
  context?: Omit<ErrorContext, 'route' | 'method'>
}

/**
 * Wrap an API handler with automatic error logging
 * @param handler - The original API handler function
 * @param options - Configuration for logging
 * @returns Wrapped handler function
 */
export function withErrorLogging(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiWrapperOptions = {}
) {
  return async function (request: NextRequest, context?: any) {
    const startTime = Date.now()
    const routeName = options.routeName || request.nextUrl.pathname
    const method = request.method
    
    try {
      const response = await handler(request, context)
      
      // Log non-2xx responses as warnings
      if (response.status >= 400) {
        await logError(
          `API returned non-success status: ${response.status}`,
          {
            route: routeName,
            method,
            statusCode: response.status,
            durationMs: Date.now() - startTime,
            ...options.context
          },
          options.logLevel || 'warn',
          'api'
        )
      }
      
      return response
    } catch (error) {
      // Log the error with full context
      const errorLevel = options.logLevel || 
        (error instanceof Error && error.message.includes('timeout') ? 'critical' : 'error')
      
      await logError(
        `API handler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          route: routeName,
          method,
          durationMs: Date.now() - startTime,
          ...options.context
        },
        errorLevel,
        'api'
      )
      
      // Return appropriate error response
      const statusCode = errorLevel === 'critical' ? 503 : 500
      return NextResponse.json(
        { 
          error: 'An error occurred while processing your request',
          code: 'INTERNAL_ERROR'
        },
        { status: statusCode }
      )
    }
  }
}

/**
 * Convenience wrapper to add error logging to a GET handler
 */
export function withErrorLoggingGET(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiWrapperOptions = {}
) {
  return withErrorLogging(handler, { routeName: 'GET', ...options })
}

/**
 * Convenience wrapper to add error logging to a POST handler
 */
export function withErrorLoggingPOST(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiWrapperOptions = {}
) {
  return withErrorLogging(handler, { routeName: 'POST', ...options })
}

/**
 * Convenience wrapper to add error logging to a PUT handler
 */
export function withErrorLoggingPUT(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiWrapperOptions = {}
) {
  return withErrorLogging(handler, { routeName: 'PUT', ...options })
}

/**
 * Convenience wrapper to add error logging to a DELETE handler
 */
export function withErrorLoggingDELETE(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiWrapperOptions = {}
) {
  return withErrorLogging(handler, { routeName: 'DELETE', ...options })
}