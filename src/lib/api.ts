import { supabase } from './supabase'
import { AgeSpecialty, BehaviorIssue, DistanceFilter, ServiceType } from '../types/database'

export interface TriageRequest {
  ageFilters?: AgeSpecialty[]
  includeRescue?: boolean
  issues?: BehaviorIssue[]
  suburbId?: number
  distanceFilter?: DistanceFilter
  serviceType?: ServiceType | null
  verifiedOnly?: boolean
  priceMax?: number
  searchTerm?: string
  limit?: number
  offset?: number
}

export interface SuburbResult {
  id: number
  name: string
  postcode: string
  latitude: number
  longitude: number
  council_id: number
  council_name: string
  region: string
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
  featured_until?: string | null
  is_featured?: boolean
  pricing_min_rate?: number | null
  suburb_name: string
  council_name: string
  region: string
  distance_km?: number | null
  average_rating?: number | null
  review_count: number
  age_specialties: AgeSpecialty[]
  behavior_issues: BehaviorIssue[]
  services: ServiceType[]
  abn_verified: boolean
}

// API service for connecting to Supabase Edge Functions
export const apiService = {
  // Search suburbs by name
  async searchSuburbs(query: string): Promise<SuburbResult[]> {
    const { data, error } = await supabase.functions.invoke('suburbs', {
      body: { query }
    })
    
    if (error) {
      console.error('Error searching suburbs:', error)
      throw new Error('Failed to search suburbs')
    }
    
    return data?.suburbs || []
  },

  // Get triage results
  async getTriageResults(request: TriageRequest): Promise<SearchResult[]> {
    const { data, error } = await supabase.functions.invoke('triage', {
      body: request
    })
    
    if (error) {
      console.error('Error getting triage results:', error)
      throw new Error('Failed to get triage results')
    }
    
    return data?.trainers || []
  }
}
