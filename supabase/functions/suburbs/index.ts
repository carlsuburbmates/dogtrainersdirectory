import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { logValidationError } from '../_shared/validation.ts'

interface SuburbResult {
  id: number;
  name: string;
  postcode: string;
  latitude: number;
  longitude: number;
  council_id: number;
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

    if (!query && req.method !== 'GET') {
      try {
        const body = await req.json()
        if (body && typeof body.query === 'string') {
          query = body.query
        }
      } catch (_) {
        // Ignore body parse errors; fall back to query param validation below.
      }
    }

    if (!query) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameter: query',
          message: 'Provide a search query using ?q= or JSON { "query": "..." }'
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
      .select('id, name, postcode, latitude, longitude, council_id')
      .ilike('name', `%${query}%`)
      .limit(10)
      .order('name') as { data: SuburbResult[] | null; error: any }

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

    return new Response(
      JSON.stringify({
        success: true,
        suburbs: suburbs,
        count: suburbs.length
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
