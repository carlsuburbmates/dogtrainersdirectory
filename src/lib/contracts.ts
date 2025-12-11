import { z } from 'zod'
import type {
  AgeSpecialty, BehaviorIssue, ServiceType, ResourceType,
  TriageRequest, SearchRequest, TrainerOnboardingData,
  Region, VerificationStatus
} from '@/types/database'

// Temporary inline types for Phase A until database.ts re-export is updated
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

export interface AbnVerificationRequest {
  abn: string
  businessName: string
  businessId: number
}

// Central Zod schemas for strict runtime validation across frontend

// Primitive enums (locked to source of truth)
export const AgeSpecialtySchema = z.enum([
  'puppies_0_6m',
  'adolescent_6_18m',
  'adult_18m_7y',
  'senior_7y_plus',
  'rescue_dogs'
]) satisfies z.ZodType<AgeSpecialty>

export const BehaviorIssueSchema = z.enum([
  'pulling_on_lead',
  'separation_anxiety',
  'excessive_barking',
  'dog_aggression',
  'leash_reactivity',
  'jumping_up',
  'destructive_behaviour',
  'recall_issues',
  'anxiety_general',
  'resource_guarding',
  'mouthing_nipping_biting',
  'rescue_dog_support',
  'socialisation'
]) satisfies z.ZodType<BehaviorIssue>

export const ServiceTypeSchema = z.enum([
  'puppy_training',
  'obedience_training',
  'behaviour_consultations',
  'group_classes',
  'private_training'
]) satisfies z.ZodType<ServiceType>

export const ResourceTypeSchema = z.enum([
  'trainer',
  'behaviour_consultant',
  'emergency_vet',
  'urgent_care',
  'emergency_shelter'
]) satisfies z.ZodType<ResourceType>

export const RegionSchema = z.enum([
  'Inner City',
  'Northern',
  'Eastern',
  'South Eastern',
  'Western'
]) satisfies z.ZodType<Region>

export const VerificationStatusSchema = z.enum([
  'pending',
  'verified',
  'rejected',
  'manual_review'
]) satisfies z.ZodType<VerificationStatus>

// Request/response models aligned to database entities
export const SuburbResultSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  postcode: z.string().regex(/^\d{4}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  council_id: z.number().int().positive()
}) satisfies z.ZodType<SuburbResult>

export const SearchResultSchema = z.object({
  business_id: z.number().int().positive(),
  business_name: z.string().min(1).max(200),
  business_email: z.string().email().optional(),
  business_phone: z.string().min(8).max(20).optional(),
  business_website: z.string().url().optional(),
  business_address: z.string().max(500).optional(),
  business_bio: z.string().max(4000).optional(),
  business_pricing: z.string().max(1000).optional(),
  suburb_name: z.string().min(1).max(100),
  council_name: z.string().min(1).max(100),
  region: z.string().min(1).max(50),
  distance_km: z.number().min(0).max(500),
  average_rating: z.number().min(1).max(5).optional(),
  review_count: z.number().int().min(0),
  age_specialties: z.array(z.string().min(1)),
  behavior_issues: z.array(z.string().min(1)),
  services: z.array(z.string().min(1)),
  verified: z.boolean(),
  is_featured: z.boolean().optional(),
  featured_until: z.string().datetime().optional().nullable(),
  abn_verified: z.boolean().optional()
}) satisfies z.ZodType<SearchResult>

export const TriageRequestSchema = z.object({
  age: AgeSpecialtySchema,
  issues: z.array(BehaviorIssueSchema).default([]),
  suburbId: z.number().int().positive(),
  radius: z.number().min(1).max(500).default(15)
}) satisfies z.ZodType<TriageRequest>

export const SearchRequestSchema = z.object({
  suburbId: z.number().int().positive(),
  radius: z.number().min(1).max(500).optional(),
  ageFilter: AgeSpecialtySchema.optional(),
  issuesFilter: z.array(BehaviorIssueSchema).optional(),
  serviceTypeFilter: ServiceTypeSchema.optional(),
  verifiedOnly: z.boolean().optional(),
  priceRange: z.tuple([z.number().min(0), z.number().min(0)]).optional(),
  sortBy: z.enum(['distance', 'rating', 'verified']).optional()
}) satisfies z.ZodType<SearchRequest>

export const TrainerOnboardingDataSchema = z.object({
  businessName: z.string().min(1).max(200),
  phone: z.string().min(8).max(20),
  email: z.string().email(),
  website: z.string().url().optional(),
  address: z.string().min(1).max(500),
  suburbId: z.number().int().positive(),
  bio: z.string().min(1).max(2000),
  pricing: z.string().min(1).max(2000),
  abn: z.string().min(1).max(20),
  ageSpecialties: z.array(AgeSpecialtySchema).min(1),
  behaviorIssues: z.array(BehaviorIssueSchema).min(1),
  primaryService: ServiceTypeSchema,
  secondaryServices: z.array(ServiceTypeSchema).max(4).optional()
}) satisfies z.ZodType<TrainerOnboardingData>

export const AbnVerificationRequestSchema = z.object({
  abn: z.string().min(1).max(20),
  businessName: z.string().min(1).max(200),
  businessId: z.number().int().positive()
}) satisfies z.ZodType<AbnVerificationRequest>

// Emergency/resource-specific contracts
export const EmergencyResourceSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  resource_type: ResourceTypeSchema,
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().max(500).optional(),
  suburb_id: z.number().int().positive(),
  is_24_hour: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
}) satisfies z.ZodType<any> // TODO: create a dedicated EmergencyResource type

// Admin dashboard contracts
export const OpsDigestSchema = z.object({
  date: z.string().datetime(),
  total_searches: z.number().int().min(0),
  total_triage_sessions: z.number().int().min(0),
  verified_trainers_count: z.number().int().min(0),
  pending_reviews_count: z.number().int().min(0),
  emergency_resource_last_updated: z.string().datetime().optional(),
  top_suburbs_searched: z.array(z.object({
    suburb_id: z.number().int(),
    suburb_name: z.string(),
    search_count: z.number().int()
  }))
}) satisfies z.ZodType<any> // TODO: create a dedicated OpsDigest type

// Helper to extract inferred TypeScript types from Zod schemas
export type ZodInfer<T extends z.ZodType<any>> = z.infer<T>

// Type guards that reuse strict validated schemas
export const isSuburbResult = (obj: unknown): obj is SuburbResult => {
  return SuburbResultSchema.safeParse(obj).success
}

export const isSearchResult = (obj: unknown): obj is SearchResult => {
  return SearchResultSchema.safeParse(obj).success
}

export const isTriageRequest = (obj: unknown): obj is TriageRequest => {
  return TriageRequestSchema.safeParse(obj).success
}

export const isSearchRequest = (obj: unknown): obj is SearchRequest => {
  return SearchRequestSchema.safeParse(obj).success
}

export const isTrainerOnboardingData = (obj: unknown): obj is TrainerOnboardingData => {
  return TrainerOnboardingDataSchema.safeParse(obj).success
}

export const isAbnVerificationRequest = (obj: unknown): obj is AbnVerificationRequest => {
  return AbnVerificationRequestSchema.safeParse(obj).success
}

// Runtime validation functions (safe, throw on failure)
export const validateTriageRequest = (obj: unknown): TriageRequest => {
  return TriageRequestSchema.parse(obj)
}

export const validateSearchRequest = (obj: unknown): SearchRequest => {
  return SearchRequestSchema.parse(obj)
}

export const validateTrainerOnboardingData = (obj: unknown): TrainerOnboardingData => {
  return TrainerOnboardingDataSchema.parse(obj)
}

export const validateAbnVerificationRequest = (obj: unknown): AbnVerificationRequest => {
  return AbnVerificationRequestSchema.parse(obj)
}
