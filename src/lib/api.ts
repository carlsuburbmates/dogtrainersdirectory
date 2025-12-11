import { supabase, supabaseAdmin } from './supabase'
import { recordSearchTelemetry, type SearchTelemetryPayload } from './telemetryLatency'
import { AgeSpecialty, BehaviorIssue } from '../types/database'

export interface TriageRequest {
  age: AgeSpecialty
  issues: BehaviorIssue[]
  suburbId: number
  radius?: number
}

export interface SuburbResult {
  id: number
  name: string
  postcode: string
  latitude: number
  longitude: number
  council_id: number
}

export interface SearchResult {
  business_id: number
  business_name: string
  business_email?: string
  business_phone?: string
  business_website?: string
  business_address?: string
  business_bio?: string
  business_pricing?: string
  suburb_name: string
  council_name: string
  region: string
  distance_km: number
  average_rating?: number
  review_count: number
  age_specialties: string[]
  behavior_issues: string[]
  services: string[]
  verified: boolean
  is_featured?: boolean
  featured_until?: string | null
  abn_verified?: boolean
}

// Helper function to log telemetry for API calls
async function logApiTelemetry(
  operation: string,
  suburbId?: number,
  suburbName?: string,
  resultCount?: number,
  latencyMs?: number,
  success: boolean = true,
  error?: string
): Promise<void> {
  const payload: SearchTelemetryPayload = {
    operation,
    suburbId,
    suburbName,
    resultCount,
    latencyMs,
    success,
    error
  }

  try {
    if (typeof window === 'undefined') {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return
      }
      await recordSearchTelemetry(payload)
    } else {
      await fetch('/api/telemetry/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }
  } catch (e) {
    console.warn('Failed to log telemetry:', e)
  }
}

// API service for connecting to Supabase Edge Functions
export const apiService = {
  // Search suburbs by name
  async searchSuburbs(query: string): Promise<SuburbResult[]> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke('suburbs', {
        body: { query }
      })
      
      if (error) {
        await logApiTelemetry(
          'search_suburbs',
          undefined,
          query,
          0,
          Date.now() - startTime,
          false,
          error.message
        )
        console.error('Error searching suburbs:', error)
        throw new Error('Failed to search suburbs')
      }
      
      const suburbs = data?.suburbs || []
      
      // Log telemetry
      await logApiTelemetry(
        'search_suburbs',
        undefined,
        query,
        suburbs.length,
        Date.now() - startTime,
        true
      )
      
      return suburbs
    } catch (error) {
      // Re-throw errors after logging attempt
      throw error
    }
  },

  // Get triage results
  async getTriageResults(request: TriageRequest): Promise<SearchResult[]> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke('triage', {
        body: request
      })
      
      if (error) {
        await logApiTelemetry(
          'triage_search',
          request.suburbId,
          undefined, // suburb name not available directly
          0,
          Date.now() - startTime,
          false,
          error.message
        )
        console.error('Error getting triage results:', error)
        throw new Error('Failed to get triage results')
      }
      
      const trainers = data?.trainers || []
      
      // Log telemetry with suburb ID from request
      await logApiTelemetry(
        'triage_search',
        request.suburbId,
        undefined, // suburb name not available directly
        trainers.length,
        Date.now() - startTime,
        true
      )
      
      return trainers
    } catch (error) {
      // Re-throw errors after logging attempt
      throw error
    }
  }
}
