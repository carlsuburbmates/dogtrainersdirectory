// Database types based on our schema design

// Import enum definitions from shared validation to ensure consistency
export type AgeSpecialty =
  | 'puppies_0_6m'
  | 'adolescent_6_18m'
  | 'adult_18m_7y'
  | 'senior_7y_plus'
  | 'rescue_dogs'

export type BehaviorIssue =
  | 'pulling_on_lead'
  | 'separation_anxiety'
  | 'excessive_barking'
  | 'dog_aggression'
  | 'leash_reactivity'
  | 'jumping_up'
  | 'destructive_behaviour'
  | 'recall_issues'
  | 'anxiety_general'
  | 'resource_guarding'
  | 'mouthing_nipping_biting'
  | 'rescue_dog_support'
  | 'socialisation'

// Validation functions to prevent frontend enum mismatches
export const isValidAgeSpecialty = (value: string): value is AgeSpecialty => {
  const validAges: AgeSpecialty[] = [
    'puppies_0_6m',
    'adolescent_6_18m',
    'adult_18m_7y',
    'senior_7y_plus',
    'rescue_dogs'
  ]
  return validAges.includes(value as AgeSpecialty)
}

export const isValidBehaviorIssue = (value: string): value is BehaviorIssue => {
  const validIssues: BehaviorIssue[] = [
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
  ]
  return validIssues.includes(value as BehaviorIssue)
}

// Runtime validation function for age specialties
export const validateAgeSpecialty = (value: string): AgeSpecialty => {
  if (!isValidAgeSpecialty(value)) {
    throw new Error(`Invalid age specialty: ${value}. Must be one of: puppies_0_6m, adolescent_6_18m, adult_18m_7y, senior_7y_plus, rescue_rehomed`)
  }
  return value as AgeSpecialty
}

// Runtime validation function for behavior issues
export const validateBehaviorIssue = (value: string): BehaviorIssue => {
  if (!isValidBehaviorIssue(value)) {
    throw new Error(`Invalid behavior issue: ${value}. Must be one of: pulling_lead, separation_anxiety, excessive_barking, dog_aggression, leash_reactivity, jumping_up, destructive_behaviour, recall_issues, anxiety_general, resource_guarding, mouthing_nipping_biting, rescue_support, socialisation`)
  }
  return value as BehaviorIssue
}

// Validation functions for ServiceType
export const isValidServiceType = (value: string): value is ServiceType => {
  const validServiceTypes: ServiceType[] = [
    'puppy_training',
    'obedience_training',
    'behaviour_consultations',
    'group_classes',
    'private_training'
  ]
  return validServiceTypes.includes(value as ServiceType)
}

export const validateServiceType = (value: string): ServiceType => {
  if (!isValidServiceType(value)) {
    throw new Error(`Invalid service type: ${value}. Must be one of: puppy_training, obedience_training, behaviour_consultations, group_classes, private_training`)
  }
  return value as ServiceType
}

// Validation functions for ResourceType
export const isValidResourceType = (value: string): value is ResourceType => {
  const validResourceTypes: ResourceType[] = [
    'trainer',
    'behaviour_consultant',
    'emergency_vet',
    'urgent_care',
    'emergency_shelter'
  ]
  return validResourceTypes.includes(value as ResourceType)
}

export const validateResourceType = (value: string): ResourceType => {
  if (!isValidResourceType(value)) {
    throw new Error(`Invalid resource type: ${value}. Must be one of: trainer, behaviour_consultant, emergency_vet, urgent_care, emergency_shelter`)
  }
  return value as ResourceType
}

// Validation functions for Region
export const isValidRegion = (value: string): value is Region => {
  const validRegions: Region[] = [
    'Inner City',
    'Northern',
    'Eastern',
    'South Eastern',
    'Western'
  ]
  return validRegions.includes(value as Region)
}

export const validateRegion = (value: string): Region => {
  if (!isValidRegion(value)) {
    throw new Error(`Invalid region: ${value}. Must be one of: Inner City, Northern, Eastern, South Eastern, Western`)
  }
  return value as Region
}

// Validation functions for UserRole
export const isValidUserRole = (value: string): value is UserRole => {
  const validUserRoles: UserRole[] = ['trainer', 'admin']
  return validUserRoles.includes(value as UserRole)
}

export const validateUserRole = (value: string): UserRole => {
  if (!isValidUserRole(value)) {
    throw new Error(`Invalid user role: ${value}. Must be one of: trainer, admin`)
  }
  return value as UserRole
}

// Validation functions for VerificationStatus
export const isValidVerificationStatus = (value: string): value is VerificationStatus => {
  const validVerificationStatuses: VerificationStatus[] = [
    'pending',
    'verified',
    'rejected',
    'manual_review'
  ]
  return validVerificationStatuses.includes(value as VerificationStatus)
}

export const validateVerificationStatus = (value: string): VerificationStatus => {
  if (!isValidVerificationStatus(value)) {
    throw new Error(`Invalid verification status: ${value}. Must be one of: pending, verified, rejected, manual_review`)
  }
  return value as VerificationStatus
}

// Array validation for behavior issues
export const validateBehaviorIssuesArray = (issues: string[]): BehaviorIssue[] => {
  if (!Array.isArray(issues)) {
    throw new Error('Behavior issues must be an array')
  }
  
  const validatedIssues: BehaviorIssue[] = []
  for (const issue of issues) {
    validatedIssues.push(validateBehaviorIssue(issue))
  }
  
  return validatedIssues
}

// Array validation for age specialties
export const validateAgeSpecialtiesArray = (ages: string[]): AgeSpecialty[] => {
  if (!Array.isArray(ages)) {
    throw new Error('Age specialties must be an array')
  }
  
  const validatedAges: AgeSpecialty[] = []
  for (const age of ages) {
    validatedAges.push(validateAgeSpecialty(age))
  }
  
  return validatedAges
}

// Array validation for service types
export const validateServiceTypesArray = (services: string[]): ServiceType[] => {
  if (!Array.isArray(services)) {
    throw new Error('Service types must be an array')
  }
  
  const validatedServices: ServiceType[] = []
  for (const service of services) {
    validatedServices.push(validateServiceType(service))
  }
  
  return validatedServices
}

// Array validation for resource types
export const validateResourceTypesArray = (resources: string[]): ResourceType[] => {
  if (!Array.isArray(resources)) {
    throw new Error('Resource types must be an array')
  }
  
  const validatedResources: ResourceType[] = []
  for (const resource of resources) {
    validatedResources.push(validateResourceType(resource))
  }
  
  return validatedResources
}

export type ServiceType = 
  | 'puppy_training'
  | 'obedience_training'
  | 'behaviour_consultations'
  | 'group_classes'
  | 'private_training'

export type ResourceType = 
  | 'trainer'
  | 'behaviour_consultant'
  | 'emergency_vet'
  | 'urgent_care'
  | 'emergency_shelter'

export type Region = 
  | 'Inner City'
  | 'Northern'
  | 'Eastern'
  | 'South Eastern'
  | 'Western'

export type UserRole = 'trainer' | 'admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_review'

// Tables
export interface Council {
  id: number
  name: string
  region: Region
  created_at?: string
}

export interface Suburb {
  id: number
  name: string
  postcode: string
  latitude: number
  longitude: number
  council_id: number
  created_at?: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Business {
  id: number
  profile_id: string
  name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  suburb_id: number
  bio?: string
  pricing?: string
  abn?: string
  abn_verified: boolean
  verification_status: VerificationStatus
  featured_until?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TrainerSpecialization {
  id: number
  business_id: number
  age_specialty: AgeSpecialty
}

export interface TrainerBehaviorIssue {
  id: number
  business_id: number
  behavior_issue: BehaviorIssue
}

export interface TrainerService {
  id: number
  business_id: number
  service_type: ServiceType
  is_primary: boolean
}

export interface Review {
  id: number
  business_id: number
  reviewer_name: string
  reviewer_email: string
  rating: number
  title?: string
  content?: string
  is_approved: boolean
  created_at: string
  updated_at: string
}

export interface EmergencyResource {
  id: number
  name: string
  resource_type: ResourceType
  phone: string
  email?: string
  website?: string
  address?: string
  suburb_id: number
  is_24_hour: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FeaturedPlacement {
  id: number
  business_id: number
  lga_id: number
  stripe_checkout_session_id?: string
  stripe_payment_intent_id?: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
}

export interface FeaturedPlacementQueue {
  id: number
  business_id: number
  lga_id: number
  stripe_payment_intent_id?: string
  queue_position: number
  created_at: string
}

export interface AbnVerification {
  id: number
  business_id: number
  abn: string
  business_name: string
  matched_name?: string
  similarity_score?: number
  verification_method: 'api' | 'manual_upload'
  status: VerificationStatus
  admin_notes?: string
  created_at: string
  updated_at: string
}

export interface WebhookEvent {
  id: number
  stripe_event_id: string
  event_type: string
  processed: boolean
  created_at: string
}

// Joins and complex types
export interface BusinessWithDetails extends Business {
  profile: Profile
  suburb: Suburb
  council: Council
  specializations: TrainerSpecialization[]
  behavior_issues: TrainerBehaviorIssue[]
  services: TrainerService[]
  reviews: Review[]
  average_rating?: number
}

export interface TrainerSearchResult {
  business: BusinessWithDetails
  distance_km: number
  match_score: number
}

// API Request/Response types
export interface TriageRequest {
  age: AgeSpecialty
  issues: BehaviorIssue[]
  suburbId: number
  radius?: number
}

export interface SearchRequest {
  suburbId: number
  radius?: number
  ageFilter?: AgeSpecialty
  issuesFilter?: BehaviorIssue[]
  serviceTypeFilter?: ServiceType
  verifiedOnly?: boolean
  priceRange?: [number, number]
  sortBy?: 'distance' | 'rating' | 'verified'
}

export interface TrainerOnboardingData {
  businessName: string
  phone: string
  email: string
  website?: string
  address: string
  suburbId: number
  bio: string
  pricing: string
  abn: string
  ageSpecialties: AgeSpecialty[]
  behaviorIssues: BehaviorIssue[]
  primaryService: ServiceType
  secondaryServices?: ServiceType[]
}

export interface AbnVerificationRequest {
  abn: string
  businessName: string
  businessId: number
}

export interface AbnVerificationResponse {
  verified: boolean
  similarity?: number
  abnData?: any
  requiresManualReview?: boolean
}
// Type guards for API parameters
export const isValidTriageRequest = (obj: any): obj is TriageRequest => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.age === 'string' &&
    isValidAgeSpecialty(obj.age) &&
    (!obj.issues || Array.isArray(obj.issues)) &&
    typeof obj.suburbId === 'number' &&
    obj.suburbId > 0 &&
    (!obj.radius || (typeof obj.radius === 'number' && obj.radius > 0 && obj.radius <= 500))
  )
}

export const isValidSearchRequest = (obj: any): obj is SearchRequest => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.suburbId === 'number' &&
    obj.suburbId > 0 &&
    (!obj.radius || (typeof obj.radius === 'number' && obj.radius > 0 && obj.radius <= 500)) &&
    (!obj.ageFilter || (typeof obj.ageFilter === 'string' && isValidAgeSpecialty(obj.ageFilter))) &&
    (!obj.issuesFilter || (Array.isArray(obj.issuesFilter) && obj.issuesFilter.every((issue: any) => typeof issue === 'string' && isValidBehaviorIssue(issue)))) &&
    (!obj.serviceTypeFilter || (typeof obj.serviceTypeFilter === 'string' && isValidServiceType(obj.serviceTypeFilter))) &&
    (!obj.verifiedOnly || typeof obj.verifiedOnly === 'boolean') &&
    (!obj.priceRange || (Array.isArray(obj.priceRange) && obj.priceRange.length === 2 && 
      typeof obj.priceRange[0] === 'number' && typeof obj.priceRange[1] === 'number' && 
      obj.priceRange[0] >= 0 && obj.priceRange[1] >= obj.priceRange[0])) &&
    (!obj.sortBy || ['distance', 'rating', 'verified'].includes(obj.sortBy))
  )
}

export const isValidTrainerOnboardingData = (obj: any): obj is TrainerOnboardingData => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.businessName === 'string' && obj.businessName.trim().length > 0 &&
    typeof obj.phone === 'string' && obj.phone.trim().length > 0 &&
    typeof obj.email === 'string' && obj.email.includes('@') &&
    (!obj.website || typeof obj.website === 'string') &&
    typeof obj.address === 'string' && obj.address.trim().length > 0 &&
    typeof obj.suburbId === 'number' && obj.suburbId > 0 &&
    typeof obj.bio === 'string' && obj.bio.trim().length > 0 &&
    typeof obj.pricing === 'string' && obj.pricing.trim().length > 0 &&
    typeof obj.abn === 'string' && obj.abn.trim().length > 0 &&
    Array.isArray(obj.ageSpecialties) && obj.ageSpecialties.every((age: any) => typeof age === 'string' && isValidAgeSpecialty(age)) &&
    Array.isArray(obj.behaviorIssues) && obj.behaviorIssues.every((issue: any) => typeof issue === 'string' && isValidBehaviorIssue(issue)) &&
    typeof obj.primaryService === 'string' && isValidServiceType(obj.primaryService) &&
    (!obj.secondaryServices || (Array.isArray(obj.secondaryServices) && obj.secondaryServices.every((service: any) => typeof service === 'string' && isValidServiceType(service))))
  )
}

export const isValidAbnVerificationRequest = (obj: any): obj is AbnVerificationRequest => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.abn === 'string' && obj.abn.trim().length > 0 &&
    typeof obj.businessName === 'string' && obj.businessName.trim().length > 0 &&
    typeof obj.businessId === 'number' && obj.businessId > 0
  )
}

// Enhanced type safety for edge cases
export const validateNumericId = (id: any, fieldName: string = 'ID'): number => {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error(`${fieldName} must be a positive integer`)
  }
  return id
}

export const validateOptionalNumericId = (id: any, fieldName: string = 'ID'): number | null => {
  if (id === null || id === undefined) {
    return null
  }
  return validateNumericId(id, fieldName)
}

export const validateStringField = (value: any, fieldName: string, minLength: number = 1, maxLength: number = 1000): string => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }
  const trimmed = value.trim()
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} character${minLength === 1 ? '' : 's'} long`)
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be no more than ${maxLength} characters long`)
  }
  return trimmed
}

export const validateOptionalStringField = (value: any, fieldName: string, minLength: number = 1, maxLength: number = 1000): string | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  return validateStringField(value, fieldName, minLength, maxLength)
}

export const validateEmail = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const validated = validateStringField(email, 'Email', 5, 255)
  if (!emailRegex.test(validated)) {
    throw new Error('Email must be a valid email address')
  }
  return validated.toLowerCase()
}

export const validatePhone = (phone: string): string => {
  const validated = validateStringField(phone, 'Phone', 8, 20)
  // Remove all non-digit characters for validation
  const digitsOnly = validated.replace(/\D/g, '')
  if (digitsOnly.length < 8) {
    throw new Error('Phone number must contain at least 8 digits')
  }
  return validated
}

export const validateUrl = (url: string): string => {
  if (!url) return url
  const validated = validateStringField(url, 'URL', 5, 500)
  try {
    new URL(validated)
    return validated
  } catch {
    throw new Error('URL must be a valid web address')
  }
}

export const validateRating = (rating: any): number => {
  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error('Rating must be an integer between 1 and 5')
  }
  return rating
}

export const validateRadius = (radius: any): number => {
  if (typeof radius !== 'number' || radius < 1 || radius > 500) {
    throw new Error('Radius must be a number between 1 and 500 kilometers')
  }
  return radius
}

export const validateCoordinates = (latitude: any, longitude: any): { latitude: number; longitude: number } => {
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be a number between -90 and 90')
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be a number between -180 and 180')
  }
  return { latitude, longitude }
}

// Comprehensive validation for API requests
export const validateTriageRequest = (obj: any): TriageRequest => {
  if (!isValidTriageRequest(obj)) {
    throw new Error('Invalid triage request format')
  }
  
  return {
    age: validateAgeSpecialty(obj.age),
    issues: obj.issues ? validateBehaviorIssuesArray(obj.issues) : [],
    suburbId: validateNumericId(obj.suburbId, 'Suburb ID'),
    radius: obj.radius ? validateRadius(obj.radius) : 50
  }
}

export const validateSearchRequest = (obj: any): SearchRequest => {
  if (!isValidSearchRequest(obj)) {
    throw new Error('Invalid search request format')
  }
  
  return {
    suburbId: validateNumericId(obj.suburbId, 'Suburb ID'),
    radius: obj.radius ? validateRadius(obj.radius) : undefined,
    ageFilter: obj.ageFilter ? validateAgeSpecialty(obj.ageFilter) : undefined,
    issuesFilter: obj.issuesFilter ? validateBehaviorIssuesArray(obj.issuesFilter) : undefined,
    serviceTypeFilter: obj.serviceTypeFilter ? validateServiceType(obj.serviceTypeFilter) : undefined,
    verifiedOnly: obj.verifiedOnly,
    priceRange: obj.priceRange ? [obj.priceRange[0], obj.priceRange[1]] as [number, number] : undefined,
    sortBy: obj.sortBy as 'distance' | 'rating' | 'verified' || undefined
  }
}
