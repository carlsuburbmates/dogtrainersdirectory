import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { logValidationError } from '../_shared/validation.ts'

interface SuburbRecord {
  id: number;
  name: string;
  postcode: string;
  latitude: number;
  longitude: number;
  council_id: number;
  councils: {
    name: string;
    region: string;
  } | null;
}

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
    const url = new URL(req.url)
    let query = url.searchParams.get('q')

    if ((!query || query.trim().length === 0) && req.method !== 'GET') {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const body = await req.json().catch(() => ({}))
        if (body && typeof body.query === 'string') {
          query = body.query
        } else if (body && typeof body.q === 'string') {
          query = body.q
        }
      }
    }

    if (!query) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameter: query',
          message: 'Please provide a search query using the "q" parameter'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate query parameter
    if (typeof query !== 'string' || query.trim().length === 0) {
      const errorMessage = 'Query parameter must be a non-empty string'
      logValidationError('suburbs', 'query', query, errorMessage)
      return new Response(
        JSON.stringify({
          error: 'Invalid query parameter',
          message: errorMessage
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate query length to prevent abuse
    if (query.length > 100) {
      const errorMessage = 'Query parameter too long (maximum 100 characters)'
      logValidationError('suburbs', 'query', query, errorMessage)
      return new Response(
        JSON.stringify({
          error: 'Invalid query parameter',
          message: errorMessage
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Search suburbs by name
    const { data: suburbs, error } = await supabase
      .from('suburbs')
      .select('id, name, postcode, latitude, longitude, council_id, councils ( name, region )')
      .ilike('name', `%${query}%`)
      .limit(10)
      .order('name') as { data: SuburbRecord[] | null; error: any }

    if (error) {
      console.error('Suburbs API database error:', error)
      return new Response(
        JSON.stringify({
          error: 'Database search failed',
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate that we found suburbs
    if (!suburbs || suburbs.length === 0) {
      logValidationError('suburbs', 'search_results', query, `No suburbs found for query: ${query}`)
      return new Response(
        JSON.stringify({
          success: true,
          suburbs: [],
          message: `No suburbs found matching "${query}"`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const formatted = suburbs.map((suburb) => ({
      id: suburb.id,
      name: suburb.name,
      postcode: suburb.postcode,
      latitude: suburb.latitude,
      longitude: suburb.longitude,
      council_id: suburb.council_id,
      council_name: suburb.councils?.name ?? '',
      region: suburb.councils?.region ?? ''
    }))

    return new Response(
      JSON.stringify({
        success: true,
        suburbs: formatted,
        count: formatted.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Suburbs API error:', error)
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
