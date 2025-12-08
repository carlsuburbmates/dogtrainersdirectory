// Error Logging Library for Priority 3: Error Logging & Monitoring
// Provides structured error logging with context, severity levels, and batch processing

import { supabaseAdmin } from './supabase'

export type ErrorLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type ErrorCategory = 'api' | 'llm' | 'validation' | 'db' | 'client' | 'other'

export interface ErrorContext {
  route?: string
  method?: string
  statusCode?: number
  userId?: string
  sessionId?: string
  requestId?: string
  durationMs?: number
  env?: 'dev' | 'staging' | 'prod'
  extra?: Record<string, unknown>
}

interface ErrorLogEntry {
  level: ErrorLevel
  category: ErrorCategory
  route?: string
  method?: string
  statusCode?: number
  message: string
  stack?: string
  context: Record<string, unknown>
  user_id?: string
  session_id?: string
  request_id?: string
  duration_ms?: number
  env: 'dev' | 'staging' | 'prod'
}

// In-memory buffer for batching
let errorBuffer: ErrorLogEntry[] = []
let flushTimeoutRef: NodeJS.Timeout | null = null

// Configuration
const BATCH_SIZE = 20
const FLUSH_INTERVAL = 500 // ms
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

// Helper to normalize error messages and extract stack trace
function normalizeError(error: string | Error): { message: string; stack?: string } {
  if (typeof error === 'string') {
    return { message: error }
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    }
  }
  
  // Handle other types that might be thrown
  return {
    message: String(error)
  }
}

// Helper to get current environment
function getCurrentEnv(): 'dev' | 'staging' | 'prod' {
  const env = process.env.NODE_ENV || 'dev'
  return env as 'dev' | 'staging' | 'prod'
}

// Main error logging function
export async function logError(
  messageOrError: string | Error,
  ctx?: ErrorContext,
  level: ErrorLevel = 'error',
  category: ErrorCategory = 'other'
): Promise<void> {
  const { message, stack } = normalizeError(messageOrError)
  const env = getCurrentEnv()
  
  const logEntry: ErrorLogEntry = {
    level,
    category,
    route: ctx?.route,
    method: ctx?.method,
    statusCode: ctx?.statusCode,
    message,
    stack,
    context: {
      ...ctx?.extra,
      timestamp: new Date().toISOString()
    },
    user_id: ctx?.userId,
    session_id: ctx?.sessionId,
    request_id: ctx?.requestId,
    duration_ms: ctx?.durationMs,
    env
  }
  
  // Add to buffer
  errorBuffer.push(logEntry)
  
  // Flush if buffer is full
  if (errorBuffer.length >= BATCH_SIZE) {
    flushErrorBuffer()
  } else {
    // Schedule flush if not already scheduled
    if (!flushTimeoutRef) {
      flushTimeoutRef = setTimeout(flushErrorBuffer, FLUSH_INTERVAL)
    }
  }
}

// Specialized logging functions for different error types
export async function logAPIError(
  route: string,
  method: string,
  statusCode: number,
  error: unknown,
  ctx?: Omit<ErrorContext, 'route' | 'method' | 'statusCode'>
): Promise<void> {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
  return await logError(error, { ...ctx, route, method, statusCode }, level, 'api')
}

export async function logLLMError(
  prompt: string,
  response: unknown,
  latencyMs: number,
  error?: unknown,
  ctx?: ErrorContext
): Promise<void> {
  return await logError(
    error || 'LLM operation completed without error',
    {
      ...ctx,
      extra: {
        prompt: prompt.substring(0, 500), // Truncate for storage
        responsePreview: typeof response === 'string' ? response.substring(0, 500) : JSON.stringify(response).substring(0, 500),
        latencyMs
      }
    },
    error ? 'error' : 'info',
    'llm'
  )
}

export async function logValidationError(
  field: string,
  error: string,
  userInput?: unknown,
  ctx?: ErrorContext
): Promise<void> {
  return await logError(
    `Validation error in ${field}: ${error}`,
    {
      ...ctx,
      extra: {
        field,
        userInput: typeof userInput === 'object' ? JSON.stringify(userInput).substring(0, 500) : userInput
      }
    },
    'warn',
    'validation'
  )
}

export async function logDBError(
  operation: string,
  error: unknown,
  ctx?: ErrorContext
): Promise<void> {
  return await logError(
    `Database error during ${operation}: ${error}`,
    ctx,
    'error',
    'db'
  )
}

export async function logClientError(
  error: unknown,
  ctx?: ErrorContext
): Promise<void> {
  return await logError(
    `Client-side error: ${error}`,
    ctx,
    'error',
    'client'
  )
}

// Flush buffer to database
async function flushErrorBuffer(): Promise<void> {
  if (errorBuffer.length === 0) {
    return
  }
  
  // Clear timeout reference
  if (flushTimeoutRef) {
    clearTimeout(flushTimeoutRef)
    flushTimeoutRef = null
  }
  
  // Copy buffer and reset
  const errorsToInsert = [...errorBuffer]
  errorBuffer = []
  
  // Insert to database with retry logic
  let retryCount = 0
  
  while (retryCount <= MAX_RETRIES) {
    try {
      const { error } = await supabaseAdmin
        .from('error_logs')
        .insert(errorsToInsert)
      
      if (error) {
        throw error
      }
      
      // Success, log batch size
      if (process.env.NODE_ENV === 'dev') {
        console.debug(`Logged ${errorsToInsert.length} errors to database`)
      }
      
      return
    } catch (err) {
      retryCount++
      
      if (retryCount <= MAX_RETRIES) {
        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, retryCount - 1)
        console.warn(`Failed to log errors to database (attempt ${retryCount}/${MAX_RETRIES + 1}), retrying in ${delay}ms:`, err)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // Final failure, output to console
        console.error('Failed to log errors to database after all retries, falling back to console:', err)
        errorsToInsert.forEach(entry => {
          console.error(`[${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}:`, entry)
        })
        return
      }
    }
  }
}

// Force flush buffer (useful in tests or shutdown)
export function flushLogs(): Promise<void> {
  return flushErrorBuffer()
}

// Get error count by level in the last N minutes (for alerting)
export async function getRecentErrorCount(
  minutes: number = 5,
  level?: ErrorLevel | ErrorLevel[]
): Promise<number> {
  try {
    let query = supabaseAdmin
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - minutes * 60000).toISOString())
    
    if (level) {
      const levels = Array.isArray(level) ? level : [level]
      query = query.in('level', levels)
    }
    
    const { count, error } = await query
    
    if (error) throw error
    
    return count || 0
  } catch (err) {
    console.error('Failed to get recent error count:', err)
    return 0
  }
}