import { supabase } from './supabase'
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