import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  validateAgeSpecialtiesArray,
  validateBehaviorIssuesArray,
  validateServiceType,
  validateSuburbId,
  logValidationError,
  ValidationError,
  AgeSpecialty,
  BehaviorIssue,
  ServiceType
} from '../_shared/validation.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

type DistanceFilter = 'any' | '0-5' | '5-15' | 'greater'

interface TriageRequest {
  ageFilters?: AgeSpecialty[];
  includeRescue?: boolean;
  issues?: BehaviorIssue[];
  suburbId?: number;
  distanceFilter?: DistanceFilter;
  serviceType?: ServiceType | null;
  verifiedOnly?: boolean;
  priceMax?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

const DISTANCE_OPTIONS: DistanceFilter[] = ['any', '0-5', '5-15', 'greater']

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      ageFilters,
      includeRescue = false,
      issues,
      suburbId,
      distanceFilter = 'any',
      serviceType,
      verifiedOnly = false,
      priceMax,
      searchTerm,
      limit = 50,
      offset = 0
    }: TriageRequest = await req.json()
    const sanitizedSearchTerm =
      typeof searchTerm === 'string' && searchTerm.trim().length > 0
        ? searchTerm.trim()
        : null

    // Validate enum values and parameters
    const validationErrors: ValidationError[] = []

    let validatedAges: AgeSpecialty[] | null = null
    if (ageFilters && ageFilters.length > 0) {
      try {
        validatedAges = validateAgeSpecialtiesArray(ageFilters)
      } catch (error) {
        validationErrors.push({ field: 'ageFilters', message: error.message })
        logValidationError('triage', 'ageFilters', ageFilters, error.message)
      }
    }

    if (suburbId) {
      try {
        validateSuburbId(suburbId)
      } catch (error) {
        validationErrors.push({ field: 'suburbId', message: error.message })
        logValidationError('triage', 'suburbId', suburbId, error.message)
      }
    }

    // Validate behavior issues array if provided
    let validatedIssues: BehaviorIssue[] | null = null
    if (issues !== undefined && issues !== null) {
      try {
        validatedIssues = validateBehaviorIssuesArray(issues)
      } catch (error) {
        validationErrors.push({ field: 'issues', message: error.message })
        logValidationError('triage', 'issues', issues, error.message)
      }
    }

    if (serviceType) {
      try {
        validateServiceType(serviceType)
      } catch (error) {
        validationErrors.push({ field: 'serviceType', message: error.message })
        logValidationError('triage', 'serviceType', serviceType, error.message)
      }
    }

    if (priceMax !== undefined && priceMax !== null) {
      if (typeof priceMax !== 'number' || Number.isNaN(priceMax) || priceMax < 0 || priceMax > 500) {
        const message = 'priceMax must be a number between 0 and 500'
        validationErrors.push({ field: 'priceMax', message })
        logValidationError('triage', 'priceMax', priceMax, message)
      }
    }

    if (DISTANCE_OPTIONS.indexOf(distanceFilter) === -1) {
      const message = `distanceFilter must be one of: ${DISTANCE_OPTIONS.join(', ')}`
      validationErrors.push({ field: 'distanceFilter', message })
      logValidationError('triage', 'distanceFilter', distanceFilter, message)
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      const message = 'limit must be between 1 and 100'
      validationErrors.push({ field: 'limit', message })
      logValidationError('triage', 'limit', limit, message)
    }

    if (typeof offset !== 'number' || offset < 0) {
      const message = 'offset must be 0 or greater'
      validationErrors.push({ field: 'offset', message })
      logValidationError('triage', 'offset', offset, message)
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationErrors
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get suburb coordinates for distance calculation
    let suburb: { latitude: number; longitude: number } | null = null

    if (suburbId) {
      const { data, error: suburbError } = await supabase
        .from('suburbs')
        .select('latitude, longitude')
        .eq('id', suburbId)
        .single()

      if (suburbError || !data) {
        return new Response(
          JSON.stringify({ error: 'Invalid suburb ID' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      suburb = { latitude: data.latitude, longitude: data.longitude }
    }

    // Call the search_trainers function
    const { data: trainers, error: searchError } = await supabase
      .rpc('search_trainers', {
        user_lat: suburb ? suburb.latitude : null,
        user_lng: suburb ? suburb.longitude : null,
        age_filters: validatedAges && validatedAges.length > 0 ? validatedAges : null,
        issue_filters: validatedIssues && validatedIssues.length > 0 ? validatedIssues : null,
        service_type_filter: serviceType ?? null,
        verified_only: verifiedOnly,
        rescue_only: includeRescue,
        distance_filter: suburb ? distanceFilter : 'greater',
        price_max: priceMax ?? null,
        search_term: sanitizedSearchTerm,
        result_limit: Math.min(Math.max(limit, 1), 100),
        result_offset: Math.max(offset, 0)
      })

    if (searchError) {
      return new Response(
        JSON.stringify({ error: 'Search failed', details: searchError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
        JSON.stringify({ 
          success: true,
          trainers: trainers || [],
          search_params: {
            ageFilters: validatedAges,
            includeRescue,
            issues,
            suburbId,
            distanceFilter: suburb ? distanceFilter : 'greater',
            serviceType,
            verifiedOnly,
            priceMax,
            searchTerm: sanitizedSearchTerm,
            limit: Math.min(Math.max(limit, 1), 100),
            offset: Math.max(offset, 0)
          }
        }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Triage API error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
