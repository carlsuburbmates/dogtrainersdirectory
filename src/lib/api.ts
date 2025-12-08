import { supabase, supabaseAdmin } from './supabase'
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
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return // Skip if no admin access
    
    await supabaseAdmin
      .from('search_telemetry')
      .insert({
        operation,
        suburb_id: suburbId,
        suburb_name: suburbName,
        result_count: resultCount,
        latency_ms: latencyMs,
        success,
        error,
        timestamp: new Date().toISOString()
      })
  } catch (e) {
    // Silently fail to avoid blocking main flow
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