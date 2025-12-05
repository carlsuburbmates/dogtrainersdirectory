// Shared validation utilities for API endpoints

// Enum definitions matching database schema
export const AGE_SPECIALTIES = [
  'puppies_0_6m',
  'adolescent_6_18m',
  'adult_18m_7y',
  'senior_7y_plus',
  'rescue_dogs'
] as const;

export const BEHAVIOR_ISSUES = [
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
] as const;

export const SERVICE_TYPES = [
  'puppy_training',
  'obedience_training',
  'behaviour_consultations',
  'group_classes',
  'private_training'
] as const;

export const RESOURCE_TYPES = [
  'trainer',
  'behaviour_consultant',
  'emergency_vet',
  'urgent_care',
  'emergency_shelter'
] as const;

export const REGIONS = [
  'Inner City',
  'Northern',
  'Eastern',
  'South Eastern',
  'Western'
] as const;

export const VERIFICATION_STATUSES = [
  'pending',
  'verified',
  'rejected',
  'manual_review'
] as const;

export const USER_ROLES = [
  'trainer',
  'admin'
] as const;

// Type definitions
export type AgeSpecialty = typeof AGE_SPECIALTIES[number];
export type BehaviorIssue = typeof BEHAVIOR_ISSUES[number];
export type ServiceType = typeof SERVICE_TYPES[number];
export type ResourceType = typeof RESOURCE_TYPES[number];
export type Region = typeof REGIONS[number];
export type VerificationStatus = typeof VERIFICATION_STATUSES[number];
export type UserRole = typeof USER_ROLES[number];

// Validation functions
export const isValidAgeSpecialty = (value: string): value is AgeSpecialty => {
  return AGE_SPECIALTIES.includes(value as AgeSpecialty);
};

export const isValidBehaviorIssue = (value: string): value is BehaviorIssue => {
  return BEHAVIOR_ISSUES.includes(value as BehaviorIssue);
};

export const isValidServiceType = (value: string): value is ServiceType => {
  return SERVICE_TYPES.includes(value as ServiceType);
};

export const isValidResourceType = (value: string): value is ResourceType => {
  return RESOURCE_TYPES.includes(value as ResourceType);
};

export const isValidRegion = (value: string): value is Region => {
  return REGIONS.includes(value as Region);
};

export const isValidVerificationStatus = (value: string): value is VerificationStatus => {
  return VERIFICATION_STATUSES.includes(value as VerificationStatus);
};

export const isValidUserRole = (value: string): value is UserRole => {
  return USER_ROLES.includes(value as UserRole);
};

// Array validation functions
export const validateAgeSpecialty = (value: string): AgeSpecialty => {
  if (!isValidAgeSpecialty(value)) {
    throw new Error(`Invalid age specialty: ${value}. Must be one of: ${AGE_SPECIALTIES.join(', ')}`);
  }
  return value as AgeSpecialty;
};

export const validateBehaviorIssue = (value: string): BehaviorIssue => {
  if (!isValidBehaviorIssue(value)) {
    throw new Error(`Invalid behavior issue: ${value}. Must be one of: ${BEHAVIOR_ISSUES.join(', ')}`);
  }
  return value as BehaviorIssue;
};

export const validateServiceType = (value: string): ServiceType => {
  if (!isValidServiceType(value)) {
    throw new Error(`Invalid service type: ${value}. Must be one of: ${SERVICE_TYPES.join(', ')}`);
  }
  return value as ServiceType;
};

export const validateResourceType = (value: string): ResourceType => {
  if (!isValidResourceType(value)) {
    throw new Error(`Invalid resource type: ${value}. Must be one of: ${RESOURCE_TYPES.join(', ')}`);
  }
  return value as ResourceType;
};

export const validateRegion = (value: string): Region => {
  if (!isValidRegion(value)) {
    throw new Error(`Invalid region: ${value}. Must be one of: ${REGIONS.join(', ')}`);
  }
  return value as Region;
};

export const validateVerificationStatus = (value: string): VerificationStatus => {
  if (!isValidVerificationStatus(value)) {
    throw new Error(`Invalid verification status: ${value}. Must be one of: ${VERIFICATION_STATUSES.join(', ')}`);
  }
  return value as VerificationStatus;
};

export const validateUserRole = (value: string): UserRole => {
  if (!isValidUserRole(value)) {
    throw new Error(`Invalid user role: ${value}. Must be one of: ${USER_ROLES.join(', ')}`);
  }
  return value as UserRole;
};

// Array validation for behavior issues
export const validateBehaviorIssuesArray = (issues: string[]): BehaviorIssue[] => {
  if (!Array.isArray(issues)) {
    throw new Error('Behavior issues must be an array');
  }
  
  const validatedIssues: BehaviorIssue[] = [];
  for (const issue of issues) {
    validatedIssues.push(validateBehaviorIssue(issue));
  }
  
  return validatedIssues;
};

export const validateAgeSpecialtiesArray = (ages: string[]): AgeSpecialty[] => {
  if (!Array.isArray(ages)) {
    throw new Error('Age specialties must be an array');
  }

  const validatedAges: AgeSpecialty[] = [];
  for (const age of ages) {
    validatedAges.push(validateAgeSpecialty(age));
  }

  return validatedAges;
};

// Numeric validation
export const validateRadius = (radius: number): number => {
  if (typeof radius !== 'number' || radius < 1 || radius > 500) {
    throw new Error('Radius must be a number between 1 and 500 kilometers');
  }
  return radius;
};

export const validateSuburbId = (suburbId: number): number => {
  if (typeof suburbId !== 'number' || suburbId < 1 || !Number.isInteger(suburbId)) {
    throw new Error('Suburb ID must be a positive integer');
  }
  return suburbId;
};

// Request validation helpers
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const createValidationError = (field: string, message: string): ValidationError => ({
  field,
  message
});

export const createValidationResult = (isValid: boolean, errors: ValidationError[] = []): ValidationResult => ({
  isValid,
  errors
});

// Logging helper for validation failures
export const logValidationError = (endpoint: string, field: string, value: any, errorMessage: string): void => {
  console.error(`Validation Error in ${endpoint}: Field '${field}' with value '${JSON.stringify(value)}' - ${errorMessage}`);
};
