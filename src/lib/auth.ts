import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

/**
 * Check if a user has admin role
 * 
 * Server-side admin authentication check that queries the profiles table
 * to verify if the given user ID has an 'admin' role.
 * 
 * @param {string} userId - The Supabase user ID to check
 * @returns {Promise<boolean>} True if user is an admin, false otherwise
 * 
 * @example
 * ```typescript
 * const userId = 'abc-123-def-456';
 * const hasAdminAccess = await isAdmin(userId);
 * if (hasAdminAccess) {
 *   // Grant admin access
 * }
 * ```
 * 
 * @remarks
 * - Uses Supabase admin client for elevated database access
 * - Returns false on any errors (fail-safe)
 * - Logs errors for debugging
 * 
 * @see {@link requireAdmin} for combined auth + admin check
 * @see {@link checkAdminAuthFromRequest} for middleware usage
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Failed to fetch user profile:', error)
      return false
    }

    return profile.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get authenticated user from current request context
 * 
 * Extracts the currently authenticated user from the Supabase session
 * by reading cookies from the Next.js request context. This function
 * is designed for use in API routes and server components.
 * 
 * @returns {Promise<string | null>} User ID if authenticated, null if not authenticated or on error
 * 
 * @example
 * ```typescript
 * // In an API route
 * export async function GET() {
 *   const userId = await getAuthenticatedUser();
 *   if (!userId) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *   // Proceed with authenticated request
 * }
 * ```
 * 
 * @remarks
 * - Uses Next.js cookies() to access request cookies
 * - Creates Supabase client with SSR cookie handling
 * - Returns null on authentication errors (fail-safe)
 * - Logs errors for debugging
 * 
 * @see {@link requireAdmin} for admin-specific authentication
 * @see {@link checkAdminAuthFromRequest} for middleware usage with NextRequest
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component
            }
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Require admin authentication for API routes
 * 
 * Combined authentication and authorization check that verifies both:
 * 1. User is authenticated (has valid Supabase session)
 * 2. User has admin role in profiles table
 * 
 * @returns {Promise<{authorized: boolean, userId: string | null}>} Object with authorization status and user ID
 * @returns {boolean} authorized - True if user is authenticated AND has admin role
 * @returns {string | null} userId - User ID if authorized, null otherwise
 * 
 * @example
 * ```typescript
 * // In an admin API route
 * export async function POST() {
 *   const { authorized, userId } = await requireAdmin();
 *   
 *   if (!authorized) {
 *     return new Response(
 *       JSON.stringify({ error: 'Admin access required' }), 
 *       { status: 401 }
 *     );
 *   }
 *   
 *   // Proceed with admin operation
 *   console.log('Admin user:', userId);
 * }
 * ```
 * 
 * @remarks
 * - Combines getAuthenticatedUser() and isAdmin() checks
 * - Returns { authorized: false, userId: null } if not authenticated
 * - Returns { authorized: false, userId: null } if authenticated but not admin
 * - Returns { authorized: true, userId: '...' } if authenticated admin
 * 
 * @see {@link getAuthenticatedUser} for authentication only
 * @see {@link isAdmin} for admin role check only
 * @see {@link checkAdminAuthFromRequest} for middleware usage
 */
export async function requireAdmin(): Promise<{ authorized: boolean; userId: string | null }> {
  const userId = await getAuthenticatedUser()
  
  if (!userId) {
    return { authorized: false, userId: null }
  }

  const adminStatus = await isAdmin(userId)
  
  return { authorized: adminStatus, userId: adminStatus ? userId : null }
}

/**
 * Check admin authentication from Next.js middleware request
 * 
 * Middleware-compatible authentication check that extracts user from
 * NextRequest cookies and verifies admin role. Specifically designed
 * for use in Next.js middleware (src/middleware.ts) where the standard
 * cookies() API is not available.
 * 
 * @param {NextRequest} request - The Next.js middleware request object
 * @returns {Promise<string | null>} User ID if authenticated admin, null otherwise
 * 
 * @example
 * ```typescript
 * // In src/middleware.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { checkAdminAuthFromRequest } from '@/lib/auth';
 * 
 * export async function middleware(request: NextRequest) {
 *   const adminUserId = await checkAdminAuthFromRequest(request);
 *   
 *   if (!adminUserId) {
 *     // Not an admin - redirect or return 401
 *     if (request.nextUrl.pathname.startsWith('/api/')) {
 *       return NextResponse.json(
 *         { error: 'Admin access required' },
 *         { status: 401 }
 *       );
 *     }
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *   
 *   // Admin authenticated - proceed
 *   return NextResponse.next();
 * }
 * ```
 * 
 * @remarks
 * - Uses NextRequest.cookies instead of Next.js cookies() API
 * - Cannot set cookies in middleware (setAll is a no-op)
 * - Combines user authentication and admin role verification
 * - Returns null on any errors (fail-safe)
 * - Logs errors for debugging
 * 
 * **Key difference from requireAdmin():**
 * - requireAdmin() uses cookies() API (for API routes/server components)
 * - checkAdminAuthFromRequest() uses NextRequest.cookies (for middleware)
 * 
 * @see {@link requireAdmin} for API route authentication
 * @see {@link isAdmin} for admin role check only
 * @see {@link getAuthenticatedUser} for authentication only
 */
export async function checkAdminAuthFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value
            }))
          },
          setAll(cookiesToSet) {
            // Middleware can't set cookies, skip
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Check if user is admin
    const adminStatus = await isAdmin(user.id)
    
    return adminStatus ? user.id : null
  } catch (error) {
    console.error('Error checking admin auth from request:', error)
    return null
  }
}
