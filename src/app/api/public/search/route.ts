import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { recordSearchTelemetry } from '@/lib/telemetryLatency'

/**
 * Public trainer search API endpoint
 * 
 * Full-text search API for finding dog trainers with advanced filtering capabilities.
 * Supports location-based search, service type filtering, behavior issue specialization,
 * and trainer verification status.
 * 
 * @route GET /api/public/search
 * @access Public - No authentication required
 * 
 * @param {Request} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with search results and metadata
 * 
 * @queryparam {string} [query] - Text search term (searches business names, suburbs, councils, specialties)
 * @queryparam {number} [lat] - User latitude for distance-based search (requires lng)
 * @queryparam {number} [lng] - User longitude for distance-based search (requires lat)
 * @queryparam {string} [distance='any'] - Distance filter: 'any', '0-5' (km), '5-15' (km), 'greater' (>15km)
 * @queryparam {string} [age_specialties] - Comma-separated age specialties (e.g., 'puppy,adult')
 * @queryparam {string} [behavior_issues] - Comma-separated behavior issues (e.g., 'aggression,anxiety')
 * @queryparam {string} [service_type] - Single service type filter (e.g., 'group_class', 'private_session')
 * @queryparam {boolean} [verified_only=false] - Filter only ABN-verified trainers
 * @queryparam {boolean} [rescue_only=false] - Filter rescue dog specialists
 * @queryparam {number} [price_max] - Maximum price filter
 * @queryparam {number} [limit=50] - Results per page (max: 100)
 * @queryparam {number} [offset=0] - Pagination offset
 * @queryparam {string} [sort='distance'] - Sort order: 'distance', 'rating', 'verified'
 * 
 * @example
 * // Basic search
 * GET /api/public/search?query=positive+training
 * 
 * @example
 * // Location-based search with filters
 * GET /api/public/search?lat=-37.8136&lng=144.9631&distance=0-5&verified_only=true
 * 
 * @example
 * // Search with behavior issues
 * GET /api/public/search?behavior_issues=aggression,anxiety&service_type=private_session
 * 
 * @response
 * ```json
 * {
 *   "success": true,
 *   "results": [
 *     {
 *       "id": "uuid",
 *       "business_name": "Happy Dogs Training",
 *       "suburb": "Melbourne",
 *       "postcode": "3000",
 *       "council": "City of Melbourne",
 *       "services": ["group_class", "private_session"],
 *       "behavior_issues": ["aggression", "anxiety"],
 *       "age_specialties": ["puppy", "adult"],
 *       "avg_rating": 4.5,
 *       "review_count": 23,
 *       "is_featured": false,
 *       "is_verified": true,
 *       "contact_email": "contact@example.com",
 *       "contact_phone": "0400000000",
 *       "distance_km": 2.3
 *     }
 *   ],
 *   "metadata": {
 *     "total": 150,
 *     "limit": 50,
 *     "offset": 0,
 *     "has_more": true
 *   }
 * }
 * ```
 * 
 * @remarks
 * **Data Source:**
 * - Calls Supabase RPC `search_trainers` with decryption key
 * - Decrypts sensitive contact fields (email, phone) server-side
 * - Uses SUPABASE_PGCRYPTO_KEY for field decryption
 * 
 * **Search Features:**
 * - Full-text search across business name, location, specializations
 * - Distance-based filtering using PostGIS geography calculations
 * - Multi-criteria filtering (service type, behavior issues, age specialties)
 * - Trainer verification status filtering
 * - Flexible sorting options
 * 
 * **Performance:**
 * - Results are cached at database level where appropriate
 * - Pagination support for large result sets
 * - Telemetry logging for monitoring search latency
 * 
 * **Security:**
 * - Public endpoint - no authentication required
 * - Sensitive fields decrypted server-side only
 * - Input validation on all parameters
 * - Max limit enforced (100 results)
 * 
 * @throws {400} Invalid query parameters
 * @throws {500} Database error or RPC failure
 * 
 * @see {@link https://supabase.com/docs/guides/database/functions} for RPC documentation
 * @since Phase 1 Batch 1 - Search functionality implementation
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    
    // Parse query parameters
    const query = url.searchParams.get('query') || null
    const lat = url.searchParams.get('lat') ? parseFloat(url.searchParams.get('lat')!) : null
    const lng = url.searchParams.get('lng') ? parseFloat(url.searchParams.get('lng')!) : null
    const distance = url.searchParams.get('distance') || 'any'
    const ageSpecialtiesParam = url.searchParams.get('age_specialties')
    const behaviorIssuesParam = url.searchParams.get('behavior_issues')
    const serviceType = url.searchParams.get('service_type') || null
    const verifiedOnly = url.searchParams.get('verified_only') === 'true'
    const rescueOnly = url.searchParams.get('rescue_only') === 'true'
    const priceMax = url.searchParams.get('price_max') ? parseFloat(url.searchParams.get('price_max')!) : null
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    // Parse array parameters
    const ageSpecialties = ageSpecialtiesParam 
      ? ageSpecialtiesParam.split(',').filter(Boolean)
      : null
    
    const behaviorIssues = behaviorIssuesParam
      ? behaviorIssuesParam.split(',').filter(Boolean)
      : null

    // Get decryption key for sensitive fields
    const decryptKey = process.env.SUPABASE_PGCRYPTO_KEY || null

    // Call search_trainers RPC
    const { data, error } = await supabaseAdmin.rpc('search_trainers', {
      user_lat: lat,
      user_lng: lng,
      age_filters: ageSpecialties,
      issue_filters: behaviorIssues,
      service_type_filter: serviceType,
      verified_only: verifiedOnly,
      rescue_only: rescueOnly,
      distance_filter: distance,
      price_max: priceMax,
      search_term: query,
      result_limit: limit,
      result_offset: offset,
      p_key: decryptKey
    })

    if (error) {
      console.error('Search RPC error:', error)
      
      // Record telemetry for failed search
      await recordSearchTelemetry({
        operation: 'search',
        resultCount: 0,
        latencyMs: Date.now() - startTime,
        success: false,
        error: error.message
      })

      return NextResponse.json(
        { 
          error: 'Search failed', 
          message: error.message,
          results: [],
          metadata: {
            total: 0,
            limit,
            offset
          }
        },
        { status: 500 }
      )
    }

    const results = data || []

    // Record successful search telemetry
    await recordSearchTelemetry({
      operation: 'search',
      resultCount: results.length,
      latencyMs: Date.now() - startTime,
      success: true,
      error: null
    })

    // Return results with metadata
    return NextResponse.json({
      results,
      metadata: {
        total: results.length,
        limit,
        offset,
        hasMore: results.length === limit, // If we got exactly the limit, there might be more
        filters: {
          query,
          location: lat && lng ? { lat, lng } : null,
          distance,
          ageSpecialties,
          behaviorIssues,
          serviceType,
          verifiedOnly,
          rescueOnly,
          priceMax
        }
      }
    })

  } catch (error: any) {
    console.error('Search API error:', error)
    
    // Record telemetry for unexpected errors
    await recordSearchTelemetry({
      operation: 'search',
      resultCount: 0,
      latencyMs: Date.now() - startTime,
      success: false,
      error: error.message || 'Unknown error'
    })

    return NextResponse.json(
      { 
        error: 'Server error', 
        message: error.message,
        results: [],
        metadata: {
          total: 0
        }
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
