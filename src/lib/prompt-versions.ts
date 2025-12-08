/**
 * Prompt Version Registry
 * 
 * Central source of truth for AI prompt versions across all pipelines.
 * Increment versions when prompts change to enable A/B testing and regression tracking.
 * 
 * @module lib/prompt-versions
 */

export const PROMPT_VERSIONS = {
  /** Emergency triage classification prompts */
  triage: 'v2.1',
  
  /** Review content moderation prompts */
  moderation: 'v1.0',
  
  /** Emergency resource verification prompts */
  verification: 'v1.0',
  
  /** Daily operations digest generation prompts */
  digest: 'v1.2',
  
  /** Weekly triage summary prompts */
  weekly_triage: 'v1.0'
} as const

export type PromptPipeline = keyof typeof PROMPT_VERSIONS

/**
 * Get the current prompt version for a given pipeline.
 * 
 * @param pipeline - The AI pipeline name
 * @returns The semantic version string (e.g., 'v2.1')
 */
export function getPromptVersion(pipeline: PromptPipeline): string {
  return PROMPT_VERSIONS[pipeline]
}

/**
 * Changelog for tracking prompt evolution.
 * Update this when bumping versions to document changes.
 */
export const PROMPT_CHANGELOG = {
  'triage-v2.1': 'Added explicit medical emergency keywords, improved confidence scoring',
  'triage-v2.0': 'Switched from binary to 4-category classification',
  'moderation-v1.0': 'Initial release with spam/profanity detection',
  'verification-v1.0': 'Initial release with phone/website validation',
  'digest-v1.2': 'Added CI health integration, improved anomaly detection',
  'digest-v1.1': 'Added weekly trends context',
  'digest-v1.0': 'Initial release'
} as const
