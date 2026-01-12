import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkAdminAuthFromRequest } from '@/lib/auth'

/**
 * Middleware to protect admin routes
 * Applies to all /admin/** and /api/admin/** routes
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

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
}
