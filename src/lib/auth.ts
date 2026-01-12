import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

/**
 * Server-side admin authentication check
 * Used in API routes and server components
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
 * Get authenticated user from request (for API routes)
 * Returns user ID if authenticated, null otherwise
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
 * Check if the current user is an admin
 * Used in API routes
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
 * Middleware helper to check admin authentication from NextRequest
 * Returns user ID if admin, null otherwise
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
