import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { recordSearchTelemetry } from '@/lib/telemetryLatency'

/**
 * Public Search API
 * GET /api/public/search
 * 
 * Query Parameters:
 * - query: Text search term (searches business names, suburbs, councils, specialties)
 * - lat: User latitude for distance-based search
 * - lng: User longitude for distance-based search
 * - distance: Distance filter ('any', '0-5', '5-15', 'greater')
 * - age_specialties: Comma-separated list of age specialties
 * - behavior_issues: Comma-separated list of behavior issues
 * - service_type: Single service type filter
 * - verified_only: Boolean to filter only verified trainers
 * - rescue_only: Boolean to filter rescue dog specialists
 * - price_max: Maximum price filter
 * - limit: Number of results to return (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - sort: Sort order ('distance', 'rating', 'verified') - default: 'distance'
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
