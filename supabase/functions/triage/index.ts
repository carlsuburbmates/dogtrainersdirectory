import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  validateAgeSpecialty,
  validateBehaviorIssuesArray,
  validateSuburbId,
  validateRadius,
  logValidationError,
  ValidationError,
  AgeSpecialty,
  BehaviorIssue
} from '../_shared/validation.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { age, issues, suburbId, radius = 50 }: {
      age: AgeSpecialty;
      issues?: BehaviorIssue[];
      suburbId: number;
      radius?: number
    } = await req.json()

    // Validate required parameters
    if (!age || !suburbId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: age and suburbId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate enum values and parameters
    const validationErrors: ValidationError[] = []

    try {
      validateAgeSpecialty(age)
    } catch (error) {
      validationErrors.push({ field: 'age', message: error.message })
      logValidationError('triage', 'age', age, error.message)
    }

    try {
      validateSuburbId(suburbId)
    } catch (error) {
      validationErrors.push({ field: 'suburbId', message: error.message })
      logValidationError('triage', 'suburbId', suburbId, error.message)
    }

    try {
      validateRadius(radius)
    } catch (error) {
      validationErrors.push({ field: 'radius', message: error.message })
      logValidationError('triage', 'radius', radius, error.message)
    }

    // Validate behavior issues array if provided
    if (issues !== undefined && issues !== null) {
      try {
        validateBehaviorIssuesArray(issues)
      } catch (error) {
        validationErrors.push({ field: 'issues', message: error.message })
        logValidationError('triage', 'issues', issues, error.message)
      }
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
    const { data: suburb, error: suburbError } = await supabase
      .from('suburbs')
      .select('latitude, longitude')
      .eq('id', suburbId)
      .single()

    if (suburbError || !suburb) {
      return new Response(
        JSON.stringify({ error: 'Invalid suburb ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Call the search_trainers function
    const { data: trainers, error: searchError } = await supabase
      .rpc('search_trainers', {
        user_lat: suburb.latitude,
        user_lng: suburb.longitude,
        radius_km: radius,
        age_filter: age,
        issues_filter: issues && issues.length > 0 ? issues : null
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
          age,
          issues,
          suburbId,
          radius
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