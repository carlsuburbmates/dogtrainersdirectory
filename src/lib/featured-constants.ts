/**
 * Featured Placement Constants
 * 
 * Shared constants for featured placement management to ensure consistency
 * across cron jobs, admin endpoints, and database migrations.
 */

// Valid slot types for featured placements
export const SLOT_TYPES = ['hero', 'premium', 'standard'] as const
export type SlotType = typeof SLOT_TYPES[number]

// Default placement duration in days
export const DEFAULT_PLACEMENT_DURATION_DAYS = 30

// Valid event types for featured_placement_events table
export const PLACEMENT_EVENT_TYPES = [
  'expired',
  'promoted',
  'renewed',
  'manual_override',
  'stripe_payment',
  'extended',
  'demoted'
] as const
export type PlacementEventType = typeof PLACEMENT_EVENT_TYPES[number]

// Valid placement statuses
export const PLACEMENT_STATUSES = ['active', 'inactive', 'queued', 'expired'] as const
export type PlacementStatus = typeof PLACEMENT_STATUSES[number]
