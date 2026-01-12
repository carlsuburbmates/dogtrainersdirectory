import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkAdminAuthFromRequest } from '@/lib/auth'

/**
 * Next.js middleware for admin route protection
 * 
 * Intercepts all requests to admin surfaces and verifies that the user
 * is both authenticated (has valid Supabase session) and authorized
 * (has admin role in profiles table). Applies to:
 * - All admin pages: `/admin/**`
 * - All admin APIs: `/api/admin/**`
 * 
 * @param {NextRequest} request - The incoming Next.js request
 * @returns {Promise<NextResponse>} Response object (redirect, 401, or continue)
 * 
 * @example
 * // This middleware runs automatically for configured routes
 * // User attempts to access /admin/reviews:
 * // 1. Middleware checks authentication via checkAdminAuthFromRequest()
 * // 2. If not admin: redirects to /login?redirectTo=/admin/reviews
 * // 3. If admin: allows access (NextResponse.next())
 * 
 * @example
 * // User attempts to call /api/admin/reviews/list:
 * // 1. Middleware checks authentication
 * // 2. If not admin: returns 401 Unauthorized JSON response
 * // 3. If admin: allows request to proceed to API handler
 * 
 * @remarks
 * **Authentication Flow:**
 * 1. Extract pathname from request
 * 2. Check if pathname matches admin patterns (/admin/** or /api/admin/**)
 * 3. Call checkAdminAuthFromRequest() to verify admin status
 * 4. If not admin:
 *    - API routes: Return 401 Unauthorized with JSON error
 *    - Page routes: Redirect to /login with returnTo parameter
 * 5. If admin: Allow request to proceed (NextResponse.next())
 * 
 * **Security Features:**
 * - Consistent admin auth enforcement across all admin surfaces
 * - Automatic 401 responses for unauthorized API access
 * - Login redirect with return URL preservation for pages
 * - Fail-safe behavior (denies access on any auth errors)
 * 
 * **Route Matching:**
 * The middleware only runs for routes matching the patterns in `config.matcher`:
 * - `/admin/:path*` - All admin pages and nested routes
 * - `/api/admin/:path*` - All admin API endpoints
 * 
 * @see {@link checkAdminAuthFromRequest} for authentication logic
 * @see {@link config} for route matcher configuration
 * 
 * @security
 * This middleware is critical for protecting admin-only functionality.
 * Do not modify without security review. Any changes must maintain:
 * - Session validation via Supabase
 * - Admin role verification via profiles table
 * - Fail-safe denial of access on errors
 * 
 * @since Phase 1 Batch 1 - Admin authentication implementation
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is an admin route
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminAPI = pathname.startsWith('/api/admin')

  if (isAdminPage || isAdminAPI) {
    // Check admin authentication
    const adminUserId = await checkAdminAuthFromRequest(request)

    if (!adminUserId) {
      // User is not authenticated or not an admin
      if (isAdminAPI) {
        // Return 401 for API routes
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Admin access required' },
          { status: 401 }
        )
      } else {
        // Redirect to login for page routes
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // User is authorized, continue
    return NextResponse.next()
  }

  // Not an admin route, continue normally
  return NextResponse.next()
}

/**
 * Middleware configuration
 * 
 * Specifies which routes should be intercepted by the middleware.
 * Only paths matching these patterns will trigger the authentication check.
 * 
 * @property {string[]} matcher - Array of route patterns to match
 * 
 * @remarks
 * **Matcher patterns:**
 * - `/admin/:path*` - Matches all admin pages (e.g., /admin, /admin/reviews, /admin/ai-health)
 * - `/api/admin/:path*` - Matches all admin API routes (e.g., /api/admin/reviews/list)
 * 
 * **Pattern syntax:**
 * - `:path*` - Matches zero or more path segments (wildcard)
 * 
 * **Performance note:**
 * Next.js middleware is efficient, but runs on every matched request.
 * Keep matcher patterns specific to minimize unnecessary invocations.
 * 
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher}
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
}
